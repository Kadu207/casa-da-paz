# Memória Viva — Casa da Paz

**Última atualização:** 2026-08-20

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Pós-go-live: estoque primário 031 |
| Versão | 0.1.0-alpha |
| Commit | `f598951` em `main` (GitHub + GitLab) |
| Produção | https://casadapaz.inovatitech.com.br (health OK) |
| Asaas (021) | **Dormant** |
| Local 031 | ✅ migrate + seed completo OK |
| Push 031 | ✅ `origin` + `gitlab` |
| Deploy VPS 031 | ⏳ SSH `gestaoti@128.140.77.31:22` **timeout** deste ambiente — rodar no terminal local do usuário |

## Specs

| Spec | Status |
|------|--------|
| 020–030 | ✅ |
| **031 estoque casa** | ✅ código + docs + push; **deploy VPS pendente SSH local** |
| 021 Asaas | Dormant |

## Deploy VPS (colar no terminal com acesso SSH)

```bash
cd ~/casadapaz
git pull origin main
cd frontend && npm ci && npm run build && cd ../infra
CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh
./scripts/compose-prod.sh exec -T backend npx prisma migrate deploy
./scripts/compose-prod.sh exec -T backend npx tsx prisma/seed.ts --estoque-casa-only
curl -s http://127.0.0.1:9080/health
curl -s https://casadapaz.inovatitech.com.br/health
```

**Não** usar seed destroy em produção.

## Próximos passos

1. Executar bloco SSH acima no PC/VPS  
2. Smoke: login → menu **Estoque**  
3. Asaas quando houver chave  
