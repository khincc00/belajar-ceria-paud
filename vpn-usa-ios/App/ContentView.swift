import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var vpn: VPNManager
    @AppStorage("serverConfig") private var stored = Data()
    @State private var config = ServerConfig()
    @State private var showSettings = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 28) {
                Spacer()
                Image(systemName: vpn.isOn ? "lock.shield.fill" : "lock.shield")
                    .font(.system(size: 96))
                    .foregroundStyle(vpn.isOn ? .green : .secondary)

                Text(vpn.statusText).font(.title2.bold())
                Label("Lokasi: Amerika Serikat", systemImage: "flag.fill")
                    .foregroundStyle(.secondary)

                Button {
                    if vpn.isOn { vpn.disconnect() } else { Task { await vpn.connect(with: config) } }
                } label: {
                    Text(vpn.isOn ? "Putuskan" : "Hubungkan")
                        .frame(maxWidth: .infinity).padding()
                }
                .buttonStyle(.borderedProminent)
                .tint(vpn.isOn ? .red : .blue)
                .padding(.horizontal, 32)
                Spacer()
            }
            .navigationTitle("VPN USA")
            .toolbar {
                Button { showSettings = true } label: { Image(systemName: "gearshape") }
            }
            .sheet(isPresented: $showSettings) { SettingsView(config: $config) }
            .alert("Error", isPresented: .constant(vpn.errorMessage != nil)) {
                Button("OK") { vpn.errorMessage = nil }
            } message: { Text(vpn.errorMessage ?? "") }
        }
        .onAppear {
            if let c = try? JSONDecoder().decode(ServerConfig.self, from: stored) { config = c }
        }
        .onChange(of: config) { stored = (try? JSONEncoder().encode($0)) ?? Data() }
    }
}

struct SettingsView: View {
    @Binding var config: ServerConfig
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Server USA") {
                    TextField("Endpoint (IP:port)", text: $config.endpoint)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                    TextField("Public key server", text: $config.serverPublicKey)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                }
                Section("Klien") {
                    SecureField("Private key klien", text: $config.clientPrivateKey)
                    TextField("Alamat klien", text: $config.clientAddress)
                    TextField("DNS", text: $config.dns)
                }
            }
            .navigationTitle("Pengaturan")
            .toolbar { Button("Selesai") { dismiss() } }
        }
    }
}
