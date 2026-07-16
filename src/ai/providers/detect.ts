import type { AiProviderKind } from './types'

const PROVIDER_LABELS: Record<AiProviderKind, string> = {
  openai: 'OpenAI 兼容',
  claude: 'Anthropic Claude',
  glm: '智谱 GLM',
}

/** 根据 baseURL / model 自动识别 Provider */
export function detectProvider(baseURL: string, model?: string): AiProviderKind {
  const u = baseURL.toLowerCase().trim()
  const m = (model ?? '').toLowerCase().trim()

  if (
    u.includes('anthropic.com') ||
    u.includes('api.anthropic') ||
    m.startsWith('claude')
  ) {
    return 'claude'
  }

  if (
    u.includes('bigmodel.cn') ||
    u.includes('open.bigmodel') ||
    u.includes('zhipuai') ||
    m.startsWith('glm')
  ) {
    return 'glm'
  }

  return 'openai'
}

export function getProviderLabel(kind: AiProviderKind): string {
  return PROVIDER_LABELS[kind]
}

export function getDetectedProviderLabel(baseURL: string, model?: string): string {
  return getProviderLabel(detectProvider(baseURL, model))
}
