# 4. Banco de Dados

**Fonte de verdade:** `backend/prisma/schema.prisma` + migrations em `backend/prisma/migrations/`.

SGBD: **PostgreSQL 16**. Autorização de aplicação via JWT/RBAC (não RLS Supabase).

## 4.1. Domínios principais

| Domínio | Models chave |
|---------|----------------|
| Pessoas / auth | `Pessoa` (+ `email` opcional), `PessoaResponsavel`, `Usuario` (+ `deveTrocarSenha`), `UsuarioPolicy` |
| Financeiro ledger | `FinanceiroTransacao`, `ContaFinanceira`, `FinanceiroFechamentoMensal` |
| Contas a pagar (022) | `Fornecedor`, `ContaPagar`, `ContaPagarParcela` |
| Recorrência (023) | `MensalidadePlano` |
| DRE / orçamento (024) | `CentroCusto`, `OrcamentoLinha` (+ `centroCustoId` em transações) |
| OFX (025) | `OfxImport`, `OfxMovimento` |
| Contribuintes | `Contribuinte` (`PATROCINIO` \| `PADRINHO`) |
| Asaas (021, opcional) | `AsaasCliente`, `AsaasCobranca`, `AsaasAssinatura`, `AsaasWebhookEvent` |
| Eventos | `Evento`, `Inscricao`, `Presenca` |
| Estoque primário (031) | `ItemEstoqueCasa`, `MovimentacaoEstoqueCasa`, `GrupoLimpeza`, `ChecklistLimpeza`, `ChecklistLimpezaItem` |
| Delegações (033) | `FuncaoCasa`, `FuncaoResponsavel`, `TarefaDelegacao` |
| Livraria / ecommerce | `Produto`, `EstoqueMovimentacao`, `EcommercePedido` (venda — ADR-004) |
| Portal | `AgendamentoPublico`, newsletter, consentimentos LGPD |
| Ops | `Alerta` (inclui tipos `DELEGACAO_*`), auditoria, marketing |

## 4.2. Enums relevantes (tesouraria)

- `StatusContaPagar`: PENDENTE / PARCIAL / PAGO / CANCELADO  
- `StatusParcela`: PENDENTE / PAGO / CANCELADO  
- `StatusOfxMovimento`: PENDENTE / CONCILIADO / IGNORADO  
- `TipoContribuinte`: PATROCINIO / PADRINHO  
- `OrigemTransacao`: inclui `RECORRENCIA`, `CONTA_PAGAR`, `OFX`, …  
- `SetorAcesso`: SUPERVISOR, ADMIN, DIRETORIA, FINANCEIRO, **TESOURARIA**, MARKETING, RECEPCAO, LIVRARIA, MEDIUM, SUPORTE  

### Estoque da casa (031)

- `CategoriaEstoqueCasa`: RITUAL, BEBIDA, TABACO, VELA, LIMPEZA, DESCARTAVEL, OUTROS  
- `UnidadeEstoqueCasa`: UN, CX, PCT, L, ML, KG, G  
- `TipoMovEstoqueCasa`: ENTRADA, SAIDA, AJUSTE  
- `StatusChecklistLimpeza`: RASCUNHO, CONCLUIDO  

### Delegações (033)

- `StatusTarefaDelegacao`: PENDENTE, CONCLUIDA, CANCELADA  

## 4.3. Regras de dados

| Regra | Detalhe |
|-------|---------|
| Adimplência | Derivada de lançamentos (ADR-003) — não persistir status duplicado |
| Baixa de parcela | Cria `FinanceiroTransacao` DESPESA CONCLUIDO e liga `transacaoId` |
| Mensalidade | Um `MensalidadePlano` por `pessoaId`; job gera lançamento do mês se ausente |
| Policy | `UsuarioPolicy.grants` JSON — snapshot no cadastro do usuário |
| Import Excel | Transação atômica com rollback total |
| Estoque mínimo (casa) | Derivado: `estoqueAtual <= estoqueMinimo` (não status persistido) |
| Multi-estoque | Primário (`itens_estoque_casa`) ≠ livraria (`produtos`) — ADR-010 |
| Delegações | Funções + tarefas checáveis; alertas `DELEGACAO_*` — ADR-011 |

## 4.4. Migrations recentes

| Migration | Conteúdo |
|-----------|----------|
| `20260803000000_financeiro_asaas_gestor` | Contas + Asaas + MARKETING |
| `20260806120000_tesouraria_022_025` | Contas a pagar, planos, DRE, OFX |
| `20260806140000_contribuintes_patrocinio_padrinho` | Contribuintes |
| `20260820120000_estoque_casa_031` | Almoxarifado primário + grupos limpeza + checklist |
| `20260901140000_usuario_deve_trocar_senha` | `Usuario.deveTrocarSenha` (F06) |
| `20260902120000_delegacoes_casa_033` | Funções/tarefas + `Pessoa.email` |

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
# Catálogo primário (idempotente, seguro em prod):
npx tsx prisma/seed.ts --estoque-casa-only
# Funções da casa 033 (idempotente):
npx tsx prisma/seed.ts --funcoes-casa-only
```

## 4.5. Porta local

- Compose padrão (`infra/docker-compose.yml`): host **5433** → container 5432  
- Alguns ambientes (ex. messaging): **5437** — conferir `DATABASE_URL` em `backend/.env`
