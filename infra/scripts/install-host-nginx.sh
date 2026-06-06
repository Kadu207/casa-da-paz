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
  exit 1
fi

if ! command -v nginx >/dev/null 2>&1; then
  echo "ERRO: nginx não instalado no host."
  exit 1
fi

echo "=== Portas 80/443 (quem escuta?) ==="
ss -tlnp | grep -E ':80 |:443 ' || true
echo ""

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
  echo "ERRO: Estrutura nginx não reconhecida."
  exit 1
fi

nginx -t

reload_ok=0
if systemctl is-active --quiet nginx 2>/dev/null; then
  systemctl reload nginx && reload_ok=1
elif pgrep -x nginx >/dev/null 2>&1; then
  nginx -s reload && reload_ok=1
else
  echo "AVISO: nginx do sistema não está ativo."
  if systemctl start nginx 2>/dev/null; then
    echo "nginx iniciado com sucesso."
    reload_ok=1
  else
    echo ""
    echo "ERRO: não foi possível iniciar nginx (Docker provavelmente ocupa 80/443)."
    echo "Peça ao administrador do servidor para adicionar no proxy existente:"
    echo "  casadapaz.inovatitech.com.br  →  http://127.0.0.1:9080"
    echo ""
    echo "Enquanto isso, use túnel SSH no PC:"
    echo "  ssh -L 9080:127.0.0.1:9080 gestaoti@128.140.77.31"
    echo "  http://localhost:9080/login"
    exit 1
  fi
fi

if [ "$reload_ok" -eq 1 ]; then
  echo ""
  echo "Vhost instalado."
  echo "  curl -s -H 'Host: casadapaz.inovatitech.com.br' http://127.0.0.1/health"
  echo "  curl -s https://casadapaz.inovatitech.com.br/health"
fi
