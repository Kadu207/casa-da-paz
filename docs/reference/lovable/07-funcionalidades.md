# 7. Funcionalidades

## 7.1. Públicas

### Home (`/`)
- Hero com nome **Casa da Paz** + mensagem de boas-vindas (endereço removido por preferência do usuário).
- Galeria umbandista em bento grid.
- **Mapa** marcando Rua Valério Eugênio, 570 — Bairro Areal — Conselheiro Lafaiete - MG.
- **Botões**: "Abrir no Google Maps" e "Abrir no Waze" (`target="_blank"`).
- Prévia dos próximos eventos.

### Eventos (`/eventos` e `/eventos/:id`)
- Listagem com banner (velas/altar).
- Filtros e busca.
- Detalhe com descrição, recomendações, capacidade, compartilhamento e botão "Adicionar ao calendário" (gera `.ics`).

### Agendamento (`/agendar`)
- Formulário validado por Zod.
- Captcha Turnstile.
- Rate-limit por IP.
- Retorna protocolo para acompanhamento via `/acompanhar/:protocolo`.

### Login (`/login`)
- Email/senha + Google OAuth.
- Links para recuperação de senha.
- Backdrop com imagem de velas/altar.

## 7.2. Admin

### Dashboard (`/admin`)
- Acesso rápido às áreas administrativas.

### Eventos (`/admin/eventos`, `/admin/eventos/novo`, `/admin/eventos/:id`)
- CRUD completo com formulário `EventoForm`.
- Toggle de publicação.
- Reordenação via campo `ordem`.
- Toda mutação gera registro em `admin_audit_log`.

### Usuários (`/admin/usuarios`)
- Listagem de usuários com role atual.
- Alteração de role (gera auditoria).

### Auditoria (`/admin/auditoria`)
- Tabela paginada (25/pág) do `admin_audit_log`.
- Filtros: papel, rota, usuário (busca), intervalo de datas.
- Ordenação clicável: data, usuário, papel, rota (asc/desc).
- Estados de loading (skeleton), empty ("Nenhum registro encontrado") e toast ao aplicar filtro.
- Exportação CSV/PDF respeitando filtros — cada export gera nova linha de auditoria com `rota=admin.auditoria.export.{csv|pdf}`, `motivo`, `ip`, `user_id`.

## 7.3. Telemetria de Imagens

- `src/lib/image-telemetry.ts`: contador em memória + `localStorage` (`window.__imageFallbackStats`).
- Cada fallback é debounced por `src` e reportado via `reportLovableError` com severidade `warning`.
- Helpers: `getImageFallbackStats()`, `resetImageFallbackStats()`.

## 7.4. Performance

- SSR + hidratação.
- `preload` com `fetchpriority="high"` em hero e banner.
- `srcSet` responsivo (320/640/960/1280) + `sizes` mobile-first.
- `loading="lazy"` em imagens below-the-fold.
- Cache de CDN agressivo (URLs imutáveis com `asset_id`).
