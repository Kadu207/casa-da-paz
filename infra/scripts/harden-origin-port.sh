#!/usr/bin/env bash
# Fecha origin HTTP em 0.0.0.0:PORTA via raw PREROUTING + DOCKER-USER.
# Uso: HOST_HTTP_PORT=9500 ./harden-origin-port.sh
set -euo pipefail
PORT="${HOST_HTTP_PORT:?defina HOST_HTTP_PORT}"
CHAIN="CASADAPAZ-ORIGIN-${PORT}"
RAW="CASADAPAZ-ORIGIN-${PORT}-RAW"

command -v iptables >/dev/null || { echo "iptables ausente"; exit 1; }

iptables -D INPUT -p tcp --dport "${PORT}" -j "${CHAIN}" 2>/dev/null || true
while iptables -D DOCKER-USER -j "${CHAIN}" 2>/dev/null; do :; done
iptables -t raw -D PREROUTING -p tcp --dport "${PORT}" -j "${RAW}" 2>/dev/null || true

iptables -F "${CHAIN}" 2>/dev/null || true
iptables -X "${CHAIN}" 2>/dev/null || true
iptables -N "${CHAIN}"
iptables -N DOCKER-USER 2>/dev/null || true

iptables -A "${CHAIN}" -s 127.0.0.0/8 -j RETURN
iptables -A "${CHAIN}" -s 172.16.0.0/12 -j RETURN
iptables -A "${CHAIN}" -s 10.0.0.0/8 -j RETURN
iptables -A "${CHAIN}" -s 192.168.0.0/16 -j RETURN
iptables -A "${CHAIN}" -m conntrack --ctstate RELATED,ESTABLISHED -j RETURN
iptables -A "${CHAIN}" -p tcp -m conntrack --ctstate NEW --ctorigdstport "${PORT}" -j DROP
iptables -A "${CHAIN}" -j RETURN
iptables -I DOCKER-USER 1 -j "${CHAIN}"

iptables -t raw -F "${RAW}" 2>/dev/null || true
iptables -t raw -X "${RAW}" 2>/dev/null || true
iptables -t raw -N "${RAW}"
iptables -t raw -A "${RAW}" -s 127.0.0.0/8 -j RETURN
iptables -t raw -A "${RAW}" -s 172.16.0.0/12 -j RETURN
iptables -t raw -A "${RAW}" -s 10.0.0.0/8 -j RETURN
iptables -t raw -A "${RAW}" -s 192.168.0.0/16 -j RETURN
iptables -t raw -A "${RAW}" -j DROP
iptables -t raw -I PREROUTING 1 -p tcp --dport "${PORT}" -j "${RAW}"

echo "OK: origin :${PORT} filtrado"
