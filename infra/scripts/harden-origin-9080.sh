#!/usr/bin/env bash
# Restringe acesso externo à porta publicada 9080 (Casa da Paz origin).
# Docker DNAT muda dport→80: usar --ctorigdstport 9080.
# Aplicar (grupo docker, sem sudo):
#   docker run --rm --network host --privileged \
#     -v "$PWD/harden-origin-9080.sh:/harden.sh:ro" alpine:3.20 \
#     sh -c 'apk add --no-cache iptables && sh /harden.sh'
set -euo pipefail

PORT="${HOST_HTTP_PORT:-9080}"
CHAIN="CASADAPAZ-9080"

command -v iptables >/dev/null || { echo "ERRO: iptables ausente"; exit 1; }

# 1) Desliga jumps antigos ANTES de recriar a chain
iptables -D INPUT -p tcp --dport "${PORT}" -j "${CHAIN}" 2>/dev/null || true
while iptables -D DOCKER-USER -j "${CHAIN}" 2>/dev/null; do :; done

# 2) Recria chain
iptables -F "${CHAIN}" 2>/dev/null || true
iptables -X "${CHAIN}" 2>/dev/null || true
iptables -N "${CHAIN}"

iptables -N DOCKER-USER 2>/dev/null || true

# 3) Allowlist
iptables -A "${CHAIN}" -s 127.0.0.0/8 -j RETURN
iptables -A "${CHAIN}" -s 172.16.0.0/12 -j RETURN
iptables -A "${CHAIN}" -s 10.0.0.0/8 -j RETURN
iptables -A "${CHAIN}" -s 192.168.0.0/16 -j RETURN
iptables -A "${CHAIN}" -m conntrack --ctstate RELATED,ESTABLISHED -j RETURN

# 4) Drop novos fluxos com porta ORIGINAL 9080 (pré-DNAT)
iptables -A "${CHAIN}" -p tcp -m conntrack --ctstate NEW --ctorigdstport "${PORT}" -j DROP

# Fallback: se ctorigdstport não casar em algum kernel, bloquear NEW para o IP público na 9080 via raw
# (só se a regra acima existir — validamos com -C)
iptables -A "${CHAIN}" -j RETURN

# 5) Hook no início do DOCKER-USER
iptables -I DOCKER-USER 1 -j "${CHAIN}"

# 6) Extra: raw PREROUTING antes do DNAT (mais confiável)
iptables -t raw -D PREROUTING -p tcp --dport "${PORT}" -j CASADAPAZ-9080-RAW 2>/dev/null || true
iptables -t raw -F CASADAPAZ-9080-RAW 2>/dev/null || true
iptables -t raw -X CASADAPAZ-9080-RAW 2>/dev/null || true
iptables -t raw -N CASADAPAZ-9080-RAW
iptables -t raw -A CASADAPAZ-9080-RAW -s 127.0.0.0/8 -j RETURN
iptables -t raw -A CASADAPAZ-9080-RAW -s 172.16.0.0/12 -j RETURN
iptables -t raw -A CASADAPAZ-9080-RAW -s 10.0.0.0/8 -j RETURN
iptables -t raw -A CASADAPAZ-9080-RAW -s 192.168.0.0/16 -j RETURN
iptables -t raw -A CASADAPAZ-9080-RAW -j DROP
iptables -t raw -I PREROUTING 1 -p tcp --dport "${PORT}" -j CASADAPAZ-9080-RAW

echo "OK: ${PORT} filtrado (DOCKER-USER ctorigdstport + raw PREROUTING)."
echo "Persistir: sudo netfilter-persistent save"
echo "FORA:  curl -m 3 http://IP:${PORT}/health → falhar"
echo "LOCAL: curl -sf http://127.0.0.1:${PORT}/health → ok"
