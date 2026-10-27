# ADR-013 — Ingressos por lote + código (sem PSP)

**Status:** Aceito | **Data:** 2026-10-27 | **Spec:** 032

## Contexto

A casa precisa vender/reservar vagas de eventos (gira aberta, oficina) com **lotes** (quantidade + valor), reserva no portal público e validação no check-in. Asaas permanece dormant; o pagamento continua manual no ERP.

## Decisão

1. Model `IngressoLote` (`ingresso_lotes`): `eventoId`, `nome`, `quantidade`, `valor`, `ativo`. Estoque secundário — **não** compartilha saldo com `ItemEstoqueCasa` nem `Produto` (ADR-010).
2. `Inscricao` ganha `ingressoLoteId` opcional, `codigo` único opcional e `canceladaEm`. Inscrições legadas sem lote continuam válidas.
3. Vagas ocupadas são **derivadas**: count de inscrições do lote com `canceladaEm IS NULL`. Sem contador materializado.
4. Soma das `quantidade` dos lotes ativos ≤ `Evento.capacidadeMax` quando a capacidade existir.
5. Reserva pública cria inscrição PENDENTE **sem** `FinanceiroTransacao`. Confirmar pagamento no ERP cria a receita (ou atualiza se já existir do fluxo interno).
6. Cancelamento só em PENDENTE → `canceladaEm = now()` → libera vaga.
7. Código curto único gerado no servidor (reserva e inscrição com lote pela equipe).
8. Check-in por código reutiliza policy `checkin` write; aceita PENDENTE e CONCLUIDO.
9. Notificação pós-reserva/pagamento via N8N `ingresso_oficina` (e-mail SMTP + Chatwoot WhatsApp/Telegram) — credenciais fora do repositório.

## Consequências

- Portal passa a oferecer formulário de reserva por lote.
- Recepção valida ingresso digitando o código.
- Tesouraria continua independente de Asaas (constituição IX).
- Wave futura: vincular `AsaasCobranca` ao lote quando 021 for ativado.
