import SwiftUI

@main
struct CascaraApp: App {
    var body: some Scene {
        WindowGroup {
            CascaraWebView()
                .ignoresSafeArea()
        }
    }
}

