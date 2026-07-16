/** 八大区域声望 / 称号 / 主线进度 / 产业 · 规则书 Ch5.3 Ch11 Ch22 */

import { create } from 'zustand'
import { AZERIA_WORLD_REGIONS } from '@/data/azeriaWorldRegions'

const KEY = 'azeria_progress_v1'

export const REGION_IDS = AZERIA_WORLD_REGIONS.map((r) => r.id)

export interface IndustrySlot {
  id: string
  name: string
  type: 'tavern' | 'inn' | 'shop' | 'workshop'
  incomePerDay: number
  managerName?: string
}

export type FactionChoice = 'none' | 'guardian' | 'liberation' | 'neutral' | 'private'

export interface AnniversaryRecord {
  characterId: string
  displayName: string
  bondedAt: number
}

interface ProgressData {
  reputation: Record<string, number>
  titles: string[]
  mainChapter: number
  industries: IndustrySlot[]
  monstersSeen: string[]
  obedience: Record<string, number>
  faction: FactionChoice
  acceptedQuestIds: string[]
  anniversaries: AnniversaryRecord[]
  challengeLog: string[]
}

interface ProgressStore extends ProgressData {
  loaded: boolean
  load: () => Promise<void>
  setReputation: (regionId: string, value: number) => Promise<void>
  bumpReputation: (regionId: string, delta: number) => Promise<void>
  unlockTitle: (id: string) => Promise<void>
  setMainChapter: (n: number) => Promise<void>
  setObedience: (characterId: string, value: number) => Promise<void>
  bumpObedience: (characterId: string, delta: number) => Promise<void>
  addIndustry: (slot: IndustrySlot) => Promise<void>
  collectMonster: (id: string) => Promise<void>
  collectDailyIncome: () => Promise<number>
  setFaction: (f: FactionChoice) => Promise<void>
  acceptQuest: (id: string) => Promise<void>
  addAnniversary: (rec: AnniversaryRecord) => Promise<void>
  pushChallengeLog: (line: string) => Promise<void>
}

export const DEFAULT_TITLES = [
  { id: 'dragon_knight', name: '龙骑士', condition: '与龙族伴侣羁绊 Lv.10' },
  { id: 'heaven_taboo', name: '天界禁忌', condition: '攻略一名天使伴侣' },
  { id: 'mermaid_darling', name: '人鱼宠儿', condition: '与人鱼伴侣好感 100' },
  { id: 'law_itself', name: '法则本身', condition: '攻略全部八种族王级伴侣' },
]

export const MAIN_STORY = [
  { id: 'ch1', title: '第一章·启程', condition: '完成开局' },
  { id: 'ch2', title: '第二章·裂痕', condition: '任一伴侣好感达 100' },
  { id: 'ch3', title: '第三章·抉择', condition: '攻略三个以上种族伴侣' },
  { id: 'ch4', title: '第四章·冲突', condition: '任意两个种族的王被攻略' },
  { id: 'ch5', title: '第五章·崩坏', condition: '法则之心碎裂' },
  { id: 'ch6', title: '终章·新生', condition: '72 小时内做出最终选择' },
]

export const CITY_GUIDES: Record<string, { city: string; highlights: string[] }> = {
  central: { city: '光辉之城（帝都）', highlights: ['冒险者公会总部', '帝国大竞技场', '贵族区宴会'] },
  east: { city: '银月城', highlights: ['精灵药草园', '竞技森林', '月光湖禁地'] },
  west: { city: '魔王城', highlights: ['血斗场', '角斗士街区', '黑市奴隶贸易（地下）'] },
  north: { city: '龙骨神殿', highlights: ['龙族试炼场', '冰湖温泉', '宝库解谜'] },
  south: { city: '珊瑚王庭', highlights: ['人鱼商会', '潮汐门', '深潜遗迹'] },
  under: { city: '欲望之城', highlights: ['深渊角斗坑', '魅魔区', '法则之心裂隙'] },
  sky: { city: '云中圣城', highlights: ['圣光穹顶', '审判广场', '浮岛链'] },
  border: { city: '大风部落', highlights: ['勇士之宴', '标记仪式场', '兽骨市集'] },
}

export const MONSTER_ENTRIES = [
  { id: 'slime', name: '史莱姆', rank: '普通', note: 'D 级委托常见' },
  { id: 'goblin', name: '哥布林', rank: '普通', note: '成群出现' },
  { id: 'orc', name: '兽人战士', rank: '中级', note: 'C 级首领候选' },
  { id: 'drake', name: '幼龙', rank: '高级', note: '永冬雪境' },
  { id: 'fallen_angel', name: '堕天使', rank: '领主', note: '深渊/天界边境' },
  { id: 'tentacle', name: '触手魔物', rank: 'NSFW', note: '深渊特殊遭遇' },
]

function defaultRep(): Record<string, number> {
  const o: Record<string, number> = {}
  for (const id of REGION_IDS) o[id] = 0
  return o
}

function snapshot(get: () => ProgressStore): ProgressData {
  const s = get()
  return {
    reputation: s.reputation,
    titles: s.titles,
    mainChapter: s.mainChapter,
    industries: s.industries,
    monstersSeen: s.monstersSeen,
    obedience: s.obedience,
    faction: s.faction,
    acceptedQuestIds: s.acceptedQuestIds,
    anniversaries: s.anniversaries,
    challengeLog: s.challengeLog,
  }
}

function persist(data: ProgressData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

export const useAzeriaProgressStore = create<ProgressStore>((set, get) => ({
  reputation: defaultRep(),
  titles: [],
  mainChapter: 1,
  industries: [],
  monstersSeen: [],
  obedience: {},
  faction: 'none',
  acceptedQuestIds: [],
  anniversaries: [],
  challengeLog: [],
  loaded: false,

  load: async () => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const data = JSON.parse(raw) as ProgressData
        set({
          reputation: { ...defaultRep(), ...data.reputation },
          titles: data.titles ?? [],
          mainChapter: data.mainChapter ?? 1,
          industries: data.industries ?? [],
          monstersSeen: data.monstersSeen ?? [],
          obedience: data.obedience ?? {},
          faction: data.faction ?? 'none',
          acceptedQuestIds: data.acceptedQuestIds ?? [],
          anniversaries: data.anniversaries ?? [],
          challengeLog: data.challengeLog ?? [],
          loaded: true,
        })
        return
      }
    } catch {
      /* ignore */
    }
    set({ loaded: true })
  },

  setReputation: async (regionId, value) => {
    const reputation = {
      ...get().reputation,
      [regionId]: Math.max(-100, Math.min(100, Math.round(value))),
    }
    set({ reputation })
    persist(snapshot(get))
  },

  bumpReputation: async (regionId, delta) => {
    const cur = get().reputation[regionId] ?? 0
    await get().setReputation(regionId, cur + delta)
  },

  unlockTitle: async (id) => {
    if (get().titles.includes(id)) return
    const titles = [...get().titles, id]
    set({ titles })
    persist(snapshot(get))
  },

  setMainChapter: async (n) => {
    set({ mainChapter: n })
    persist(snapshot(get))
  },

  setObedience: async (characterId, value) => {
    const obedience = {
      ...get().obedience,
      [characterId]: Math.max(0, Math.min(100, Math.round(value))),
    }
    set({ obedience })
    persist(snapshot(get))
  },

  bumpObedience: async (characterId, delta) => {
    const cur = get().obedience[characterId] ?? 0
    await get().setObedience(characterId, cur + delta)
  },

  addIndustry: async (slot) => {
    const industries = [...get().industries.filter((i) => i.id !== slot.id), slot]
    set({ industries })
    persist(snapshot(get))
  },

  collectMonster: async (id) => {
    if (get().monstersSeen.includes(id)) return
    const monstersSeen = [...get().monstersSeen, id]
    set({ monstersSeen })
    persist(snapshot(get))
  },

  collectDailyIncome: async () => get().industries.reduce((a, i) => a + i.incomePerDay, 0),

  setFaction: async (f) => {
    set({ faction: f })
    persist(snapshot(get))
  },

  acceptQuest: async (id) => {
    if (get().acceptedQuestIds.includes(id)) return
    const acceptedQuestIds = [...get().acceptedQuestIds, id]
    set({ acceptedQuestIds })
    persist(snapshot(get))
  },

  addAnniversary: async (rec) => {
    const anniversaries = [
      ...get().anniversaries.filter((a) => a.characterId !== rec.characterId),
      rec,
    ]
    set({ anniversaries })
    persist(snapshot(get))
  },

  pushChallengeLog: async (line) => {
    const challengeLog = [line, ...get().challengeLog].slice(0, 40)
    set({ challengeLog })
    persist(snapshot(get))
  },
}))

export function obedienceStage(n: number): { stage: number; name: string } {
  if (n >= 100) return { stage: 5, name: '所有物' }
  if (n >= 76) return { stage: 4, name: '臣服者' }
  if (n >= 51) return { stage: 3, name: '追随者' }
  if (n >= 26) return { stage: 2, name: '动摇者' }
  return { stage: 1, name: '抵抗者' }
}
