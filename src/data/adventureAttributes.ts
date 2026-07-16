import type { DiceSkill } from '@/utils/dice'

export type AttrKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export interface AdventureAttributes {
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}

export type AdventureClassId =
  | 'warrior'
  | 'rogue'
  | 'mage'
  | 'archer'
  | 'priest'
  | 'summoner'
  | 'monk'
  | 'bard'
  | 'arbiter'

export interface AdventureClassDef {
  id: AdventureClassId
  name: string
  mainAttr: string
  role: string
  skill: string
}

export const ADVENTURE_CLASSES: AdventureClassDef[] = [
  { id: 'warrior', name: '战士', mainAttr: 'STR/CON', role: '近战·坦克', skill: '【猛击】伤害+3' },
  { id: 'rogue', name: '盗贼', mainAttr: 'DEX', role: '潜行·暗杀', skill: '【背刺】潜行中伤害×2' },
  { id: 'mage', name: '法师', mainAttr: 'INT', role: '魔法·控场', skill: '【火球术】范围伤害' },
  { id: 'archer', name: '弓箭手', mainAttr: 'DEX/WIS', role: '远程·侦查', skill: '【精准射击】命中+3' },
  { id: 'priest', name: '祭司', mainAttr: 'WIS/CHA', role: '治疗·辅助', skill: '【治愈术】恢复生命' },
  { id: 'summoner', name: '召唤师', mainAttr: 'INT/CHA', role: '召唤·控场', skill: '【低级召唤】魔物助战' },
  { id: 'monk', name: '武僧', mainAttr: 'DEX/WIS', role: '徒手·机动', skill: '【气劲】徒手伤害+2' },
  { id: 'bard', name: '吟游诗人', mainAttr: 'CHA', role: '增益·魅惑', skill: '【迷魂曲】魅力优势' },
  { id: 'arbiter', name: '裁决者', mainAttr: 'STR/CHA', role: '审判·抗魔', skill: '【裁决印记】伤害+2' },
]

export const ATTR_LABELS: Record<AttrKey, string> = {
  str: '力量',
  dex: '敏捷',
  con: '体质',
  int: '智力',
  wis: '感知',
  cha: '魅力',
}

export const ATTR_DEFAULTS: AdventureAttributes = {
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 14,
}

export const STAT_POINT_POOL = 20
export const STAT_SINGLE_MAX = 18
export const STAT_SINGLE_MIN = 8

export function modifierFromScore(score: number): number {
  if (score <= 9) return -1
  if (score <= 11) return 0
  if (score <= 13) return 1
  if (score <= 15) return 2
  if (score <= 17) return 3
  if (score <= 19) return 4
  if (score <= 21) return 5
  if (score <= 23) return 6
  if (score <= 25) return 7
  if (score <= 27) return 8
  if (score <= 29) return 9
  return 10
}

const SKILL_ATTR: Record<DiceSkill, AttrKey> = {
  persuasion: 'cha',
  intimidation: 'cha',
  allure: 'cha',
  combat: 'str',
  finesse: 'dex',
}

export function modifierForSkill(attrs: AdventureAttributes, skill: DiceSkill): number {
  return modifierFromScore(attrs[SKILL_ATTR[skill]])
}

export function spentStatPoints(attrs: AdventureAttributes): number {
  return (Object.keys(ATTR_DEFAULTS) as AttrKey[]).reduce(
    (sum, k) => sum + Math.max(0, attrs[k] - ATTR_DEFAULTS[k]),
    0,
  )
}

export function formatAdventureStatsPanel(attrs: AdventureAttributes, classId?: AdventureClassId): string {
  const cls = ADVENTURE_CLASSES.find((c) => c.id === classId)
  const lines = [
    '┌──────── D20 六维 · 艾泽利亚 ────────┐',
    cls ? `│ 职业：${cls.name} · ${cls.role}` : '│ 职业：未设定',
    '├──────────────────────────────────┤',
  ]
  for (const key of Object.keys(ATTR_LABELS) as AttrKey[]) {
    const v = attrs[key]
    const mod = modifierFromScore(v)
    const modStr = mod >= 0 ? `+${mod}` : `${mod}`
    lines.push(`│ ${ATTR_LABELS[key].padEnd(4, ' ')} ${String(v).padStart(2, ' ')} (${modStr})`)
  }
  lines.push('└──────────────────────────────────┘')
  return lines.join('\n')
}

export function formatAdventureStatsPrompt(attrs: AdventureAttributes, classId?: AdventureClassId): string {
  const cls = ADVENTURE_CLASSES.find((c) => c.id === classId)
  const bits = (Object.keys(ATTR_LABELS) as AttrKey[]).map(
    (k) => `${ATTR_LABELS[k]}${attrs[k]}(${modifierFromScore(attrs[k]) >= 0 ? '+' : ''}${modifierFromScore(attrs[k])})`,
  )
  return [
    '## 冒险者 D20 面板',
    cls ? `职业：${cls.name}（${cls.skill}）` : '',
    bits.join(' · '),
  ]
    .filter(Boolean)
    .join('\n')
}
