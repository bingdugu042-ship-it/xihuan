import { create } from 'zustand'
import { getAdventureStats, putAdventureStats } from '@/storage/db'
import type { AdventureStatsData } from '@/types'
import {
  ATTR_DEFAULTS,
  type AdventureAttributes,
  type AdventureClassId,
} from '@/data/adventureAttributes'

interface AdventureStatsStore extends AdventureStatsData {
  loaded: boolean
  load: () => Promise<void>
  setClass: (classId: AdventureClassId) => Promise<void>
  setAttributes: (attributes: AdventureAttributes) => Promise<void>
  setMeta: (
    patch: Partial<Pick<AdventureStatsData, 'race' | 'bodyType' | 'background' | 'level'>>,
  ) => Promise<void>
  /** 获得经验；满额自动升级并增加技能点 */
  gainXp: (amount: number) => Promise<{ leveled: boolean; level: number; skillPoints: number }>
  spendSkillPoint: (attr: keyof AdventureAttributes) => Promise<boolean>
  saveAll: (data: AdventureStatsData) => Promise<void>
}

const DEFAULT: AdventureStatsData = {
  attributes: { ...ATTR_DEFAULTS },
  level: 1,
  xp: 0,
  skillPoints: 0,
}

function xpToNext(level: number): number {
  return 40 + Math.max(0, level - 1) * 25
}

async function persist(data: AdventureStatsData) {
  await putAdventureStats(data)
}

function snapshot(get: () => AdventureStatsStore): AdventureStatsData {
  const s = get()
  return {
    attributes: s.attributes,
    classId: s.classId,
    race: s.race,
    bodyType: s.bodyType,
    background: s.background,
    level: s.level ?? 1,
    xp: s.xp ?? 0,
    skillPoints: s.skillPoints ?? 0,
  }
}

export const useAdventureStatsStore = create<AdventureStatsStore>((set, get) => ({
  ...DEFAULT,
  loaded: false,

  load: async () => {
    const data = await getAdventureStats()
    if (data) {
      set({
        ...DEFAULT,
        ...data,
        attributes: { ...ATTR_DEFAULTS, ...data.attributes },
        level: data.level ?? 1,
        xp: data.xp ?? 0,
        skillPoints: data.skillPoints ?? 0,
        loaded: true,
      })
    } else {
      set({ ...DEFAULT, loaded: true })
    }
  },

  setClass: async (classId) => {
    set({ classId })
    await persist(snapshot(get))
  },

  setAttributes: async (attributes) => {
    set({ attributes })
    await persist(snapshot(get))
  },

  setMeta: async (patch) => {
    set(patch)
    await persist(snapshot(get))
  },

  gainXp: async (amount) => {
    let level = get().level ?? 1
    let xp = (get().xp ?? 0) + Math.max(0, amount)
    let skillPoints = get().skillPoints ?? 0
    let leveled = false
    while (xp >= xpToNext(level) && level < 99) {
      xp -= xpToNext(level)
      level += 1
      skillPoints += 1
      leveled = true
    }
    set({ level, xp, skillPoints })
    await persist(snapshot(get))
    return { leveled, level, skillPoints }
  },

  spendSkillPoint: async (attr) => {
    const points = get().skillPoints ?? 0
    if (points <= 0) return false
    const attributes = { ...get().attributes }
    attributes[attr] = Math.min(99, (attributes[attr] ?? 0) + 1)
    set({ attributes, skillPoints: points - 1 })
    await persist(snapshot(get))
    return true
  },

  saveAll: async (data) => {
    set({ ...DEFAULT, ...data, loaded: true })
    await persist(snapshot(get))
  },
}))

export { xpToNext }
