#!/usr/bin/env bash
# Sync frontend/dist → VPS. Rode no Linux (Debian) com chave SSH em ~/.ssh.
# Build antes: cd frontend && npm ci && npm run build
set -euo pipefail

REMOTE_HOST="${VPS_REMOTE_HOST:-gestaoti@128.140.77.31}"
REMOTE_PATH="${VPS_REMOTE_PATH:-~/casadapaz/frontend/dist}"
RESTART=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --restart) RESTART=1; shift ;;
    --host) REMOTE_HOST="$2"; shift 2 ;;
    *) echo "Uso: $0 [--restart] [--host user@host]"; exit 1 ;;
  esac
done

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOCAL_DIST="$ROOT/frontend/dist"

if [[ ! -f "$LOCAL_DIST/index.html" ]]; then
  echo "Erro: $LOCAL_DIST/index.html ausente. Rode: cd frontend && npm run build" >&2
  exit 1
fi

echo "Enviando frontend/dist para $REMOTE_HOST"
ssh "$REMOTE_HOST" "mkdir -p $REMOTE_PATH && rm -rf ${REMOTE_PATH}/*"
scp -r "$LOCAL_DIST/." "${REMOTE_HOST}:${REMOTE_PATH}/"

ssh "$REMOTE_HOST" "find $REMOTE_PATH -type d -exec chmod 755 {} \; && find $REMOTE_PATH -type f -exec chmod 644 {} \;"

JS_BUNDLE="$(grep -oP '/assets/index-[^"]+\.js' "$LOCAL_DIST/index.html" | head -1 | sed 's|^/assets/||')"
if [[ -n "$JS_BUNDLE" ]]; then
  ssh "$REMOTE_HOST" "test -f ${REMOTE_PATH}/assets/${JS_BUNDLE}"
  CODE="$(ssh "$REMOTE_HOST" "curl -sf -o /dev/null -w '%{http_code}' http://127.0.0.1:9080/assets/${JS_BUNDLE}" || echo 000)"
  echo "Origin :9080 /assets/${JS_BUNDLE} → HTTP ${CODE}"
  [[ "$CODE" == "200" ]] || exit 1
fi

if [[ "$RESTART" -eq 1 ]]; then
  ssh "$REMOTE_HOST" "cd ~/casadapaz/infra && ./scripts/compose-prod.sh restart frontend"
  echo "Frontend reiniciado."
fi

echo "OK — Cloudflare: purge cache se HTML antigo persistir."
