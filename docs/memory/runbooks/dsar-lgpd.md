# Runbook — DSAR (direitos do titular LGPD)

Prazo legal: **15 dias corridos** (`DSAR_SLA_DAYS` em `backend/src/lib/lgpd.ts`).

Encarregados de dados: **Carlos Eduardo Souza Silva**, **Raquel Cristina**. Desenvolvimento: **Carlos Eduardo Souza Silva**. E-mail: `terreirocasadapaz@gmail.com` ou `VITE_DPO_EMAIL`.

---

## 1. Canais de entrada

| Canal | Ação da recepção |
|-------|------------------|
| WhatsApp institucional | Assunto **Privacidade / LGPD** — registrar data/hora |
| E-mail DPO (`terreirocasadapaz@gmail.com` ou `VITE_DPO_EMAIL`) | Encaminhar ao ADMIN |
| Presencial | Anotar pedido; confirmar e-mail ou telefone para resposta |

**Dados mínimos do pedido:** nome completo, contato, direito solicitado (acesso, correção, exclusão, revogação, portabilidade quando aplicável).

---

## 2. Registro interno (dia 0)

1. Recepção abre planilha ou ticket interno com:
   - Data do pedido
   - Titular (nome + e-mail/telefone)
   - Tipo: acesso | correção | exclusão | revogação | outro
   - Prazo limite: **data pedido + 15 dias**
2. Notificar perfil **ADMIN** no ERP ou WhatsApp interno.

---

## 3. Localização dos dados (ADMIN)

| Origem | Onde buscar no ERP / DB |
|--------|-------------------------|
| Agendamento público | **Recepção** → fila de agendamentos; protocolo se informado |
| Pessoa cadastrada | **Pessoas** → busca por nome/e-mail/telefone |
| Newsletter | Dashboard (contagem); DB `newsletter_inscritos` por e-mail |
| Pedido e-commerce | **E-commerce** → protocolo ou CPF/CNPJ do cliente |
| Logs administrativos | **Auditoria** (somente referência; não exportar dados de terceiros) |

Consulta SQL útil (VPS):

```bash
cd ~/casadapaz/infra
./scripts/compose-prod.sh exec db psql -U admin_casadapaz -d casadapaz_db
```

```sql
-- Exemplo: localizar por e-mail
SELECT 'newsletter' AS origem, email, ativo, aceite_lgpd_em FROM newsletter_inscritos WHERE email ILIKE '%exemplo%';
SELECT 'agendamento' AS origem, protocolo, nome, telefone, created_at FROM agendamentos_publicos WHERE telefone LIKE '%999%' OR nome ILIKE '%Maria%';
```

---

## 4. Atendimento por tipo

### Acesso (cópia dos dados)

- Exportar campos relevantes (nome, contato, datas, status).
- Enviar por e-mail criptografado ou entregar presencialmente.
- **Não** incluir dados de outros titulares.

### Correção

- Atualizar em **Pessoas** ou registro correspondente.
- Registrar em **Auditoria** (motivo: `dsar.correcao`).

### Exclusão / revogação

| Sistema | Ação |
|---------|------|
| Newsletter | `UPDATE newsletter_inscritos SET ativo = false` ou DELETE conforme política de retenção |
| Agendamento | Anonimizar ou excluir se não houver obrigação legal de guarda |
| Pessoa | Excluir apenas se sem vínculos financeiros/eventos exigidos por lei |
| E-commerce | Preservar pedidos fiscais; anonimizar cliente se permitido |

Sempre registrar conclusão na auditoria.

---

## 5. Resposta ao titular (até dia 15)

Modelo curto (e-mail/WhatsApp):

> Prezado(a) [nome],  
> Atendemos seu pedido de [tipo] referente aos dados na Casa da Paz em [data].  
> [Descrever ação: dados enviados / corrigidos / excluídos / newsletter cancelada.]  
> Dúvidas: responda a este canal ou fale com nosso Encarregado de Dados.

Se impossível cumprir no prazo (complexidade legítima), informar prazo adicional **uma vez**, com justificativa (art. 18, §2º).

---

## 6. Escalonamento

| Situação | Quem aciona |
|----------|-------------|
| Dados de saúde sensíveis em observações | Direção + avaliar RIPD |
| Pedido judicial ou ANPD | Direção + assessoria jurídica |
| Vazamento suspeito | `docs/contracts/` + incidente de segurança |

---

## 7. Retenção sugerida (política interna)

| Dado | Prazo sugerido |
|------|----------------|
| Agendamento cancelado | 12 meses, depois anonimizar |
| Newsletter inativo | 24 meses sem interação, depois excluir |
| Pedidos e-commerce | 5 anos (obrigações fiscais — confirmar com contabilidade) |
| Logs de auditoria | 24 meses |

Ajustar com contador/advogado e refletir em `PublicTermos` se mudar.

---

## 8. Atualizar política pública

Após mudar DPO ou prazos:

1. `frontend/src/lib/lgpd-contact.ts` e `PublicTermos.tsx`
2. Incrementar `LGPD_POLICY_VERSION`
3. Deploy frontend (+ backend se versão compartilhada)
