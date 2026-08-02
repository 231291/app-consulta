import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // ya existe public/manifest.json enlazado en index.html; no lo duplicamos
      includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'icon.svg', 'manifest.json'],
      workbox: {
        // Guarda en caché los archivos de la app (JS, CSS, HTML, íconos) para que abra rápido y sin internet.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json}'],
        runtimeCaching: [
          {
            // Los datos de Supabase (balances, inspecciones) nunca se guardan en
            // caché: siempre deben venir frescos, nunca desactualizados.
            urlPattern: ({ url }) => url.origin.includes('supabase.co'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
