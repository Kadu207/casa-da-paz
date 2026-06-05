# Briefing Lovable — Portal Público Casa da Paz

> **Como usar:** copie este documento inteiro (ou seções) para o chat do projeto Lovable.
> Export depois para branch `lovable/export-portal`. Integração final no Cursor (`frontend/src/pages/public/`).

---

## Contexto do projeto

**Casa da Paz** — terreiro de Umbanda afroindígena em Conselheiro Lafaiete, MG (Bairro Areal).
Sistema ERP/CRM interno já funcional; este briefing é **somente o portal público** (sem login).

**Tom visual:** acolhedor, espiritual, profissional. Afroindígena com respeito — evitar clichês ou caricaturas.

---

## Design tokens (obrigatório)

| Token | Hex | Uso |
|-------|-----|-----|
| Background | `#0F172A` | navy — fundo principal |
| Surface | `#1E293B` | cards, formulários |
| Accent / Gold | `#D4AF37` | títulos, CTAs primários |
| Success | `#22C55E` | confirmações |
| Danger | `#EF4444` | erros |
| Texto | `#FFFFFF` / 80% opacity | corpo |

**Tipografia:** serif para títulos (elegância espiritual), sans para corpo.
**Mobile-first:** breakpoints sm/md/lg. Touch-friendly (botões min 44px).

---

## Estrutura de telas (4 rotas)

### 1. Home — `/public`

**Objetivo:** primeira impressão + navegação.

**Conteúdo:**
- Logo/título: **Casa da Paz**
- Subtítulo: *Um ecossistema digital inteligente, responsivo e seguro para fortalecer o acolhimento, a gestão e a comunidade afroindígena.*
- Local: Conselheiro Lafaiete, MG — Bairro Areal
- Missão (1 parágrafo): espaço de cura, escuta e espiritualidade ancestral afroindígena; tradição Umbanda com respeito à natureza e aos povos originários.

**CTAs (botões):**
1. **Eventos** → `/public/eventos` (primário gold)
2. **Agendar consulta** → `/public/agendar` (outline gold)
3. **Contato** → `/public/contato` (outline neutro)
4. Link discreto: **Área interna** → `/login`

**Referência Instagram:** @umbandacasadapaz

---

### 2. Eventos — `/public/eventos`

**Objetivo:** listar giras e oficinas abertas (somente leitura).

**Layout:**
- Header com link ← Voltar (home)
- Título: **Próximos eventos**
- Lista de cards:
  - Nome do evento
  - Data formatada (pt-BR)
  - Opcional: "X/Y inscritos" se houver capacidade

**Estado vazio:** "Nenhum evento aberto no momento."

**API (referência — NÃO mockar em produção):**
```
GET /api/public/eventos
→ [{ id, nomeEvento, dataEvento, capacidadeMax, _count: { inscricoes } }]
```

**Nota Lovable:** pode usar dados estáticos no protótipo; export será conectado à API real.

---

### 3. Agendar consulta — `/public/agendar`

**Objetivo:** formulário de solicitação (não confirma horário — recepção retorna contato).

**Campos:**
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome completo | text | sim |
| Telefone (WhatsApp) | tel | sim |
| Data preferida | date | não |
| Observação | textarea | não |

**Botão:** "Enviar solicitação" (gold, full width mobile)

**Sucesso:**
- Título: **Agendamento recebido!**
- Texto: *A recepção entrará em contato em breve.*
- Link: Voltar ao início

**Erro:** mensagem em vermelho acima do form.

**API:**
```
POST /api/public/agendamentos
Body: { nome, telefone, dataPreferida?, observacao? }
Rate limit: 5/hora/IP
```

---

### 4. Contato — `/public/contato`

**Objetivo:** canais de comunicação + WhatsApp.

**Conteúdo em card (surface):**
- **Instagram:** [@umbandacasadapaz](https://instagram.com/umbandacasadapaz)
- **E-mail:** terreirocasadapaz@gmail.com
- **Local:** Bairro Areal — Conselheiro Lafaiete, MG

**Botão WhatsApp:** verde `#25D366`, full width, link `https://wa.me/5531999990000`

**Chatwoot (produção):** placeholder para widget embed — texto pequeno "Chat online em breve" no protótipo.

---

## Componentes sugeridos

- `PublicLayout` — nav minimal + footer com copyright Casa da Paz
- `PublicCard` — surface rounded-xl padding
- `PublicButton` — variants: primary (gold), outline, whatsapp
- `PublicHeader` — back link + título serif gold

---

## O que NÃO incluir no portal MVP

- Login de consulentes
- Pagamentos online
- Área logada pública
- Inscrição paga em eventos (só visualização)

---

## Checklist pós-export (Cursor)

- [ ] Conectar `src/lib/api.ts` (sem mocks)
- [ ] Manter rotas React Router existentes
- [ ] Preservar tokens em `tokens.css`
- [ ] Testar POST agendamento → fila recepção
- [ ] `VITE_CHATWOOT_WEBSITE_TOKEN` quando disponível

---

## Prompt inicial sugerido para o Lovable

```
Crie um portal público mobile-first para "Casa da Paz", terreiro de Umbanda em MG.
4 páginas: Home institucional, lista de eventos, formulário agendar consulta, contato com WhatsApp.
Cores: fundo navy #0F172A, accent gold #D4AF37, cards #1E293B.
Tom acolhedor e respeitoso. Títulos em serif. CTAs claros.
Sem área logada. Formulário agendar com nome, telefone, data preferida, observação.
```
