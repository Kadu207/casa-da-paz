# Plan — 032 Ingressos / lotes

1. Spec detalhada + ADR-013 + rbac-matrix (comportamento)
2. Prisma: `IngressoLote` + `Inscricao.codigo` / `canceladaEm` / `ingressoLoteId` + migration
3. Lib: geração de código, vagas derivadas, validação de soma de lotes vs capacidade
4. API autenticada: CRUD lotes, inscrição com lote, cancelar, check-in por código, pagamento gera receita se ainda não houver
5. API pública: listar lotes no detalhe do evento + `POST /public/eventos/:id/reservas`
6. FE ERP: lotes em Eventos; cancelar; código na lista
7. FE portal: lotes + formulário de reserva
8. FE recepção: check-in por código
9. N8N `ingresso-oficina.json` com e-mail + Chatwoot (credenciais externas)
10. Runbook mensageria: SMTP, WhatsApp Meta, Telegram inbox, diagnóstico Chatwoot 502
11. Testes unitários + memória / CHANGELOG
12. Deploy VPS sob confirmação humana
