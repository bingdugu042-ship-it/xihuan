/** 西幻万人迷 · 种族定义（规则书 Ch4） */

export type RaceId =
  | 'human'
  | 'elf'
  | 'demon'
  | 'dragon'
  | 'mermaid'
  | 'angel'
  | 'succubus'
  | 'god'
  | 'beastfolk'

export interface RaceDef {
  id: RaceId
  name: string
  nameEn: string
  vibe: string
  appearanceGuide: string
  /** 固定可攻略男主建议人数 */
  fixedLeadQuota: number
  /** 随机遭遇池权重 */
  randomWeight: number
  /** 主分布世界区域 id（azeriaWorldRegions） */
  homeRegionId: string
  genderFluid?: boolean
}

export const RACES: RaceDef[] = [
  {
    id: 'human',
    name: '人类',
    nameEn: 'Human',
    vibe: '骑士式忠诚 · 热血直率',
    appearanceGuide: '无特殊种族生理；旅行装、剑客或学者气质均可。',
    fixedLeadQuota: 1,
    randomWeight: 20,
    homeRegionId: 'central',
  },
  {
    id: 'elf',
    name: '精灵',
    nameEn: 'Elf',
    vibe: '俊美克制 · 五倍感官',
    appearanceGuide: '尖耳、精致骨相；银发/浅发常见；耳尖为完整性感带（立绘勿过度色情）。',
    fixedLeadQuota: 1,
    randomWeight: 18,
    homeRegionId: 'east',
  },
  {
    id: 'demon',
    name: '魔族',
    nameEn: 'Demonkin',
    vibe: '慕强 · 占有扭曲成忠诚',
    appearanceGuide: '角为身份标志；体温偏高；薄鳞隐现；军装或黑金袍。',
    fixedLeadQuota: 1,
    randomWeight: 14,
    homeRegionId: 'west',
  },
  {
    id: 'dragon',
    name: '龙族',
    nameEn: 'Dragonborn',
    vibe: '力量压迫 · 笨拙温柔',
    appearanceGuide: '宽肩、鳞纹、竖瞳；半人化形态优先于全龙。',
    fixedLeadQuota: 1,
    randomWeight: 12,
    homeRegionId: 'north',
  },
  {
    id: 'mermaid',
    name: '人鱼',
    nameEn: 'Merfolk',
    vibe: '潮汐富庶 · 不排他但要最优先',
    appearanceGuide: '潮光肤、湿润皮肤；岸行形态可为人腿，隐约鳞痕。',
    fixedLeadQuota: 1,
    randomWeight: 12,
    homeRegionId: 'south',
    genderFluid: true,
  },
  {
    id: 'angel',
    name: '天使',
    nameEn: 'Angel',
    vibe: '禁欲圣颜 · 系统崩溃式动摇',
    appearanceGuide: '光羽（可六翼）、圣甲；表情禁欲，身体反应诚实。',
    fixedLeadQuota: 1,
    randomWeight: 10,
    homeRegionId: 'sky',
  },
  {
    id: 'succubus',
    name: '魅魔',
    nameEn: 'Incubus',
    vibe: '猎食者反转为被猎食者',
    appearanceGuide: '小角与尾；体温偏低；可穿端正袍服制造反差。',
    fixedLeadQuota: 1,
    randomWeight: 10,
    homeRegionId: 'under',
  },
  {
    id: 'god',
    name: '神族',
    nameEn: 'Deity',
    vibe: '创世理性 · 法则反噬',
    appearanceGuide: '神性余辉、不可直视的端丽；非固定七人组，后期线。',
    fixedLeadQuota: 0,
    randomWeight: 3,
    homeRegionId: 'sky',
  },
  {
    id: 'beastfolk',
    name: '亚兽人',
    nameEn: 'Beastfolk',
    vibe: '部落标记 · 野性契约',
    appearanceGuide: '耳尾兽征；草原战士气质；非固定七人组，可随机遭遇。',
    fixedLeadQuota: 1,
    randomWeight: 10,
    homeRegionId: 'border',
  },
]

export const RACE_MAP = Object.fromEntries(RACES.map((r) => [r.id, r])) as Record<RaceId, RaceDef>

/** 固定男主（八域各一；天界另有兄弟米迦可同场） */
export const FIXED_LEAD_IDS = [
  'human_rowan',
  'elf_caer',
  'demon_vex',
  'dragon_rhaeg',
  'mermaid_nyx',
  'angel_seraph',
  'succubus_milo',
  'beastfolk_wolf',
] as const

export function racePromptBlock(raceId?: string): string {
  const r = raceId ? RACE_MAP[raceId as RaceId] : undefined
  if (!r) return ''
  return [
    `【种族】${r.name}（${r.nameEn}）`,
    `气质：${r.vibe}`,
    `外貌指引：${r.appearanceGuide}`,
    r.genderFluid ? '人鱼可随剧情分化形态呈现，需在描写中自然交代当前形态。' : '',
  ]
    .filter(Boolean)
    .join('\n')
}
