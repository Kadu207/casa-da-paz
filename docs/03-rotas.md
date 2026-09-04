# 3. Rotas

Base: React Router em `frontend/src/App.tsx`.  
API: prefixo `/api` no Express (`backend/src/index.ts`).

## 3.1. Portal público

| URL | Descrição |
|-----|-----------|
| `/public` | Home |
| `/public/eventos` | Lista de eventos |
| `/public/eventos/:id` | Detalhe + inscrição |
| `/public/agendar` | Agendamento de atendimento |
| `/public/acompanhar/:protocolo` | Status do agendamento |
| `/public/contato` | Contato |
| `/public/livraria` | Catálogo / checkout (Asaas se configurado) |
| `/public/estudos` | Materiais de estudo (ervas, banhos, defumação) |
| `/public/estudos/:slug` | Detalhe do material |
| `/public/galeria` | Galeria pública de fotos e vídeos (Spec 034) |
| `/public/galeria/:slug` | Detalhe da mídia pública |
| `/public/termos` | Termos / LGPD |

## 3.2. ERP (`/app`)

| URL | Recurso RBAC típico | Descrição |
|-----|---------------------|-----------|
| `/app/login` | — | Login JWT |
| `/app` | dashboard | Dashboard / painel médium |
| `/app/delegacoes` | delegacoes | Funções da casa, responsáveis, tarefas (check) |
| `/app/financeiro/lancamentos` | financeiro | Lançamentos |
| `/app/financeiro/fluxo` | financeiro | Fluxo de caixa |
| `/app/financeiro/atrasados` | financeiro | Recebíveis atrasados |
| `/app/financeiro/pagamentos` | contas_pagar | Agenda a pagar |
| `/app/financeiro/contas-pagar` | contas_pagar | Contas a pagar / fornecedores |
| `/app/financeiro/recorrencia` | recorrencia | Planos de mensalidade |
| `/app/financeiro/contribuintes` | contribuintes | Patrocínios / padrinhos |
| `/app/financeiro/dre` | dre | DRE / orçamento / centros |
| `/app/financeiro/ofx` | conciliacao_bancaria | Extrato OFX |
| `/app/financeiro/conciliacao` | financeiro | Conciliação operacional |
| `/app/financeiro/contas` | contas | Contas financeiras |
| `/app/financeiro/cobrancas` | cobrancas | Cobranças Asaas (opcional) |
| `/app/financeiro/transparencia` | transparencia | Transparência interna |
| `/app/financeiro/alertas` | alertas | Alertas financeiros |
| `/app/pessoas` | pessoas | Cadastros por função (+ mensalidade nos médiuns) |
| `/app/recepcao` | checkin | Recepção / check-in |
| `/app/eventos` | eventos | Eventos ERP |
| `/app/livraria` | livraria | PDV / estoque de venda |
| `/app/estoque` | estoque_casa | Estoque primário da casa (insumos) |
| `/app/ecommerce` | ecommerce | Pedidos |
| `/app/marketing` | marketing | Marketing + materiais de estudo + galeria CRUD |
| `/app/galeria` | (autenticado) | Consumo fotos/vídeos públicos e internos |
| `/app/usuarios` | usuarios | Usuários + policies (SUPERVISOR) |
| `/app/auditoria` | auditoria | Auditoria / export |

## 3.3. API (principais)

| Método | Path | Notas |
|--------|------|-------|
| POST | `/api/auth/login` | JWT |
| GET/POST | `/api/auth/usuarios` | Cria usuário **com** `UsuarioPolicy` |
| GET/PUT | `/api/auth/usuarios/:id/politicas` | Policies (SUPERVISOR) |
| GET | `/api/auth/politicas/catalogo` | Defaults por setor |
| CRUD | `/api/pessoas` | Inclui `mensalidadePlano` |
| * | `/api/financeiro/*` | Ledger, fluxo, atrasados, DRE, OFX… |
| * | `/api/fornecedores`, `/api/contas-pagar` | Contas a pagar |
| * | `/api/mensalidade-planos` | Recorrência |
| * | `/api/contribuintes` | Patrocínios / padrinhos |
| * | `/api/cobrancas`, `/api/webhooks/asaas` | Asaas (se chave) |
| * | `/api/livraria` | PDV / produtos |
| * | `/api/estoque-casa` | Estoque primário (itens, movimentações, grupos, checklists) |
| * | `/api/delegacoes` | Funções, responsáveis, tarefas, toggle, sync-alertas, resumo |
| * | `/api/public/*` | Portal anônimo |

Contrato parcial: [`docs/contracts/openapi.yaml`](./contracts/openapi.yaml).
