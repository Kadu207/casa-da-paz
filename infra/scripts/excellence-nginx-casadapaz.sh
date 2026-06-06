#!/usr/bin/env bash
# Adiciona vhost casadapaz no nginx do Excellence Dental (porta 80 compartilhada)
# Pré-requisito: Casa da Paz escutando em 0.0.0.0:9080 (HOST_BIND=0.0.0.0 no .env.production + redeploy)
set -euo pipefail

NGINX_CONTAINER="${NGINX_CONTAINER:-excellence_dental_prod-nginx-1}"
UPSTREAM="${UPSTREAM:-http://172.17.0.1:9080}"
CONF_NAME="casadapaz.conf"
TMP="/tmp/${CONF_NAME}"

if ! docker ps --format '{{.Names}}' | grep -qx "$NGINX_CONTAINER"; then
  echo "ERRO: container $NGINX_CONTAINER não encontrado."
  docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep 80 || true
  exit 1
fi

# Testa se o upstream responde (a partir do host)
if ! curl -sf --max-time 3 http://127.0.0.1:9080/health >/dev/null 2>&1; then
  echo "AVISO: http://127.0.0.1:9080/health não responde no host."
  echo "       Se HOST_BIND=127.0.0.1, altere para 0.0.0.0 e redeploy antes."
fi

cat > "$TMP" <<EOF
# Casa da Paz — proxy para Docker infra-frontend (9080)
server {
    listen 80;
    server_name casadapaz.inovatitech.com.br;

    location / {
        proxy_pass ${UPSTREAM};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

docker cp "$TMP" "${NGINX_CONTAINER}:/etc/nginx/conf.d/${CONF_NAME}"
docker exec "$NGINX_CONTAINER" nginx -t
docker exec "$NGINX_CONTAINER" nginx -s reload
rm -f "$TMP"

echo ""
echo "OK — vhost casadapaz adicionado em ${NGINX_CONTAINER}"
echo "  curl -s -H 'Host: casadapaz.inovatitech.com.br' http://127.0.0.1/health"
echo "  curl -s https://casadapaz.inovatitech.com.br/health"
