/** 统一 AI Provider 适配层 · 类型定义 */

export type AiProviderKind = 'openai' | 'claude' | 'glm'

export type ChatRole = 'system' | 'user' | 'assistant'

export type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export interface ChatCompletionMessage {
  role: ChatRole
  content: string | ChatContentPart[]
}

export interface ChatCompletionParams {
  baseURL: string
  apiKey: string
  model: string
  messages: ChatCompletionMessage[]
  temperature?: number
  topP?: number
  presencePenalty?: number
  frequencyPenalty?: number
  maxTokens?: number
  jsonMode?: boolean
  proxyURL?: string
  signal?: AbortSignal
  /** 429/5xx 额外重试次数，默认 2 */
  retries?: number
}

export interface ProviderAdapter {
  kind: AiProviderKind
  label: string
  fetchModels(baseURL: string, apiKey: string, proxyURL?: string): Promise<string[]>
  chatCompletion(params: ChatCompletionParams): Promise<string>
}
