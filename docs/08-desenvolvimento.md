# 8. Desenvolvimento

## 8.1. Pré-requisitos

- Docker Desktop  
- Node.js LTS  
- PowerShell (Windows) ou bash  

## 8.2. Subir local (recomendado)

```powershell
Set-Location "C:\Projetos DEV\Casa da Paz"

# Terminal 1 — DB + API
.\scripts\start-backend.ps1

# Terminal 2 — Frontend
.\scripts\start-frontend.ps1
```

Manual:

```powershell
cd infra; docker compose up -d db
cd ..\backend
copy .env.example .env   # se necessário
npm ci
npx prisma migrate deploy
npm run db:seed
# Ou só catálogo do estoque primário (idempotente):
# npx tsx prisma/seed.ts --estoque-casa-only
# Ou só funções da casa 033 (idempotente):
# npx tsx prisma/seed.ts --funcoes-casa-only
npm run dev

# outro terminal
cd frontend
npm ci
npm run dev
```

- API: http://localhost:3000/health  
- App: http://localhost:5173  

## 8.3. Scripts úteis

| Script | Uso |
|--------|-----|
| `scripts/test-tesouraria-022.ps1` | Smoke tesouraria 022–025 |
| `scripts/test-financeiro-asaas.ps1` | Smoke Asaas (configured ou não) |
| `scripts/smoke-audit-f01-f10-prod.ps1` | Matriz auditoria F01–F10 em produção |
| `infra/scripts/smoke-security-origin.ps1` | Smoke origin :9080 / headers |
| `infra/scripts/check-prod-secrets.sh` | Gate secrets VPS (sem imprimir valores) |
| `scripts/build-frontend-prod.ps1` | Build produção FE |
| `scripts/sync-frontend-vps.ps1` | Envia `dist` à VPS |
| `infra/scripts/build-frontend-on-vps.sh` | Build FE na VPS (Docker node) |
| `infra/scripts/setup-n8n-delegacao-vps.sh` | Import workflow 033 + token Chatwoot |
| `infra/scripts/deploy.sh` | Deploy containers (**gate** `CASADAPAZ_DEPLOY_CONFIRMED=yes`) |

## 8.4. Variáveis (resumo)

### Backend (`backend/.env`)
- `DATABASE_URL`  
- `JWT_SECRET`  
- `CORS_ORIGIN`  
- `ASAAS_API_KEY` / `ASAAS_ENV` — opcional  

### Frontend
- `VITE_API_URL` (ou proxy Vite)  
- Tokens Chatwoot / Turnstile / Cloudflare Images quando aplicável  

Nunca commitar `.env.production`.

## 8.5. Testes

```powershell
cd backend; npm test
# Galeria 034:
npx vitest run src/lib/video-url.test.ts src/lib/galeria-smoke.test.ts
cd ..\frontend; npx tsc --noEmit
```

Smoke prod galeria: `curl -s https://casadapaz.inovatitech.com.br/api/public/galeria`  
Álbuns públicos: `curl -s https://casadapaz.inovatitech.com.br/api/public/galeria/albuns`

## 8.6. Git dual

```powershell
git push origin main
git push gitlab main
```

## 8.7. Deploy

Ver `docs/memory/runbooks/deploy.md` e `deploy-vps-passo-a-passo.md`.  
**Só com confirmação explícita do usuário.**
