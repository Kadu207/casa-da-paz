# LGPD — checklist Casa da Paz

Versão da política no código: `backend/src/lib/lgpd.ts` → `LGPD_POLICY_VERSION`

## Implementado no sistema

| Item | Status |
|------|--------|
| Política de Privacidade pública (`/public/termos`) | ✅ |
| Consentimento explícito (checkbox) em agendamento, newsletter, checkout | ✅ |
| Registro de consentimento (`aceite_lgpd_em`, `aceite_lgpd_versao`) | ✅ |
| Banner de cookies técnicos | ✅ |
| HTTPS em produção (Cloudflare + redirect no app) | ✅ |
| RBAC e auditoria administrativa | ✅ |
| Rate limit em formulários públicos | ✅ |

## Ações organizacionais (fora do código)

1. **Encarregado (DPO)** — nomear responsável e publicar canal de contato na política.
2. **RIPD** — avaliar necessidade de Relatório de Impacto (dados sensíveis religiosos / saúde em observações).
3. **Retenção** — definir prazos de exclusão para agendamentos cancelados e inativos na newsletter.
4. **Processadores** — contratos ou termos com Hetzner, Cloudflare, Stripe (quando ativo), N8N.
5. **Treinamento** — equipe de recepção sobre direitos do titular (acesso, correção, exclusão).
6. **Canal DSAR** — procedimento interno para atender solicitações em até 15 dias (art. 18 LGPD).

## Direitos do titular (operacional)

Solicitações via Contato/WhatsApp → recepção registra → perfil **ADMIN** localiza em Pessoas/Agendamentos/Newsletter/E-commerce → exclusão ou correção manual + registro em auditoria.

## Atualização da política

1. Editar `frontend/src/pages/public/PublicTermos.tsx`
2. Incrementar `LGPD_POLICY_VERSION` em `backend/src/lib/lgpd.ts` e `frontend/src/lib/lgpd.ts`
3. Deploy backend + frontend (novos consentimentos gravam nova versão)
