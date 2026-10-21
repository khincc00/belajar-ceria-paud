#!/usr/bin/env bash
# Tambah klien (satu per perangkat). Menampilkan nilai untuk layar Pengaturan app + QR.
set -euo pipefail
NAME=${1:?pakai: ./add-client.sh <nama>}
SUBNET=10.8.0
cd /etc/wireguard

N=$(( $(grep -c '^\[Peer\]' wg0.conf) + 2 ))
KEY=$(wg genkey); PUB=$(echo "$KEY" | wg pubkey)
PUBLIC_IP=$(curl -s https://api.ipify.org)

cat >> wg0.conf <<CONF

# ${NAME}
[Peer]
PublicKey = ${PUB}
AllowedIPs = ${SUBNET}.${N}/32
CONF
wg syncconf wg0 <(wg-quick strip wg0)

cat <<OUT
Endpoint        : ${PUBLIC_IP}:51820
Server pubkey   : $(cat server.pub)
Client privkey  : ${KEY}
Client address  : ${SUBNET}.${N}/32
OUT
