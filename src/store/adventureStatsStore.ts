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
  saveAll: (data: AdventureStatsData) => Promise<void>
}

const DEFAULT: AdventureStatsData = {
  attributes: { ...ATTR_DEFAULTS },
  level: 1,
}

async function persist(data: AdventureStatsData) {
  await putAdventureStats(data)
}

export const useAdventureStatsStore = create<AdventureStatsStore>((set, get) => ({
  ...DEFAULT,
  loaded: false,

  load: async () => {
    const data = await getAdventureStats()
    if (data) {
      set({ ...data, loaded: true })
    } else {
      set({ ...DEFAULT, loaded: true })
    }
  },

  setClass: async (classId) => {
    set({ classId })
    const { attributes, race, bodyType, background, level } = get()
    await persist({ attributes, classId, race, bodyType, background, level })
  },

  setAttributes: async (attributes) => {
    set({ attributes })
    const { classId, race, bodyType, background, level } = get()
    await persist({ attributes, classId, race, bodyType, background, level })
  },

  setMeta: async (patch) => {
    set(patch)
    const state = get()
    await persist({
      attributes: state.attributes,
      classId: state.classId,
      race: state.race,
      bodyType: state.bodyType,
      background: state.background,
      level: state.level,
    })
  },

  saveAll: async (data) => {
    set({ ...data, loaded: true })
    await persist(data)
  },
}))
