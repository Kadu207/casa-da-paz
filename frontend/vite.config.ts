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
      includeAssets: ['portal/logo.svg'],
      manifest: {
        name: 'Casa da Paz',
        short_name: 'Casa da Paz',
        description: 'Terreiro de Umbanda — Conselheiro Lafaiete, MG',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        lang: 'pt-BR',
        start_url: '/public',
        icons: [
          { src: '/portal/logo.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/portal/logo.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,jpg}'],
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
