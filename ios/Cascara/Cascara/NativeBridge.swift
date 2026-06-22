import Foundation
import UIKit
import WebKit

final class NativeBridge: NSObject, WKScriptMessageHandler {
    static let messageHandlerName = "cascaraNative"

    static let bootstrapScript = WKUserScript(
        source: """
        (function () {
          if (window.CascaraNative) return;

          var nextRequestId = 1;
          var pending = {};

          window.__cascaraNativeReceive = function (response) {
            var request = pending[response.requestId];
            if (!request) return;
            delete pending[response.requestId];
            if (response.ok) {
              request.resolve(response.value);
            } else {
              request.reject(new Error(response.error || "Native bridge error"));
            }
          };

          function callNative(type, payload) {
            return new Promise(function (resolve, reject) {
              if (!window.webkit || !window.webkit.messageHandlers || !window.webkit.messageHandlers.cascaraNative) {
                reject(new Error("Cascara native bridge unavailable"));
                return;
              }
              var requestId = String(nextRequestId++);
              pending[requestId] = { resolve: resolve, reject: reject };
              window.webkit.messageHandlers.cascaraNative.postMessage({
                requestId: requestId,
                type: type,
                payload: payload || {}
              });
            });
          }

          window.CascaraNative = {
            isAvailable: true,
            save: function (slot, data) { return callNative("save", { slot: slot, data: data }); },
            load: function (slot) { return callNative("load", { slot: slot }); },
            delete: function (slot) { return callNative("delete", { slot: slot }); },
            haptic: function (type) { return callNative("haptic", { type: type }); },
            log: function (message) { return callNative("log", { message: message }); }
          };

          window.dispatchEvent(new CustomEvent("cascara:native-ready"));
        })();
        """,
        injectionTime: .atDocumentStart,
        forMainFrameOnly: true
    )

    private let saveStore = NativeSaveStore()
    private weak var webView: WKWebView?

    func attach(_ webView: WKWebView) {
        self.webView = webView
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any] else {
            sendResponse(requestId: nil, ok: false, value: nil, error: "Invalid native bridge message")
            return
        }

        let requestId = body["requestId"] as? String
        let type = body["type"] as? String
        let payload = body["payload"] as? [String: Any] ?? [:]

        do {
            switch type {
            case "save":
                try save(payload)
                sendResponse(requestId: requestId, ok: true, value: true, error: nil)
            case "load":
                let value = try load(payload)
                sendResponse(requestId: requestId, ok: true, value: value, error: nil)
            case "delete":
                try delete(payload)
                sendResponse(requestId: requestId, ok: true, value: true, error: nil)
            case "haptic":
                triggerHaptic(payload)
                sendResponse(requestId: requestId, ok: true, value: true, error: nil)
            case "log":
                print("[Cascara JS]", payload["message"] ?? "")
                sendResponse(requestId: requestId, ok: true, value: true, error: nil)
            default:
                sendResponse(requestId: requestId, ok: false, value: nil, error: "Unknown native bridge call")
            }
        } catch {
            sendResponse(requestId: requestId, ok: false, value: nil, error: error.localizedDescription)
        }
    }

    private func save(_ payload: [String: Any]) throws {
        let slot = sanitizedSlot(payload["slot"])
        let data = payload["data"] ?? [:]
        try saveStore.save(data, slot: slot)
    }

    private func load(_ payload: [String: Any]) throws -> Any? {
        let slot = sanitizedSlot(payload["slot"])
        return try saveStore.load(slot: slot)
    }

    private func delete(_ payload: [String: Any]) throws {
        let slot = sanitizedSlot(payload["slot"])
        try saveStore.delete(slot: slot)
    }

    private func triggerHaptic(_ payload: [String: Any]) {
        DispatchQueue.main.async {
            self.haptic(payload)
        }
    }

    private func haptic(_ payload: [String: Any]) {
        let type = payload["type"] as? String
        switch type {
        case "success":
            let generator = UINotificationFeedbackGenerator()
            generator.prepare()
            generator.notificationOccurred(.success)
        case "warning":
            let generator = UINotificationFeedbackGenerator()
            generator.prepare()
            generator.notificationOccurred(.warning)
        case "error":
            let generator = UINotificationFeedbackGenerator()
            generator.prepare()
            generator.notificationOccurred(.error)
        case "heavy":
            let generator = UIImpactFeedbackGenerator(style: .heavy)
            generator.prepare()
            generator.impactOccurred()
        case "light":
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.prepare()
            generator.impactOccurred()
        default:
            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.prepare()
            generator.impactOccurred()
        }
    }

    private func sanitizedSlot(_ value: Any?) -> String {
        let rawSlot = (value as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        let slot = rawSlot?.isEmpty == false ? rawSlot! : "autosave"
        let allowed = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "-_"))
        let cleaned = String(slot.unicodeScalars.map { allowed.contains($0) ? Character($0) : "_" })
        return cleaned.isEmpty ? "autosave" : cleaned
    }

    private func sendResponse(requestId: String?, ok: Bool, value: Any?, error: String?) {
        let response: [String: Any?] = [
            "requestId": requestId,
            "ok": ok,
            "value": value,
            "error": error
        ]

        guard
            let data = try? JSONSerialization.data(withJSONObject: response.compactMapValues { $0 }),
            let json = String(data: data, encoding: .utf8)
        else {
            return
        }

        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript("window.__cascaraNativeReceive(\(json));")
        }
    }
}

final class NativeSaveStore {
    private let directoryURL: URL

    init() {
        let applicationSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        directoryURL = applicationSupport.appendingPathComponent("CascaraSaves", isDirectory: true)
    }

    func save(_ value: Any, slot: String) throws {
        try ensureDirectoryExists()
        let data = try JSONSerialization.data(withJSONObject: value, options: [.prettyPrinted, .sortedKeys])
        try data.write(to: fileURL(for: slot), options: [.atomic])
    }

    func load(slot: String) throws -> Any? {
        let url = fileURL(for: slot)
        guard FileManager.default.fileExists(atPath: url.path) else { return nil }
        let data = try Data(contentsOf: url)
        return try JSONSerialization.jsonObject(with: data)
    }

    func delete(slot: String) throws {
        let url = fileURL(for: slot)
        guard FileManager.default.fileExists(atPath: url.path) else { return }
        try FileManager.default.removeItem(at: url)
    }

    private func ensureDirectoryExists() throws {
        try FileManager.default.createDirectory(at: directoryURL, withIntermediateDirectories: true)
    }

    private func fileURL(for slot: String) -> URL {
        directoryURL.appendingPathComponent("\(slot).json")
    }
}
