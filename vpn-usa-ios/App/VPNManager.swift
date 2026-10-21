import NetworkExtension

@MainActor
final class VPNManager: ObservableObject {
    @Published private(set) var status: NEVPNStatus = .disconnected
    @Published var errorMessage: String?

    private var manager: NETunnelProviderManager?
    private var observer: NSObjectProtocol?

    private let tunnelBundleID = "com.example.vpnusa.tunnel"

    var isOn: Bool { status == .connected || status == .connecting || status == .reasserting }

    var statusText: String {
        switch status {
        case .connected: return "Terhubung"
        case .connecting, .reasserting: return "Menghubungkan…"
        case .disconnecting: return "Memutuskan…"
        default: return "Tidak terhubung"
        }
    }

    func connect(with config: ServerConfig) async {
        guard config.isComplete else {
            errorMessage = "Lengkapi pengaturan server terlebih dahulu."
            return
        }
        do {
            let manager = try await loadOrCreateManager()

            let proto = NETunnelProviderProtocol()
            proto.providerBundleIdentifier = tunnelBundleID
            proto.serverAddress = config.endpoint
            proto.providerConfiguration = ["wgQuickConfig": config.wgQuick]

            manager.protocolConfiguration = proto
            manager.localizedDescription = "VPN USA"
            manager.isEnabled = true

            try await manager.saveToPreferences()
            try await manager.loadFromPreferences()
            try manager.connection.startVPNTunnel()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func disconnect() {
        manager?.connection.stopVPNTunnel()
    }

    private func loadOrCreateManager() async throws -> NETunnelProviderManager {
        if let manager { return manager }
        let all = try await NETunnelProviderManager.loadAllFromPreferences()
        let m = all.first ?? NETunnelProviderManager()
        manager = m
        status = m.connection.status
        observer = NotificationCenter.default.addObserver(
            forName: .NEVPNStatusDidChange, object: m.connection, queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.status = m.connection.status }
        }
        return m
    }
}
