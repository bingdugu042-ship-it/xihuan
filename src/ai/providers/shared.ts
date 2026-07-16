import { apiRequest, readApiError } from '@/utils/apiFetch'

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}

export function shouldRetryStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500
}

/** 从 OpenAI 风格或多段 content 中提取文本 */
export function extractTextContent(content: unknown): string {
  if (typeof content === 'string') return content.trim()
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!part || typeof part !== 'object') return ''
        const p = part as { type?: unknown; text?: unknown }
        if (p.type === 'text' && typeof p.text === 'string') return p.text
        return ''
      })
      .join('\n')
      .trim()
  }
  return ''
}

export async function requestWithRetry(params: {
  baseURL: string
  path: string
  proxyURL?: string
  signal?: AbortSignal
  init: RequestInit
  retries?: number
}): Promise<Response> {
  const retries = params.retries ?? 2
  let lastError = ''

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await apiRequest({
      baseURL: params.baseURL,
      path: params.path,
      proxyURL: params.proxyURL,
      signal: params.signal,
      init: params.init,
    })

    if (res.ok) return res

    lastError = await readApiError(res)
    if (attempt < retries && shouldRetryStatus(res.status) && !params.signal?.aborted) {
      await sleep(450)
      continue
    }
    throw new Error(lastError)
  }

  throw new Error(lastError || '请求失败')
}

export function messageContentToString(content: string | import('./types').ChatContentPart[]): string {
  if (typeof content === 'string') return content
  return content
    .map((p) => (p.type === 'text' ? p.text : ''))
    .filter(Boolean)
    .join('\n')
}
