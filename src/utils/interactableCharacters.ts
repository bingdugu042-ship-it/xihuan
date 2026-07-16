import { useMemo } from 'react'
import { useDataStore } from '@/store/dataStore'
import { usePassportStore } from '@/store/passportStore'
import type { CharacterCard } from '@/types'

/** 当前可互动的男主 id（运行时 + 名册，不含已删除的静态卡） */
export function useInteractableCharacterIds(): string[] {
  const roster = usePassportStore((s) => s.roster)
  const characters = useDataStore((s) => s.characters)
  const runtimeCharacters = useDataStore((s) => s.runtimeCharacters)
  return useMemo(() => {
    const all = { ...characters, ...runtimeCharacters }
    const ids = new Set<string>([...Object.keys(all), ...roster.map((r) => r.id)])
    return [...ids]
  }, [characters, runtimeCharacters, roster])
}

export function rosterCardToCharacter(saved: {
  id: string
  displayName: string
  facilityName: string
  npcArchetype: string
  snapshot: Record<string, string>
}): CharacterCard {
  return {
    id: saved.id,
    name: saved.displayName,
    title: `${saved.facilityName}·${saved.npcArchetype}`,
    personality: saved.snapshot.personality?.split('、').filter(Boolean) ?? [],
    speakingStyle: saved.snapshot.style ?? '男主',
    background: `保留的男主，来自${saved.facilityName}。`,
    greeting: `……你又来了。`,
    avatar: '',
    expressions: { normal: '', shy: '', smug: '' },
    defaultExpression: 'normal',
    voice: { provider: 'browser', voiceId: 'zh-CN-XiaoxiaoNeural' },
    initialRelationship: { favor: 0, trust: 0, dependence: 0 },
    memoryRules: [],
  }
}

export function coverColorForId(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360
  return `hsl(${h}, 45%, 32%)`
}
