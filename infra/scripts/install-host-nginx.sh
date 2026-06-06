#!/usr/bin/env bash
# Instala vhost nginx no HOST para casadapaz.inovatitech.com.br → 127.0.0.1:9080
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Execute com sudo: sudo ./scripts/install-host-nginx.sh"
  exit 1
fi

INFRA_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ORIGIN_PEM="${INFRA_DIR}/nginx/ssl/origin.pem"
ORIGIN_KEY="${INFRA_DIR}/nginx/ssl/origin-key.pem"
VHOST_SRC="${INFRA_DIR}/nginx/host-vhost.conf"
SSL_DIR="/etc/nginx/ssl/casadapaz"

if [ ! -f "$ORIGIN_PEM" ] || [ ! -f "$ORIGIN_KEY" ]; then
  echo "ERRO: Certificados não encontrados em ${INFRA_DIR}/nginx/ssl/"
  echo "      Configure Cloudflare Origin Certificate antes."
  exit 1
fi

if ! command -v nginx >/dev/null 2>&1; then
  echo "ERRO: nginx não instalado no host."
  exit 1
fi

mkdir -p "$SSL_DIR"
cp "$ORIGIN_PEM" "$SSL_DIR/origin.pem"
cp "$ORIGIN_KEY" "$SSL_DIR/origin-key.pem"
chmod 600 "$SSL_DIR"/*

if [ -d /etc/nginx/sites-available ]; then
  cp "$VHOST_SRC" /etc/nginx/sites-available/casadapaz
  ln -sf /etc/nginx/sites-available/casadapaz /etc/nginx/sites-enabled/casadapaz
elif [ -d /etc/nginx/conf.d ]; then
  cp "$VHOST_SRC" /etc/nginx/conf.d/casadapaz.conf
else
  echo "ERRO: Estrutura nginx não reconhecida (/etc/nginx/sites-available ou conf.d)."
  exit 1
fi

nginx -t
systemctl reload nginx

echo ""
echo "Vhost instalado."
echo "  Teste local:  curl -s -H 'Host: casadapaz.inovatitech.com.br' http://127.0.0.1/health"
echo "  Teste HTTPS: curl -s https://casadapaz.inovatitech.com.br/health"
echo "  Portal:       https://casadapaz.inovatitech.com.br/public"
echo "  Login ERP:    https://casadapaz.inovatitech.com.br/login"
