import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['portal/logo.png', 'portal/logo.svg'],
      manifest: {
        name: 'Bem vindo a Casa da Paz',
        short_name: 'Casa da Paz',
        description: 'Comunidade de Terreiro Afro-Indígena — Umbanda em Conselheiro Lafaiete, MG',
        theme_color: '#84cc16',
        background_color: '#0f172a',
        display: 'standalone',
        lang: 'pt-BR',
        start_url: '/public',
        icons: [
          { src: '/portal/logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/portal/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/portal/logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,jpg}'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
