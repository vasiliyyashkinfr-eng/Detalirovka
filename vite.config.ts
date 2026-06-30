import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Деталировка 3D',
        short_name: 'Деталировка',
        description: 'Калькулятор деталировки мебели с 3D-визуализацией',
        theme_color: '#1f2933',
        background_color: '#0f1419',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      }
    })
  ]
})
