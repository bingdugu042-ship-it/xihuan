import { create } from 'zustand'
import {
  PRESET_FESTIVALS,
  festivalDateKey,
  type FestivalDef,
} from '@/data/festivals'

const KEY = 'azeria_festivals_v1'

interface FestivalData {
  custom: FestivalDef[]
  /** 强制开启的 id（含预设） */
  forcedOn: string[]
  /** 强制关闭的 id */
  forcedOff: string[]
}

interface FestivalStore extends FestivalData {
  loaded: boolean
  load: () => Promise<void>
  /** 今日生效节日（日期匹配或强制开启，且未被关闭） */
  activeFestivals: () => FestivalDef[]
  addCustom: (input: Omit<FestivalDef, 'id' | 'custom'> & { id?: string }) => void
  removeCustom: (id: string) => void
  setEnabled: (id: string, on: boolean) => void
}

function allDefs(custom: FestivalDef[]): FestivalDef[] {
  return [...PRESET_FESTIVALS, ...custom]
}

function persist(data: FestivalData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

export const useFestivalStore = create<FestivalStore>((set, get) => ({
  custom: [],
  forcedOn: [],
  forcedOff: [],
  loaded: false,

  load: async () => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const data = JSON.parse(raw) as FestivalData
        set({
          custom: data.custom ?? [],
          forcedOn: data.forcedOn ?? [],
          forcedOff: data.forcedOff ?? [],
          loaded: true,
        })
        return
      }
    } catch {
      /* ignore */
    }
    set({ loaded: true })
  },

  activeFestivals: () => {
    const { custom, forcedOn, forcedOff } = get()
    const today = festivalDateKey()
    return allDefs(custom).filter((f) => {
      if (forcedOff.includes(f.id)) return false
      if (forcedOn.includes(f.id)) return true
      if (f.enabled === false) return false
      if (!f.dateKey) return Boolean(f.custom)
      return f.dateKey === today
    })
  },

  addCustom: (input) => {
    const id = input.id?.trim() || `fest_${Date.now().toString(36)}`
    const def: FestivalDef = {
      id,
      name: input.name.trim() || '未命名节日',
      blurb: input.blurb.trim() || '自定义节日',
      worldbook:
        input.worldbook.trim() ||
        `【全球节日 · ${input.name.trim() || '自定义'}】\n${input.blurb.trim() || '全员沉浸此节日。'}`,
      npcBehaviors: input.npcBehaviors?.length ? input.npcBehaviors : ['融入节日'],
      dateKey: input.dateKey,
      custom: true,
      enabled: true,
    }
    const custom = [...get().custom.filter((c) => c.id !== id), def]
    const forcedOn = [...new Set([...get().forcedOn, id])]
    set({ custom, forcedOn })
    persist({ custom, forcedOn, forcedOff: get().forcedOff })
  },

  removeCustom: (id) => {
    const custom = get().custom.filter((c) => c.id !== id)
    const forcedOn = get().forcedOn.filter((x) => x !== id)
    const forcedOff = get().forcedOff.filter((x) => x !== id)
    set({ custom, forcedOn, forcedOff })
    persist({ custom, forcedOn, forcedOff })
  },

  setEnabled: (id, on) => {
    let forcedOn = get().forcedOn.filter((x) => x !== id)
    let forcedOff = get().forcedOff.filter((x) => x !== id)
    if (on) forcedOn = [...forcedOn, id]
    else forcedOff = [...forcedOff, id]
    set({ forcedOn, forcedOff })
    persist({ custom: get().custom, forcedOn, forcedOff })
  },
}))
