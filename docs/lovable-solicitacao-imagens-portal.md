# Solicitação Lovable — Imagens do Portal Público Casa da Paz

> **Como usar:** copie este documento inteiro para o chat do projeto Lovable.
> Peça para **gerar e exportar** os arquivos listados. Depois coloque em `frontend/public/portal/` no Cursor.

---

## Contexto

**Casa da Paz** — terreiro de Umbanda afroindígena em Conselheiro Lafaiete, MG (Bairro Areal).
Precisamos de **9 arquivos de mídia** para o portal público (`/public`).

**Tom visual:** acolhedor, espiritual, profissional. Afroindígena com respeito — evitar clichês, caricaturas ou estereótipos.
Paleta do site: fundo navy escuro (`#0F172A`), dourado (`#D4AF37`), texto claro.

**Formato de entrega:** JPG otimizado para web (qualidade 80–85), **exceto o logo em PNG** com fundo transparente ou circular recortável.

**Nomenclatura exata dos arquivos** (obrigatório — o código referencia estes nomes):

| # | Nome do arquivo | Formato |
|---|-----------------|---------|
| 1 | `logo.png` | PNG |
| 2 | `hero.jpg` | JPG |
| 3 | `velas.jpg` | JPG |
| 4 | `nature.jpg` | JPG |
| 5 | `landscape.jpg` | JPG |
| 6 | `preto-velho.jpg` | JPG |
| 7 | `atabaque.jpg` | JPG |
| 8 | `iemanja.jpg` | JPG |
| 9 | `ervas.jpg` | JPG |

---

## 1. Logo — `logo.png`

- **Dimensão:** 512×512 px (quadrado, exibido em círculo 140px na tela)
- **Conteúdo:** logotipo ou emblema **Casa da Paz** — pode ser símbolo espiritual discreto (vela, folha, círculo sagrado) + tipografia serif elegante
- **Fundo:** transparente ou sólido que funcione sobre navy `#0F172A`
- **Uso:** cabeçalho hero da home, favicon futuro

---

## 2. Hero principal — `hero.jpg`

- **Dimensão mínima:** 1920×800 px (landscape wide, ratio ~2.4:1)
- **Conteúdo:** ambiente do terreiro ou natureza afroindígena ao entardecer — floresta, fogueira suave, ou salão de gira com luz dourada quente
- **Estilo:** fotografia artística ou ilustração realista; overlay escuro será aplicado no site
- **Uso:** banner full-width no topo da home (atrás do título)

---

## 3. Velas no altar — `velas.jpg`

- **Dimensão:** 1280×720 px (16:9)
- **Conteúdo:** velas acesas em altar de Umbanda — brancas, azuis ou douradas; ambiente respeitoso
- **Uso:** seção “Nossa missão” / cards de destaque na home

---

## 4. Natureza — `nature.jpg`

- **Dimensão:** 1280×720 px (16:9)
- **Conteúdo:** mata, riacho ou trilha — conexão com natureza e povos originários
- **Uso:** banner secundário entre seções

---

## 5. Paisagem — `landscape.jpg`

- **Dimensão:** 1280×720 px (16:9)
- **Conteúdo:** paisagem de Conselheiro Lafaiete / serra mineira ao pôr do sol, ou campo com montanhas ao fundo
- **Uso:** banner alternativo em páginas internas do portal

---

## 6. Pretos Velhos — `preto-velho.jpg`

- **Dimensão:** 1024×768 px (4:3)
- **Conteúdo:** representação respeitosa da entidade **Preto Velho** — pode ser estátua de gesso, imagem simbólica ou arte sacra (sem caricatura)
- **Uso:** galeria bento grid na home — legenda: “Pretos Velhos”

---

## 7. Atabaques — `atabaque.jpg`

- **Dimensão:** 1024×768 px (4:3)
- **Conteúdo:** atabaques sagrados — madeira, couro, ambiente de gira
- **Uso:** galeria — legenda: “Atabaques sagrados”

---

## 8. Iemanjá — `iemanja.jpg`

- **Dimensão:** 1024×1024 px (quadrado — ocupa 2 linhas no grid mobile)
- **Conteúdo:** homenagem a **Iemanjá** — mar, oferendas de flores, azul e branco, respeito à Mãe das Águas
- **Uso:** destaque maior na galeria — legenda: “Iemanjá — Mãe das águas”

---

## 9. Ervas e oferendas — `ervas.jpg`

- **Dimensão:** 1280×720 px (16:9, largura dupla no grid desktop)
- **Conteúdo:** ervas, folhas, defumação, oferendas naturais sobre mesa de altar
- **Uso:** card largo na galeria — legenda: “Ervas e oferendas”

---

## Onde cada imagem aparece no site

```
HOME (/public)
├── hero.jpg          → fundo do banner principal
├── logo.png          → logo circular central
├── velas.jpg         → card missão
├── nature.jpg        → banner meio da página
├── landscape.jpg     → (reserva / seções alternativas)
└── Galeria bento:
    ├── iemanja.jpg       (grande, quadrado)
    ├── preto-velho.jpg
    ├── atabaque.jpg
    └── ervas.jpg         (largo)
```

---

## Restrições importantes

1. **Sem texto embutido** nas fotos (títulos vêm do HTML).
2. **Sem marcas d’água** ou logos de stock.
3. **Direitos:** imagens originais ou licenciadas para uso no site institucional.
4. **Acessibilidade:** contraste suficiente mesmo com overlay escuro no hero.
5. **Peso:** cada JPG idealmente &lt; 400 KB (hero até ~600 KB).

---

## Após gerar no Lovable

1. Baixe os 9 arquivos com os nomes exatos acima.
2. Coloque em: `frontend/public/portal/`
3. No Cursor, confirme que `frontend/src/lib/portal-assets.ts` aponta para `/portal/*.jpg` e `/portal/logo.png`.
4. Recarregue http://localhost:5173/public

Variável opcional: `VITE_PORTAL_ASSETS_LOCAL=false` força CDN Lovable em vez dos arquivos locais.

---

## Prompt resumido (copiar e colar)

```
Gere 9 assets para o portal Casa da Paz (Umbanda afroindígena, Conselheiro Lafaiete MG):

1. logo.png 512×512 — emblema espiritual elegante, fundo transparente
2. hero.jpg 1920×800 — terreiro/natureza ao entardecer, tom acolhedor
3. velas.jpg 1280×720 — velas em altar
4. nature.jpg 1280×720 — mata/rio
5. landscape.jpg 1280×720 — serra mineira
6. preto-velho.jpg 1024×768 — Preto Velho, respeitoso
7. atabaque.jpg 1024×768 — atabaques sagrados
8. iemanja.jpg 1024×1024 — Iemanjá, mar e flores
9. ervas.jpg 1280×720 — ervas e oferendas

Paleta: navy #0F172A + dourado #D4AF37. Sem clichês. Exporte com estes nomes exatos.
```
