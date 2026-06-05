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

## Início rápido

```bash
# Banco + serviços
cd infra && docker compose up -d db

# Backend
cd backend && cp .env.example .env && npm install
npx prisma db push && npm run db:seed && npm run dev

# Frontend
cd frontend && npm install && npm run dev
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

```bash
git push origin main && git push gitlab main
```
