import type { AppSettings } from '@/types'

/** 输出长度滑块 → 单次回复字数上/下限（拉满约 4000 字） */
export function getOutputCharLimit(outputLength: number): { min: number; max: number } {
  const v = Math.max(10, Math.min(100, outputLength))
  const t = (v - 10) / 90
  // 拉开档差：低=短回，高=长描写
  const max = Math.round(80 + t * 3920)
  const min =
    v <= 25 ? Math.round(max * 0.55) : v <= 50 ? Math.round(max * 0.4) : Math.round(max * 0.32)
  return { min: Math.max(40, min), max }
}

export function formatOutputCharHint(outputLength: number): string {
  const { min, max } = getOutputCharLimit(outputLength)
  return `约 ${min}–${max} 字/次（硬性写入提示词并裁剪）`
}

/** 中文约 1.8 token/字 + JSON 结构开销 */
export function getMaxTokensForOutput(outputLength: number): number {
  const { max } = getOutputCharLimit(outputLength)
  return Math.min(8192, Math.round(max * 2.35 + 220))
}

/** 上下文滑块 → 送入 API 的历史消息条数 */
export function getContextMessageCount(contextLength: number): number {
  const v = Math.max(10, Math.min(100, contextLength))
  return Math.max(6, Math.round(6 + ((v - 10) / 90) * 140))
}

export function formatContextHint(contextLength: number): string {
  const msgs = getContextMessageCount(contextLength)
  const mems = getMemoryRetrieveCount(contextLength)
  return `发送约 ${msgs} 条历史 + 检索 ${mems} 条记忆`
}

/** 上下文滑块 → 检索长期记忆条数 */
export function getMemoryRetrieveCount(contextLength: number): number {
  const v = Math.max(10, Math.min(100, contextLength))
  return Math.max(4, Math.round(4 + ((v - 10) / 90) * 48))
}

/** 活跃度 → temperature（档差更明显，用户能感到「奔放程度」） */
export function getCreativityTemperature(creativity: number): number {
  const v = Math.max(10, Math.min(100, creativity))
  return Math.max(0.2, Math.min(1.55, 0.2 + (v / 100) * 1.35))
}

export function formatCreativityHint(creativity: number): string {
  const t = getCreativityTemperature(creativity)
  const tone = creativity <= 30 ? '克制日常' : creativity <= 65 ? '平衡发挥' : '奔放戏剧'
  return `${tone} · temperature ${t.toFixed(2)}`
}

/** 聚焦度滑块 → top_p（越低越稳、越高越发散） */
export function getTopP(focus: number): number {
  const v = Math.max(10, Math.min(100, focus ?? 80))
  return Math.round((0.45 + (v / 100) * 0.55) * 100) / 100
}

export function formatTopPHint(focus: number): string {
  const p = getTopP(focus)
  const label = focus <= 35 ? '更稳、更贴人设' : focus <= 70 ? '自然取样' : '更跳脱、意外词更多'
  return `${label} · top_p ${p.toFixed(2)}`
}

/** 新鲜度滑块 → presence / frequency penalty（减复读） */
export function getFreshnessPenalties(freshness: number): {
  presencePenalty: number
  frequencyPenalty: number
} {
  const v = Math.max(0, Math.min(100, freshness ?? 35))
  const t = v / 100
  return {
    presencePenalty: Math.round(t * 0.85 * 100) / 100,
    frequencyPenalty: Math.round(t * 0.7 * 100) / 100,
  }
}

export function formatFreshnessHint(freshness: number): string {
  const { presencePenalty, frequencyPenalty } = getFreshnessPenalties(freshness)
  const label = freshness <= 25 ? '允许习惯用语' : freshness <= 60 ? '轻度去重' : '强力避免复读'
  return `${label} · presence ${presencePenalty} / frequency ${frequencyPenalty}`
}

export interface SpeedParams {
  preferFast: boolean
  includeChoices: boolean
  maxChoices: number
  hint: string
}

export function getSpeedParams(speed: number): SpeedParams {
  const v = Math.max(10, Math.min(100, speed))
  if (v >= 75) {
    return {
      preferFast: true,
      includeChoices: false,
      maxChoices: 0,
      hint: '偏快：少选项、短上下文、少网络重试；空回复仍会再试一次',
    }
  }
  if (v >= 45) {
    return {
      preferFast: false,
      includeChoices: true,
      maxChoices: 2,
      hint: '均衡：最多 2 个选项；失败会用纯文本模式再试',
    }
  }
  return {
    preferFast: false,
    includeChoices: true,
    maxChoices: 2,
    hint: '稳妥：失败必重试；优先完整 JSON 与描写质量',
  }
}

export function formatSpeedHint(speed: number): string {
  return getSpeedParams(speed).hint
}

/** 群聊抢话间隔说明 */
export function formatGroupInterruptHint(interval: number): string {
  if (interval <= 0) return '已关闭，仅正常轮流回复'
  return `每 ${interval} 轮后，其他角色可能打断刚发言者，争宠吃醋`
}

export function getAiParams(settings: AppSettings): {
  temperature: number
  topP: number
  presencePenalty: number
  frequencyPenalty: number
  memoryLimit: number
  maxTokens: number
  preferFast: boolean
  includeChoices: boolean
  maxChoices: number
  outputCharMax: number
  outputCharMin: number
  historyLimit: number
} {
  const ctx = settings.ui.aiContextLength ?? 50
  const cre = settings.ui.aiCreativity ?? 50
  const out = settings.ui.aiOutputLength ?? 50
  const spd = settings.ui.aiResponseSpeed ?? 50
  const focus = settings.ui.aiTopP ?? 80
  const fresh = settings.ui.aiFreshness ?? 40
  const { min: outputCharMin, max: outputCharMax } = getOutputCharLimit(out)
  const speed = getSpeedParams(spd)
  const penalties = getFreshnessPenalties(fresh)
  const memoryLimit = getMemoryRetrieveCount(ctx)
  const historyLimit = getContextMessageCount(ctx)
  return {
    temperature: getCreativityTemperature(cre),
    topP: getTopP(focus),
    presencePenalty: penalties.presencePenalty,
    frequencyPenalty: penalties.frequencyPenalty,
    memoryLimit: speed.preferFast ? Math.min(memoryLimit, 10) : memoryLimit,
    maxTokens: getMaxTokensForOutput(out),
    preferFast: speed.preferFast,
    includeChoices: speed.includeChoices,
    maxChoices: speed.maxChoices,
    outputCharMax,
    outputCharMin,
    historyLimit: speed.preferFast ? Math.min(historyLimit, 28) : historyLimit,
  }
}

/** 设置页「本轮会生效」摘要 */
export function formatAiParamsLiveSummary(settings: AppSettings): string {
  const p = getAiParams(settings)
  return [
    `温度 ${p.temperature.toFixed(2)} · top_p ${p.topP.toFixed(2)}`,
    `max_tokens ${p.maxTokens} · 正文字数 ${p.outputCharMin}–${p.outputCharMax}`,
    `历史 ${p.historyLimit} 条 · 记忆 ${p.memoryLimit} 条`,
    `去重 presence ${p.presencePenalty} / frequency ${p.frequencyPenalty}`,
    `选项 ${p.includeChoices ? `0–${p.maxChoices}` : '关闭'} · ${p.preferFast ? '快路径' : '质量重试'}`,
  ].join('\n')
}

export function buildAiBehaviorHints(settings: AppSettings): string {
  const ctx = settings.ui.aiContextLength ?? 50
  const cre = settings.ui.aiCreativity ?? 50
  const out = settings.ui.aiOutputLength ?? 50
  const spd = settings.ui.aiResponseSpeed ?? 50
  const fresh = settings.ui.aiFreshness ?? 40
  const { min, max } = getOutputCharLimit(out)
  const history = getContextMessageCount(ctx)
  const mems = getMemoryRetrieveCount(ctx)
  const speed = getSpeedParams(spd)

  const ctxHint = `【Context】Ground every reply in the provided ~${history} recent messages and ~${mems} long-term memories. Do not invent off-screen plot facts.`

  const creHint =
    cre <= 30
      ? '【Tone · restrained】Stay close to character voice; prefer concrete action over purple prose.'
      : cre <= 65
        ? '【Tone · balanced】Keep persona consistency while adding sensory and emotional detail.'
        : '【Tone · dramatic】Lean into vivid imagery, tension, and surprising micro-details without breaking character.'

  const outHint = `【Length · hard】JSON field "text" must be ${min}–${max} Chinese characters (punctuation included). Pad with sensory/action beats if short; end on a complete sentence if long.`

  const speedHint = speed.includeChoices
    ? `【Choices】Provide 0–${speed.maxChoices} actionable player choices in "choices". ${speed.hint}`
    : `【Choices】Set "choices" to []. ${speed.hint}`

  const freshHint =
    fresh >= 55
      ? '【Freshness · high】Never reuse the previous reply’s adjectives, sentence rhythm, or onomatopoeia; rephrase every beat.'
      : fresh >= 30
        ? '【Freshness · mid】Avoid repeating the last two replies’ signature phrases.'
        : '【Freshness · low】Character catchphrases are allowed; still forbid copying whole sentences.'

  return [ctxHint, creHint, outHint, speedHint, freshHint].join('\n')
}

/**
 * 剥掉历史信道里的 `[名]` / `[名/身份]：` 发言人前缀。
 * 模型易把该前缀写进 text，再经「历史再加前缀」叠成死循环刷屏。
 */
const SPEAKER_LABEL_CHUNK = '(?:\\[|【)[^\\]】\\n]{1,48}(?:\\]|】)\\s*[：:]\\s*'
const LEADING_SPEAKER_LABELS = new RegExp(`^(?:${SPEAKER_LABEL_CHUNK})+`, 'u')
const ONLY_SPEAKER_LABELS = new RegExp(`^(?:${SPEAKER_LABEL_CHUNK})+$`, 'u')

export function stripSpeakerLabelPrefixes(text: string): string {
  let t = String(text ?? '').trim()
  if (!t) return t

  // 连续剥掉开头的多层 `[xxx]：`
  for (let i = 0; i < 64 && LEADING_SPEAKER_LABELS.test(t); i++) {
    t = t.replace(LEADING_SPEAKER_LABELS, '').trim()
  }

  // 全文几乎全是同一标签空转（截图那种刷屏）
  if (ONLY_SPEAKER_LABELS.test(t)) return ''

  const labels = t.match(new RegExp(SPEAKER_LABEL_CHUNK, 'gu'))
  if (labels && labels.length >= 5) {
    const first = labels[0]
    if (labels.every((x) => x === first)) {
      t = t.split(first).join('').trim()
    }
  }

  return t
}

/** 将回复裁剪到字数上限（尽量在句号处截断） */
export function clampReplyText(text: string, maxChars: number): string {
  const cleaned = stripSpeakerLabelPrefixes(text)
  if (cleaned.length <= maxChars) return cleaned
  const slice = cleaned.slice(0, maxChars)
  const lastStop = Math.max(
    slice.lastIndexOf('。'),
    slice.lastIndexOf('！'),
    slice.lastIndexOf('？'),
    slice.lastIndexOf('…'),
    slice.lastIndexOf('\n'),
  )
  if (lastStop > maxChars * 0.5) return slice.slice(0, lastStop + 1)
  return `${slice}…`
}

/** 不足最小字数时的提示（解析后由引擎尽量保留原文；提示词已强制） */
export function enforceMinReplyHint(minChars: number): string {
  return `若正文不足 ${minChars} 字，请在角色语言与动作描写中自然加长，禁止灌水标点。`
}
