import type { ChatCompletionParams, ProviderAdapter } from './types'
import { extractTextContent, requestWithRetry } from './shared'

const openaiAdapter: ProviderAdapter = {
  kind: 'openai',
  label: 'OpenAI 兼容',

  async fetchModels(baseURL, apiKey, proxyURL) {
    const res = await requestWithRetry({
      baseURL,
      path: '/models',
      proxyURL,
      init: {
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    })
    const data = (await res.json()) as { data?: { id: string }[] }
    return (data.data ?? []).map((m) => m.id).filter(Boolean).sort()
  },

  async chatCompletion(params: ChatCompletionParams) {
    const body: Record<string, unknown> = {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.8,
      max_tokens: params.maxTokens ?? 2048,
    }
    if (params.topP != null) body.top_p = params.topP
    if (params.presencePenalty != null) body.presence_penalty = params.presencePenalty
    if (params.frequencyPenalty != null) body.frequency_penalty = params.frequencyPenalty
    if (params.jsonMode) body.response_format = { type: 'json_object' }

    const res = await requestWithRetry({
      baseURL: params.baseURL,
      path: '/chat/completions',
      proxyURL: params.proxyURL,
      signal: params.signal,
      retries: params.retries,
      init: {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    })

    const data = (await res.json()) as { choices?: { message?: { content?: unknown } }[] }
    const content = extractTextContent(data?.choices?.[0]?.message?.content)
    if (!content?.trim()) throw new Error('模型空回复')
    return content.trim()
  },
}

export { openaiAdapter }
