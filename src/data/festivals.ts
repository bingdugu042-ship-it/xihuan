/** 节日系统 · 预设 + 自定义节日写入世界书 */

export interface FestivalDef {
  id: string
  name: string
  /** 简短氛围 */
  blurb: string
  /** 写入 AI / 世界书的完整条文 */
  worldbook: string
  /** 期望 NPC 行为关键词 */
  npcBehaviors: string[]
  /** MM-DD，忽略年份；自定义也可为空表示「进行中」 */
  dateKey?: string
  /** 用户自定义 */
  custom?: boolean
  enabled?: boolean
}

export const PRESET_FESTIVALS: FestivalDef[] = [
  {
    id: 'lantern_night',
    name: '星灯祭',
    blurb: '全城点灯祈愿，男女主更易暧昧靠近。',
    worldbook:
      '【全球节日 · 星灯祭】\n艾泽利亚诸城挂起星灯。关键词：祈愿、共行、告白、赠灯。\n所有 NPC / 男主应主动提及灯火或祭典；行为更柔软、更愿意同行与小礼物。',
    npcBehaviors: ['提及星灯', '邀请共行', '赠小礼物'],
    dateKey: '07-15',
  },
  {
    id: 'blood_moon',
    name: '血月夜',
    blurb: '魔力暴涨，欲望与危险同步升高。',
    worldbook:
      '【全球节日 · 血月夜】\n血月当空，魔力与情欲双重涨潮。关键词：危险邀约、禁忌仪式、血契。\nNPC 更主动、更压迫；战斗与 H 氛围都可升一档，但仍须尊重玩家节奏。',
    npcBehaviors: ['压迫感上升', '提及血月', '危险邀约'],
    dateKey: '10-31',
  },
  {
    id: 'harvest_fair',
    name: '丰收集市',
    blurb: '酒馆与公会委托爆满，报酬略丰。',
    worldbook:
      '【全球节日 · 丰收集市】\n商队与农夫涌入城邦。关键词：集市、试吃、委托翻倍、热闹。\nNPC 口吻更生活化；委托与跑腿话题增多；可自然提及食物与金币。',
    npcBehaviors: ['聊集市', '聊吃喝', '推委托'],
    dateKey: '09-22',
  },
]

export function festivalDateKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m}-${day}`
}

export function buildFestivalWorldbookBlock(festivals: FestivalDef[]): string {
  const active = festivals.filter((f) => f.enabled !== false)
  if (!active.length) return ''
  return [
    '## 当前全球节日（全体 NPC / 男主必须遵从）',
    ...active.map(
      (f) =>
        `${f.worldbook}\n行为要点：${f.npcBehaviors.join('、') || '融入节日氛围'}`,
    ),
    '规则：对话、动作、委托旁白均应体现上述节日；不可装作不知道。',
  ].join('\n\n')
}
