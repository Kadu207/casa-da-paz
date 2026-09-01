#!/usr/bin/env bash
# Inventário de secrets em .env.production — NÃO imprime valores.
# Uso na VPS: cd ~/casadapaz/infra && ./scripts/check-prod-secrets.sh
set -euo pipefail

ENV_FILE="${1:-.env.production}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERRO: arquivo não encontrado: $ENV_FILE"
  exit 1
fi

# Defaults conhecidos de desenvolvimento (rejeitar em prod)
DEV_BAD=("dev-secret-change-me" "dev-secret" "changeme" "change-me-in-production" "asaas-dev-webhook-token" "pix-dev-secret" "n8n-dev-secret")

get_val() {
  local key="$1"
  # shellcheck disable=SC2002
  grep -E "^${key}=" "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '\r' || true
}

check_present() {
  local key="$1"
  local val
  val=$(get_val "$key")
  if [[ -z "$val" ]]; then
    echo "MISSING  $key"
    return 1
  fi
  local len=${#val}
  for bad in "${DEV_BAD[@]}"; do
    if [[ "$val" == "$bad" ]]; then
      echo "WEAK    $key (default de desenvolvimento)"
      return 1
    fi
  done
  echo "OK      $key (len=${len})"
  return 0
}

check_optional_strong() {
  local key="$1"
  local val
  val=$(get_val "$key")
  if [[ -z "$val" ]]; then
    echo "SKIP    $key (vazio — OK se integração dormant)"
    return 0
  fi
  for bad in "${DEV_BAD[@]}"; do
    if [[ "$val" == "$bad" ]]; then
      echo "WEAK    $key (default de desenvolvimento — trocar antes de ativar)"
      return 1
    fi
  done
  echo "OK      $key (len=${#val})"
  return 0
}

fail=0
echo "=== Secrets obrigatórios (Casa da Paz) ==="
check_present DB_PASSWORD || fail=$((fail + 1))
check_present JWT_SECRET || fail=$((fail + 1))

echo "=== Bind / origin ==="
hb=$(get_val HOST_BIND)
hp=$(get_val HOST_HTTP_PORT)
echo "INFO    HOST_BIND=${hb:-'(default compose 127.0.0.1)'} HOST_HTTP_PORT=${hp:-9080}"
if [[ "${hb:-}" == "0.0.0.0" ]]; then
  echo "INFO    Origin em 0.0.0.0 — confirme harden-origin-9080.sh + smoke bypass"
fi

echo "=== CORS (compose força URL; env local opcional) ==="
co=$(get_val CORS_ORIGIN)
if [[ -z "$co" ]]; then
  echo "INFO    CORS_ORIGIN não no .env — compose prod define https://casadapaz.inovatitech.com.br"
elif [[ "$co" == "*" ]]; then
  echo "WEAK    CORS_ORIGIN=*"
  fail=$((fail + 1))
else
  echo "OK      CORS_ORIGIN (len=${#co})"
fi

echo "=== Integrações (opcional / dormant OK) ==="
check_optional_strong ASAAS_WEBHOOK_TOKEN || fail=$((fail + 1))
check_optional_strong ASAAS_API_KEY || fail=$((fail + 1))
check_optional_strong N8N_WEBHOOK_SECRET || fail=$((fail + 1))
check_optional_strong CHATWOOT_SECRET || fail=$((fail + 1))

echo "=== Resultado ==="
if [[ "$fail" -eq 0 ]]; then
  echo "APROVADO (nenhum valor impresso)"
  exit 0
fi
echo "REPROVADO: $fail problema(s)"
exit 1
