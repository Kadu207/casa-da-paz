#!/usr/bin/env bash
# Smoke segurança origin — Cloudflare OK + bypass :9080 deve falhar.
# Uso (do PC ou VPS):
#   DOMAIN=casadapaz.inovatitech.com.br PUBLIC_IP=128.140.77.31 ./smoke-security-origin.sh
set -euo pipefail

DOMAIN="${DOMAIN:-casadapaz.inovatitech.com.br}"
PUBLIC_IP="${PUBLIC_IP:-128.140.77.31}"
PORT="${HOST_HTTP_PORT:-9080}"
TIMEOUT="${CURL_TIMEOUT:-5}"

pass=0
fail=0

ok() { echo "OK  $*"; pass=$((pass + 1)); }
bad() { echo "FAIL $*"; fail=$((fail + 1)); }

echo "=== 1) Health público via Cloudflare ==="
hdrs=$(curl -sI --max-time "${TIMEOUT}" "https://${DOMAIN}/health" || true)
body=$(curl -sf --max-time "${TIMEOUT}" "https://${DOMAIN}/health" || true)
echo "$hdrs" | head -n 20
if echo "$body" | grep -q '"status":"ok"'; then
  ok "health JSON"
else
  bad "health JSON ausente"
fi
for h in "x-frame-options: DENY" "x-content-type-options: nosniff" "content-security-policy:"; do
  if echo "$hdrs" | grep -qi "^${h}"; then
    ok "header ${h%%:*}"
  else
    bad "header ausente: ${h}"
  fi
done

echo "=== 2) Frontend / headers ==="
root=$(curl -sI --max-time "${TIMEOUT}" "https://${DOMAIN}/" || true)
if echo "$root" | grep -qi "^x-frame-options: DENY"; then
  ok "X-Frame-Options em /"
else
  bad "X-Frame-Options em /"
fi
if echo "$root" | grep -qi "^content-security-policy:"; then
  ok "CSP em /"
else
  bad "CSP em /"
fi

echo "=== 3) Bypass Cloudflare (IP:${PORT}) — deve FALHAR ==="
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "${TIMEOUT}" "http://${PUBLIC_IP}:${PORT}/health" || echo "000")
# 000 = timeout/refused; qualquer 2xx/3xx/4xx/5xx = origem alcançável (ruim)
if [[ "$code" == "000" || "$code" == "000000" ]]; then
  ok "http://${PUBLIC_IP}:${PORT} inacessível (timeout/refused)"
else
  bad "origem exposta: HTTP ${code} em ${PUBLIC_IP}:${PORT}"
fi

echo "=== Resultado: ${pass} ok, ${fail} fail ==="
[[ "$fail" -eq 0 ]]
