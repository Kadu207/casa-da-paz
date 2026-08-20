# Cronograma — Casa da Paz

**Atualizado:** 2026-08-20

## Concluído

| Fase | Escopo | Status |
|------|--------|--------|
| 001–006 core ERP | Auth, pessoas, recepção, inscrições, livraria | ✅ Prod |
| 003 financeiro v2 | Ledger, atrasados, fluxo, conciliação | ✅ Prod |
| 011 portal público | `/public/*`, LGPD, agendamento | ✅ Prod |
| 014 alertas UI | Badge + N8N lembrete | ✅ |
| 017–019 | Dashboard, painel médium, auditoria export | ✅ |
| 020 RBAC + policies | Hierarquia + `UsuarioPolicy` | ✅ (+ snapshot no cadastro) |
| 021 Asaas + marketing | Código completo | ✅ **dormant** sem chave |
| 022–025 tesouraria | AP, recorrência, DRE, OFX | ✅ Prod |
| Contribuintes | Patrocínios / padrinhos + mensalidade médiuns | ✅ Prod |
| Harness agents | `agents.md` + 5 agentes ops | ✅ |
| 030 security | Hardening / own-scope | ✅ Prod |
| **031 estoque casa** | Almoxarifado primário + checklist limpeza | ✅ Código + migrate local |

## Sequência atual

```
✅ 031 Estoque primário (código + docs + migrate local)
    ↓
⏳ Deploy VPS 031 (gate humano confirmado nesta sessão)
    ↓
012 Chatwoot/N8N polish (tokens)
    ↓
Ativar Asaas (sandbox → prod) só com chave + confirmação
    ↓
Ingressos/eventos (estoque secundário — ADR-010)
    ↓
016 Next.js — só com aprovação + ADR-008/009
```

## Próxima onda

| Prioridade | Item | Notas |
|------------|------|-------|
| **1** | Deploy VPS 031 | migrate + seed `--estoque-casa-only` (não seed destroy) |
| **2** | Chatwoot/N8N prod polish | Token Meta / widget |
| **3** | Asaas sandbox | Quando houver `ASAAS_API_KEY` |
| **4** | Ingressos eventos | Spec futura (secundário) |
