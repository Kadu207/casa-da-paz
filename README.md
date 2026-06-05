# Casa da Paz — Management System Cloud

ERP/CRM para o terreiro de Umbanda afroindígena Casa da Paz (Conselheiro Lafaiete, MG).

## Repositórios

- GitHub: https://github.com/kadu207/casa-da-paz
- GitLab: https://gitlab.com/kadu207/casa-da-paz

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind + Recharts
- **Backend:** Node.js + Express + Prisma + PostgreSQL 16
- **IA:** Python FastAPI (Executor, Validador, Qualidade)
- **Mensageria:** Chatwoot + N8N
- **Infra:** Docker, Nginx, Hetzner, Cloudflare

## Início rápido (PowerShell — Windows)

> **Pré-requisitos:** Docker Desktop + Node.js LTS.
> Se `npm` não for reconhecido: `winget install OpenJS.NodeJS.LTS` e **feche/reabra o terminal**.
> Postgres do projeto: porta **5433** (evita conflito com PostgreSQL local na 5432).

### Opção A — Scripts (recomendado)

```powershell
Set-Location "C:\Users\carlo\OneDrive\Área de Trabalho\Projetos DEV\Casa da Paz"

# Terminal 1 — Backend + banco
.\scripts\start-backend.ps1

# Terminal 2 — Frontend (abra outro PowerShell)
Set-Location "C:\Users\carlo\OneDrive\Área de Trabalho\Projetos DEV\Casa da Paz"
.\scripts\start-frontend.ps1
```

### Opção B — Manual (com PATH corrigido)

```powershell
Set-Location "C:\Users\carlo\OneDrive\Área de Trabalho\Projetos DEV\Casa da Paz"
. .\scripts\setup-path.ps1

Set-Location infra
docker compose up -d db

Set-Location ..\backend
Copy-Item .env.example .env -ErrorAction SilentlyContinue
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Em **outro terminal**, repita `setup-path.ps1` e depois:

```powershell
Set-Location "C:\Users\carlo\OneDrive\Área de Trabalho\Projetos DEV\Casa da Paz"
. .\scripts\setup-path.ps1
Set-Location frontend
npm install
npm run dev
```

- API: http://localhost:3000
- App: http://localhost:5173
- Portal público: http://localhost:5173/public
- Admin seed: `admin@casadapaz.local` / `admin123`

## Documentação

- [Requisitos consolidados](docs/analise-requisitos-consolidada.md)
- [Agentes](AGENTS.md)
- [ADRs](docs/memory/decisions/)

## Deploy

**Requer confirmação do usuário.** Ver `infra/scripts/deploy.sh` e `docs/memory/runbooks/deploy.md`.

## Push dual

```powershell
git push origin main; git push gitlab main
```
