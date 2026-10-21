#!/usr/bin/env bash
# Setup server WireGuard di VPS USA (Ubuntu 22.04+). Jalankan sebagai root.
set -euo pipefail

PORT=51820
SUBNET=10.8.0
WAN_IF=$(ip route show default | awk '{print $5; exit}')

apt-get update && apt-get install -y wireguard qrencode ufw

umask 077
mkdir -p /etc/wireguard && cd /etc/wireguard
[ -f server.key ] || wg genkey | tee server.key | wg pubkey > server.pub

cat > wg0.conf <<CONF
[Interface]
Address = ${SUBNET}.1/24
ListenPort = ${PORT}
PrivateKey = $(cat server.key)
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o ${WAN_IF} -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o ${WAN_IF} -j MASQUERADE
CONF

echo 'net.ipv4.ip_forward=1' > /etc/sysctl.d/99-wg.conf
sysctl --system >/dev/null

ufw allow OpenSSH
ufw allow ${PORT}/udp
ufw --force enable

systemctl enable --now wg-quick@wg0
echo "Server public key: $(cat server.pub)"
echo "Selanjutnya: ./add-client.sh <nama>"
