/**
 * OpenAI 兼容 API 门面 — 实际请求经 providers 适配层路由
 * （OpenAI / DeepSeek / 硅基流动 / 智谱 GLM / Anthropic Claude）
 */

import { normalizeBaseURL } from '@/utils/apiFetch'

export {
  chatCompletion,
  fetchModelList,
  testApiConnection,
  detectProvider,
  getProviderLabel,
  getDetectedProviderLabel,
} from './providers'

export type {
  ChatCompletionMessage,
  ChatContentPart,
  ChatRole,
  AiProviderKind,
} from './providers'

/** 过滤 TTS 相关模型 */
export function filterTtsModels(models: string[]): string[] {
  return models.filter((m) => /tts|speech/i.test(m))
}

/** 过滤 STT / Whisper 相关模型 */
export function filterSttModels(models: string[]): string[] {
  return models.filter((m) => /whisper|speech|asr|audio/i.test(m))
}

/** 过滤视觉 / 多模态模型 */
export function filterVisionModels(models: string[]): string[] {
  return models.filter((m) => /vision|vl|4v|4\.6v|5v|gpt-4o|glm-4v|glm-4\.6v|glm-5v|claude-3/i.test(m))
}

export { normalizeBaseURL }
