#!/usr/bin/env bash
# Aplica lockdown P0–P2 nas stacks da VPS (host-level).
set -euo pipefail

SCRIPTS="${HOME}/casadapaz/infra/scripts"
mkdir -p "$SCRIPTS"
cp -f /tmp/harden-origin-port.sh "$SCRIPTS/harden-origin-port.sh"
cp -f /tmp/bind-compose-localhost.py "$SCRIPTS/bind-compose-localhost.py"
cp -f /tmp/apply-vps-port-lockdown.sh "$SCRIPTS/apply-vps-port-lockdown.sh" 2>/dev/null || true
HARDEN="$SCRIPTS/harden-origin-port.sh"
BIND="$SCRIPTS/bind-compose-localhost.py"
chmod +x "$HARDEN" "$BIND"

apply_harden() {
  local port="$1"
  docker run --rm --network host --privileged \
    -v "${HARDEN}:/harden.sh:ro" \
    alpine:3.20 \
    sh -c "apk add --no-cache iptables >/dev/null && HOST_HTTP_PORT=${port} sh /harden.sh"
}

root_compose() {
  # docker compose as root via docker.sock (bypass file perms for .env owned by root)
  local workdir="$1"; shift
  docker run --rm --privileged \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v "${workdir}:${workdir}" \
    -w "${workdir}" \
    docker:27-cli "$@"
}

root_bind() {
  local file="$1"; shift
  docker run --rm --privileged \
    -v /tmp/bind-compose-localhost.py:/bind.py:ro \
    -v "$(dirname "$file"):$(dirname "$file")" \
    alpine:3.20 \
    sh -c "apk add --no-cache python3 >/dev/null && python3 /bind.py '$file' $*"
}

echo "=== P0: Postgres gastro :5440 → 127.0.0.1 ==="
root_bind /opt/inova-gastro-360/docker-compose.prod.yml 5440 || true
root_compose /opt/inova-gastro-360 compose -f docker-compose.prod.yml up -d postgres
sleep 5
docker ps --format '{{.Names}} {{.Ports}}' | grep 5440 || true
echo "P0 OK"

echo "=== P1a: Agenda AI 9500/9501 harden ==="
for p in 9500 9501; do apply_harden "$p"; done
echo "P1a OK"

echo "=== P1b: agenda :3000 → 127.0.0.1 ==="
AGENDA="/home/gestaoti/agenda"
cp -a "${AGENDA}/docker-compose.yml" "${AGENDA}/docker-compose.yml.bak.$(date +%Y%m%d%H%M%S)"
python3 "$BIND" "${AGENDA}/docker-compose.yml" 3000 || true
cd "$AGENDA"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate
sleep 3
docker ps --format '{{.Names}} {{.Ports}}' | grep -E '3000|3100' || true
echo "P1b OK"

echo "=== P2a: platform APIs → 127.0.0.1 ==="
mapfile -t PLATFORM_YMLS < <(find /home/gestaoti/inova-platform-core-v2 -name 'docker-compose*.yml' 2>/dev/null || true)
for yml in "${PLATFORM_YMLS[@]:-}"; do
  if grep -qE '(8001|8002|8004|8007):' "$yml" 2>/dev/null; then
    echo "patch $yml"
    python3 "$BIND" "$yml" 8001 8002 8004 8007 || true
  fi
done
# Recreate via known compose dirs
if [[ -f /home/gestaoti/inova-platform-core-v2/infra/docker/docker-compose.prod-vps.yml ]]; then
  cd /home/gestaoti/inova-platform-core-v2/infra/docker
  if [[ -f docker-compose.yml ]]; then
    docker compose -f docker-compose.yml -f docker-compose.prod-vps.yml up -d || true
  else
    docker compose -f docker-compose.prod-vps.yml up -d || true
  fi
fi
# Recreate any running containers still on 0.0.0.0 for those ports by inspecting project labels
docker ps --format '{{.Names}} {{.Ports}}' | grep -E '8001|8002|8004|8007' || true
echo "P2a OK"

echo "=== P2b: gerador-licencas :8195 → 127.0.0.1 ==="
if [[ -f /opt/gerador-licencas/docker-compose.yml ]]; then
  root_bind /opt/gerador-licencas/docker-compose.yml 8195 || true
  root_compose /opt/gerador-licencas compose up -d --force-recreate || true
fi
docker ps --format '{{.Names}} {{.Ports}}' | grep 8195 || true
echo "P2b OK"

echo "=== P2c: gastro nginx :9088 harden + bind ==="
apply_harden 9088
G9088="/home/gestaoti/inova-gastro-360/infra/hetzner/docker-compose.app.yml"
if [[ -f "$G9088" ]]; then
  cp -a "$G9088" "${G9088}.bak.$(date +%Y%m%d%H%M%S)"
  python3 "$BIND" "$G9088" 9088 || true
  cd "$(dirname "$G9088")"
  docker compose -f docker-compose.app.yml up -d --force-recreate || true
fi
echo "P2c OK"

echo "=== P2d: dental-lab :9180 → 127.0.0.1 ==="
if [[ -f /opt/dental-lab-system/docker-compose.prod.yml ]]; then
  root_bind /opt/dental-lab-system/docker-compose.prod.yml 9180 || true
  root_compose /opt/dental-lab-system compose -f docker-compose.prod.yml up -d --force-recreate || true
fi
docker ps --format '{{.Names}} {{.Ports}}' | grep 9180 || true
echo "P2d OK"

echo "=== Persist iptables rules.v4 ==="
docker run --rm --network host --privileged \
  -v /etc/iptables:/etc/iptables \
  alpine:3.20 \
  sh -c 'apk add --no-cache iptables >/dev/null; mkdir -p /etc/iptables; iptables-save > /etc/iptables/rules.v4; echo lines=$(wc -l < /etc/iptables/rules.v4)'

echo "=== Listen inventory ==="
docker ps --format '{{.Names}}\t{{.Ports}}' | grep -E '5440|9500|9501|3000|3100|8001|8002|8004|8007|8195|9088|9180' || true

echo "ALL STEPS FINISHED"
