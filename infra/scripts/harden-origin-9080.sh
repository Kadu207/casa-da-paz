#!/usr/bin/env bash
# Restringe acesso externo à porta publicada 9080 (Casa da Paz origin).
# Docker faz DNAT 9080→80: filtrar com --ctorigdstport (não --dport).
# Aplicar: sudo ./scripts/harden-origin-9080.sh
#   ou (sem sudo, user no grupo docker):
#   docker run --rm --network host --privileged -v "$PWD/scripts/harden-origin-9080.sh:/harden.sh:ro" alpine:3.20 sh -c 'apk add --no-cache iptables && sh /harden.sh'
set -euo pipefail

PORT="${HOST_HTTP_PORT:-9080}"
CHAIN="CASADAPAZ-9080"

if ! command -v iptables >/dev/null 2>&1; then
  echo "ERRO: iptables não encontrado"
  exit 1
fi

# Limpa jump antigo em INPUT (versão inicial do script)
iptables -D INPUT -p tcp --dport "${PORT}" -j "${CHAIN}" 2>/dev/null || true

iptables -N DOCKER-USER 2>/dev/null || true

iptables -F "${CHAIN}" 2>/dev/null || true
iptables -X "${CHAIN}" 2>/dev/null || true
iptables -N "${CHAIN}"

# Origens confiáveis (host / Docker / LAN)
iptables -A "${CHAIN}" -s 127.0.0.1 -j RETURN
iptables -A "${CHAIN}" -s 172.16.0.0/12 -j RETURN
iptables -A "${CHAIN}" -s 10.0.0.0/8 -j RETURN
iptables -A "${CHAIN}" -s 192.168.0.0/16 -j RETURN
iptables -A "${CHAIN}" -m conntrack --ctstate RELATED,ESTABLISHED -j RETURN

# Bloquear NOVOS fluxos cuja porta ORIGINAL era 9080 (antes do DNAT Docker)
iptables -A "${CHAIN}" -p tcp -m conntrack --ctstate NEW --ctorigdstport "${PORT}" -j DROP

iptables -A "${CHAIN}" -j RETURN

while iptables -D DOCKER-USER -j "${CHAIN}" 2>/dev/null; do :; done
iptables -I DOCKER-USER 1 -j "${CHAIN}"

echo "OK: TCP origin-port ${PORT} filtrado em DOCKER-USER (ctorigdstport)."
echo "Persistir: sudo netfilter-persistent save"
echo "Validar FORA: curl -m 3 http://IP_PUBLICO:${PORT}/health  → deve FALHAR"
echo "Validar local: curl -sf http://127.0.0.1:${PORT}/health → OK"
echo "Validar site:  curl -sf https://casadapaz.inovatitech.com.br/health → OK"
