# Memória Viva — Casa da Paz

**Última atualização:** 2026-08-06

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | **Patrocínios/Padrinhos + mensalidade na lista de médiuns** |
| Versão | 0.1.0-alpha |
| Produção | https://casadapaz.inovatitech.com.br |
| Asaas (021) | **Dormant** — tesouraria opera sem PSP |

## Specs

| Spec | Status |
|------|--------|
| 022 contas a pagar | ✅ Implementado |
| 023 recorrência mensalidade | ✅ Implementado |
| 024 DRE / orçamento / centros | ✅ Implementado |
| 025 OFX | ✅ Implementado |
| Contribuintes (patrocínio/padrinho) | ✅ Implementado |
| 021 Asaas | Dormant até `ASAAS_API_KEY` |

## Harness

- `agents.md` — construção + 5 agentes ops pós-construção
- `.specify/memory/memory.md`

## Próximos passos

1. `npx prisma migrate deploy` (migrations 022–025 + contribuintes)
2. Smoke tesouraria + conferir aba Patrocínios / Padrinhos
3. Configurar Asaas quando houver conta
4. Deploy VPS — gate humano
