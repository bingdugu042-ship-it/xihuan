import { create } from 'zustand'
import { getBodyStats, putBodyStats } from '@/storage/db'
import type { PlayerGender } from '@/types'

export type { PlayerGender }

const FEMALE_DEFAULTS: Record<string, number> = {
  sensitivity: 20,
  vaginal: 15,
  anal: 10,
  oral: 15,
  breast: 20,
  clitoris: 25,
  cervical: 5,
  multi: 15,
  exposure: 20,
  climaxStamina: 15,
  flexibility: 25,
}

const MALE_DEFAULTS: Record<string, number> = {
  stamina: 30,
  sensitivityControl: 25,
  ejaculationStamina: 20,
  anal: 10,
  prostate: 15,
  oralSkill: 20,
  physical: 35,
  volume: 25,
  multi: 15,
  exposure: 20,
  flexibility: 25,
}

interface BodyStatsStore {
  gender: PlayerGender
  stats: Record<string, number>
  stateLabels: Record<string, string>
  loaded: boolean
  load: () => Promise<void>
  setGender: (g: PlayerGender) => Promise<void>
  bumpStat: (key: string, delta: number) => Promise<void>
  setStateLabel: (key: string, value: string) => Promise<void>
  /** AI JSON 回写身体数值与状态文案 */
  applyAiWriteback: (patch: {
    deltas?: Record<string, number>
    labels?: Partial<Record<'lower' | 'stamina' | 'mind', string>>
  }) => Promise<void>
}

async function persist(state: Pick<BodyStatsStore, 'gender' | 'stats' | 'stateLabels'>) {
  await putBodyStats({
    gender: state.gender,
    stats: state.stats,
    stateLabels: state.stateLabels,
  })
}

export const useBodyStatsStore = create<BodyStatsStore>((set, get) => ({
  gender: 'other',
  stats: { ...FEMALE_DEFAULTS },
  stateLabels: {
    lower: '正常',
    stamina: '充沛',
    mind: '清醒',
  },
  loaded: false,

  load: async () => {
    const data = await getBodyStats()
    if (data) {
      set({
        gender: data.gender,
        stats: data.stats,
        stateLabels: data.stateLabels,
        loaded: true,
      })
    } else {
      set({ loaded: true })
    }
  },

  setGender: async (g) => {
    const stats = g === 'male' ? { ...MALE_DEFAULTS } : g === 'female' ? { ...FEMALE_DEFAULTS } : { ...FEMALE_DEFAULTS }
    set({ gender: g, stats })
    await persist(get())
  },

  bumpStat: async (key, delta) => {
    const cur = get().stats[key] ?? 0
    const stats = { ...get().stats, [key]: Math.max(0, Math.min(100, cur + delta)) }
    set({ stats })
    await persist(get())
  },

  setStateLabel: async (key, value) => {
    const stateLabels = { ...get().stateLabels, [key]: value }
    set({ stateLabels })
    await persist(get())
  },

  applyAiWriteback: async ({ deltas, labels }) => {
    let stats = { ...get().stats }
    let stateLabels = { ...get().stateLabels }
    let changed = false
    const allowed = new Set([
      ...Object.keys(FEMALE_STAT_LABELS),
      ...Object.keys(MALE_STAT_LABELS),
    ])
    if (deltas) {
      for (const [key, raw] of Object.entries(deltas)) {
        if (!allowed.has(key)) continue
        const delta = Math.max(-3, Math.min(8, Math.round(Number(raw) || 0)))
        if (!delta) continue
        const cur = stats[key] ?? 0
        stats[key] = Math.max(0, Math.min(100, cur + delta))
        changed = true
      }
    }
    if (labels) {
      for (const k of ['lower', 'stamina', 'mind'] as const) {
        const v = labels[k]?.trim()
        if (v) {
          stateLabels[k] = v.slice(0, 24)
          changed = true
        }
      }
    }
    if (!changed) return
    set({ stats, stateLabels })
    await persist(get())
  },
}))

export const FEMALE_STAT_LABELS: Record<string, string> = {
  sensitivity: '身体敏感度',
  vaginal: '阴道开发度',
  anal: '后庭开发度',
  oral: '口腔开发度',
  breast: '乳房敏感度',
  clitoris: '阴蒂敏感度',
  cervical: '宫颈开发度',
  multi: '多人耐受度',
  exposure: '公开暴露耐性',
  climaxStamina: '连续高潮耐力',
  flexibility: '身体柔韧度',
}

export const MALE_STAT_LABELS: Record<string, string> = {
  stamina: '持久力',
  sensitivityControl: '敏感度控制',
  ejaculationStamina: '连续射精耐力',
  anal: '后庭开发度',
  prostate: '前列腺敏感度',
  oralSkill: '口腔技巧度',
  physical: '体力值',
  volume: '射精量/浓度',
  multi: '多人耐受度',
  exposure: '公开暴露耐性',
  flexibility: '身体柔韧度',
}
