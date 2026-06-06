#!/usr/bin/env bash
# Conecta infra-frontend-1 à rede Docker do stack inovati (cloudflared / wordpress)
set -euo pipefail

FRONTEND="${FRONTEND_CONTAINER:-infra-frontend-1}"
REF_CONTAINER="${REF_CONTAINER:-wordpress}"

if ! docker ps --format '{{.Names}}' | grep -qx "$FRONTEND"; then
  echo "ERRO: container $FRONTEND não está rodando."
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "$REF_CONTAINER"; then
  echo "AVISO: $REF_CONTAINER não encontrado. Containers disponíveis:"
  docker ps --format '{{.Names}}'
  exit 1
fi

NETWORK=$(docker inspect "$REF_CONTAINER" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' | awk '{print $1}')
if [ -z "$NETWORK" ]; then
  echo "ERRO: não foi possível detectar rede de $REF_CONTAINER"
  exit 1
fi

echo "Rede detectada: $NETWORK"

if docker inspect "$FRONTEND" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' | grep -q "$NETWORK"; then
  echo "OK — $FRONTEND já está na rede $NETWORK"
else
  docker network connect "$NETWORK" "$FRONTEND"
  echo "Conectado $FRONTEND → $NETWORK"
fi

echo ""
echo "Teste:"
echo "  docker run --rm --network $NETWORK curlimages/curl:latest -s http://$FRONTEND/health"
echo ""
echo "Cloudflare → túnel conectado → Add hostname:"
echo "  casadapaz.inovatitech.com.br  →  http://$FRONTEND:80"
echo ""
echo "Depois: sudo systemctl restart cloudflared"
