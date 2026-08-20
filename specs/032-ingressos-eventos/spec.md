# Feature 032 — Ingressos / estoque secundário de eventos

**Status:** 📋 Planejado (não implementar agora) | **Criado:** 2026-08-20  
**Depende de:** ADR-010 (multi-estoque), módulo Eventos existente

## Objetivo

Controle de **ingressos/capacidade** dos eventos que a casa cria, como estoque **secundário** — separado do almoxarifado primário (`estoque_casa`) e da Livraria/PDV (`estoque`).

## Fora de escopo nesta spec (até aprovação)

- Unificar saldos com Estoque da Casa ou Livraria
- PSP/Asaas obrigatório (pode reutilizar cobrança de inscrição já existente quando Asaas estiver ativo)

## Direção (rascunho)

| Tema | Ideia |
|------|--------|
| Domínio | Evento / Inscrição / lotação (`capacidadeMax` já existe em parte) |
| UI | Dentro de Eventos ERP + portal público (compra/reserva) |
| RBAC | Provável reuso de `eventos` + grants de cobrança |
| Relação ADR-010 | Secundário “Ingressos/eventos” |

## Critérios de aceite (quando abrir implementação)

- [ ] Spec detalhada + plan/tasks
- [ ] Não misturar com `ItemEstoqueCasa` nem `Produto`
- [ ] Capacidade / ingressos consistentes com check-in e inscrições
- [ ] Matriz RBAC e smoke

## Referências

- ADR-010: `docs/memory/decisions/010-estoque-casa.md`
- Eventos atuais: `specs/004-recepcao-checkin`, `specs/005-inscricoes`
- Asaas (opcional): `specs/021-financeiro-asaas-gestor` — **dormant**
