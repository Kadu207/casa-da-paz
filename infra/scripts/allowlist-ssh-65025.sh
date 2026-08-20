#!/usr/bin/env bash
# Restringe SSH :65025 ao IP informado (iptables).
# USO (na VPS, com 2ª sessão SSH já aberta + console Hetzner disponível):
#   chmod +x ~/casadapaz/infra/scripts/allowlist-ssh-65025.sh
#   ./scripts/allowlist-ssh-65025.sh 177.206.120.41
#
# NÃO rode se só tiver uma sessão e não tiver console de emergência.
set -euo pipefail

MY_IP="${1:-}"
PORT=65025

if [[ -z "$MY_IP" ]]; then
  echo "Uso: $0 <IPv4-do-PC>"
  echo "Ex.: $0 177.206.120.41"
  exit 1
fi

if [[ ! "$MY_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "ERRO: informe IPv4 (ex. 177.206.120.41), não IPv6."
  exit 1
fi

echo "=== Allowlist SSH :${PORT} → ${MY_IP}/32 ==="
echo "Confirme: outra sessão SSH + console Hetzner prontos."
read -r -p "Digite ALLOW para continuar: " CONFIRM
if [[ "$CONFIRM" != "ALLOW" ]]; then
  echo "Abortado."
  exit 1
fi

# ACCEPT do IP no topo (após lo / established tipicamente nas linhas 1–2)
sudo iptables -C INPUT -p tcp -s "${MY_IP}/32" --dport "${PORT}" -j ACCEPT 2>/dev/null \
  || sudo iptables -I INPUT 3 -p tcp -s "${MY_IP}/32" --dport "${PORT}" -j ACCEPT

# Remover ACCEPT aberto 0.0.0.0/0 :65025 (pode haver várias — loop)
while sudo iptables -C INPUT -p tcp --dport "${PORT}" -j ACCEPT 2>/dev/null; do
  # Não remover a regra específica do MY_IP
  # Lista e remove só a linha sem -s
  LINE="$(sudo iptables -L INPUT -n --line-numbers | awk -v p="$PORT" '
    $0 ~ "tcp dpt:"p && $0 !~ /[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/ { print $1; exit }
  ')"
  if [[ -z "${LINE:-}" ]]; then
    break
  fi
  sudo iptables -D INPUT "${LINE}"
done

# DROP default para a porta (se ainda não houver)
sudo iptables -C INPUT -p tcp --dport "${PORT}" -j DROP 2>/dev/null \
  || sudo iptables -A INPUT -p tcp --dport "${PORT}" -j DROP

sudo mkdir -p /etc/iptables
sudo sh -c 'iptables-save > /etc/iptables/rules.v4'

echo ""
echo "Regras atuais :${PORT}:"
sudo iptables -L INPUT -n -v --line-numbers | grep -E "${PORT}|num " | head -20
echo ""
echo "TESTE AGORA em outra janela: ssh -p ${PORT} gestaoti@128.140.77.31"
echo "Se falhar, use console Hetzner e restaure ACCEPT amplo."
