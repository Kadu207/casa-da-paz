# Changelog — Casa da Paz

## [Unreleased]

### Adicionado
- **033 Delegações / Funções da Casa:** menu `/app/delegacoes`, API `/api/delegacoes`, modelos `FuncaoCasa`/`TarefaDelegacao`, `Pessoa.email`, RBAC `delegacoes`, N8N `tarefa_delegacao` + `sync-alertas` (ADR-011) — **deploy VPS** `2975b46` (migrate + seed funções + rebuild BE/FE) 2026-09-02
- **030 Security hardening:** Helmet/CSP API, magic bytes em uploads (media/OFX/Excel), rate-limit `/api`, smoke bypass `:9080`, `check-prod-secrets.sh`, Spec 030 (spec/plan/tasks), skill `agent-security-ops` checklist datado
- **031 Estoque primário da Casa:** menu `/app/estoque`, API `/api/estoque-casa`, catálogo seedado (ritualística/limpeza), estoque mínimo/alertas, grupos de limpeza + checklist com baixas, RBAC `estoque_casa` (ADR-010) — separado da Livraria/PDV

### Segurança
- `npm audit` BE: override `deepmerge-ts` ≥8 (0 vulns omit=dev)
- Smoke 2026-08-20: HTTPS headers OK; `http://IP:9080` TIMEOUT
- Deploy VPS backend `e18a63c` (Helmet + uploads) — health + CSP API em produção
- **Auditoria F01–F10:** Remediado/Validado 2026-09-02 — smoke prod PASS; ver `docs/security-audit/ACHADOS.md`

### Documentação
- **Refresh 2026-09-02:** docs 00–09, README, roadmap, memória, ACHADOS F01–F10 GREEN, 033/delegações, CSP mapa OSM, smokes de auditoria
- **Refresh 2026-08-06:** `docs/00–09`, README, roadmap, playbooks, constitution IX, specs 022–026 status, OpenAPI/RBAC alinhados à stack Express/Vite (Lovable movido para `docs/reference/lovable/`)
- Cloudflare DNS + runbook firewall: smoke scripts e inventário secrets

### Corrigido
- **Mapa “Onde nos encontrar”:** CSP nginx `frame-src` para OpenStreetMap (bloqueio de iframe) — 2026-09-02
- **Auditoria F01–F10:** remediações P1/P2/P3 + smoke prod PASS — 2026-09-02

### Validado
- Smoke auditoria F01–F10 prod (`scripts/smoke-audit-f01-f10-prod.ps1`) PASS 11/0 — 2026-09-02
- Smoke local tesouraria 022–025 + contribuintes + migrate (2026-08-06)
- Deploy VPS + smoke manual produção (2026-06-09)
- Smoke local 017–019 + alertas reenvio N8N (2026-06-29)
- Unit tests Asaas webhook mappers (2026-08-02)

### Adicionado (anterior)
- **027 Materiais de estudo:** portal `/public/estudos` (ervas/banhos/defumação); edição via Marketing; home galeria ervas → estudos
- **Policies no cadastro de usuário:** `POST /auth/usuarios` cria `UsuarioPolicy` com snapshot do setor (+ overrides); UI define nível de acesso no ato
- **Patrocínios / Padrinhos:** aba Financeiro + API `/contribuintes`; coluna mensalidade na lista de médiuns
- **022–025 Tesouraria completa (sem Asaas):** contas a pagar, agenda a pagar, recorrência mensalidade, DRE/orçamento/centros, OFX; agentes ops em `agents.md`
- **021 Financeiro Asaas + Marketing:** ContaFinanceira, cobranças/assinaturas Asaas, webhook idempotente, transparência interna ERP, papel MARKETING (`/app/marketing`), checkout público via Asaas (ADR-009) — dormant até chave
- Harness: `agents.md`, `.specify/memory/memory.md`, skills atualizadas + 5 agentes pós-construção
- Smoke: `scripts/test-financeiro-asaas.ps1`, `scripts/test-tesouraria-022.ps1`
- **Cadastros por função:** seções Presidente/Diretoria/Tesouraria/etc.; `PessoaResponsavel` para menores
- **Alertas UI (014 S1–S3):** API `/api/alertas`, página Financeiro, badge pendências, workflow N8N `lembrete_atraso`
- Scripts smoke: `test-alertas-reenviar.ps1`, `test-dashboard-v2.ps1`, `test-painel-medium.ps1`, `test-agendamento-n8n-prod.ps1`
- **Dashboard v2 (017):** seletor mês/ano, KPIs/gráficos por período, link para fluxo de caixa
- **Painel Médium (018):** `GET /metricas/meu-painel`, KPIs + mensalidades/presenças/inscrições
- **Auditoria v2 (019):** export CSV/PDF com filtros, sort e filename por período
- API `/metricas/resumo` retorna `periodo`; presenças filtradas no período
- Sub-nav `FinanceiroLayout`, rotas aninhadas em `/app/financeiro/*`
- i18n pt-BR/en para módulo financeiro; export CSV/PDF; batch pagar atrasados

### Removido
- Campos Stripe em `EcommercePedido` (substituídos por `asaas_*`)
- `FinanceiroPage.tsx` legado (substituído pelas 4 telas)

### Validado
- Smoke local tesouraria 022–025 + contribuintes + migrate (2026-08-06)
- Deploy VPS + smoke manual produção (2026-06-09)
- Smoke local 017–019 + alertas reenvio N8N (2026-06-29)
- Unit tests Asaas webhook mappers (2026-08-02)

## [0.1.0-alpha] — 2026-06-05

### Adicionado
- Documentação consolidada (MD + DOCX + PDF)
- 7 ADRs (Lovable, RBAC, adimplência, estoque, portal, Chatwoot/N8N, dual-git)
- Pipeline SDD: Spec Kit, memória permanente, 8 agentes Cursor
- Monorepo: frontend, backend, ai-service, infra
- Epic 1: auth-rbac, pessoas-core, infra-base
- Epic 2: financeiro ADR-003, recepção check-in, migrations Prisma formais
- Epic 2b: inscrições ADR-004, livraria PDV/estoque
- Portal público e WhatsApp no escopo MVP (Sprint 3)
- Repositórios GitHub e GitLab `kadu207/casa-da-paz`
