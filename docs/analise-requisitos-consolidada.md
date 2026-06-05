# Análise de Requisitos Consolidada — Casa da Paz Management System Cloud

> Fontes: `projeto_casadapaz.md`, `projeto_casadapaz.docx`, `Casa da Paz - Management System Cloud.pdf` (10 slides), plano SDD.

**Versão:** 1.0.0 | **Data:** 2026-06-05 | **Responsável:** Pipeline SDD Casa da Paz

---

## 1. Visão e contexto

**Casa da Paz** é um ERP/CRM para o terreiro de Umbanda afroindígena em Conselheiro Lafaiete, MG (Bairro Areal).

**Missão do sistema:** organizar gestão administrativa (financeiro, CRM, eventos, livraria) para que a diretoria e voluntários foquem em espiritualidade, caridade e acolhimento.

**Contatos institucionais:**
- Instagram: `@umbandacasadapaz`
- E-mail: `terreirocasadapaz@gmail.com`
- DNS produção: `casadapaz.inovatitech.com.br` (Cloudflare proxy + Hetzner VPS)

---

## 2. Personas e dispositivos

| Persona | Dispositivo | Módulos |
|---------|-------------|---------|
| **Diretoria** | Desktop | Dashboards, relatórios, configurações, RBAC admin |
| **Financeiro** | Desktop | Fluxo de caixa, importação Excel, adimplência |
| **Recepção** | Mobile/tablet | CRM, check-in, cadastro consulentes |
| **Livraria** | Mobile/tablet | PDV, estoque |
| **Médium** | Mobile | Painel próprio: mensalidade, presença, escala |
| **Suporte** | Desktop | Logs, manutenção DB |
| **Público (MVP)** | Web/mobile | Portal: eventos, agendamento consulta, contato WhatsApp |

---

## 3. Stack tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend interno | React + Vite + TypeScript + Tailwind + Recharts |
| Portal público | Mesmo frontend, rotas `/public/*` (sem JWT) |
| Protótipo UI | Lovable → export → integração no Cursor |
| Backend | Node.js + Express + TypeScript + Prisma + Zod |
| Banco | PostgreSQL 16 |
| IA | Python FastAPI + LangChain (Executor, Validador, Qualidade) |
| Mensageria MVP | **Chatwoot** (inbox WhatsApp) + **N8N** (automações) |
| Infra | Docker Compose, Nginx, Hetzner, Cloudflare |
| CI/CD | GitHub Actions + GitLab CI (mirror) |
| Repositórios | `kadu207/casa-da-paz` (GitHub e GitLab) |

---

## 4. RBAC — matriz de acesso

| Setor | Permissões |
|-------|------------|
| DIRETORIA | Acesso total + relatórios + config |
| FINANCEIRO | Financeiro, importação, adimplência (sem prontuários) |
| RECEPCAO | CRM, eventos, check-in |
| LIVRARIA | PDV, estoque, produtos |
| MEDIUM | Apenas dados próprios (`pessoa_id` do usuário) |
| SUPORTE | Logs, health, manutenção |
| PUBLICO | Sem login — apenas rotas públicas |

Isolamento MEDIUM: `WHERE pessoa_id = :currentUserPessoaId` em todas as queries do painel pessoal.

---

## 5. Modelo de dados consolidado (MD + PDF)

### Entidades core (MD)
- `Pessoas` — single source of truth
- `Usuarios` — autenticação JWT
- `FinanceiroTransacoes` — receitas/despesas
- `Eventos` — giras, oficinas
- `Presencas` — check-in porta

### Extensões (PDF)
- `Produtos` — livros, ervas, artigos umbanda
- `EstoqueMovimentacoes` — baixa automática PDV
- `Inscricoes` — oficinas com lotação e pagamento
- `Alertas` — vencimentos, manutenções, lembretes
- `AgendamentosPublicos` — consultas via portal

### Status financeiros unificados (ADR-003)
- **Transação:** `PENDENTE` | `CONCLUIDO`
- **Adimplência (derivada):** `EM_DIA` | `ATRASADO` | `PAGO` (calculado por `vencimento` + `status`)

### Categorias receita (dashboard)
`MENSALIDADE`, `LIVRARIA`, `DOACAO`, `EVENTOS`, `OFICINAS`

### Categorias despesa (dashboard)
`ESTRUTURA_MANUTENCAO`, `INSUMOS_TERREIRO`, `CUSTOS_OPERACIONAIS`

---

## 6. Portal público (MVP)

**URL:** `https://casadapaz.inovatitech.com.br/public`

### Páginas
1. **Home** — missão, contato, link Instagram
2. **Eventos** — giras e oficinas abertas (somente leitura)
3. **Agendar consulta** — formulário: nome, telefone, data preferida, observação
4. **Contato** — botão WhatsApp (Chatwoot widget ou link wa.me)

### Fluxo agendamento
1. Consulentes preenchem formulário público
2. Backend cria `AgendamentoPublico` com status `PENDENTE`
3. N8N dispara notificação à recepção via Chatwoot/e-mail
4. Recepção confirma no painel interno → vincula a `Pessoas` se novo

### O que o portal NÃO faz no MVP
- Pagamentos online
- Login de consulentes
- Prontuários ou histórico clínico

---

## 7. WhatsApp + Chatwoot + N8N (MVP)

| Componente | Função |
|----------|--------|
| **Chatwoot** | Inbox unificada WhatsApp; widget no portal; atendimento recepção |
| **N8N** | Workflows: lembrete atraso, envio recibo, confirmação agendamento, alerta vencimento |
| **Backend** | Webhooks para N8N (`/api/webhooks/n8n/*`); stub PIX (`/api/webhooks/pix`) |

### Automações MVP (N8N)
1. Transação `ATRASADO` → WhatsApp lembrete (template)
2. Transação `CONCLUIDO` → WhatsApp recibo
3. Novo agendamento público → notifica recepção
4. Evento encerrado → resumo presenças para diretoria (e-mail)

---

## 8. Fluxos de negócio

### A. Financeiro e adimplência
- Mensalidades com `vencimento`; status derivado automaticamente (job diário)
- Conciliação manual ou webhook PIX
- Dashboard: barras receita + donut despesas (Recharts)

### B. Recepção / check-in
- Busca por telefone; menores exigem `nome_responsavel`
- Médiuns: checklist one-click
- Fechamento evento consolida contagens

### C. Livraria / PDV
- Venda registra transação `LIVRARIA` + baixa estoque

### D. Oficinas / inscrições
- `capacidade_max` no evento; inscrição com pagamento e ingresso digital (e-mail via N8N)

### E. Importação Excel
- Transação atômica; rollback total em erro; log detalhado

### F. Agentes IA (Python)
- Executor: parser xlsx
- Validador: regras negócio + rollback
- Qualidade: deduplicação fuzzy `Pessoas`

---

## 9. Identidade visual (PDF)

| Token | Valor |
|-------|-------|
| `--color-bg` | `#0F172A` |
| `--color-accent` | `#D4AF37` |
| `--color-text` | `#FFFFFF` |
| `--color-success` | `#22C55E` |
| `--color-danger` | `#EF4444` |

Tipografia: serif nos títulos, sans-serif no corpo. Dark mode padrão.

---

## 10. Epics e cronograma revisado

| Sprint | Epic | Features | Entregável |
|--------|------|----------|------------|
| 0 | Documentação + SDD | Spec Kit, memória, agentes, ADRs | Pipeline pronto |
| 1 | Fundação | 001-auth, 002-pessoas, 003-infra | Login RBAC + Docker local |
| 2 | Core operacional | 004-financeiro, 005-recepção, 006-eventos, 007-livraria | Módulos internos |
| 3 | Portal + mensageria | 011-portal-publico, 012-chatwoot-n8n | Portal + automações |
| 4 | Dashboards + adimplência | 013-dashboards, 014-alertas | Recharts + alertas |
| 5 | Automação | 008-excel, 009-ia, 010-pix-stub | IA + import |
| 6 | Produção | 015-cloudflare, 016-hetzner | **Gate usuário** |

**Lovable:** paralelo ao Sprint 2 — protótipo UI → export → integração A3.

---

## 11. ADRs relacionados

| ADR | Título |
|-----|--------|
| [001](memory/decisions/001-lovable-hibrido.md) | Estratégia Lovable híbrida |
| [002](memory/decisions/002-jwt-rbac.md) | JWT + RBAC backend-first |
| [003](memory/decisions/003-status-financeiro-adimplencia.md) | Status transação vs adimplência |
| [004](memory/decisions/004-estoque-inscricoes.md) | Estoque e inscrições |
| [005](memory/decisions/005-portal-publico-mvp.md) | Portal público MVP |
| [006](memory/decisions/006-whatsapp-chatwoot-n8n.md) | WhatsApp via Chatwoot + N8N |
| [007](memory/decisions/007-repositorios-dual-git.md) | Dual git GitHub + GitLab |

---

## 12. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| PDF sem texto extraível | Consolidado neste documento |
| API Key Lovable | Protótipo only; API no Cursor |
| WhatsApp Business API | Chatwoot como camada; N8N para templates |
| RBAC leak | Middleware + testes + auditoria mensal A1 |
| Deploy acidental | Script bloqueado; gate humano |
