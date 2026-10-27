# Memória Viva — Casa da Paz

**Última atualização:** 2026-10-27

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Pós-go-live: **032 ingressos (código local)** + mensageria runbook; prod ainda em pontos/ervas (2026-10-21) |
| Versão | 0.1.0-alpha |
| Commit referência | Prod: `490ed7e` pontos/contato — **032 ainda sem deploy VPS** |
| Produção | https://casadapaz.inovatitech.com.br |
| SSH VPS | `ssh -p 65025 gestaoti@128.140.77.31` (Host `inovati`; **não** :22) |
| Asaas (021) | **Dormant** — [`asaas-dormant.md`](../../docs/memory/runbooks/asaas-dormant.md) |
| Spec 032 ingressos | ✅ Código local — lotes + reserva pública + check-in por código (ADR-013). **Deploy VPS pendente** |
| Spec 033 delegações | ✅ Prod — migrate + seed funções + menu `/app/delegacoes` + N8N |
| Spec 034 galeria | ✅ Prod — PUBLICO/PRIVADO, `MidiaAlbum`, YouTube, Marketing CRUD, ADR-012 |
| Portal história | ✅ Prod — `/public/historia` |
| Enciclopédia de ervas | ✅ Prod — `/public/ervas`, 100 fotos creditadas |
| Logo oficial | ✅ Prod |
| Pontos e contato | ✅ Prod — `/public/pontos`, Telegram link, Chatwoot widget |
| Seed prod | Só flags idempotentes. Seed completo destroy exige `CONFIRM_SEED_DESTROY=yes` + backup |
| Auditoria F01–F10 | ✅ **GREEN** |
| Mensageria | Runbook SMTP/WhatsApp/Telegram pronto; Chatwoot público **HTTP 000** (diagnóstico SSH gate humano) |
| CSP mídia | ✅ YouTube / youtube-nocookie / Vimeo |

## Pendências operacionais (próxima onda)

| Prioridade | Item | Notas |
|------------|------|-------|
| 1 | Deploy 032 | Confirmar migrate `20261027120000_ingressos_lotes_032` + rebuild FE/BE + reimport N8N `ingresso-oficina` |
| 2 | Mensageria polish | SMTP N8N; inbox WhatsApp Meta; Telegram BotFather; Chatwoot `casadapaz-chat` 502/000 |
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
