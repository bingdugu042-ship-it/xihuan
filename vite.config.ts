import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

/**
 * GitHub Pages base：
 * - 自定义域名（public/CNAME）→ `/`
 * - 项目站 github.io/<repo>/ → `/<repo>/`
 * - 本地开发默认 `/`
 */
function resolvePagesBase(): string {
  if (process.env.GITHUB_PAGES_BASE) return process.env.GITHUB_PAGES_BASE
  try {
    const cnamePath = path.resolve(process.cwd(), 'public/CNAME')
    if (fs.existsSync(cnamePath) && fs.readFileSync(cnamePath, 'utf8').trim()) {
      return '/'
    }
  } catch {
    /* ignore */
  }
  return '/'
}

export default defineConfig({
  base: resolvePagesBase(),
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
