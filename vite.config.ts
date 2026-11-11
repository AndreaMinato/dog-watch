import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { appName, themeColors } from './src/brand'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'brand',
      transformIndexHtml: () => [
        { tag: 'title', children: appName, injectTo: 'head' },
        ...Object.entries(themeColors).map(([scheme, color]) => ({
          tag: 'meta',
          attrs: { name: 'theme-color', content: color, media: `(prefers-color-scheme: ${scheme})` },
          injectTo: 'head' as const,
        })),
      ],
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
        background_color: themeColors.light,
        theme_color: themeColors.light,
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
