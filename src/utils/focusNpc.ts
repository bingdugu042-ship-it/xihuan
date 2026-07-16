import type { CharacterCard, ChatMessage, Session, SessionDynamicNpc } from '@/types'

/** 当前焦点男主：定向回复 → 最近发言 → 首位在场 */
export function resolveFocusCharacterId(
  session: Session | null | undefined,
  replyTarget: string | null | undefined,
): string | null {
  if (!session) return null
  const { participantIds, messages } = session
  if (replyTarget && participantIds.includes(replyTarget)) return replyTarget
  const last = [...messages]
    .reverse()
    .find((m) => m.role === 'character' && m.characterId && participantIds.includes(m.characterId))
  if (last?.characterId) return last.characterId
  return participantIds[0] ?? null
}

/** 取会话内某男主的动态快照（当前 dynamicNpc 或名册缓存） */
export function getNpcSnapshot(
  session: Session | null | undefined,
  characterId: string | null | undefined,
): SessionDynamicNpc | undefined {
  if (!session || !characterId) return undefined
  if (session.dynamicNpc?.id === characterId) return session.dynamicNpc
  return session.npcRoster?.[characterId]
}

/** 从最近该角色发言里取欲望/内心/身体 */
export function getStatusFromLastMessage(
  messages: ChatMessage[],
  characterId: string,
): { desire?: string; innerThought?: string; bodyState?: string } {
  const last = [...messages]
    .reverse()
    .find((m) => m.role === 'character' && m.characterId === characterId)
  if (!last) return {}
  return {
    desire: last.npcDesire,
    innerThought: last.npcInnerThought,
    bodyState: last.npcBodyState,
  }
}

export type FocusNpcView = {
  id: string
  name: string
  card?: CharacterCard
  dyn?: SessionDynamicNpc
  desire?: string
  innerThought?: string
  bodyState?: string
}

/** 组装焦点男主展示数据（角色页 / 身体弹层共用） */
export function buildFocusNpcView(
  session: Session | null | undefined,
  focusId: string | null,
  characters: Record<string, CharacterCard>,
): FocusNpcView | null {
  if (!session || !focusId) return null
  const card = characters[focusId]
  const dyn = getNpcSnapshot(session, focusId)
  const fromMsg = getStatusFromLastMessage(session.messages, focusId)
  const name = dyn?.displayName ?? card?.name ?? focusId
  return {
    id: focusId,
    name,
    card,
    dyn,
    desire: dyn?.desire ?? fromMsg.desire,
    innerThought: dyn?.innerThought ?? fromMsg.innerThought,
    bodyState: dyn?.bodyState ?? fromMsg.bodyState,
  }
}

/** 写入 / 合并男主名册（切换 dynamicNpc 时归档旧位） */
export function archiveNpcToRoster(
  session: Session,
  npc: SessionDynamicNpc,
): Record<string, SessionDynamicNpc> {
  return {
    ...(session.npcRoster ?? {}),
    [npc.id]: npc,
  }
}
