import type { CoreMemory, CharacterCard } from '@/types'
import { SHARED_MEMORY_CHARACTER_ID } from '@/types'
import { listAllMemories } from '@/storage/db'

const TYPE_WEIGHT: Record<CoreMemory['type'], number> = {
  preference: 14,
  npc_bond: 12,
  facility: 11,
  secret: 9,
  milestone: 8,
  conflict: 7,
  daily: 3,
}

export interface MemoryQueryContext {
  participantIds: string[]
  characters: Record<string, CharacterCard>
  facilityId?: string
  facilityName?: string
  playMode?: string
  /** 最近玩家发言，用于关键词加分 */
  queryText?: string
  limit: number
}

/** 从统一记忆池过滤与当前参与者相关的记忆 */
export function filterMemoriesForParticipants(
  memories: CoreMemory[],
  participants: CharacterCard[],
): CoreMemory[] {
  const ids = new Set(participants.map((c) => c.id))
  const names = participants.map((c) => c.name)

  return memories.filter((m) => {
    if (m.characterId !== SHARED_MEMORY_CHARACTER_ID) {
      return ids.has(m.characterId)
    }
    const t = m.text
    for (const id of ids) {
      if (t.includes(`[${id}]`) || t.includes(`【${participants.find((c) => c.id === id)?.name}】`)) {
        return true
      }
    }
    for (const name of names) {
      if (t.includes(`【${name}】`) || t.includes(name)) return true
    }
    // 偏好 / 域界级 / 无角色前缀 → 全局可用
    if (m.type === 'preference' || m.type === 'facility') return true
    if (!t.startsWith('[') && !t.startsWith('【')) return true
    return false
  })
}

function scoreMemory(m: CoreMemory, ctx: MemoryQueryContext, participants: CharacterCard[]): number {
  let score = TYPE_WEIGHT[m.type] ?? 3

  // 设施命中
  if (ctx.facilityId && m.facilityId === ctx.facilityId) score += 18
  if (ctx.facilityName) {
    if (m.text.includes(ctx.facilityName)) score += 6
    if (m.tags?.some((t) => t.includes(ctx.facilityName!) || ctx.facilityName!.includes(t))) score += 5
  }
  if (ctx.playMode) {
    if (m.text.includes(ctx.playMode)) score += 5
    if (m.tags?.some((t) => t.includes(ctx.playMode!))) score += 4
  }

  // 角色羁绊
  for (const p of participants) {
    if (m.text.includes(`[${p.id}]`) || m.text.includes(p.name) || m.text.includes(`【${p.name}】`)) {
      score += m.type === 'npc_bond' ? 14 : 8
    }
    if (m.tags?.includes(p.id) || m.tags?.includes(p.name)) score += 6
  }

  // 查询关键词粗匹配
  const q = ctx.queryText?.trim()
  if (q && q.length >= 2) {
    const tokens = q
      .replace(/[，。！？、\s]+/g, ' ')
      .split(' ')
      .filter((t) => t.length >= 2)
      .slice(0, 8)
    for (const tok of tokens) {
      if (m.text.includes(tok)) score += 3
      if (m.tags?.some((t) => t.includes(tok))) score += 2
    }
  }

  // 偏好类常驻加权（忌忘记玩家贴纸）
  if (m.type === 'preference') score += 6

  // 时效：越新越高，衰减很慢
  const ageDays = (Date.now() - m.timestamp) / (1000 * 60 * 60 * 24)
  score += Math.max(0, 8 - ageDays * 0.15)

  return score
}

/** 分层检索：类型 / 冒险域 / 角色 / 关键词加权后取 Top-N */
export async function loadRelevantMemories(
  participantIds: string[],
  characters: Record<string, CharacterCard>,
  limit: number,
  extras?: Omit<MemoryQueryContext, 'participantIds' | 'characters' | 'limit'>,
): Promise<CoreMemory[]> {
  const participants = participantIds.map((id) => characters[id]).filter(Boolean) as CharacterCard[]
  const all = await listAllMemories()
  const filtered = filterMemoriesForParticipants(all, participants)
  const ctx: MemoryQueryContext = {
    participantIds,
    characters,
    limit,
    ...extras,
  }

  return filtered
    .map((m) => ({ m, score: scoreMemory(m, ctx, participants) }))
    .sort((a, b) => b.score - a.score || b.m.timestamp - a.m.timestamp)
    .slice(0, Math.max(1, limit))
    .map((x) => x.m)
}

export function formatMemoriesForPrompt(memories: CoreMemory[]): string {
  if (memories.length === 0) return '（暂无长期记忆）'
  return memories
    .map((m, i) => {
      const date = new Date(m.timestamp).toLocaleDateString('zh-CN')
      const tag = m.tags?.length ? ` #${m.tags.slice(0, 4).join(',')}` : ''
      const fac = m.facilityId ? ` @${m.facilityId}` : ''
      return `${i + 1}. [${m.type}]${fac}${tag} ${date} — ${m.text}`
    })
    .join('\n')
}

/** 根据会话上下文给记忆事件打标 */
export function enrichMemoryMeta(params: {
  type: CoreMemory['type']
  text: string
  characterId: string
  facilityId?: string
  facilityName?: string
  playMode?: string
  characterName?: string
}): Pick<CoreMemory, 'tags' | 'facilityId' | 'type'> {
  const tags = new Set<string>()
  tags.add(params.type)
  if (params.facilityId) tags.add(params.facilityId)
  if (params.facilityName) tags.add(params.facilityName)
  if (params.playMode) tags.add(params.playMode)
  if (params.characterId) tags.add(params.characterId)
  if (params.characterName) tags.add(params.characterName)

  let type = params.type
  // 启发式：若未标明但文本像偏好/设施，上提类型
  if (type === 'daily') {
    if (/喜欢|避雷|禁忌|不要|偏好/.test(params.text)) type = 'preference'
    else if (params.facilityName && params.text.includes(params.facilityName)) type = 'facility'
    else if (/羁绊|烙印|专属|只对你/.test(params.text)) type = 'npc_bond'
  }

  return {
    type,
    facilityId: params.facilityId,
    tags: [...tags],
  }
}
