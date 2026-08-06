# 7. Funcionalidades

## 7.1. Portal público (`/public`)

- Home institucional, eventos, agendamento com protocolo, contato, termos LGPD  
- Livraria / checkout (Asaas se `ASAAS_API_KEY`; senão fluxo sem PSP)  
- Newsletter e consentimentos  

## 7.2. Cadastros (`/app/pessoas`)

Listas por função: Presidente, Diretoria, Tesouraria, Conselheiro, **Médium**, Consulente, Suporte TI.  
Menores: `PessoaResponsavel`.  
**Médiuns:** coluna Mensalidade (edição por quem tem `recorrencia` write).

## 7.3. Tesouraria (`/app/financeiro`)

| Aba | Função |
|-----|--------|
| Lançamentos | CRUD ledger |
| Fluxo de caixa | Entradas/saídas no período |
| Atrasados | Recebíveis (mensalidades) |
| A pagar | Agenda de saídas (`/pagamentos-a-fazer`) |
| Contas a pagar | Fornecedores, parcelas, baixas → ledger |
| Recorrência | Planos + job gerar mensalidades |
| Patrocínios / Padrinhos | Nome + valor da contribuição |
| DRE | Orçado vs realizado / centros de custo |
| Extrato OFX | Import, match ±2 dias, ignorar |
| Conciliação | Checklist operacional |
| Contas | Contas financeiras (caixa/banco/Asaas) |
| Cobranças | Asaas — opcional/dormant |
| Transparência | Agregados internos (sem PII) |
| Alertas | Pendências → N8N |

**Decisão:** tesouraria completa **sem conta Asaas**.

## 7.4. Outros módulos ERP

| Módulo | Descrição |
|--------|-----------|
| Dashboard | KPIs por período; painel próprio para MEDIUM |
| Recepção | Check-in / presença |
| Eventos | Gestão + inscrições |
| Livraria | PDV e estoque |
| Ecommerce | Pedidos |
| Marketing | Conteúdo / campanhas (papel MARKETING) |
| Usuários | SUPERVISOR: criar com policies no ato |
| Auditoria | Filtros + export CSV/PDF |

## 7.5. Specs de referência

| Spec | Status |
|------|--------|
| 020 RBAC + policies | ✅ |
| 021 Asaas + marketing | ✅ código; **dormant** sem chave |
| 022 Contas a pagar | ✅ |
| 023 Recorrência mensalidade | ✅ |
| 024 DRE / orçamento / centros | ✅ |
| 025 Conciliação OFX | ✅ |
| Contribuintes (patrocínio/padrinho) | ✅ (junto ao ciclo tesouraria) |
