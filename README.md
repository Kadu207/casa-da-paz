# Casa da Paz — Management System Cloud

ERP/CRM para o terreiro de Umbanda afroindígena Casa da Paz (Conselheiro Lafaiete, MG).

**Produção:** https://casadapaz.inovatitech.com.br

## Repositórios

- GitHub: https://github.com/kadu207/casa-da-paz  
- GitLab: https://gitlab.com/kadu207/casa-da-paz  

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind  
- **Backend:** Node.js + Express + Prisma + PostgreSQL 16  
- **IA:** Python FastAPI  
- **Mensageria:** Chatwoot + N8N  
- **Infra:** Docker, Nginx, Hetzner, Cloudflare  
- **PSP (opcional):** Asaas — dormant sem `ASAAS_API_KEY`  

## Início rápido (PowerShell — Windows)

> **Pré-requisitos:** Docker Desktop + Node.js LTS.  
> Postgres: porta **5433** no `infra/docker-compose.yml` (alguns `.env` usam **5437** — alinhar `DATABASE_URL`).

### Opção A — Scripts

```powershell
Set-Location "C:\Projetos DEV\Casa da Paz"
.\scripts\start-backend.ps1    # Terminal 1
.\scripts\start-frontend.ps1   # Terminal 2
```

### Opção B — Manual

```powershell
Set-Location "C:\Projetos DEV\Casa da Paz\infra"
docker compose up -d db

Set-Location ..\backend
Copy-Item .env.example .env -ErrorAction SilentlyContinue
npm ci
npx prisma migrate deploy
npm run db:seed
npm run dev
```

```powershell
Set-Location "C:\Projetos DEV\Casa da Paz\frontend"
npm ci
npm run dev
```

- API: http://localhost:3000  
- ERP: http://localhost:5173/app  
- Portal: http://localhost:5173/public  
- Seed: `admin` / `admin123` (trocar em produção)

## Features (resumo)

- Tesouraria **022–025** completa sem Asaas (contas a pagar, recorrência, DRE, OFX)  
- Patrocínios / padrinhos + mensalidade na lista de médiuns  
- Estoque primário da casa (**031**)  
- **Delegações / funções da casa (033)** — `/app/delegacoes`  
- Policies de acesso definidas **no cadastro** do usuário  
- Asaas 021 opcional (dormant)  
- Auditoria de segurança F01–F10 **GREEN**  

## Documentação

| Documento | Link |
|-----------|------|
| Índice completo | [docs/00-index.md](docs/00-index.md) |
| Requisitos | [docs/analise-requisitos-consolidada.md](docs/analise-requisitos-consolidada.md) |
| Agentes | [agents.md](agents.md) |
| Memória viva | [.specify/memory/memory.md](.specify/memory/memory.md) |
| Estado atual | [.specify/memory/project-memory.md](.specify/memory/project-memory.md) |
| RBAC | [docs/contracts/rbac-matrix.md](docs/contracts/rbac-matrix.md) |
| CHANGELOG | [docs/memory/CHANGELOG.md](docs/memory/CHANGELOG.md) |
| Roadmap | [docs/memory/roadmap-cronograma.md](docs/memory/roadmap-cronograma.md) |
| Auditoria segurança | [docs/security-audit/ACHADOS.md](docs/security-audit/ACHADOS.md) |
| ADRs | [docs/memory/decisions/](docs/memory/decisions/) |
| Deploy | [docs/memory/runbooks/deploy.md](docs/memory/runbooks/deploy.md) |

## Deploy

**Requer confirmação explícita do usuário.**  
`CASADAPAZ_DEPLOY_CONFIRMED=yes ./infra/scripts/deploy.sh`  
Guia: `docs/memory/runbooks/deploy-vps-passo-a-passo.md`

## Push dual

```powershell
git push origin main; git push gitlab main
```
