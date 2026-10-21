# VPN USA untuk iOS

Klien VPN iOS (SwiftUI + Network Extension) berbasis WireGuard yang mengarahkan
semua lalu lintas lewat server milikmu di Amerika Serikat.

## Struktur
- `App/` – aplikasi SwiftUI (tombol Hubungkan, layar Pengaturan, `VPNManager`).
- `PacketTunnel/` – extension Packet Tunnel yang menjalankan WireGuardKit.
- `server/` – skrip setup server WireGuard di VPS USA.
- `project.yml` – definisi proyek untuk [XcodeGen](https://github.com/yonaskolb/XcodeGen).

## Langkah
1. **Server**: sewa VPS di USA (Ubuntu 22.04+), salin folder `server/`, lalu:
   `sudo ./setup-wireguard.sh` dan `sudo ./add-client.sh iphone-saya`.
2. **Apple Developer**: butuh akun berbayar. Di developer.apple.com buat App ID untuk
   `com.example.vpnusa` dan `com.example.vpnusa.tunnel`, aktifkan capability
   **Network Extensions**. Ganti `com.example` di `project.yml` dan
   `VPNManager.swift` (`tunnelBundleID`) dengan bundle ID milikmu, isi `DEVELOPMENT_TEAM`.
3. **Build di Mac**: `brew install xcodegen go && xcodegen generate && open VPNUSA.xcodeproj`.
   Jalankan di **iPhone fisik** (Network Extension tidak jalan di Simulator).
4. Buka Pengaturan di app, isi endpoint, server public key, dan client private key dari
   output `add-client.sh`, lalu tekan Hubungkan.
5. Cek di `https://ifconfig.me` bahwa IP kamu sekarang di USA.

## Catatan
- Kode ini ditulis di Linux dan **belum pernah di-compile**; langkah build bridge Go
  (`WireGuardGoBridge`) mungkin perlu disesuaikan dengan versi wireguard-apple terbaru.
- Private key klien disimpan di `UserDefaults`/preferences VPN untuk kesederhanaan.
  Untuk rilis, pindahkan ke Keychain.
- Untuk App Store, kamu perlu privacy policy dan menjelaskan penggunaan Network Extension.
- Satu server = satu lokasi. Untuk beberapa kota USA, tambah VPS dan daftar server di app.
