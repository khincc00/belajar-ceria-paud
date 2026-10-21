import NetworkExtension
import WireGuardKit
import os.log

enum PacketTunnelError: Error {
    case invalidConfiguration
}

final class PacketTunnelProvider: NEPacketTunnelProvider {
    private lazy var adapter = WireGuardAdapter(with: self) { _, message in
        os_log("%{public}@", log: .default, type: .info, message)
    }

    override func startTunnel(options: [String: NSObject]?, completionHandler: @escaping (Error?) -> Void) {
        guard
            let proto = protocolConfiguration as? NETunnelProviderProtocol,
            let wgQuick = proto.providerConfiguration?["wgQuickConfig"] as? String,
            let config = try? TunnelConfiguration(fromWgQuickConfig: wgQuick)
        else {
            completionHandler(PacketTunnelError.invalidConfiguration)
            return
        }
        adapter.start(tunnelConfiguration: config) { error in
            completionHandler(error)
        }
    }

    override func stopTunnel(with reason: NEProviderStopReason, completionHandler: @escaping () -> Void) {
        adapter.stop { _ in completionHandler() }
    }
}
