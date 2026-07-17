import { claudeAdapter } from './claude'
import { detectProvider, getProviderLabel } from './detect'
import { glmAdapter } from './glm'
import { openaiAdapter } from './openaiCompatible'
import type { AiProviderKind, ChatCompletionParams, ProviderAdapter } from './types'

const ADAPTERS: Record<AiProviderKind, ProviderAdapter> = {
  openai: openaiAdapter,
  claude: claudeAdapter,
  glm: glmAdapter,
}

export function getProviderAdapter(kind: AiProviderKind): ProviderAdapter {
  return ADAPTERS[kind]
}

export function resolveProvider(baseURL: string, model?: string): ProviderAdapter {
  return getProviderAdapter(detectProvider(baseURL, model))
}

export async function fetchModelList(
  baseURL: string,
  apiKey: string,
  proxyURL?: string,
  model?: string,
): Promise<string[]> {
  const adapter = resolveProvider(baseURL, model)
  return adapter.fetchModels(baseURL, apiKey, proxyURL)
}

export async function chatCompletion(params: ChatCompletionParams): Promise<string> {
  const adapter = resolveProvider(params.baseURL, params.model)
  return adapter.chatCompletion(params)
}

export async function testApiConnection(
  baseURL: string,
  apiKey: string,
  model?: string,
  proxyURL?: string,
): Promise<{ ok: boolean; message: string; provider?: AiProviderKind }> {
  try {
    if (!apiKey.trim()) return { ok: false, message: '请先填写 API Key' }
    const adapter = resolveProvider(baseURL, model)
    const providerLabel = getProviderLabel(adapter.kind)
    const models = await adapter.fetchModels(baseURL, apiKey, proxyURL)

    // 有模型名时再做一次极短 chat 探测，避免「能拉模型列表但聊天失败」
    const pingModel = (model?.trim() || models[0] || '').trim()
    if (pingModel) {
      try {
        await adapter.chatCompletion({
          baseURL,
          apiKey,
          model: pingModel,
          proxyURL,
          temperature: 0,
          maxTokens: 8,
          retries: 0,
          messages: [{ role: 'user', content: 'ping' }],
        })
      } catch (chatErr) {
        const detail = chatErr instanceof Error ? chatErr.message : '聊天探测失败'
        return {
          ok: false,
          message: `模型列表可达，但聊天失败（${providerLabel}）：${detail}`,
          provider: adapter.kind,
        }
      }
    }

    if (models.length === 0 && !pingModel) {
      return { ok: false, message: `连接成功（${providerLabel}）但未返回模型`, provider: adapter.kind }
    }
    if (model && models.length > 0 && models.includes(model)) {
      return {
        ok: true,
        message: `联通成功 · ${providerLabel} · 聊天探测通过 · ${model}`,
        provider: adapter.kind,
      }
    }
    if (model) {
      return {
        ok: true,
        message: `联通成功 · ${providerLabel} · 聊天探测通过（模型列表 ${models.length || '未知'}）`,
        provider: adapter.kind,
      }
    }
    return {
      ok: true,
      message: `联通成功 · ${providerLabel} · 共 ${models.length} 个模型`,
      provider: adapter.kind,
    }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : '连接失败' }
  }
}

export { detectProvider, getProviderLabel, getDetectedProviderLabel } from './detect'
export type {
  AiProviderKind,
  ChatCompletionMessage,
  ChatCompletionParams,
  ChatContentPart,
  ChatRole,
  ProviderAdapter,
} from './types'
