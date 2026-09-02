# 1. Visão Geral

## 1.1. Propósito

O **Casa da Paz Management System Cloud** apoia a gestão do terreiro e a presença pública:

- Cadastros por função (Presidência, Diretoria, Tesouraria, Médiuns, Consulentes, etc.)
- Tesouraria completa **sem depender de PSP** (lançamentos, atrasados, contas a pagar, DRE, OFX, patrocínios/padrinhos, recorrência de mensalidade)
- Recepção / check-in, eventos e inscrições
- **Estoque primário da casa** (insumos ritualísticos e de funcionamento — ADR-010)
- **Delegações / funções da casa** (tarefas, responsáveis, alertas N8N — ADR-011)
- Livraria (PDV/estoque de venda) e ecommerce
- Portal público (eventos, agendamento, livraria, estudos, LGPD, mapa OSM)
- Marketing institucional (papel MARKETING)
- Cobranças Asaas **opcionais** (dormant até `ASAAS_API_KEY` — ADR-009)
- Alertas e automações via N8N / Chatwoot
- Hardening de segurança 030 + auditoria F01–F10 remediada

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
| Multi-estoque | ADR-010 (`docs/memory/decisions/010-estoque-casa.md`) |
| Delegações | ADR-011 (`docs/memory/decisions/011-delegacoes-casa.md`) |
| Auditoria segurança | `docs/security-audit/ACHADOS.md` (F01–F10 GREEN) |
