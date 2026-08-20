# Memória Viva — Casa da Paz

**Última atualização:** 2026-08-20

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Pós-go-live: estoque primário 031 |
| Versão | 0.1.0-alpha |
| Produção | https://casadapaz.inovatitech.com.br |
| Asaas (021) | **Dormant** |
| Local 031 | ✅ migrate `20260820120000_estoque_casa_031` + seed OK |
| Deploy VPS 031 | Em andamento (confirmação usuário) |
| Segurança | ✅ host lockdown; own-scope agregados; OFX/Asaas Zod |

## Specs

| Spec | Status |
|------|--------|
| 020–030 | ✅ |
| **031 estoque casa** | ✅ código + docs; deploy VPS |
| 021 Asaas | Dormant |

## Harness

- `agents.md` — construção + ops + security-ops
- ADR-010 multi-estoque (primário casa vs livraria vs ingressos)
- Seed seguro catálogo: `npx tsx prisma/seed.ts --estoque-casa-only`

## Próximos passos

1. Concluir deploy VPS 031 (migrate + seed catálogo + FE build)  
2. Cloudflare / Asaas quando houver chave  
3. Spec futura: ingressos/eventos (estoque secundário)  
