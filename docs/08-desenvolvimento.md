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
| `scripts/build-frontend-prod.ps1` | Build produção FE |
| `scripts/sync-frontend-vps.ps1` | Envia `dist` à VPS |
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
cd ..\frontend; npx tsc --noEmit
```

## 8.6. Git dual

```powershell
git push origin main
git push gitlab main
```

## 8.7. Deploy

Ver `docs/memory/runbooks/deploy.md` e `deploy-vps-passo-a-passo.md`.  
**Só com confirmação explícita do usuário.**
