/**
 * Mídia do portal — URLs canônicas do export Lovable (CDN preview).
 * Override: VITE_LOVABLE_ASSETS_BASE ou arquivos locais em public/portal/*.jpg
 */
const LOVABLE_BASE =
  import.meta.env.VITE_LOVABLE_ASSETS_BASE ??
  'https://id-preview--aaacf821-2ee4-4d25-8c43-cfa7e3b27388.lovable.app';

/** Local por padrão (public/portal/*.jpg). CDN: VITE_PORTAL_ASSETS_LOCAL=false */
const useLocal = import.meta.env.VITE_PORTAL_ASSETS_LOCAL !== 'false';

function lovable(path: string, localFile: string): string {
  if (useLocal) return `/portal/${localFile}`;
  return `${LOVABLE_BASE}${path}`;
}

export const portalAssets = {
  logo: lovable(
    '/__l5e/assets-v1/eeccef43-b889-4135-8b5f-c4ced7b4480f/casa-da-paz-logo.png',
    'logo.png'
  ),
  hero: lovable(
    '/__l5e/assets-v1/7a3cccb7-7e32-4ecb-b542-70930763ac21/hero-afroindigena.jpg',
    'hero.jpg'
  ),
  velasAltar: lovable(
    '/__l5e/assets-v1/e3139a1e-0b38-4ec0-a74a-2b216637fd33/velas-altar.jpg',
    'velas.jpg'
  ),
  bannerNature: lovable(
    '/__l5e/assets-v1/7a3cccb7-7e32-4ecb-b542-70930763ac21/hero-afroindigena.jpg',
    'nature.jpg'
  ),
  bannerLandscape: lovable(
    '/__l5e/assets-v1/e3139a1e-0b38-4ec0-a74a-2b216637fd33/velas-altar.jpg',
    'landscape.jpg'
  ),
  pretoVelho: lovable(
    '/__l5e/assets-v1/364c80c4-4e48-47c7-9ad5-0afc83b75028/preto-velho.jpg',
    'preto-velho.jpg'
  ),
  atabaque: lovable(
    '/__l5e/assets-v1/6e2b183d-5184-4d1e-88f1-63455eb16b7d/atabaque.jpg',
    'atabaque.jpg'
  ),
  iemanja: lovable(
    '/__l5e/assets-v1/2733cecb-ba30-4142-914a-9450782f5e74/iemanja.jpg',
    'iemanja.jpg'
  ),
  ervas: lovable(
    '/__l5e/assets-v1/e962ef0a-df52-48ec-aaa7-2f18bb2572b4/ervas-oferenda.jpg',
    'ervas.jpg'
  ),
} as const;

export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '5531999990000';

export const ADDRESS = {
  line1: 'Rua Valério Eugênio, 570',
  line2: 'Bairro Areal — Conselheiro Lafaiete, MG',
  query: 'Casa da Paz - Rua Valério Eugênio, 570 - Areal, Conselheiro Lafaiete - MG',
  wazeCoords: '-20.659,-43.788',
} as const;
