# LGPD — checklist Casa da Paz

Versão da política: `backend/src/lib/lgpd.ts` → `LGPD_POLICY_VERSION`

Runbook DSAR: `docs/memory/runbooks/dsar-lgpd.md`

## Implementado no sistema

| Item | Status |
|------|--------|
| Política de Privacidade pública (`/public/termos`) | ✅ |
| DPO publicado na política + contato (`/public/contato`) | ✅ |
| Fluxo DSAR documentado (15 dias) | ✅ runbook |
| Consentimento explícito (checkbox) em agendamento, newsletter, checkout | ✅ |
| Registro de consentimento (`aceite_lgpd_em`, `aceite_lgpd_versao`) | ✅ |
| Banner de cookies técnicos | ✅ |
| HTTPS em produção | ✅ |

## Configuração DPO (produção)

**Responsáveis publicados (jun/2026):**

| Papel | Nomes |
|-------|--------|
| Tratamento de dados (LGPD) | Carlos Eduardo Souza Silva, Raquel Cristina |
| Desenvolvimento do sistema | Carlos Eduardo Souza Silva |

**Ampliar a equipe depois** — escolha uma opção:

1. **Código** — editar `frontend/src/lib/lgpd-contact.ts` → array `DATA_PROTECTION_BASE` ou `SYSTEM_DEV_CONTACTS`, incrementar `LGPD_POLICY_VERSION`, deploy frontend.
2. **Deploy sem rebuild de código** — variável de ambiente no build:
   - `VITE_DPO_EXTRA_NAMES=Nome Completo 1,Nome Completo 2` (só para encarregados de dados extras)

| Variável | Uso |
|----------|-----|
| `VITE_DPO_EXTRA_NAMES` | Nomes adicionais de encarregados (vírgula) |
| `VITE_DPO_EMAIL` | E-mail LGPD (default: terreirocasadapaz@gmail.com) |

## Pendências organizacionais

1. **RIPD** — avaliar se observações de saúde em agendamentos exigem relatório de impacto.
2. **Retenção** — validar prazos do runbook com contador/advogado.
3. **Processadores** — termos com Hetzner, Cloudflare, Stripe, N8N.
4. **Treinamento** — recepção ler `dsar-lgpd.md`.

## Atualização da política

1. Editar `PublicTermos.tsx` / `lgpd-contact.ts`
2. Incrementar `LGPD_POLICY_VERSION` (backend + frontend)
3. Deploy frontend (consentimentos novos gravam nova versão)
