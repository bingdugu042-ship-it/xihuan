import type { ChatCompletionParams, ProviderAdapter } from './types'
import { extractTextContent, requestWithRetry } from './shared'
import { openaiAdapter } from './openaiCompatible'

const glmAdapter: ProviderAdapter = {
  kind: 'glm',
  label: '智谱 GLM',

  fetchModels: openaiAdapter.fetchModels,

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

    // GLM-4.5+ 默认开启 thinking，关闭以兼容 JSON 输出
    if (/glm-4\.[5-9]|glm-5/i.test(params.model)) {
      body.thinking = { type: 'disabled' }
    }

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

    const data = (await res.json()) as {
      choices?: { message?: { content?: unknown } }[]
      /** 智谱部分模型将正文放在 reasoning_content 旁路字段 */
      reasoning_content?: string
    }

    const content = extractTextContent(data?.choices?.[0]?.message?.content)
    if (content?.trim()) return content.trim()

    // 极少数代理/旧版返回格式
    if (typeof data.reasoning_content === 'string' && data.reasoning_content.trim()) {
      return data.reasoning_content.trim()
    }

    throw new Error('模型空回复')
  },
}

export { glmAdapter }
