# Feature 032 — Ingressos / estoque secundário de eventos

**Status:** ✅ Código local (deploy pendente) | **Criado:** 2026-08-20 | **Aberto:** 2026-10-27  
**Depende de:** ADR-010 (multi-estoque), ADR-013 (lotes + código), módulo Eventos existente  
**Não depende de:** Asaas (021)

## Objetivo

Controle de **ingressos/capacidade** dos eventos da casa como estoque **secundário** — separado do almoxarifado primário (`estoque_casa`) e da Livraria/PDV (`Produto`).

Primeira entrega: **lotes** com quantidade e valor, **reserva pública** no portal, pagamento **manual** no ERP, **código** de ingresso e validação desse código no check-in.

## Escopo

| Tema | Decisão |
|------|---------|
| Domínio | `IngressoLote` + `Inscricao` com `codigo` e `canceladaEm` |
| Portal | Visitante escolhe lote, reserva vaga (Turnstile + LGPD) |
| ERP | CRUD de lotes, lista de reservas, confirmar pagamento, cancelar PENDENTE |
| Check-in | Por pessoa (já existe) **e** por código do ingresso |
| Mensageria | N8N `ingresso_oficina` → e-mail SMTP + Chatwoot (quando credenciais existirem) |
| RBAC | Resource `eventos` (lotes/reserva ERP); `checkin` write para validar código |

## Fora de escopo

- Unificar saldos com Estoque da Casa ou Livraria
- PSP/Asaas obrigatório (pode reutilizar cobrança quando Asaas estiver ativo)
- Múltiplas inscrições da mesma pessoa no mesmo evento
- Contador materializado de vendidos (vagas são derivadas)

## Regras de negócio

1. Vaga ocupada = inscrição do lote com `canceladaEm` nulo.
2. Soma das quantidades dos lotes **ativos** ≤ `Evento.capacidadeMax` (quando definida).
3. Uma pessoa: no máximo uma inscrição ativa por evento; escolhe um lote.
4. Reserva pública **não** cria `FinanceiroTransacao`. Confirmar pagamento no ERP gera a receita.
5. Cancelar só com `statusPagamento = PENDENTE`: preenche `canceladaEm` e libera a vaga.
6. Pessoa da reserva: busca por `telefoneDigitos`; 0 → cria `CONSULENTE`; >1 → 409.
7. Código curto único gerado na reserva e na inscrição com lote feita pela equipe.
8. Check-in por código: aceita PENDENTE e CONCLUIDO; recusa cancelada, evento encerrado, outro evento, presença duplicada.

## Critérios de aceite

- [x] Spec detalhada + plan/tasks + ADR-013
- [x] Migration `IngressoLote` + campos em `Inscricao`
- [x] API lotes + reserva pública + cancelamento + check-in por código
- [x] UI: lotes no Eventos ERP, formulário no portal, campo código na Recepção
- [x] Não misturar com `ItemEstoqueCasa` nem `Produto`
- [x] Capacidade / ingressos consistentes com check-in e inscrições
- [x] Matriz RBAC atualizada (comportamento) e smoke/unitários
- [x] Workflow N8N ingresso com nós SMTP/Chatwoot (sem secrets no repo)
- [ ] Deploy VPS (gate humano)

## Referências

- ADR-010: `docs/memory/decisions/010-estoque-casa.md`
- ADR-013: `docs/memory/decisions/013-ingressos-lotes.md`
- Eventos atuais: `specs/004-recepcao-checkin`, `specs/005-inscricoes`
- Asaas (opcional futuro): `specs/021-financeiro-asaas-gestor`
