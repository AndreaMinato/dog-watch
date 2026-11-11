import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { appName } from './src/brand'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'app-name',
      transformIndexHtml: () => [{ tag: 'title', children: appName, injectTo: 'head' }],
    },
  ],
})
