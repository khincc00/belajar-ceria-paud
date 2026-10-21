import SwiftUI

@main
struct VPNUSAApp: App {
    @StateObject private var vpn = VPNManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(vpn)
        }
    }
}
