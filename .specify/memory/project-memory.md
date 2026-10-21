# Memória Viva — Casa da Paz

**Última atualização:** 2026-10-21

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Pós-go-live estável: **enciclopédia de ervas** + emblema transparente + **Nossa história** + **034 Galeria** + 033 + 031 + 030 + F01–F10 GREEN |
| Versão | 0.1.0-alpha |
| Commit referência | `9c65c5e` emblema transparente — **deploy VPS** 2026-10-21 (enciclopédia `ce143fb` no mesmo dia) |
| Produção | https://casadapaz.inovatitech.com.br |
| SSH VPS | `ssh -p 65025 gestaoti@128.140.77.31` (Host `inovati`; **não** :22) |
| Asaas (021) | **Dormant** — [`asaas-dormant.md`](../../docs/memory/runbooks/asaas-dormant.md) |
| Spec 032 ingressos | 📋 Stub — não implementar até priorizar |
| Spec 033 delegações | ✅ Prod — migrate + seed funções + menu `/app/delegacoes` + N8N |
| Spec 034 galeria | ✅ Prod — PUBLICO/PRIVADO, `MidiaAlbum`, YouTube, Marketing CRUD, ADR-012 |
| Portal história | ✅ Prod — `/public/historia` (marcos 26/09/2015 · 11 anos / 10 anos registro em 2026) |
| Enciclopédia de ervas | ✅ Prod — `/public/ervas`, 100 fotos creditadas — **deploy VPS** `ce143fb` 2026-10-21 |
| Logo oficial | ✅ Prod `9c65c5e` — emblema transparente no portal/ERP/favicon (triângulo interno branco). Home não usa o 4K de fundo branco |
| Seed prod | Só flags idempotentes (`--estoque-casa-only`, `--funcoes-casa-only`, `--galeria-policies-034`). **Seed completo (destroy) não foi rodado** — exige `CONFIRM_SEED_DESTROY=yes` + backup |
| Auditoria F01–F10 | ✅ **GREEN** — [`ACHADOS.md`](../../docs/security-audit/ACHADOS.md) |
| Mapa portal | ✅ Google Maps embed + CSP (fallback estático) |
| CSP mídia | ✅ YouTube / youtube-nocookie / Vimeo |

## Pendências operacionais (próxima onda)

| Prioridade | Item | Notas |
|------------|------|-------|
| 1 | Mensageria polish | SMTP N8N; inbox WhatsApp Meta; Chatwoot público **502** |
| 2 | Spec 032 | Ingressos — só com decisão explícita |
| 3 | Asaas | Sandbox/prod com chave + confirmação |
| 4 | SSH allowlist :65025 | Opcional |
| Ops | Conteúdo galeria | Canal YouTube + 1º item via Marketing (álbum + Público/Privado) |
| Ops | Narrativa história | Completar `historia.body` em `frontend/src/i18n/pt-BR.ts` (+ `en.ts`) |

## Policies galeria (034)

```bash
# Na VPS (idempotente): marketing write + função Comunicação
./scripts/compose-prod.sh exec -T backend npx tsx prisma/seed.ts --galeria-policies-034
```

Logins cobertos: `admin`, `supervisor`, `admin.integracoes`, `maedesanto`, `marketing01`–`04`.

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
./scripts/compose-prod.sh restart frontend   # após build FE
curl -s http://127.0.0.1:9080/health
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:9080/public/historia
curl -s http://127.0.0.1:9080/api/public/galeria
curl -s http://127.0.0.1:9080/api/public/galeria/albuns
```

**Gate:** nunca `deploy.sh` sem confirmação explícita.
