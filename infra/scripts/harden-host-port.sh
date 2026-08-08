#!/usr/bin/env bash
# Fecha portas Swarm / métricas de origem pública (TCP e/ou UDP).
# Uso:
#   HOST_PORT=2377 PROTO=tcp ./harden-host-port.sh
#   HOST_PORT=7946 PROTO=udp ./harden-host-port.sh
#   HOST_PORT=20243 PROTO=tcp ./harden-host-port.sh
set -euo pipefail

PORT="${HOST_PORT:?defina HOST_PORT}"
PROTO="${PROTO:-tcp}"
case "$PROTO" in
  tcp|udp) ;;
  *) echo "PROTO deve ser tcp ou udp"; exit 1 ;;
esac

# iptables chain names keep short
CHAIN="CDP-${PROTO}-${PORT}"
RAW="CDP-${PROTO}-${PORT}-R"

command -v iptables >/dev/null || { echo "iptables ausente"; exit 1; }

iptables -D INPUT -p "${PROTO}" --dport "${PORT}" -j "${CHAIN}" 2>/dev/null || true
while iptables -D DOCKER-USER -j "${CHAIN}" 2>/dev/null; do :; done
iptables -t raw -D PREROUTING -p "${PROTO}" --dport "${PORT}" -j "${RAW}" 2>/dev/null || true

iptables -F "${CHAIN}" 2>/dev/null || true
iptables -X "${CHAIN}" 2>/dev/null || true
iptables -N "${CHAIN}"
iptables -N DOCKER-USER 2>/dev/null || true

iptables -A "${CHAIN}" -s 127.0.0.0/8 -j RETURN
iptables -A "${CHAIN}" -s 172.16.0.0/12 -j RETURN
iptables -A "${CHAIN}" -s 10.0.0.0/8 -j RETURN
iptables -A "${CHAIN}" -s 192.168.0.0/16 -j RETURN
if [[ "$PROTO" == "tcp" ]]; then
  iptables -A "${CHAIN}" -m conntrack --ctstate RELATED,ESTABLISHED -j RETURN
  iptables -A "${CHAIN}" -p tcp -m conntrack --ctstate NEW --ctorigdstport "${PORT}" -j DROP 2>/dev/null \
    || iptables -A "${CHAIN}" -p tcp --dport "${PORT}" -m conntrack --ctstate NEW -j DROP
fi
iptables -A "${CHAIN}" -j RETURN
iptables -I DOCKER-USER 1 -j "${CHAIN}"
iptables -I INPUT 1 -p "${PROTO}" --dport "${PORT}" -j "${CHAIN}"

iptables -t raw -F "${RAW}" 2>/dev/null || true
iptables -t raw -X "${RAW}" 2>/dev/null || true
iptables -t raw -N "${RAW}"
iptables -t raw -A "${RAW}" -s 127.0.0.0/8 -j RETURN
iptables -t raw -A "${RAW}" -s 172.16.0.0/12 -j RETURN
iptables -t raw -A "${RAW}" -s 10.0.0.0/8 -j RETURN
iptables -t raw -A "${RAW}" -s 192.168.0.0/16 -j RETURN
iptables -t raw -A "${RAW}" -j DROP
iptables -t raw -I PREROUTING 1 -p "${PROTO}" --dport "${PORT}" -j "${RAW}"

echo "OK: ${PROTO}/:${PORT} filtrado (privado+loopback only)"
