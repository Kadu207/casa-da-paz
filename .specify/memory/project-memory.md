# Memória Viva — Casa da Paz

**Última atualização:** 2026-09-02

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Pós-go-live estável: **033 Delegações** + 031 Estoque + 030 Security + auditoria F01–F10 GREEN |
| Versão | 0.1.0-alpha |
| Commit referência docs | `70774ba` (auditoria Green) / feature 033 `2975b46` |
| Produção | https://casadapaz.inovatitech.com.br |
| SSH VPS | `ssh -p 65025 gestaoti@128.140.77.31` (Host `inovati`; **não** :22) |
| Asaas (021) | **Dormant** — [`asaas-dormant.md`](../../docs/memory/runbooks/asaas-dormant.md) |
| Spec 032 ingressos | 📋 Stub — não implementar até priorizar |
| Spec 033 delegações | ✅ Prod — migrate + seed funções + menu `/app/delegacoes` + N8N workflow importado |
| Auditoria F01–F10 | ✅ **GREEN** Remediado/Validado — [`ACHADOS.md`](../../docs/security-audit/ACHADOS.md) |
| Mapa portal | ✅ CSP `frame-src` OSM — “Onde nos encontrar” OK |
| Security 030 | ✅ Fase 0–2 + CSP mapa |

## Pendências operacionais (próxima onda)

| Prioridade | Item | Notas |
|------------|------|-------|
| 1 | Mensageria polish | SMTP N8N (`SMTP Casa da Paz`); inbox WhatsApp Meta; Chatwoot público **502** |
| 2 | Spec 032 | Ingressos — só com decisão explícita |
| 3 | Asaas | Sandbox/prod com chave + confirmação |
| 4 | SSH allowlist :65025 | Opcional |

## Security — referência rápida

```powershell
.\infra\scripts\smoke-security-origin.ps1
.\scripts\smoke-audit-f01-f10-prod.ps1
```

```bash
cd ~/casadapaz/infra && ./scripts/check-prod-secrets.sh
# Esperado: APROVADO
```

## Deploy VPS (colar)

```bash
cd ~/casadapaz
git fetch origin && git pull origin main
chmod +x infra/scripts/*.sh
cd infra
./scripts/build-frontend-on-vps.sh   # se FE mudou
CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh
./scripts/compose-prod.sh exec -T backend npx prisma migrate deploy
# Seed idempotente 033:
./scripts/compose-prod.sh exec -T backend npx tsx prisma/seed.ts --funcoes-casa-only
curl -s http://127.0.0.1:9080/health
```

**Gate:** nunca `deploy.sh` sem confirmação explícita.
