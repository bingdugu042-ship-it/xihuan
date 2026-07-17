import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import https from 'node:https'

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

/**
 * 本地开发 CORS 代理：设置里填 `/cors-proxy`，请求经本服务转发到 X-Target-URL。
 * 解决手机局域网访问 Vite 时无法直连智谱/OpenAI 的跨域问题。
 */
function corsProxyPlugin(): Plugin {
  return {
    name: 'dev-cors-proxy',
    configureServer(server) {
      server.middlewares.use('/cors-proxy', (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
          res.setHeader(
            'Access-Control-Allow-Headers',
            'Authorization, Content-Type, X-Target-URL, anthropic-version, x-api-key',
          )
          res.end()
          return
        }

        const target = String(req.headers['x-target-url'] ?? '').trim()
        if (!target) {
          res.statusCode = 400
          res.end('Missing X-Target-URL')
          return
        }

        let parsed: URL
        try {
          parsed = new URL(target)
        } catch {
          res.statusCode = 400
          res.end('Invalid X-Target-URL')
          return
        }

        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          res.statusCode = 400
          res.end('Only http/https targets allowed')
          return
        }

        const chunks: Buffer[] = []
        req.on('data', (c) => chunks.push(Buffer.from(c)))
        req.on('end', () => {
          const body = Buffer.concat(chunks)
          const headers: Record<string, string> = {}
          for (const [k, v] of Object.entries(req.headers)) {
            if (v == null) continue
            const key = k.toLowerCase()
            if (
              key === 'host' ||
              key === 'connection' ||
              key === 'content-length' ||
              key === 'x-target-url' ||
              key.startsWith('sec-') ||
              key === 'origin' ||
              key === 'referer'
            ) {
              continue
            }
            headers[k] = Array.isArray(v) ? v.join(',') : v
          }
          if (body.length) headers['content-length'] = String(body.length)

          const lib = parsed.protocol === 'https:' ? https : http
          const upstream = lib.request(
            {
              protocol: parsed.protocol,
              hostname: parsed.hostname,
              port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
              path: `${parsed.pathname}${parsed.search}`,
              method: req.method || 'GET',
              headers,
            },
            (upRes) => {
              res.statusCode = upRes.statusCode ?? 502
              for (const [k, v] of Object.entries(upRes.headers)) {
                if (v == null) continue
                const key = k.toLowerCase()
                if (key === 'access-control-allow-origin' || key === 'transfer-encoding') continue
                res.setHeader(k, v)
              }
              res.setHeader('Access-Control-Allow-Origin', '*')
              upRes.pipe(res)
            },
          )
          upstream.on('error', (err) => {
            res.statusCode = 502
            res.end(`Proxy error: ${err.message}`)
          })
          if (body.length) upstream.write(body)
          upstream.end()
        })
      })
    },
  }
}

export default defineConfig({
  base: resolvePagesBase(),
  plugins: [react(), tailwindcss(), corsProxyPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
  },
})
