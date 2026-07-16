/** 浏览器直连 AI API：校验地址、可选 CORS 代理、友好错误 */

const API_TIMEOUT_MS = 90_000

export function normalizeBaseURL(url: string): string {
  return url.replace(/\/+$/, '')
}

function joinPath(base: string, path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${normalizeBaseURL(base)}${p}`
}

/** 校验目标 API 是否能在当前页面环境访问 */
export function validateApiTargetUrl(targetUrl: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(targetUrl)
  } catch {
    return 'Base URL 格式不正确'
  }

  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && parsed.protocol === 'http:') {
    return 'HTTPS 页面无法请求 HTTP 接口（混合内容被阻止），请改用 HTTPS 地址'
  }

  const host = parsed.hostname.toLowerCase()
  const isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host.endsWith('.local')
  const isPrivate =
    /^192\.168\./.test(host) ||
    /^10\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)

  if (typeof window !== 'undefined') {
    const pageHost = window.location.hostname.toLowerCase()
    const pageIsLocal = pageHost === 'localhost' || pageHost === '127.0.0.1'
    if (!pageIsLocal && (isLocal || isPrivate)) {
      return '手机或公网页面无法访问本机/局域网 API，请填写公网 HTTPS 地址，或配置下方 CORS 代理'
    }
  }

  return null
}

function translateFetchError(error: unknown, usedProxy: boolean): Error {
  if (error instanceof Error && error.name === 'AbortError') {
    return new Error('请求超时，请检查网络或 API 地址')
  }
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase()
    if (/fetch|network|load failed|failed to fetch/.test(msg)) {
      if (!usedProxy) {
        return new Error(
          '浏览器跨域拦截：手机端无法直连多数 AI API（如智谱、OpenAI）。请填写下方「CORS 代理」后重试',
        )
      }
      return new Error('网络连接失败，请检查 CORS 代理地址是否可访问')
    }
  }
  return error instanceof Error ? error : new Error('请求失败')
}

async function fetchWithTimeout(url: string, init: RequestInit, externalSignal?: AbortSignal): Promise<Response> {
  const controller = new AbortController()
  const timer = globalThis.setTimeout(() => controller.abort(), API_TIMEOUT_MS)
  const onExternalAbort = () => controller.abort()
  externalSignal?.addEventListener('abort', onExternalAbort)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    globalThis.clearTimeout(timer)
    externalSignal?.removeEventListener('abort', onExternalAbort)
  }
}

export interface ApiRequestOptions {
  baseURL: string
  path: string
  proxyURL?: string
  signal?: AbortSignal
  init?: RequestInit
}

/**
 * 发起 OpenAI 兼容 API 请求。
 * - 无代理：直连 baseURL + path
 * - 有代理：请求 proxyURL，通过 X-Target-URL 转发到真实接口
 */
export async function apiRequest({ baseURL, path, proxyURL, signal, init = {} }: ApiRequestOptions): Promise<Response> {
  const targetUrl = joinPath(baseURL, path)
  const validationError = validateApiTargetUrl(targetUrl)
  if (validationError) throw new Error(validationError)

  const proxy = proxyURL?.trim()
  const headers = new Headers(init.headers)

  try {
    if (proxy) {
      const proxyBase = (() => {
        if (!proxy.startsWith('/')) return normalizeBaseURL(proxy)
        const origin = globalThis.location?.origin
        if (!origin) throw new Error('当前环境无法解析相对代理地址，请填写完整代理 URL')
        return `${origin}${proxy.replace(/\/+$/, '')}`
      })()
      headers.set('X-Target-URL', targetUrl)
      return await fetchWithTimeout(proxyBase, { ...init, headers }, signal)
    }
    return await fetchWithTimeout(targetUrl, { ...init, headers }, signal)
  } catch (e) {
    throw translateFetchError(e, Boolean(proxy))
  }
}

export async function readApiError(res: Response): Promise<string> {
  const text = await res.text().catch(() => res.statusText)
  if (!text) return `HTTP ${res.status}`
  try {
    const json = JSON.parse(text) as { error?: { message?: string }; message?: string }
    return json.error?.message ?? json.message ?? text
  } catch {
    return text.slice(0, 280)
  }
}
