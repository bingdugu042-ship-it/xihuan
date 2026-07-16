/** 酒馆生活玩法：杂谈 / 委托会 / 日体力 */

export type ForumTag = '灌水' | '求助' | '传闻' | '委托线索'

export interface ForumReply {
  author: string
  text: string
}

export interface ForumThread {
  id: string
  tag: ForumTag
  title: string
  author: string
  body: string
  hot?: boolean
  commentCount: number
  replies: ForumReply[]
  createdAt: number
}

export type CommissionStatus = 'open' | 'accepted' | 'done'

export interface CommissionJob {
  id: string
  title: string
  reward: number
  employer: string
  summary: string
  tags: string[]
  location: string
  timeSlot: string
  staminaCost: number
  risk: string
  status: CommissionStatus
}

export type CommissionOutcome = 'success' | 'partial' | 'fail'

export interface CommissionReport {
  commissionId: string
  title: string
  narrative: string
  outcome: CommissionOutcome
  coinsDelta: number
  staminaSpent: number
  at: number
}

export type RosterBeatAction = 'errand' | 'warmbed' | 'standby' | 'promote'

export const ROSTER_BEAT_LABELS: Record<RosterBeatAction, string> = {
  errand: '跑腿',
  warmbed: '暖床',
  standby: '战斗待命',
  promote: '转正',
}

/** 名册预设测试员（无队伍时展示） */
export const DEMO_ROSTER_MEMBER = {
  characterId: 'demo_feiche',
  displayName: '绯澈·试炼',
  raceId: 'human',
  title: '虚空王座厅试炼员',
  background: '一名被召唤到艾泽利亚的试炼男主，专供酒馆名册与指令测试。',
  favor: 10,
  trust: 8,
  dependence: 0,
} as const

export function dayKey(ts = Date.now()): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
