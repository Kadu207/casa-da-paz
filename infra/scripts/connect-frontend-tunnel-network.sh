#!/usr/bin/env bash
# Conecta infra-frontend-1 à mesma rede Docker do cloudflared (Swarm/stack inovati)
set -euo pipefail

FRONTEND="${FRONTEND_CONTAINER:-infra-frontend-1}"

if ! docker ps --format '{{.Names}}' | grep -qx "$FRONTEND"; then
  echo "ERRO: container $FRONTEND não está rodando."
  exit 1
fi

# Referência: cloudflared (Swarm) — wordpress pode não existir nesta VPS
REF=$(docker ps --format '{{.Names}}' | grep -i cloudflared | head -1 || true)
if [ -z "$REF" ]; then
  REF="${REF_CONTAINER:-}"
fi
if [ -z "$REF" ]; then
  echo "ERRO: container cloudflared não encontrado."
  docker ps --format 'table {{.Names}}\t{{.Image}}'
  exit 1
fi

echo "Container referência (cloudflared): $REF"

NETWORK=$(docker inspect "$REF" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' | head -1)
if [ -z "$NETWORK" ]; then
  echo "ERRO: rede não detectada em $REF"
  exit 1
fi

echo "Rede: $NETWORK"

if docker inspect "$FRONTEND" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' | grep -qw "$NETWORK"; then
  echo "OK — $FRONTEND já está na rede $NETWORK"
else
  docker network connect "$NETWORK" "$FRONTEND"
  echo "Conectado $FRONTEND → $NETWORK"
fi

echo ""
echo "=== Teste (de dentro da rede Docker) ==="
docker run --rm --network "$NETWORK" curlimages/curl:8.5.0 -sf "http://${FRONTEND}/health" || {
  echo "AVISO: teste falhou — confira se o frontend responde na rede interna."
}

echo ""
echo "=== Cloudflare (túnel JÁ conectado — wf, app, chat…) ==="
echo "Add public hostname:"
echo "  casadapaz.inovatitech.com.br  →  http://${FRONTEND}:80"
echo ""
echo "Depois:"
echo "  sudo systemctl restart cloudflared"
echo "  docker service ls | grep -i cloudflared   # se usar Swarm, reinicie o serviço também"
echo "  sudo journalctl -u cloudflared -n 20 | grep casadapaz"
echo "  curl -s https://casadapaz.inovatitech.com.br/health"
