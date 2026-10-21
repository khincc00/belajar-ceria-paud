import Foundation

/// Konfigurasi server WireGuard di USA. Simpan nilai ini lewat layar Pengaturan,
/// jangan hardcode private key di source code.
struct ServerConfig: Codable, Equatable {
    var endpoint = ""          // contoh: 203.0.113.10:51820
    var serverPublicKey = ""
    var clientPrivateKey = ""
    var clientAddress = "10.8.0.2/32"
    var dns = "1.1.1.1"

    var isComplete: Bool {
        !endpoint.isEmpty && !serverPublicKey.isEmpty && !clientPrivateKey.isEmpty
    }

    /// Format wg-quick yang dibaca WireGuardKit di Packet Tunnel.
    var wgQuick: String {
        """
        [Interface]
        PrivateKey = \(clientPrivateKey)
        Address = \(clientAddress)
        DNS = \(dns)

        [Peer]
        PublicKey = \(serverPublicKey)
        AllowedIPs = 0.0.0.0/0, ::/0
        Endpoint = \(endpoint)
        PersistentKeepalive = 25
        """
    }
}
