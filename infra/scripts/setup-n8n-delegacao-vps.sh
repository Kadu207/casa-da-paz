#!/usr/bin/env bash
# Import tarefa-delegacao + provision Chatwoot API token for N8N
set -euo pipefail
cd ~/casadapaz/infra
COMPOSE=./scripts/compose-prod-messaging.sh
chmod +x scripts/*.sh

echo "=== 1) Import only tarefa-delegacao.json ==="
./scripts/import-n8n-workflows.sh tarefa-delegacao.json

echo "=== 2) Confirm workflow listed ==="
$COMPOSE exec -T n8n n8n list:workflow 2>/dev/null | grep -i Deleg || echo "WARN: Delegacao not in list"

echo "=== 3) Chatwoot user / inbox / token ==="
CID=$($COMPOSE ps -q chatwoot)
cat > /tmp/cw-check.rb <<'RUBY'
u = User.first
puts "USER=#{u ? u.email : 'none'}"
puts "ACCOUNTS=#{Account.count}"
puts "INBOXES=#{Inbox.count}"
Inbox.find_each { |i| puts "INBOX id=#{i.id} name=#{i.name} channel=#{i.channel_type}" }
if u
  t = AccessToken.find_or_create_by!(owner: u)
  File.write('/tmp/cw-token.txt', t.token)
  puts "TOKEN_PRESENT=yes"
else
  puts "TOKEN_PRESENT=no"
end
RUBY
docker cp /tmp/cw-check.rb "$CID:/tmp/cw-check.rb"
$COMPOSE exec -T chatwoot bundle exec rails runner /tmp/cw-check.rb 2>/dev/null | tee /tmp/cw-out.txt | grep -E '^(USER|ACCOUNT|INBOX|TOKEN_PRESENT)' || true

TOKEN=""
if docker exec "$CID" test -f /tmp/cw-token.txt; then
  docker cp "$CID:/tmp/cw-token.txt" /tmp/cw-token.txt
  TOKEN=$(cat /tmp/cw-token.txt)
  rm -f /tmp/cw-token.txt
  docker exec -u root "$CID" rm -f /tmp/cw-token.txt 2>/dev/null || true
fi
INBOX_WA=$(grep '^INBOX ' /tmp/cw-out.txt | grep -i whatsapp | head -1 | sed -n 's/.*id=\([0-9]*\).*/\1/p' || true)
INBOX_ANY=$(grep '^INBOX ' /tmp/cw-out.txt | head -1 | sed -n 's/.*id=\([0-9]*\).*/\1/p' || true)
INBOX_ID="${INBOX_WA:-${INBOX_ANY:-1}}"

upsert_env() {
  local key="$1" val="$2"
  if grep -q "^${key}=" .env.production; then
    sed -i "s|^${key}=.*|${key}=${val}|" .env.production
    echo "Updated ${key}"
  else
    echo "${key}=${val}" >> .env.production
    echo "Appended ${key}"
  fi
}

if [ -n "${TOKEN:-}" ]; then
  upsert_env CHATWOOT_API_TOKEN "$TOKEN"
  upsert_env CHATWOOT_ACCOUNT_ID "1"
  upsert_env CHATWOOT_INBOX_ID "$INBOX_ID"
else
  echo "WARN: no Chatwoot user — open Chatwoot UI and create admin, then re-run"
fi

echo "=== 4) SMTP keys ==="
if grep -qE '^(SMTP_HOST|N8N_SMTP_HOST)=' .env.production; then
  echo "SMTP_HOST present"
else
  echo "SMTP_HOST absent — create credential 'SMTP Casa da Paz' in N8N UI after setting SMTP_*"
fi

echo "=== 5) Recreate n8n+backend with env ==="
$COMPOSE up -d n8n backend
sleep 5
$COMPOSE exec -T n8n n8n list:workflow 2>/dev/null | grep -i Deleg || true
echo "=== Done ==="
