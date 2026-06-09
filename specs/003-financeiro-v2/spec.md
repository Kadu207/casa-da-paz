# Feature 003-v2 — Gestor Financeiro Operacional

**Status:** Proposta | **Data:** 2026-06-08  
**Substitui/estende:** `specs/003-financeiro/spec.md` (MVP concluído)  
**ADR relacionados:** [003](../../docs/memory/decisions/003-status-financeiro-adimplencia.md) (mantido sem alteração)

---

## 1. Overview

Evoluir o módulo financeiro MVP para um **gestor operacional** adequado ao dia a dia de um terreiro: visão por período, conciliação mensal, relatórios exportáveis e UI completa sobre a API já existente.

### Por que Fase 1 (operacional)?

| Opção | Valor | Risco | Decisão |
|-------|-------|-------|---------|
| **Fase 1 — Operacional** | Alto (usa 80% do backend atual) | Baixo | **Escopo desta spec** |
| Fase 2 — Automação (PIX, recorrência) | Alto | Médio (integrações externas) | Fora de escopo |
| Fase 3 — Contabilidade (DRE, orçamento) | Médio | Alto (complexidade contábil) | Fora de escopo |

A Fase 1 entrega valor imediato para **FINANCEIRO** e **DIRETORIA** sem migration pesada, sem dependência de PSP bancário e alinhada ao playbook em `docs/memory/playbooks/financeiro.md`.

### Objetivo de negócio

Permitir que o setor financeiro:

1. Veja entradas, saídas e saldo **por período** (não só acumulado total).
2. **Concilie** mensalidades e pendências ao fim do mês.
3. **Exporte** relatório mensal para arquivo (CSV/PDF).
4. Opere transações com **CRUD completo na UI** (editar/excluir já existem na API).
5. Acompanhe **atrasados** em painel dedicado com ações em lote.

---

## 2. Personas e histórias de usuário

| Persona | Setor | Necessidade |
|---------|-------|-------------|
| Tesoureiro(a) | FINANCEIRO | Lançar, corrigir e baixar pagamentos |
| Diretor(a) | DIRETORIA | Visão consolidada e fechamento mensal |
| Médium | MEDIUM | Ver apenas próprias mensalidades (já existe) |

### User stories

- **US-01:** Como FINANCEIRO, quero filtrar transações por período, tipo e categoria para encontrar lançamentos rapidamente.
- **US-02:** Como FINANCEIRO, quero editar e excluir uma transação na interface quando houver erro de lançamento.
- **US-03:** Como FINANCEIRO, quero ver fluxo de caixa do mês (receitas, despesas, saldo, pendências) em um único painel.
- **US-04:** Como FINANCEIRO, quero um painel de atrasados com telefone da pessoa e ação “marcar pago” em lote.
- **US-05:** Como DIRETORIA, quero exportar relatório mensal (CSV/PDF) para prestação de contas.
- **US-06:** Como DIRETORIA, quero registrar fechamento mensal após conciliação, com snapshot dos totais.
- **US-07:** Como DIRETORIA, quero filtrar KPIs do dashboard financeiro por mês/ano.
- **US-08:** Como FINANCEIRO, quero ver histórico financeiro de uma pessoa ao vincular mensalidade.

---

## 3. Escopo

### Dentro do escopo (Fase 1)

- Filtros avançados na listagem (`de`, `ate`, `tipo`, `categoria`, `status`, `pessoaId`, `adimplencia`)
- Paginação server-side na listagem
- UI: editar transação, excluir com confirmação
- Nova sub-rota **Fluxo de caixa** (`/app/financeiro/fluxo`)
- Nova sub-rota **Atrasados** (`/app/financeiro/atrasados`)
- Nova sub-rota **Conciliação mensal** (`/app/financeiro/conciliacao`)
- Endpoints de agregação por período e exportação
- Tabela `financeiro_fechamentos_mensais` (snapshot + auditoria)
- Dashboard: filtro `?mes=&ano=` em `/metricas/resumo`
- i18n pt-BR + en para novas strings
- Testes backend (filtros, export, fechamento) + smoke E2E mínimo

### Fora do escopo (Fase 2+)

- PIX produção / conciliação bancária OFX
- Mensalidades recorrentes automáticas
- Orçamento por categoria, DRE, centros de custo
- Multi-conta / caixas separados
- NF-e, SPED, integração contábil externa
- Pagamentos online no portal público

---

## 4. Modelo de dados

### 4.1 Entidade existente (sem breaking change)

`FinanceiroTransacao` permanece conforme ADR-003:

| Campo | Tipo | Notas |
|-------|------|-------|
| `status` | PENDENTE \| CONCLUIDO | Fonte primária |
| `vencimento` | DATE? | Obrigatório em MENSALIDADE/EVENTOS/OFICINAS |
| `adimplencia` | derivado | EM_DIA \| ATRASADO \| PAGO — **não persistir** |

### 4.2 Nova entidade — fechamento mensal

```prisma
model FinanceiroFechamentoMensal {
  id              Int      @id @default(autoincrement())
  ano             Int
  mes             Int      // 1-12
  receitasTotal   Decimal  @map("receitas_total") @db.Decimal(12, 2)
  despesasTotal   Decimal  @map("despesas_total") @db.Decimal(12, 2)
  saldo           Decimal  @db.Decimal(12, 2)
  pendentesQtd    Int      @map("pendentes_qtd")
  atrasadosQtd    Int      @map("atrasados_qtd")
  observacoes     String?
  fechadoPorId    Int      @map("fechado_por_id")
  fechadoEm       DateTime @default(now()) @map("fechado_em")
  fechadoPor      Usuario  @relation(fields: [fechadoPorId], references: [id])

  @@unique([ano, mes])
  @@map("financeiro_fechamentos_mensais")
}
```

**Regras:**

- Um fechamento por `(ano, mes)` — segunda tentativa retorna `409 Conflict`.
- Fechamento **não bloqueia** novos lançamentos retroativos; registra snapshot + responsável.
- Exclusão de fechamento: apenas `DIRETORIA` (`DELETE`).

### 4.3 Índices recomendados

```sql
CREATE INDEX idx_fin_trans_data ON financeiro_transacoes(data_transacao);
CREATE INDEX idx_fin_trans_vencimento ON financeiro_transacoes(vencimento) WHERE vencimento IS NOT NULL;
CREATE INDEX idx_fin_trans_pessoa ON financeiro_transacoes(pessoa_id) WHERE pessoa_id IS NOT NULL;
```

---

## 5. Telas e navegação

### 5.1 Estrutura de rotas (frontend)

```
/app/financeiro              → FinanceiroPage (listagem + CRUD)     [existente, evoluir]
/app/financeiro/fluxo        → FinanceiroFluxoPage                  [nova]
/app/financeiro/atrasados    → FinanceiroAtrasadosPage              [nova]
/app/financeiro/conciliacao  → FinanceiroConciliacaoPage            [nova]
```

**Nav interna** (tabs ou sub-nav abaixo do título, padrão dark + accent `#D4AF37`):

| Tab | Ícone sugerido | Roles |
|-----|----------------|-------|
| Lançamentos | lista | DIRETORIA, FINANCEIRO |
| Fluxo de caixa | gráfico barras | DIRETORIA, FINANCEIRO |
| Atrasados | alerta | DIRETORIA, FINANCEIRO |
| Conciliação | calendário | DIRETORIA, FINANCEIRO |

MEDIUM continua vendo apenas `/app/financeiro` filtrado por `pessoa_id` (sem sub-rotas administrativas).

### 5.2 Tela — Lançamentos (`FinanceiroPage` evoluída)

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ Financeiro          [Lançamentos|Fluxo|Atrasados|Conciliação]│
├─────────────────────────────────────────────────────────────┤
│ Filtros: [De] [Até] [Tipo▼] [Cat▼] [Status▼] [Adimpl▼] [🔍]│
│ [+ Nova] [Import Excel] [Sync alertas]                       │
├─────────────────────────────────────────────────────────────┤
│ Tabela paginada (50/página)                                  │
│ Pessoa | Tipo | Cat | Valor | Data | Venc | Adimpl | Ações  │
│ ...                                    [Editar] [Excluir] [✓]│
├─────────────────────────────────────────────────────────────┤
│ « Anterior   Página 1 de N   Próximo »                       │
└─────────────────────────────────────────────────────────────┘
```

**Comportamentos:**

- Modal/drawer de **edição** reutiliza formulário de criação (`PUT /financeiro/:id`).
- **Excluir** exige confirmação; bloqueado se transação vinculada a inscrição paga (retorno 409 da API).
- **Marcar pago** mantém ação inline (`PATCH /financeiro/:id/status`).
- Empty state e loading skeleton consistentes com demais páginas ERP.

### 5.3 Tela — Fluxo de caixa (`FinanceiroFluxoPage`)

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ Período: [Mês/Ano ▼]  ou  [De] — [Até]                      │
├──────────┬──────────┬──────────┬──────────┬──────────────────┤
│ Receitas │ Despesas │ Saldo    │ Pendente │ Atrasado         │
│ R$ X     │ R$ Y     │ R$ Z     │ N        │ M                │
├─────────────────────────────────────────────────────────────┤
│ Gráfico barras empilhadas: receita vs despesa por semana     │
│ Gráfico linha: saldo acumulado no período                    │
├─────────────────────────────────────────────────────────────┤
│ Tabela resumo por categoria (Receita | Despesa | Saldo cat.) │
└─────────────────────────────────────────────────────────────┘
```

**Defaults:** mês corrente. Recharts (mesma lib do `DashboardPage`).

### 5.4 Tela — Atrasados (`FinanceiroAtrasadosPage`)

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ N atrasados | Total em aberto: R$ X                          │
│ [Selecionar todos] [Marcar selecionados como pagos]          │
├─────────────────────────────────────────────────────────────┤
│ ☐ | Pessoa | Tel | Cat | Valor | Venc | Dias atraso | [✓]  │
└─────────────────────────────────────────────────────────────┘
```

- Dados de `GET /financeiro/atrasados` (já existe; incluir `diasAtraso` calculado).
- Ação em lote: `POST /financeiro/batch/status`.

### 5.5 Tela — Conciliação mensal (`FinanceiroConciliacaoPage`)

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ Mês: [Jun/2026 ▼]                                            │
├─────────────────────────────────────────────────────────────┤
│ Checklist automático:                                        │
│ ☐ Todas mensalidades do mês revisadas (N pendentes)          │
│ ☐ Atrasados tratados ou justificados (M itens)               │
│ ☐ Despesas do mês lançadas                                   │
├─────────────────────────────────────────────────────────────┤
│ Resumo: Receitas R$ X | Despesas R$ Y | Saldo R$ Z           │
│ [Exportar CSV] [Exportar PDF] [Registrar fechamento]         │
├─────────────────────────────────────────────────────────────┤
│ Histórico de fechamentos (últimos 12 meses)                  │
└─────────────────────────────────────────────────────────────┘
```

- Botão **Registrar fechamento** habilitado se não existir fechamento para o mês.
- Após fechamento: badge “Fechado em DD/MM por Nome” + desabilita re-fechar (DIRETORIA pode reabrir via DELETE).

---

## 6. Contratos de API

Prefixo: `/api/financeiro`  
Auth: JWT + RBAC (`financeiro` read/write, `dashboard` read onde indicado).

### 6.1 Endpoints existentes (reutilizar)

| Método | Rota | Ação | Alteração v2 |
|--------|------|------|--------------|
| GET | `/` | Listar transações | **Estender** query params + paginação |
| GET | `/atrasados` | Listar atrasados | **Estender** com `diasAtraso` |
| GET | `/dashboard` | Agregado por categoria | Manter (legado) |
| POST | `/` | Criar | Manter |
| PUT | `/:id` | Atualizar | Manter |
| PATCH | `/:id/status` | Baixa manual | Manter |
| DELETE | `/:id` | Excluir | **Estender** regra inscrição vinculada |
| POST | `/sync-alertas` | Job alertas | Manter |

### 6.2 Endpoints novos

#### `GET /financeiro` — listagem paginada (evolução)

**Query params:**

| Param | Tipo | Descrição |
|-------|------|-----------|
| `de` | ISO date | Início inclusive (`dataTransacao`) |
| `ate` | ISO date | Fim inclusive |
| `tipo` | RECEITA \| DESPESA | Filtro tipo |
| `categoria` | string | Filtro categoria |
| `status` | PENDENTE \| CONCLUIDO | Filtro status |
| `adimplencia` | EM_DIA \| ATRASADO \| PAGO | Filtro derivado (pós-query ou SQL) |
| `pessoaId` | number | Filtro pessoa |
| `page` | number | Default 1 |
| `limit` | number | Default 50, max 100 |

**Response 200:**

```json
{
  "data": [ { "id": 1, "tipo": "RECEITA", "adimplencia": "EM_DIA", "...": "..." } ],
  "meta": { "page": 1, "limit": 50, "total": 123, "totalPages": 3 }
}
```

> **Compatibilidade:** se `page` ausente, retornar array simples (comportamento atual) por 1 release; deprecar em v0.2.

#### `GET /financeiro/fluxo-caixa`

**Query:** `de`, `ate` (obrigatório) ou `mes` + `ano`.

**Response 200:**

```json
{
  "periodo": { "de": "2026-06-01", "ate": "2026-06-30" },
  "totais": {
    "receitasConcluidas": 15000.00,
    "despesasConcluidas": 8200.00,
    "saldo": 6800.00,
    "pendentesValor": 1200.00,
    "pendentesQtd": 8,
    "atrasadosValor": 450.00,
    "atrasadosQtd": 3
  },
  "porSemana": [
    { "semana": "2026-W23", "receitas": 4000, "despesas": 2100, "saldoAcumulado": 1900 }
  ],
  "porCategoria": {
    "receitas": [ { "categoria": "MENSALIDADE", "valor": 9000 } ],
    "despesas": [ { "categoria": "INSUMOS_TERREIRO", "valor": 3200 } ]
  }
}
```

**RBAC:** `financeiro:read`

#### `GET /financeiro/pessoas/:pessoaId/historico`

Histórico financeiro de uma pessoa (mensalidades, eventos, etc.).

**Response 200:**

```json
{
  "pessoa": { "id": 12, "nomeCompleto": "..." },
  "resumo": { "totalPago": 600, "totalPendente": 50, "atrasadosQtd": 1 },
  "transacoes": [ "..."]
}
```

**RBAC:** `financeiro:read`; MEDIUM só se `pessoaId === currentUser.pessoaId`.

#### `POST /financeiro/batch/status`

Baixa em lote.

**Body:**

```json
{ "ids": [1, 2, 3], "status": "CONCLUIDO" }
```

**Response 200:**

```json
{ "atualizados": 3, "ignorados": 0, "erros": [] }
```

**RBAC:** `financeiro:write`

#### `GET /financeiro/conciliacao`

**Query:** `mes`, `ano` (obrigatório).

**Response 200:**

```json
{
  "mes": 6,
  "ano": 2026,
  "checklist": {
    "mensalidadesPendentes": 2,
    "atrasados": 1,
    "despesasNoMes": 15
  },
  "totais": { "receitas": 15000, "despesas": 8200, "saldo": 6800 },
  "fechamento": null
}
```

Se já fechado, `fechamento: { "id", "fechadoEm", "fechadoPor": { "nome" } }`.

#### `POST /financeiro/conciliacao/fechar`

**Body:**

```json
{ "mes": 6, "ano": 2026, "observacoes": "Conciliação junho OK" }
```

**Response 201:** objeto `FinanceiroFechamentoMensal`.  
**409:** mês já fechado.

**RBAC:** `financeiro:write` (FINANCEIRO + DIRETORIA)

#### `DELETE /financeiro/conciliacao/:ano/:mes`

Reabre mês (remove fechamento). **RBAC:** apenas `DIRETORIA`.

#### `GET /financeiro/export.csv`

**Query:** `mes`, `ano` ou `de` + `ate`.

**Response:** `text/csv` com colunas:
`id,tipo,categoria,valor,data_transacao,vencimento,status,adimplencia,pessoa_nome,observacoes`

**RBAC:** `financeiro:read`

#### `GET /financeiro/export.pdf`

Mesmo filtro do CSV. PDF simples (mesmo padrão de `auditoria/export.pdf`).

**RBAC:** `financeiro:read`

### 6.3 Evolução em `/metricas/resumo`

Adicionar query opcional `mes` + `ano`:

- Quando presentes, KPIs financeiros consideram transações com `dataTransacao` no mês.
- Quando ausentes, comportamento atual (acumulado total).

---

## 7. RBAC

| Recurso / Ação | DIRETORIA | FINANCEIRO | MEDIUM |
|----------------|-----------|------------|--------|
| Listar / fluxo / export | ✅ | ✅ | own |
| CRUD transações | ✅ | ✅ | ❌ |
| Batch status | ✅ | ✅ | ❌ |
| Fechar mês | ✅ | ✅ | ❌ |
| Reabrir mês (DELETE fechamento) | ✅ | ❌ | ❌ |
| Conciliação / atrasados admin | ✅ | ✅ | ❌ |

Middleware existente em `backend/src/policies/rbac.ts` — sem novos recursos; usar `financeiro` e `dashboard`.

---

## 8. Integrações

| Sistema | Uso na v2 |
|---------|-----------|
| N8N | Sem mudança; continua consumindo `/atrasados` |
| Chatwoot | Lembretes via N8N (fora desta spec) |
| Import Excel | Mantém rota `/import/excel` |
| PDV Livraria | Transações LIVRARIA automáticas (sem mudança) |
| Inscrições | Bloqueio DELETE se inscrição ativa vinculada |

---

## 9. Critérios de aceite

### Backend

- [ ] Migration `financeiro_fechamentos_mensais` + índices
- [ ] `GET /financeiro` com filtros + paginação documentados acima
- [ ] `GET /financeiro/fluxo-caixa` com agregação semanal e por categoria
- [ ] `GET /financeiro/pessoas/:id/historico` com isolamento MEDIUM
- [ ] `POST /financeiro/batch/status` idempotente por id
- [ ] `GET/POST/DELETE` conciliação mensal conforme contrato
- [ ] `GET /financeiro/export.csv` e `export.pdf`
- [ ] `DELETE /financeiro/:id` retorna 409 se vinculado a inscrição não cancelada
- [ ] `/metricas/resumo?mes=&ano=` filtra KPIs financeiros
- [ ] Testes Pest/Jest cobrindo filtros, fechamento duplicado, RBAC MEDIUM

### Frontend

- [ ] Sub-nav Financeiro com 4 abas
- [ ] Lançamentos: filtros, paginação, editar, excluir
- [ ] Fluxo de caixa: KPIs + 2 gráficos Recharts
- [ ] Atrasados: seleção múltipla + batch pagar
- [ ] Conciliação: checklist, export, fechar mês, histórico
- [ ] i18n pt-BR e en para todas as strings novas
- [ ] MEDIUM não vê abas administrativas

### Não-funcional

- [ ] Listagem paginada < 300 ms com 10k transações (índices)
- [ ] Export CSV até 5k linhas sem OOM (stream)
- [ ] Auditoria: fechamento mensal registrado em log de auditoria existente

---

## 10. Plano de testes

| Caso | Tipo | Esperado |
|------|------|----------|
| Filtrar jun/2026 receitas | API | Só RECEITA no intervalo |
| MEDIUM acessa histórico de outra pessoa | API | 403 |
| Fechar jun/2026 duas vezes | API | 409 na segunda |
| DIRETORIA reabre mês | API | 204 + fechamento removido |
| Batch 5 ids, 1 inválido | API | 4 atualizados, 1 em erros |
| Excluir tx de inscrição ativa | API | 409 |
| Export PDF jun/2026 | API | Content-Type application/pdf |
| UI editar transação | E2E | PUT reflete na tabela |
| Fluxo gráfico mês vazio | UI | Empty state amigável |

---

## 11. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Breaking change em `GET /financeiro` (array → objeto) | Período de compat: sem `page` retorna array |
| Performance em adimplencia filter | Calcular em SQL quando possível; índice em vencimento |
| Fechamento “falso” com pendências | UI alerta; não bloqueia (decisão consciente da diretoria) |
| PDF pesado | Limitar export a 12 meses; paginar CSV |

---

## 12. Estimativa e entregáveis

| Sprint | Entregável |
|--------|------------|
| S1 | Migration + endpoints listagem/fluxo/batch + testes |
| S2 | Conciliação + export + `/metricas` filtro período |
| S3 | UI completa (4 telas) + i18n + smoke E2E |

**Agentes:** `agent-backend-api` → `agent-frontend-ux` → `validador-integracao` → `validador-qualidade`

---

## 13. Roadmap Fase 2 (referência futura)

Spec separada `003-financeiro-v3` quando Fase 1 estiver em produção:

- Campo `formaPagamento` (MANUAL, PIX, PDV, IMPORT)
- Webhook PIX idempotente com `referenciaExterna` unique
- Job mensal: gerar mensalidades recorrentes
- Import OFX/CSV para conciliação bancária

---

## 14. Referências

- MVP: `specs/003-financeiro/spec.md`
- ADR-003: `docs/memory/decisions/003-status-financeiro-adimplencia.md`
- Playbook: `docs/memory/playbooks/financeiro.md`
- API atual: `backend/src/routes/financeiro.ts`
- UI atual: `frontend/src/pages/FinanceiroPage.tsx`
- Dashboard: `frontend/src/pages/DashboardPage.tsx`, `backend/src/routes/metricas.ts`
