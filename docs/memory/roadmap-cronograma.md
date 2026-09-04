# Cronograma — Casa da Paz

**Atualizado:** 2026-09-04

## Concluído

| Fase | Escopo | Status |
|------|--------|--------|
| 001–006 core ERP | Auth, pessoas, recepção, inscrições, livraria | ✅ Prod |
| 003 financeiro v2 | Ledger, atrasados, fluxo, conciliação | ✅ Prod |
| 011 portal público | `/public/*`, LGPD, agendamento | ✅ Prod |
| 014 alertas UI | Badge + N8N lembrete | ✅ |
| 017–019 | Dashboard, painel médium, auditoria export | ✅ |
| 020 RBAC + policies | Hierarquia + `UsuarioPolicy` | ✅ |
| 021 Asaas + marketing | Código completo | ✅ **dormant** |
| 022–025 tesouraria | AP, recorrência, DRE, OFX | ✅ Prod |
| Contribuintes | Patrocínios / padrinhos | ✅ Prod |
| 027 Materiais de estudo | Portal + Marketing | ✅ Prod |
| 030 security | Hardening + CSP OSM + YouTube/Vimeo | ✅ Prod |
| **031 estoque casa** | Almoxarifado primário | ✅ Prod |
| Auditoria F01–F10 | Remediação + smoke prod | ✅ **GREEN** |
| **033 delegações** | Funções da casa + tarefas + N8N | ✅ Prod |
| **034 galeria mídia** | Fotos CF + vídeos YouTube, PUBLICO/PRIVADO + álbuns | ✅ Prod |

## Sequência atual

```
✅ 034 Galeria em produção
✅ 033 Delegações em produção
✅ Auditoria F01–F10 GREEN
    ↓
🔧 Mensageria polish (SMTP + WhatsApp Meta + Chatwoot 502)
    ↓
📋 032 Ingressos/eventos (stub — aguarda abertura)
    ↓
021 Asaas — dormant até chave + confirmação
    ↓
016 Next.js — ADR-008
```

## Próxima onda

| Prioridade | Item | Notas |
|------------|------|-------|
| **1** | Chatwoot/N8N polish | Credencial SMTP N8N; inbox WhatsApp; corrigir 502 `casadapaz-chat` |
| **2** | Spec 032 detalhada | Só quando priorizar ingressos |
| **3** | Asaas sandbox | `asaas-dormant.md` gate |
| **4** | SSH allowlist :65025 | Opcional |
| Ops | Conteúdo galeria | Canal YouTube + 1º item via Marketing |
