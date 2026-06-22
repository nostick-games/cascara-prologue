import SwiftUI
import WebKit

struct CascaraWebView: UIViewRepresentable {
    private let gameURL = URL(string: "https://nostick-games.github.io/cascara-prologue/")!

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.userContentController.addUserScript(NativeBridge.bootstrapScript)
        configuration.userContentController.add(context.coordinator.nativeBridge, name: NativeBridge.messageHandlerName)

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.load(URLRequest(url: gameURL, cachePolicy: .reloadIgnoringLocalCacheData))
        context.coordinator.nativeBridge.attach(webView)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate {
        let nativeBridge = NativeBridge()

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            print("[Cascara iOS] Navigation failed: \(error.localizedDescription)")
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            print("[Cascara iOS] Provisional navigation failed: \(error.localizedDescription)")
        }
    }
}

