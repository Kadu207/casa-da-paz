#!/usr/bin/env bash
# Restringe TCP 9080 a loopback + redes privadas.
# Docker publica portas via chain DOCKER-USER (INPUT sozinho NÃO basta).
# Uso (VPS): sudo ./scripts/harden-origin-9080.sh
set -euo pipefail

PORT="${HOST_HTTP_PORT:-9080}"
CHAIN="CASADAPAZ-9080"

if ! command -v iptables >/dev/null 2>&1; then
  echo "ERRO: iptables não encontrado"
  exit 1
fi

# Limpa jump antigo em INPUT (versão anterior do script)
iptables -D INPUT -p tcp --dport "${PORT}" -j "${CHAIN}" 2>/dev/null || true

# Garante chain DOCKER-USER (Docker cria; se não existir, cria)
iptables -N DOCKER-USER 2>/dev/null || true

# Recria nossa chain
iptables -F "${CHAIN}" 2>/dev/null || true
iptables -X "${CHAIN}" 2>/dev/null || true
iptables -N "${CHAIN}"

# Aceitar origem local / Docker / redes privadas
iptables -A "${CHAIN}" -s 127.0.0.1 -j RETURN
iptables -A "${CHAIN}" -s 172.16.0.0/12 -j RETURN
iptables -A "${CHAIN}" -s 10.0.0.0/8 -j RETURN
iptables -A "${CHAIN}" -s 192.168.0.0/16 -j RETURN
# Tráfego já estabelecido (respostas)
iptables -A "${CHAIN}" -m conntrack --ctstate RELATED,ESTABLISHED -j RETURN
# Bloquear o resto na porta
iptables -A "${CHAIN}" -p tcp --dport "${PORT}" -j DROP
iptables -A "${CHAIN}" -j RETURN

# Remover jump duplicado em DOCKER-USER
while iptables -D DOCKER-USER -j "${CHAIN}" 2>/dev/null; do :; done
# Inserir no início de DOCKER-USER (antes do RETURN padrão do Docker)
iptables -I DOCKER-USER 1 -j "${CHAIN}"

echo "OK: TCP ${PORT} filtrado em DOCKER-USER (loopback + privadas)."
echo "Persistência: sudo apt install -y iptables-persistent && sudo netfilter-persistent save"
echo "Validar de FORA do servidor: curl -m 3 http://IP_PUBLICO:${PORT}/health  → deve FALHAR"
echo "Validar local: curl -sf http://127.0.0.1:${PORT}/health  → deve OK"
echo "Validar site:  curl -sf https://casadapaz.inovatitech.com.br/health → deve OK"
