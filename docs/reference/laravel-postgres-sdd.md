> **Referência externa** — Casa da Paz usa Express + Prisma + PostgreSQL (não Laravel). Mantido como padrão SDD alternativo para projetos PHP.

# Laravel + PostgreSQL + SDD (padrão recomendado)

## Escopo de aplicação
- Projetos SaaS B2B, ERP, CRM e módulos financeiros com requisitos de segurança e auditoria.

## Stack padrão
- Backend: Laravel (PHP 8.2+)
- Banco: PostgreSQL
- Testes: Pest
- Lint/format: Pint
- Análise estática: Larastan/PHPStan
- IA pesada (opcional): FastAPI em serviço separado

## Regras de implementação
- Nenhuma feature entra sem `spec.md` aprovado.
- Controllers devem ficar finos; regra de negócio em Services/Actions.
- Toda feature nova exige teste Red antes de código Green.
- Query multi-tenant deve ter isolamento explícito (`tenant_id`, schema ou RLS).

## Modelagem de dados mínima
- PK com UUID.
- Índices para colunas de busca e filtros por tenant.
- JSONB para metadados e trilhas variáveis.
- Auditoria de alterações sensíveis.

## Critérios de qualidade
- 100% dos testes obrigatórios da branch passando.
- Zero erro de linter no pipeline.
- Sem vulnerabilidade crítica/alta em dependências na etapa de segurança.
