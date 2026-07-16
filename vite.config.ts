import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
// GitHub Pages 项目站地址为 https://<user>.github.io/<repo>/，需匹配 base
const repoBase = process.env.GITHUB_PAGES_BASE ?? '/'

export default defineConfig({
  base: repoBase,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
  },
})
