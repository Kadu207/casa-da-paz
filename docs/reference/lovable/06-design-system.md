# 6. Design System

## 6.1. Identidade Visual

Tema umbandista, com paleta inspirada em terra, ouro velho, branco-vela e índigo noturno — evocando ancestralidade, natureza e espiritualidade.

### Tokens (definidos em `src/styles.css` em `oklch`)
- `--background`, `--foreground`
- `--primary` (dourado/ouro velho), `--primary-foreground`
- `--secondary`, `--muted`, `--accent`
- `--card`, `--border`, `--ring`
- Gradientes derivados (ex.: hero overlay com `from-background/35 via-background/55`).

> **Regra crítica**: nunca usar classes Tailwind como `text-white` ou `bg-black` diretamente em componentes — sempre tokens semânticos.

## 6.2. Tipografia

shadcn/ui default (Inter via Tailwind). Cabeçalhos com `tracking-tight` e títulos da galeria com `drop-shadow-lg` para legibilidade sobre imagem.

## 6.3. Componentes UI

Base shadcn/ui em `src/components/ui/`: button, card, dialog, table, input, select, checkbox, tabs, dropdown, toast (sonner), skeleton, etc.

## 6.4. Imagens Estratégicas

| Imagem | Local de uso | Significado |
| --- | --- | --- |
| Preto Velho | Galeria home | Sabedoria ancestral |
| Atabaque | Galeria home | Ritmo sagrado, chamada dos guias |
| Iemanjá | Galeria home (coluna dupla) | Mãe das águas, acolhimento |
| Ervas / Oferenda | Galeria home, rodapé | Natureza, cura |
| Velas / Altar | Banner `/eventos`, login | Luz, oração |
| Afro-indígena (hero) | Home (above-the-fold, preload) | Ancestralidade do povo brasileiro |

Layout da galeria: **bento grid** com Iemanjá em coluna dupla, hover `scale-110`, anel `ring-1 ring-primary/10` em dourado.

## 6.5. Animação

Transições suaves (`transition-transform duration-500`) em hover de cards e imagens. Sem libs pesadas — apenas Tailwind + CSS.

## 6.6. Acessibilidade

- `alt` text em toda imagem.
- Contraste verificado em dark mode.
- `aria-label` em botões de ícone (ex.: abrir Google Maps, Waze).
- Foco visível com `--ring`.
