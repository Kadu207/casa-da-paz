# 4. Banco de Dados

**Fonte de verdade:** `backend/prisma/schema.prisma` + migrations em `backend/prisma/migrations/`.

SGBD: **PostgreSQL 16**. Autorização de aplicação via JWT/RBAC (não RLS Supabase).

## 4.1. Domínios principais

| Domínio | Models chave |
|---------|----------------|
| Pessoas / auth | `Pessoa`, `PessoaResponsavel`, `Usuario`, `UsuarioPolicy` |
| Financeiro ledger | `FinanceiroTransacao`, `ContaFinanceira`, `FinanceiroFechamentoMensal` |
| Contas a pagar (022) | `Fornecedor`, `ContaPagar`, `ContaPagarParcela` |
| Recorrência (023) | `MensalidadePlano` |
| DRE / orçamento (024) | `CentroCusto`, `OrcamentoLinha` (+ `centroCustoId` em transações) |
| OFX (025) | `OfxImport`, `OfxMovimento` |
| Contribuintes | `Contribuinte` (`PATROCINIO` \| `PADRINHO`) |
| Asaas (021, opcional) | `AsaasCliente`, `AsaasCobranca`, `AsaasAssinatura`, `AsaasWebhookEvent` |
| Eventos | `Evento`, `Inscricao`, `Presenca` |
| Livraria / ecommerce | produtos, estoque, `EcommercePedido` |
| Portal | `AgendamentoPublico`, newsletter, consentimentos LGPD |
| Ops | `Alerta`, auditoria, marketing |

## 4.2. Enums relevantes (tesouraria)

- `StatusContaPagar`: PENDENTE / PARCIAL / PAGO / CANCELADO  
- `StatusParcela`: PENDENTE / PAGO / CANCELADO  
- `StatusOfxMovimento`: PENDENTE / CONCILIADO / IGNORADO  
- `TipoContribuinte`: PATROCINIO / PADRINHO  
- `OrigemTransacao`: inclui `RECORRENCIA`, `CONTA_PAGAR`, `OFX`, …  
- `SetorAcesso`: SUPERVISOR, ADMIN, DIRETORIA, FINANCEIRO, MARKETING, RECEPCAO, LIVRARIA, MEDIUM, SUPORTE  

## 4.3. Regras de dados

| Regra | Detalhe |
|-------|---------|
| Adimplência | Derivada de lançamentos (ADR-003) — não persistir status duplicado |
| Baixa de parcela | Cria `FinanceiroTransacao` DESPESA CONCLUIDO e liga `transacaoId` |
| Mensalidade | Um `MensalidadePlano` por `pessoaId`; job gera lançamento do mês se ausente |
| Policy | `UsuarioPolicy.grants` JSON — snapshot no cadastro do usuário |
| Import Excel | Transação atômica com rollback total |

## 4.4. Migrations recentes

| Migration | Conteúdo |
|-----------|----------|
| `20260803000000_financeiro_asaas_gestor` | Contas + Asaas + MARKETING |
| `20260806120000_tesouraria_022_025` | Contas a pagar, planos, DRE, OFX |
| `20260806140000_contribuintes_patrocinio_padrinho` | Contribuintes |

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

## 4.5. Porta local

- Compose padrão (`infra/docker-compose.yml`): host **5433** → container 5432  
- Alguns ambientes (ex. messaging): **5437** — conferir `DATABASE_URL` em `backend/.env`
