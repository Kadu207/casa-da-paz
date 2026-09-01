# Memória Viva — Casa da Paz

**Última atualização:** 2026-09-01

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Pós-go-live: estoque 031 + **security harden 030** |
| Versão | 0.1.0-alpha |
| Commit | `e18a63c` (030 Helmet/uploads; backend rebuild na VPS 2026-08-20) |
| Produção | https://casadapaz.inovatitech.com.br |
| SSH VPS | `ssh -p 65025 gestaoti@128.140.77.31` (**não** :22) |
| Asaas (021) | **Dormant** — runbook [`docs/memory/runbooks/asaas-dormant.md`](../../docs/memory/runbooks/asaas-dormant.md) |
| Spec 032 ingressos | 📋 Stub em `specs/032-ingressos-eventos/` (não implementar) |
| SSH allowlist | Script `infra/scripts/allowlist-ssh-65025.sh` (opcional; gate humano) |
| Security 030 | ✅ Fase 0–2: `:9080` filtrado (smoke TIMEOUT), headers OK, Helmet+magic uploads, CI GL test, CodeRabbit no Git, validators 028/029/030 |
| Deploy 031 | ✅ migrate + FE na VPS |
| Audit fix P1 | ✅ 2026-09-01: IDOR financeiro, estoque limpeza, denylist+N8N — `docs/security-audit/` |
| Deploy P1 | ✅ VPS `0b08dc9` — backend rebuild + FE Docker build; health OK 2026-09-01 |
| Audit fix P2/P3 | ✅ 2026-09-01: `deveTrocarSenha`, RequireRole sub-rotas financeiras, gates write marketing/ecommerce, `safeUrl` href/src |

## Security (030) — referência rápida

```powershell
# Do PC
.\infra\scripts\smoke-security-origin.ps1
# Esperado: 7 ok; http://IP:9080 inacessível
```

```bash
# Na VPS — secrets sem imprimir valores
cd ~/casadapaz/infra && ./scripts/check-prod-secrets.sh
# Reaplicar filtro 9080 se necessário
sudo ./scripts/harden-origin-9080.sh
```

Inventário portas: `docs/memory/runbooks/firewall-host-iptables.md`  
Spec: `specs/030-security-hardening/`

## Deploy VPS (colar)

```bash
cd ~/casadapaz
git fetch origin && git reset --hard origin/main
git clean -fd
chmod +x infra/scripts/*.sh

cd infra
docker compose --env-file .env.production -f docker-compose.prod.yml build --no-cache backend
CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh
./scripts/compose-prod.sh exec -T backend npx prisma migrate deploy
curl -s http://127.0.0.1:9080/health
```

Frontend (PC):

```powershell
cd "C:\Projetos DEV\Casa da Paz"
.\scripts\deploy-frontend-vps.ps1 -PasswordOnly -RestartFrontend
```

Se SSH do PC der **timeout**, build FE na VPS:

```bash
cd ~/casadapaz && git pull origin main && cd infra
./scripts/build-frontend-on-vps.sh
./scripts/compose-prod.sh restart frontend
```

**Gate:** nunca `deploy.sh` sem confirmação explícita do usuário.
