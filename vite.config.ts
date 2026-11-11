import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { appName } from './src/brand'

// --sage in style.css, like the day theme-color in index.html.
const sage = '#cbdac6'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'app-name',
      transformIndexHtml: () => [{ tag: 'title', children: appName, injectTo: 'head' }],
    },
    VitePWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/apple-touch-icon-180x180.png', 'fonts/**/*.woff2'],
      manifest: {
        name: appName,
        short_name: appName,
        lang: 'it',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        background_color: sage,
        theme_color: sage,
        icons: [
          { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
