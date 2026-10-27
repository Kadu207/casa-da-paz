# Memória Viva — Casa da Paz

**Última atualização:** 2026-10-27

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Pós-go-live: **032 ingressos em prod** + Chatwoot público 200 |
| Versão | 0.1.0-alpha |
| Commit referência | Prod: `6d4bda4` — 032 ingressos + Chatwoot bind `0.0.0.0` (2026-10-27) |
| Produção | https://casadapaz.inovatitech.com.br |
| SSH VPS | `ssh -p 65025 gestaoti@128.140.77.31` (Host `inovati`; IdentityFile `id_ed25519_inova`) |
| Asaas (021) | **Dormant** — [`asaas-dormant.md`](../../docs/memory/runbooks/asaas-dormant.md) |
| Spec 032 ingressos | ✅ Prod — lotes + reserva pública + check-in por código (ADR-013) — deploy `6d4bda4` |
| Spec 033 delegações | ✅ Prod — migrate + seed funções + menu `/app/delegacoes` + N8N |
| Spec 034 galeria | ✅ Prod — PUBLICO/PRIVADO, `MidiaAlbum`, YouTube, Marketing CRUD, ADR-012 |
| Portal história | ✅ Prod — `/public/historia` |
| Enciclopédia de ervas | ✅ Prod — `/public/ervas`, 100 fotos creditadas |
| Logo oficial | ✅ Prod |
| Pontos e contato | ✅ Prod — `/public/pontos`, Telegram link, Chatwoot widget |
| Seed prod | Só flags idempotentes. Seed completo destroy exige `CONFIRM_SEED_DESTROY=yes` + backup |
| Auditoria F01–F10 | ✅ **GREEN** |
| Mensageria | Chatwoot `casadapaz-chat` **200** (bind corrigido `0.0.0.0:3001`); SMTP/WhatsApp/Telegram **gates credencial humana** |
| CSP mídia | ✅ YouTube / youtube-nocookie / Vimeo |

## Pendências operacionais (próxima onda)

| Prioridade | Item | Notas |
|------------|------|-------|
| 1 | Mensageria credenciais | SMTP N8N `SMTP Casa da Paz`; inbox WhatsApp Meta; Telegram BotFather |
| 2 | Smoke 032 prod | Criar lote + reserva portal + check-in código em produção |
| 3 | Asaas | Sandbox/prod com chave + confirmação |
| 4 | SSH allowlist :65025 | Opcional |
| Ops | Conteúdo galeria | Canal YouTube + 1º item via Marketing |
| Ops | Narrativa história | Completar `historia.body` em i18n |

## Policies galeria (034)

```bash
# Na VPS (idempotente): marketing write + função Comunicação
./scripts/compose-prod.sh exec -T backend npx tsx prisma/seed.ts --galeria-policies-034
```

## Security — referência rápida

```powershell
.\infra\scripts\smoke-security-origin.ps1
.\scripts\smoke-audit-f01-f10-prod.ps1
```

```bash
cd ~/casadapaz/infra && ./scripts/check-prod-secrets.sh
# Esperado: APROVADO
```

## Deploy VPS (colar) — inclui 032 quando autorizado

```bash
cd ~/casadapaz
git fetch origin && git pull origin main
chmod +x infra/scripts/*.sh
cd infra
./scripts/build-frontend-on-vps.sh   # se FE mudou
CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh
./scripts/compose-prod.sh exec -T backend npx prisma migrate deploy
./scripts/compose-prod.sh restart frontend   # após build FE
# Reimport N8N ingresso (se messaging up):
# ./scripts/import-n8n-workflows.sh
curl -s http://127.0.0.1:9080/health
```

**Gate:** nunca `deploy.sh` sem confirmação explícita.
