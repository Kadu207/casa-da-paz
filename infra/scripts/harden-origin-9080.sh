#!/usr/bin/env bash
# Restringe TCP 9080 a loopback + bridge Docker (evita bypass Cloudflare).
# Uso (VPS): sudo ./scripts/harden-origin-9080.sh
set -euo pipefail

PORT="${HOST_HTTP_PORT:-9080}"
CHAIN="CASADAPAZ-9080"

if ! command -v iptables >/dev/null 2>&1; then
  echo "ERRO: iptables não encontrado"
  exit 1
fi

# Recria chain
iptables -D INPUT -p tcp --dport "${PORT}" -j "${CHAIN}" 2>/dev/null || true
iptables -F "${CHAIN}" 2>/dev/null || true
iptables -X "${CHAIN}" 2>/dev/null || true
iptables -N "${CHAIN}"

iptables -A "${CHAIN}" -s 127.0.0.1 -j ACCEPT
iptables -A "${CHAIN}" -s 172.16.0.0/12 -j ACCEPT
iptables -A "${CHAIN}" -s 10.0.0.0/8 -j ACCEPT
iptables -A "${CHAIN}" -j DROP

iptables -I INPUT -p tcp --dport "${PORT}" -j "${CHAIN}"

echo "OK: TCP ${PORT} restrito (127.0.0.1 + redes privadas Docker). Persistência: apt install iptables-persistent"
echo "Validar de fora: curl -m 3 http://IP_PUBLICO:${PORT}/health  → deve falhar"
echo "Validar local:   curl -sf http://127.0.0.1:${PORT}/health"
