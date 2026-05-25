import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Kontrol',
        short_name: 'Kontrol',
        description: "Your social media command center",
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'favicon-32x32.png',  sizes: '32x32',   type: 'image/png' },
          { src: 'favicon-64x64.png',  sizes: '64x64',   type: 'image/png' },
          { src: 'icon-512.png',       sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png',       sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-1024.png',      sizes: '1024x1024', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 10 },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
