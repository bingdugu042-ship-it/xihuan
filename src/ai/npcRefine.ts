/**
 * 可选：用文本 API 润色本地随机生成的男主。
 * 失败时静默回退，不阻断入域。
 */
import type { AppSettings, CharacterCard, Region, SessionDynamicNpc } from '@/types'
import { chatCompletion } from './openaiClient'
import { stageLabel } from './npcGenerator'
import { parseAiJson } from './promptBuilder'

export interface SpawnedNpc {
  meta: SessionDynamicNpc
  card: CharacterCard
}

function hasTextApi(settings: AppSettings): boolean {
  const { baseURL, apiKey, model } = settings.api.text
  return Boolean(baseURL.trim() && apiKey.trim() && model.trim())
}

interface RefinePayload {
  displayName?: string
  gender?: string
  ageFeel?: string
  bodyType?: string
  style?: string
  personality?: string[]
  speakingStyle?: string
  desire?: string
  innerThought?: string
  greeting?: string
  background?: string
  appearance?: string
  bodyState?: string
}

function parseRefineJson(raw: string): RefinePayload | null {
  try {
    return parseAiJson(raw) as RefinePayload
  } catch {
    return null
  }
}

export async function refineNpcWithApi(params: {
  spawned: SpawnedNpc
  settings: AppSettings
  region: Region
  playMode?: string
  identityHint?: string
}): Promise<SpawnedNpc> {
  const { spawned, settings, region, playMode, identityHint } = params
  if (!settings.ui.npcApiRefine) return spawned
  if (!hasTextApi(settings)) return spawned

  const { meta, card } = spawned
  const { text: api } = settings.api

  const system = [
    '你是艾尔茜利恩的男主人设润色器。在保持给定维度的前提下，把角色写得像有血有肉的西幻存在。',
    '只输出一个 JSON 对象，不要 markdown。字段：',
    'displayName, gender, ageFeel, bodyType, style, personality(2-3个中文标签数组), speakingStyle,',
    'desire, innerThought, greeting, appearance(外貌2-4句), background(背景故事3-6句), bodyState',
    '要求：中文；禁止油腻霸总腔；开场白 2–4 句；外貌与背景必须具体可感；贴合当前冒险域与玩法；不要发明其他冒险域。',
  ].join('\n')

  const user = [
    `设施：${region.name}（${region.id}）`,
    `NPC 固定类型：${meta.npcArchetype}`,
    playMode ? `当前玩法：${playMode}` : '',
    identityHint ? `玩家身份提示：${identityHint}` : '',
    `草稿名：${meta.displayName}`,
    `性别/年龄感/体型/风格：${meta.gender} · ${meta.ageFeel} · ${meta.bodyType} · ${meta.style}`,
    `主动度：${meta.activePassive}`,
    `性格草稿：${meta.personality.join('、')}`,
    `性癖：${meta.kinks.join('、')}`,
    `堕落阶段：${stageLabel(meta.corruptionStage)}`,
    `外貌草稿：${meta.appearance}`,
    `背景草稿：${meta.background}`,
    `欲望草稿：${meta.desire}`,
    `内心草稿：${meta.innerThought}`,
    `开场草稿：${card.greeting}`,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const content = await chatCompletion({
      baseURL: api.baseURL,
      apiKey: api.apiKey,
      model: api.model,
      temperature: 0.85,
      maxTokens: 1200,
      jsonMode: true,
      proxyURL: settings.api.proxyURL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    })
    const parsed = parseRefineJson(content)
    if (!parsed) return spawned

    const displayName = clip(parsed.displayName, 12) || meta.displayName
    const gender = clip(parsed.gender, 8) || meta.gender
    const ageFeel = clip(parsed.ageFeel, 12) || meta.ageFeel
    const bodyType = clip(parsed.bodyType, 12) || meta.bodyType
    const style = clip(parsed.style, 12) || meta.style
    const personality =
      Array.isArray(parsed.personality) && parsed.personality.length
        ? parsed.personality.map((p) => clip(String(p), 8)).filter(Boolean).slice(0, 3)
        : meta.personality
    const speakingStyle = clip(parsed.speakingStyle, 80) || card.speakingStyle
    const desire = clip(parsed.desire, 220) || meta.desire
    const innerThought = clip(parsed.innerThought, 220) || meta.innerThought
    const greeting = clip(parsed.greeting, 360) || card.greeting
    const background = clip(parsed.background, 480) || meta.background || card.background
    const appearance = clip(parsed.appearance, 360) || meta.appearance
    const bodyState = clip(parsed.bodyState, 220) || meta.bodyState

    const nextMeta: SessionDynamicNpc = {
      ...meta,
      displayName,
      gender,
      ageFeel,
      bodyType,
      style,
      personality,
      desire,
      innerThought,
      bodyState,
      appearance,
      background,
    }
    const nextCard: CharacterCard = {
      ...card,
      name: displayName,
      personality,
      speakingStyle,
      background,
      appearance,
      greeting,
      behavior: `${stageLabel(nextMeta.corruptionStage)}阶段：专业与个人欲望并行。`,
    }
    return { meta: nextMeta, card: nextCard }
  } catch {
    return spawned
  }
}

function clip(s: string | undefined, n: number): string {
  const t = (s ?? '').trim()
  if (!t) return ''
  return t.length <= n ? t : `${t.slice(0, n)}…`
}
