import type { ChatCompletionMessage, ChatCompletionParams, ProviderAdapter } from './types'
import { extractTextContent, messageContentToString, requestWithRetry } from './shared'

const JSON_SYSTEM_APPEND =
  '\n\n你必须仅输出合法 JSON 对象，不要包含 markdown 代码块或额外说明。'

type ClaudeContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }

function toClaudeContent(content: string | import('./types').ChatContentPart[]): ClaudeContentBlock[] {
  if (typeof content === 'string') {
    return content.trim() ? [{ type: 'text', text: content }] : []
  }
  const blocks: ClaudeContentBlock[] = []
  for (const part of content) {
    if (part.type === 'text' && part.text.trim()) {
      blocks.push({ type: 'text', text: part.text })
      continue
    }
    if (part.type === 'image_url') {
      const url = part.image_url.url
      const dataUrl = /^data:([^;]+);base64,(.+)$/i.exec(url)
      if (dataUrl) {
        blocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: dataUrl[1],
            data: dataUrl[2],
          },
        })
      } else {
        blocks.push({ type: 'text', text: `[image] ${url}` })
      }
    }
  }
  return blocks.length ? blocks : [{ type: 'text', text: '' }]
}

function splitClaudeMessages(messages: ChatCompletionMessage[]) {
  const systemParts: string[] = []
  const claudeMessages: { role: 'user' | 'assistant'; content: ClaudeContentBlock[] }[] = []

  for (const msg of messages) {
    if (msg.role === 'system') {
      const text = messageContentToString(msg.content).trim()
      if (text) systemParts.push(text)
      continue
    }
    claudeMessages.push({
      role: msg.role,
      content: toClaudeContent(msg.content),
    })
  }

  return { system: systemParts.join('\n\n'), messages: claudeMessages }
}

/** Claude 官方无 /models 列表，返回常用模型供手动选择 */
const CLAUDE_FALLBACK_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
]

const claudeAdapter: ProviderAdapter = {
  kind: 'claude',
  label: 'Anthropic Claude',

  async fetchModels(baseURL, apiKey, proxyURL) {
    try {
      const res = await requestWithRetry({
        baseURL,
        path: '/models',
        proxyURL,
        retries: 0,
        init: {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
        },
      })
      const data = (await res.json()) as { data?: { id: string }[] }
      const list = (data.data ?? []).map((m) => m.id).filter(Boolean).sort()
      if (list.length) return list
    } catch {
      // 部分代理仍走 OpenAI 风格 /models
    }
    return [...CLAUDE_FALLBACK_MODELS]
  },

  async chatCompletion(params: ChatCompletionParams) {
    const { system, messages } = splitClaudeMessages(params.messages)
    const systemText = params.jsonMode && system
      ? system + JSON_SYSTEM_APPEND
      : params.jsonMode
        ? JSON_SYSTEM_APPEND.trim()
        : system

    const body: Record<string, unknown> = {
      model: params.model,
      messages,
      max_tokens: params.maxTokens ?? 2048,
      temperature: params.temperature ?? 0.8,
    }
    if (systemText) body.system = systemText
    if (params.topP != null) body.top_p = params.topP

    const res = await requestWithRetry({
      baseURL: params.baseURL,
      path: '/messages',
      proxyURL: params.proxyURL,
      signal: params.signal,
      retries: params.retries,
      init: {
        method: 'POST',
        headers: {
          'x-api-key': params.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    })

    const data = (await res.json()) as {
      content?: { type?: string; text?: string }[]
      choices?: { message?: { content?: unknown } }[]
    }

    // 原生 Claude /messages
    const claudeText = extractTextContent(
      data.content?.map((b) => (b.type === 'text' ? { type: 'text', text: b.text ?? '' } : null)).filter(Boolean),
    )
    if (claudeText?.trim()) return claudeText.trim()

    // 部分代理将 Claude 包装为 OpenAI choices
    const wrapped = extractTextContent(data?.choices?.[0]?.message?.content)
    if (wrapped?.trim()) return wrapped.trim()

    throw new Error('模型空回复')
  },
}

export { claudeAdapter }
