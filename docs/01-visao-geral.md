# Casa da Paz — Documentação do Projeto

## 1. Visão Geral

**Casa da Paz** é uma aplicação web para uma casa de Umbanda localizada em Conselheiro Lafaiete - MG (Rua Valério Eugênio, 570, Bairro Areal). O sistema oferece divulgação de eventos espirituais, agendamento de atendimentos, mapa de localização e área administrativa para gestão de eventos, usuários e auditoria.

### 1.1. Propósito

- Apresentar a Casa da Paz ao público, com elementos visuais que conectam o visitante à espiritualidade umbandista (imagens de pretos velhos, atabaques, Iemanjá, ervas, velas e oferendas).
- Permitir consulta pública aos eventos (giras, festas de orixás, palestras).
- Permitir agendamento de atendimentos com acompanhamento por protocolo.
- Oferecer um painel administrativo seguro para gestão de conteúdo e usuários.
- Auditar ações administrativas críticas (login, alterações em eventos/usuários, exportações).

### 1.2. Stack Técnica

| Camada | Tecnologia |
| --- | --- |
| Framework | TanStack Start v1 (React 19 + Vite 7, SSR/SSG) |
| Roteamento | TanStack Router (file-based em `src/routes/`) |
| Estado servidor | TanStack Query 5 |
| Estilização | Tailwind CSS v4 (tokens em `src/styles.css`, formato `oklch`) |
| UI | shadcn/ui + Radix UI |
| Backend | Lovable Cloud (Supabase gerenciado) — Postgres + Auth + RLS |
| Server logic | `createServerFn` (TanStack) e server routes em `src/routes/api/` |
| Runtime servidor | Cloudflare Workers (nodejs_compat) |
| Validação | Zod |
| Formulários | react-hook-form + @hookform/resolvers |
| Captcha | Cloudflare Turnstile |

### 1.3. Endereço Físico

**Casa da Paz**
Rua Valério Eugênio, 570 — Bairro Areal
Conselheiro Lafaiete — MG

Localização marcada no mapa da home com botões de abertura no Google Maps e Waze.
