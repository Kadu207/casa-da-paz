# Cronograma — Casa da Paz

**Atualizado:** 2026-10-27

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
| **Portal Nossa história** | `/public/historia` — marcos 2015/2026 + espaço narrativa | ✅ Prod |
| Enciclopédia de ervas | `/public/ervas` — 100 espécies, fotos creditadas, fundamentos e banhos | ✅ Prod (`ce143fb`) |
| Logo oficial | Arquivo enviado pela casa, fundo branco, home/cabeçalho/favicon | ✅ Prod (`3a3d4fc`) |
| Pontos cantados | `/public/pontos` player Spotify + `/app/pontos`; Telegram e chat no contato | ✅ Prod (`490ed7e`) |
| **032 Ingressos** | Lotes + reserva portal + código + check-in (ADR-013) | ✅ Código local — **deploy pendente** |

## Sequência atual

```
✅ Enciclopédia / história / 034 / 033 / F01–F10 GREEN (prod)
✅ 032 Ingressos implementado localmente (migration + API + UI + N8N)
    ↓
🔧 Deploy 032 (gate humano) + Mensageria polish
   (SMTP N8N; WhatsApp Meta; Telegram BotFather; Chatwoot casadapaz-chat 000/502)
    ↓
021 Asaas — dormant até chave + confirmação
    ↓
016 Next.js — ADR-008
```

## Próxima onda

| Prioridade | Item | Notas |
|------------|------|-------|
| **1** | Deploy 032 | migrate + rebuild + reimport N8N ingresso |
| **2** | Chatwoot/N8N polish | SMTP; WhatsApp Meta; Telegram inbox; diagnosticar `casadapaz-chat` |
| **3** | Asaas sandbox | `asaas-dormant.md` gate |
| **4** | SSH allowlist :65025 | Opcional |
| Ops | Conteúdo galeria | Canal YouTube + 1º item via Marketing |
| Ops | Narrativa história | Completar `historia.body` (pt-BR / en) |
