#!/usr/bin/env bash
# Fecha Swarm (single-node) e métricas cloudflared :20243 na internet pública.
set -eu
HARDEN="${HOME}/casadapaz/infra/scripts/harden-host-port.sh"
if [[ ! -f "$HARDEN" ]]; then
  HARDEN=/tmp/harden-host-port.sh
fi

apply() {
  local port="$1" proto="$2"
  echo ">>> ${proto}/${port}"
  docker run --rm --network host --privileged \
    -v "${HARDEN}:/harden.sh:ro" \
    alpine:3.20 \
    sh -c "apk add --no-cache iptables >/dev/null && HOST_PORT=${port} PROTO=${proto} sh /harden.sh"
}

# Swarm control / data plane — cluster é 1 nó; não precisa exposição pública
apply 2377 tcp
apply 7946 tcp
apply 7946 udp
apply 4789 udp

# cloudflared (container swarm sem --metrics localhost) escuta *:20243
apply 20243 tcp

docker run --rm --network host --privileged -v /etc/iptables:/etc/iptables alpine:3.20 \
  sh -c 'apk add --no-cache iptables >/dev/null; mkdir -p /etc/iptables; iptables-save > /etc/iptables/rules.v4; echo persisted_lines=$(wc -l < /etc/iptables/rules.v4)'

echo "=== local still reachable? ==="
# TCP connect local (should work for swarm/dockerd)
timeout 2 bash -c 'echo >/dev/tcp/127.0.0.1/2377' && echo "2377 local OK" || echo "2377 local fail"
timeout 2 bash -c 'echo >/dev/tcp/127.0.0.1/7946' && echo "7946 local OK" || echo "7946 local fail"
timeout 2 bash -c 'echo >/dev/tcp/127.0.0.1/20243' && echo "20243 local OK" || echo "20243 local fail"

docker node ls
echo APPLY_DONE
