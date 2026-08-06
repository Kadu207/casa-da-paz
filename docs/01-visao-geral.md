# 1. Visão Geral

## 1.1. Propósito

O **Casa da Paz Management System Cloud** apoia a gestão do terreiro e a presença pública:

- Cadastros por função (Presidência, Diretoria, Tesouraria, Médiuns, Consulentes, etc.)
- Tesouraria completa **sem depender de PSP** (lançamentos, atrasados, contas a pagar, DRE, OFX, patrocínios/padrinhos, recorrência de mensalidade)
- Recepção / check-in, eventos e inscrições
- Livraria (PDV/estoque) e ecommerce
- Portal público (eventos, agendamento, livraria, LGPD)
- Marketing institucional (papel MARKETING)
- Cobranças Asaas **opcionais** (dormant até `ASAAS_API_KEY` — ADR-009)
- Alertas e automações via N8N / Chatwoot

## 1.2. Stack técnica (canônica)

| Camada | Tecnologia |
|--------|------------|
| Frontend ERP + portal | React + Vite + TypeScript + Tailwind + React Router |
| Backend API | Node.js + Express + Zod + Prisma |
| Banco | PostgreSQL 16 |
| AuthZ | JWT + RBAC backend-first + `usuario_policies` |
| IA | Python FastAPI (Executor / Validador / Qualidade) |
| Mensageria | Chatwoot + N8N |
| Infra | Docker Compose, Nginx, Hetzner VPS, Cloudflare Tunnel |
| PSP (opcional) | Asaas (sandbox por padrão) |

## 1.3. Ambientes

| Ambiente | URL / notas |
|----------|-------------|
| Local API | http://localhost:3000 |
| Local app | http://localhost:5173 (`/app`, `/public`) |
| Produção | https://casadapaz.inovatitech.com.br |
| Health | `/health` (API) e proxy público |

## 1.4. Endereço físico

**Casa da Paz**  
Rua Valério Eugênio, 570 — Bairro Areal  
Conselheiro Lafaiete — MG  

## 1.5. Fontes de verdade

| Tema | Onde ler |
|------|----------|
| Estado atual | `.specify/memory/project-memory.md` |
| Agentes | `agents.md` |
| Specs SDD | `specs/<feature>/` |
| RBAC | `docs/contracts/rbac-matrix.md` |
| Schema | `backend/prisma/schema.prisma` |
