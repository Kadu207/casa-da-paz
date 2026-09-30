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
      includeAssets: [
        'favicon.ico',
        'portal/logo.png',
        'portal/logo.webp',
        'portal/logo-192.png',
        'portal/logo-512.png',
        'portal/logo-4k.webp',
        'portal/logo-4k.jpg',
        'portal/favicon-32.png',
        'portal/apple-touch-icon.png',
      ],
      manifest: {
        name: 'Bem vindo a Casa da Paz',
        short_name: 'Casa da Paz',
        description: 'Comunidade de Terreiro Afro-Indígena — Umbanda em Conselheiro Lafaiete, MG',
        theme_color: '#006b3f',
        background_color: '#0f172a',
        display: 'standalone',
        lang: 'pt-BR',
        start_url: '/public',
        icons: [
          { src: '/portal/logo-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/portal/logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/portal/logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,ico}'],
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
