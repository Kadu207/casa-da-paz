# 7. Funcionalidades

## 7.1. Portal público (`/public`)

- Home institucional, eventos, agendamento com protocolo, contato, termos LGPD  
- Livraria / checkout (Asaas se `ASAAS_API_KEY`; senão fluxo sem PSP)  
- **Materiais de estudo** (`/public/estudos`): ervas, banhos, defumação — edição via Marketing  
- **Galeria** (`/public/galeria`): fotos e vídeos YouTube estilo grade; público vs privado + álbuns (Spec 034)  
- Newsletter e consentimentos  

## 7.2. Cadastros (`/app/pessoas`)

Listas por função: Presidente, Diretoria, Tesouraria, Conselheiro, **Médium**, Consulente, Suporte TI.  
Menores: `PessoaResponsavel`.  
Campo opcional **e-mail** (`Pessoa.email`) — usado em alertas de delegações.  
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
| **Delegações** | Funções da casa (`/app/delegacoes`): responsáveis, tarefas com check, alertas e-mail/WhatsApp via N8N |
| **Galeria** | Consumo ERP (`/app/galeria`): itens públicos + privados ao vivo; filtro por álbum |
| Recepção | Check-in / presença |
| Eventos | Gestão + inscrições |
| **Estoque** | Almoxarifado **primário** (`/app/estoque`): itens, mínimo/alertas, grupos de limpeza, checklist, relatório |
| Livraria | PDV e estoque de **venda** (produtos) |
| Ecommerce | Pedidos |
| Marketing | Conteúdo, materiais de estudo e **galeria** (fotos/vídeos YouTube, Público/Privado, álbuns) |
| Usuários | SUPERVISOR: criar com policies no ato |
| Auditoria | Filtros + export CSV/PDF |

### Taxonomia de estoques

| Prioridade | Módulo | Resource |
|------------|--------|----------|
| Primário | Estoque da Casa | `estoque_casa` |
| Secundário | Livraria/PDV | `estoque` |
| Futuro | Ingressos/eventos | módulo eventos (032 stub) |

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
| 027 Materiais de estudo | ✅ |
| 030 Security hardening | ✅ |
| **031 Estoque primário da casa** | ✅ |
| 032 Ingressos/eventos | 📋 Stub — não implementar ainda |
| **033 Delegações / funções da casa** | ✅ |
| **034 Galeria de mídia** | ✅ (YouTube; PUBLICO/PRIVADO + álbuns — ADR-012) |
| Auditoria F01–F10 | ✅ GREEN |
