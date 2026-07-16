import { create } from 'zustand'
import {
  dayKey,
  type CommissionJob,
  type CommissionReport,
  type ForumThread,
} from '@/data/tavernLife'

const KEY = 'tavern_life_v1'
const DEFAULT_STAMINA = 3
const MAX_STAMINA = 5

interface LifeData {
  forumThreads: ForumThread[]
  hotTitles: string[]
  commissions: CommissionJob[]
  workStamina: number
  lastStaminaDay: string
  activeCommissionId: string | null
  lastReport: CommissionReport | null
}

interface TavernLifeStore extends LifeData {
  loaded: boolean
  load: () => Promise<void>
  ensureStaminaDay: () => void
  setForumBoard: (threads: ForumThread[], hotTitles: string[]) => void
  setCommissions: (jobs: CommissionJob[]) => void
  spendStamina: (n: number) => boolean
  setActiveCommission: (id: string | null) => void
  markCommissionDone: (id: string) => void
  setLastReport: (report: CommissionReport | null) => void
}

function snapshot(get: () => TavernLifeStore): LifeData {
  const s = get()
  return {
    forumThreads: s.forumThreads,
    hotTitles: s.hotTitles,
    commissions: s.commissions,
    workStamina: s.workStamina,
    lastStaminaDay: s.lastStaminaDay,
    activeCommissionId: s.activeCommissionId,
    lastReport: s.lastReport,
  }
}

function persist(data: LifeData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

export const useTavernLifeStore = create<TavernLifeStore>((set, get) => ({
  forumThreads: [],
  hotTitles: [],
  commissions: [],
  workStamina: DEFAULT_STAMINA,
  lastStaminaDay: '',
  activeCommissionId: null,
  lastReport: null,
  loaded: false,

  load: async () => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const data = JSON.parse(raw) as LifeData
        set({
          forumThreads: data.forumThreads ?? [],
          hotTitles: data.hotTitles ?? [],
          commissions: data.commissions ?? [],
          workStamina: data.workStamina ?? DEFAULT_STAMINA,
          lastStaminaDay: data.lastStaminaDay ?? '',
          activeCommissionId: data.activeCommissionId ?? null,
          lastReport: data.lastReport ?? null,
          loaded: true,
        })
        get().ensureStaminaDay()
        return
      }
    } catch {
      /* ignore */
    }
    set({ loaded: true, lastStaminaDay: dayKey(), workStamina: DEFAULT_STAMINA })
  },

  ensureStaminaDay: () => {
    const today = dayKey()
    const s = get()
    if (s.lastStaminaDay === today) return
    set({ workStamina: DEFAULT_STAMINA, lastStaminaDay: today })
    persist(snapshot(get))
  },

  setForumBoard: (threads, hotTitles) => {
    set({ forumThreads: threads, hotTitles })
    persist(snapshot(get))
  },

  setCommissions: (jobs) => {
    set({ commissions: jobs })
    persist(snapshot(get))
  },

  spendStamina: (n) => {
    get().ensureStaminaDay()
    const cur = get().workStamina
    if (cur < n) return false
    set({ workStamina: Math.max(0, cur - n) })
    persist(snapshot(get))
    return true
  },

  setActiveCommission: (id) => {
    set({ activeCommissionId: id })
    persist(snapshot(get))
  },

  markCommissionDone: (id) => {
    const commissions = get().commissions.map((c) =>
      c.id === id ? { ...c, status: 'done' as const } : c,
    )
    set({ commissions, activeCommissionId: null })
    persist(snapshot(get))
  },

  setLastReport: (report) => {
    set({ lastReport: report })
    persist(snapshot(get))
  },
}))

export { DEFAULT_STAMINA, MAX_STAMINA }
