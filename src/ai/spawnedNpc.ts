import type { CharacterCard, Region, SessionDynamicNpc } from '@/types'
import { genId } from '@/storage/db'
import {
  cardFromDynamicNpc,
  corruptionStageFromValue,
  ensureNpcBioFields,
} from '@/ai/npcGenerator'

export type SpawnedNpcDraft = {
  name: string
  title?: string
  appearance?: string
  personality?: string[]
  background?: string
  bodyState?: string
  desire?: string
  innerThought?: string
  gender?: string
  ageFeel?: string
  bodyType?: string
  style?: string
}

const MAX_SPAWN_PER_TURN = 10

export function wantsNpcSpawn(userText: string): boolean {
  const t = userText.trim()
  return (
    /(?:生成|召唤|创造|捏造|招来|叫来|整)\s*.{0,16}(?:美男|男主|npc|NPC|角色)/i.test(t) ||
    /(?:美男|男主|npc|NPC|角色)\s*.{0,12}(?:生成|召唤|创造)/i.test(t) ||
    /来\s*(?:\d+|几|十)\s*个/.test(t) ||
    /角色卡|立绘人设/.test(t)
  )
}

/** 从旅者话里抽「要几个」；没有数字则 null */
export function requestedSpawnCount(userText: string): number | null {
  const t = userText.trim()
  const m =
    t.match(/(?:生成|召唤|创造|捏造|招来|叫来|来)\s*(\d{1,2})\s*[个位名]?/) ||
    t.match(/(\d{1,2})\s*个\s*(?:美男|男主|npc|NPC|角色)/i) ||
    t.match(/十\s*个/)
  if (!m) return null
  if (m[0].includes('十')) return 10
  return Math.min(MAX_SPAWN_PER_TURN, Math.max(1, Number(m[1])))
}

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined
  const out = v.map((x) => String(x ?? '').trim()).filter(Boolean)
  return out.length ? out.slice(0, 6) : undefined
}

/** 从 AI JSON 的 spawnedNpcs 字段解析 */
export function parseSpawnedNpcsField(raw: unknown): SpawnedNpcDraft[] {
  if (!Array.isArray(raw)) return []
  const out: SpawnedNpcDraft[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const name = String(o.name ?? o.displayName ?? o.姓名 ?? '').trim()
    if (!name || name.length > 24) continue
    out.push({
      name,
      title: String(o.title ?? o.archetype ?? o.身份 ?? '').trim() || undefined,
      appearance: String(o.appearance ?? o.外貌 ?? '').trim() || undefined,
      personality: asStringArray(o.personality ?? o.性格),
      background: String(o.background ?? o.背景 ?? '').trim() || undefined,
      bodyState: String(o.bodyState ?? o.身体 ?? '').trim() || undefined,
      desire: String(o.desire ?? o.欲望 ?? '').trim() || undefined,
      innerThought: String(o.innerThought ?? o.内心 ?? '').trim() || undefined,
      gender: String(o.gender ?? o.性别 ?? '男').trim() || '男',
      ageFeel: String(o.ageFeel ?? o.年龄感 ?? '').trim() || undefined,
      bodyType: String(o.bodyType ?? o.体型 ?? '').trim() || undefined,
      style: String(o.style ?? o.气质 ?? '').trim() || undefined,
    })
    if (out.length >= MAX_SPAWN_PER_TURN) break
  }
  return out
}

/**
 * 正文兜底：从「1. 名字 —— 简介」类列表抽名字
 * 仅当 JSON 未给 spawnedNpcs 时使用
 */
export function extractSpawnedNpcsFromText(text: string): SpawnedNpcDraft[] {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  const out: SpawnedNpcDraft[] = []
  const seen = new Set<string>()

  for (const line of lines) {
    // 1. 墨衡 / ①墨衡 / - 墨衡：简介
    const m =
      line.match(/^(?:\d+[\.、．)]\s*|[-*·]\s*|（?\d+）\s*)([^\s：:\-—（(]{1,12})/) ||
      line.match(/^【([^】]{1,12})】/) ||
      line.match(/^「([^」]{1,12})」/)
    if (!m) continue
    const name = m[1].replace(/[，,。.!！？?].*$/, '').trim()
    if (!name || seen.has(name) || /^(他|你|我|男主|旅者|NPC)$/i.test(name)) continue
    seen.add(name)
    const rest = line.slice(m[0].length).replace(/^[\s：:\-—]+/, '').trim()
    out.push({
      name,
      title: rest ? clip(rest, 28) : undefined,
      appearance: rest ? clip(rest, 80) : undefined,
      gender: '男',
    })
    if (out.length >= MAX_SPAWN_PER_TURN) break
  }
  return out
}

export function resolveSpawnedNpcs(params: {
  rawField: unknown
  replyText: string
  userAskedSpawn: boolean
}): SpawnedNpcDraft[] {
  const fromJson = parseSpawnedNpcsField(params.rawField)
  if (fromJson.length) return fromJson
  if (!params.userAskedSpawn) return []
  return extractSpawnedNpcsFromText(params.replyText)
}

export function draftToDynamicNpc(
  draft: SpawnedNpcDraft,
  region: Region | undefined,
  facilityFallback: { id: string; name: string },
): { meta: SessionDynamicNpc; card: CharacterCard } {
  const id = genId('dyn')
  const facilityId = region?.id ?? facilityFallback.id
  const facilityName = region?.name ?? facilityFallback.name
  const archetype = draft.title || '在场男主'
  const gender = draft.gender || '男'
  const ageFeel = draft.ageFeel || '青年'
  const bodyType = draft.bodyType || '匀称'
  const style = draft.style || '俊朗'
  const personality = draft.personality?.length ? draft.personality : ['沉稳', '好看']
  const corruption = 8 + Math.floor(Math.random() * 12)

  let meta: SessionDynamicNpc = {
    id,
    displayName: draft.name,
    facilityId,
    facilityName,
    npcArchetype: archetype,
    corruption,
    corruptionStage: corruptionStageFromValue(corruption),
    attention: 20 + Math.floor(Math.random() * 25),
    possessiveness: Math.floor(Math.random() * 15),
    desire: draft.desire || `想在${facilityName}里把你的目光多留一会儿。`,
    innerThought: draft.innerThought || `对方点名要我出现……那就别让场面冷下来。`,
    bodyState: draft.bodyState || '呼吸平稳，神情自若，目光落在你身上。',
    gender,
    ageFeel,
    bodyType,
    style,
    appearance: draft.appearance || '',
    background: draft.background || '',
    personality,
    activePassive: '偏主动',
    kinks: ['角色扮演'],
  }
  meta = ensureNpcBioFields(meta)
  if (draft.appearance) meta.appearance = clip(draft.appearance, 220)
  if (draft.background) meta.background = clip(draft.background, 280)

  const card = cardFromDynamicNpc(meta)
  return { meta, card }
}

export function spawnHintForPrompt(userText: string): string {
  if (!wantsNpcSpawn(userText)) return ''
  const n = requestedSpawnCount(userText) ?? 3
  const count = Math.min(MAX_SPAWN_PER_TURN, n)
  return [
    '',
    '## 生成男主入场（本回合必填）',
    `旅者要求生成/召唤新男主。除 text 外，必须填写 spawnedNpcs 数组，恰好 ${count} 人（上限 ${MAX_SPAWN_PER_TURN}）。`,
    '每人短字段：name, title, appearance(1句), personality[], background(1句), desire, innerThought, bodyState。',
    '全部为成年男性。字段写短，保证前端能立刻挂到「在场」条与角色详情。',
    'text 里用在场男主口吻介绍他们入场即可，不要只列名单不给 spawnedNpcs。',
  ].join('\n')
}
