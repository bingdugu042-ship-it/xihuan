import type { Session, ChatMessage, CharacterCard, Region } from '@/types'
import { SHARED_MEMORY_CHARACTER_ID } from '@/types'
import { genId } from '@/storage/db'
import { getFacilityWorldbook } from '@/data/facilityWorldbook'
import { FACILITY_MAP } from '@/data/facilities'
import { getFacilityOpening, personalizeNpcOpening } from '@/data/facilityOpenings'
import { resolveIdentityRoles } from '@/data/identityRoles'
import { intensityLabel, exploreStyleLabel } from '@/data/playAtmosphere'

export function buildIntroMessages(
  session: Session,
  region: Region | undefined,
  characters: Record<string, CharacterCard>,
): ChatMessage[] {
  const now = Date.now()
  const msgs: ChatMessage[] = []
  if (!region) return msgs

  const book = getFacilityWorldbook(region.id)
  const facility = FACILITY_MAP[region.id]
  const identityId = session.playerIdentityId ?? facility?.identities[0]?.id
  const opening = getFacilityOpening(region.id, identityId, session.playMode)

  const catLabel =
    region.worldId === 'aetherion' || region.worldId === 'aetherion'
      ? '冒险域'
      : region.category === 'online'
        ? '线上'
        : region.category === 'modern'
          ? '现代社会'
          : '边域'

  msgs.push({
    id: genId('msg'),
    role: 'system',
    bubbleStyle: 'system',
    text: [
      `📍 ${book?.name ?? region.name} · ${catLabel}`,
      session.playMode ? `篇章：${session.playMode}` : '',
      (() => {
        if (!identityId || !facility) return ''
        const roles = resolveIdentityRoles(region.id, identityId)
        if (roles) return `你：${roles.player.name} · 对面：${roles.npc.name}`
        return `身份：${facility.identities.find((i) => i.id === identityId)?.name ?? identityId}`
      })(),
      session.eroticIntensity ? `尺度：${intensityLabel(session.eroticIntensity)}` : '',
      session.exploreStyle ? `模式：${exploreStyleLabel(session.exploreStyle)}` : '',
    ]
      .filter(Boolean)
      .join(' · '),
    timestamp: now,
  })

  msgs.push({
    id: genId('msg'),
    role: 'system',
    bubbleStyle: 'narrator',
    text: opening.narrator,
    timestamp: now + 2,
  })

  if (session.type === 'private' && session.participantIds[0]) {
    const c = characters[session.participantIds[0]]
    if (c) {
      const npcText = personalizeNpcOpening(opening.npcLine, c.name, c.greeting)
      msgs.push({
        id: genId('msg'),
        role: 'character',
        characterId: c.id,
        text: npcText,
        expression: c.defaultExpression,
        bubbleStyle: 'default',
        timestamp: now + 3,
      })
    }
  } else if (session.type === 'group') {
    msgs.push({
      id: genId('msg'),
      role: 'system',
      bubbleStyle: 'thought',
      text: '—— 众人已到场，空气里弥漫着各自的气息。',
      timestamp: now + 3,
    })
  } else if (
    (region.worldId === 'aetherion' || region.worldId === 'aetherion') &&
    !session.participantIds.length
  ) {
    msgs.push({
      id: genId('msg'),
      role: 'system',
      bubbleStyle: 'narrator',
      text: '男主尚未现身——预言的风仍在页间流动。你可以先感受场景，或主动开口呼唤。',
      timestamp: now + 3,
    })
  }

  return msgs
}

export { SHARED_MEMORY_CHARACTER_ID }
