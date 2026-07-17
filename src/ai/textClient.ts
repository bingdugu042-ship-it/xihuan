import type { AppSettings, CharacterCard, ChatMessage, GiftLog, Session, UserProfile, HPhase } from '@/types'
import { genId } from '@/storage/db'
import { chatCompletion } from './openaiClient'
import { loadRelevantMemories } from './memoryUtils'
import {
  buildChatMessages,
  buildSystemPrompt,
  getAiParams,
  messageToSummaryLines,
  parseAiJsonOrPlain,
  validateExpression,
  clampReplyText,
} from './promptBuilder'
import type { MockAIResult } from './mockResponder'
import type { Region, WorldBook, CoreMemory } from '@/types'
import { resolveSpawnedNpcs, wantsNpcSpawn } from './spawnedNpc'

export interface GenerateReplyContext {
  session: Session
  lastUserMessage: ChatMessage
  settings: AppSettings
  characters: Record<string, CharacterCard>
  regions: Record<string, Region>
  worlds: Record<string, WorldBook>
  userProfile?: UserProfile
  gifts: GiftLog[]
  forceCharacterId?: string
  replyMode?: 'reply' | 'interrupt'
  /** 被抢话、被打断的角色 id */
  interruptedCharacterId?: string
  signal?: AbortSignal
}

function clampRel(n: unknown, min = -5, max = 5): number {
  const v = typeof n === 'number' ? n : Number(n) || 0
  return Math.max(min, Math.min(max, Math.round(v)))
}

function parseResult(
  raw: Record<string, unknown>,
  participantIds: string[],
  characters: Record<string, CharacterCard>,
  outputCharMax: number,
  maxChoices: number,
  forceCharacterId?: string,
  userText?: string,
): MockAIResult {
  let characterId = forceCharacterId ?? String(raw.characterId ?? participantIds[0] ?? '')
  if (!participantIds.includes(characterId)) {
    characterId = forceCharacterId ?? participantIds[0]
  }
  const character = characters[characterId]
  const rawText = String(raw.text ?? '……').trim() || '……'
  // clampReplyText 内已剥 [名/身份]：叠层，防止设施页刷屏死循环
  const text = clampReplyText(rawText, outputCharMax) || '……'
  const expression = validateExpression(character, String(raw.expression ?? ''))
  // 角色卡丢失时仍能出回合，避免整条链路崩溃
  if (!character && characterId) {
    console.warn('[AI] missing character card for', characterId)
  }

  const choicesRaw = Array.isArray(raw.choices) ? raw.choices : []
  const choices = choicesRaw
    .slice(0, maxChoices)
    .map((c) => {
      const item = c as { text?: string }
      const t = String(item?.text ?? c ?? '').trim()
      return t ? { id: genId('c'), text: t } : null
    })
    .filter(Boolean) as MockAIResult['choices']

  const relRaw = (raw.relationshipChange ?? {}) as Record<string, unknown>
  const favor = clampRel(relRaw.favor)
  const trust = clampRel(relRaw.trust)
  const dependence = clampRel(relRaw.dependence)
  const relationshipChange =
    favor || trust || dependence ? { favor, trust, dependence } : undefined

  let memoryEvent: MockAIResult['memoryEvent']
  const mem = raw.memoryEvent
  if (mem && typeof mem === 'object' && mem !== null && 'text' in mem) {
    const m = mem as { type?: string; text?: string }
    const t = String(m.text ?? '').trim()
    if (t) {
      const validTypes = ['milestone', 'daily', 'conflict', 'secret', 'preference', 'facility', 'npc_bond'] as const
      const rawType = m.type as (typeof validTypes)[number]
      const type = validTypes.includes(rawType) ? rawType : 'daily'
      memoryEvent = { type, text: t }
    }
  }

  const npcDesire = String(raw.npcDesire ?? '').trim() || undefined
  const npcInnerThought = String(raw.npcInnerThought ?? '').trim() || undefined
  const npcBodyState = String(raw.npcBodyState ?? '').trim() || undefined
  const hPhaseRaw = String(raw.hPhase ?? '').trim()
  const validPhases: HPhase[] = ['idle', 'foreplay', 'main', 'climax', 'afterglow']
  const hPhase = validPhases.includes(hPhaseRaw as HPhase) ? (hPhaseRaw as HPhase) : undefined
  const npcCorruptionDelta = raw.npcCorruptionDelta != null
    ? Math.max(0, Math.min(5, Math.round(Number(raw.npcCorruptionDelta) || 0)))
    : undefined

  const guideAdvanceRaw = raw.guideAdvance
  const guideAdvance =
    guideAdvanceRaw === true ||
    guideAdvanceRaw === 1 ||
    String(guideAdvanceRaw).toLowerCase() === 'true'

  const mainAdvanceRaw = raw.mainAdvance
  const mainAdvance =
    mainAdvanceRaw === true ||
    mainAdvanceRaw === 1 ||
    String(mainAdvanceRaw).toLowerCase() === 'true'
  const endingHint = String(raw.endingHint ?? '').trim() || undefined

  let bodyStatDeltas: MockAIResult['bodyStatDeltas']
  if (raw.bodyStatDeltas && typeof raw.bodyStatDeltas === 'object' && !Array.isArray(raw.bodyStatDeltas)) {
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(raw.bodyStatDeltas as Record<string, unknown>)) {
      const n = Math.round(Number(v) || 0)
      if (n) out[k] = n
    }
    if (Object.keys(out).length) bodyStatDeltas = out
  }

  let bodyStateLabels: MockAIResult['bodyStateLabels']
  if (raw.bodyStateLabels && typeof raw.bodyStateLabels === 'object' && !Array.isArray(raw.bodyStateLabels)) {
    const bl = raw.bodyStateLabels as Record<string, unknown>
    const labels: NonNullable<MockAIResult['bodyStateLabels']> = {}
    for (const k of ['lower', 'stamina', 'mind'] as const) {
      const t = String(bl[k] ?? '').trim()
      if (t) labels[k] = t
    }
    if (Object.keys(labels).length) bodyStateLabels = labels
  }

  const spawnedNpcs = resolveSpawnedNpcs({
    rawField: raw.spawnedNpcs ?? raw.spawnedNPCS ?? raw.newNpcs,
    replyText: text,
    userAskedSpawn: wantsNpcSpawn(userText ?? ''),
  })

  return {
    characterId,
    text,
    expression,
    choices,
    relationshipChange,
    memoryEvent,
    npcDesire,
    npcInnerThought,
    npcBodyState,
    hPhase,
    npcCorruptionDelta,
    bodyStatDeltas,
    bodyStateLabels,
    guideAdvance: guideAdvance || undefined,
    mainAdvance: mainAdvance || undefined,
    endingHint,
    spawnedNpcs,
  }
}

export function hasTextApiConfigured(settings: AppSettings): boolean {
  const { baseURL, apiKey, model } = settings.api.text
  return Boolean(baseURL.trim() && apiKey.trim() && model.trim())
}

/** 是否已在设置页测连成功 */
export function isTextApiLinked(settings: AppSettings): boolean {
  return Boolean(settings.ui.apiTextLastStatus?.ok)
}

/** 调用 OpenAI 兼容接口生成角色回复 */
export async function generateCharacterReply(ctx: GenerateReplyContext): Promise<MockAIResult> {
  const { session, lastUserMessage, settings, characters, regions, worlds, userProfile, gifts, forceCharacterId, replyMode = 'reply', interruptedCharacterId, signal } = ctx
  const isInterrupt = replyMode === 'interrupt'
  const { text: api } = settings.api
  const {
    temperature,
    topP,
    presencePenalty,
    frequencyPenalty,
    memoryLimit,
    maxTokens,
    preferFast,
    outputCharMax,
    maxChoices,
  } = getAiParams(settings)
  const userAskedSpawn = wantsNpcSpawn(lastUserMessage.text)
  // 生成多名男主时需要更大 JSON 预算；快档则压缩上下文/重试
  let effectiveMaxTokens = maxTokens
  let effectiveMemoryLimit = memoryLimit
  if (userAskedSpawn) {
    effectiveMaxTokens = Math.max(maxTokens, preferFast ? 3200 : 4200)
  } else if (preferFast) {
    effectiveMaxTokens = Math.min(maxTokens, 2400)
    effectiveMemoryLimit = Math.min(memoryLimit, 8)
  }
  const effectiveOutputMax = isInterrupt ? Math.min(outputCharMax, 180) : outputCharMax
  let effectiveMaxChoices = isInterrupt ? 0 : Math.min(2, maxChoices)
  const hHard =
    !isInterrupt &&
    (settings.ui.hPhaseMode ?? 'soft') === 'hard' &&
    !!session.hPhase &&
    session.hPhase !== 'idle'
  if (hHard) effectiveMaxChoices = 2
  if (!isInterrupt && session.exploreStyle === 'guided') {
    effectiveMaxChoices = Math.max(effectiveMaxChoices, 2)
  }

  const participantCards = session.participantIds
    .map((id) => characters[id])
    .filter(Boolean) as CharacterCard[]

  const region = regions[session.regionId]
  const world = region?.worldId ? worlds[region.worldId] : undefined
  const memories = await loadRelevantMemories(session.participantIds, characters, effectiveMemoryLimit, {
    facilityId: region?.id ?? session.regionId,
    facilityName: region?.name,
    playMode: session.playMode,
    queryText: lastUserMessage.text,
  })

  const systemPrompt = buildSystemPrompt({
    session,
    region,
    world,
    characters: participantCards,
    userProfile,
    memories,
    gifts,
    characterEmojiEnabled: settings.ui.characterEmojiEnabled,
    settings,
    forceCharacterId,
    replyMode,
    interruptedCharacterId,
  })

  const messages = buildChatMessages({
    systemPrompt,
    session,
    characters,
    aiContextLength: preferFast && !userAskedSpawn
      ? Math.min(settings.ui.aiContextLength ?? 50, 40)
      : settings.ui.aiContextLength,
    userProfile,
  })

  // JSON 优先；快档仅在首次失败/空回复时再试纯文本，避免双倍等待
  const proxyURL = settings.api.proxyURL
  const baseParams = {
    baseURL: api.baseURL,
    apiKey: api.apiKey,
    model: api.model,
    messages,
    temperature,
    topP,
    presencePenalty,
    frequencyPenalty,
    maxTokens: effectiveMaxTokens,
    proxyURL,
    signal,
    retries: preferFast ? 1 : 2,
  } as const

  let content: string
  try {
    content = await chatCompletion({ ...baseParams, jsonMode: true })
  } catch (firstErr) {
    try {
      content = await chatCompletion({ ...baseParams, jsonMode: false })
    } catch (secondErr) {
      const msg = secondErr instanceof Error ? secondErr.message : '请求失败'
      if (/未返回内容|空回复|empty/i.test(msg)) {
        throw new Error('模型空回复，请检查 Key / 模型 / CORS 代理后重试')
      }
      if (preferFast) throw secondErr
      throw secondErr instanceof Error ? secondErr : firstErr
    }
  }

  if (!content?.trim()) {
    content = await chatCompletion({ ...baseParams, jsonMode: false })
  }
  if (!content?.trim()) {
    throw new Error('模型空回复，请检查 Key / 模型 / CORS 代理后重试')
  }

  const defaultCharId = forceCharacterId ?? session.participantIds[0] ?? ''
  const parsed = parseAiJsonOrPlain(content, defaultCharId)
  return parseResult(
    parsed,
    session.participantIds,
    characters,
    effectiveOutputMax,
    effectiveMaxChoices,
    forceCharacterId,
    lastUserMessage.text,
  )
}

/** 用 AI 压缩对话为长期记忆摘要 */
export async function compressSessionMemory(params: {
  settings: AppSettings
  character: CharacterCard
  messages: ChatMessage[]
  existingMemories: CoreMemory[]
}): Promise<string> {
  const { settings, character, messages, existingMemories } = params
  const { text: api } = settings.api
  const transcript = clip(messageToSummaryLines(messages.slice(-30), character.name), 3000)

  const existing = existingMemories
    .slice(0, 8)
    .map((m) => `- ${m.text}`)
    .join('\n')

  const content = await chatCompletion({
    baseURL: api.baseURL,
    apiKey: api.apiKey,
    model: api.model,
    temperature: 0.3,
    maxTokens: 800,
    proxyURL: settings.api.proxyURL,
    messages: [
      {
        role: 'system',
        content: `你是记忆管理员。将对话压缩为简洁的中文长期记忆条目（100-200字），保留关键事实、情感转折、玩家偏好。角色：${character.name}。只输出记忆正文，不要标题。`,
      },
      {
        role: 'user',
        content: `已有记忆：\n${existing || '无'}\n\n新对话：\n${transcript}\n\n请输出更新后的记忆摘要：`,
      },
    ],
  })

  return content.trim()
}

function clip(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n)}…`
}
