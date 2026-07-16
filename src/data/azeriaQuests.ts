/** 冒险者公会委托 · 规则书 Ch1.3 */

export type QuestRank = 'E' | 'D' | 'C' | 'B' | 'A'

export interface GuildQuest {
  id: string
  rank: QuestRank
  title: string
  summary: string
  reward: string
  /** 推荐前往的冒险域 id（facilities） */
  regionId?: string
  /** 最低等级建议 */
  minLevel: number
}

export const QUEST_RANK_META: Record<
  QuestRank,
  { name: string; color: string; rewardRange: string }
> = {
  E: { name: '铜级', color: '#b87333', rewardRange: '1–10 金币' },
  D: { name: '银级', color: '#9aa8b5', rewardRange: '10–50 金币' },
  C: { name: '金级', color: '#d4b06a', rewardRange: '50–200 金币' },
  B: { name: '秘银级', color: '#7eb8d4', rewardRange: '200–1000 金币 + 魔道具' },
  A: { name: '传说级', color: '#c45cff', rewardRange: '1000+ 金币 + 传说装备' },
}

export const GUILD_QUESTS: GuildQuest[] = [
  {
    id: 'q_e_wolves',
    rank: 'E',
    title: '清剿郊狼群',
    summary: '人类诸国边境狼群骚扰商路，需驱逐或击杀首领。',
    reward: '8 金币',
    regionId: 'drake_crag',
    minLevel: 1,
  },
  {
    id: 'q_d_slime',
    rank: 'D',
    title: '史莱姆巢穴调查',
    summary: '矿洞深处出现变异史莱姆，公会要求取样并封锁入口。',
    reward: '35 金币',
    regionId: 'moonwood',
    minLevel: 5,
  },
  {
    id: 'q_c_orc_chief',
    rank: 'C',
    title: '兽人酋长谈判',
    summary: '部落与商队冲突升级，需以武力或魅力迫使酋长停战。',
    reward: '120 金币',
    regionId: 'drake_crag',
    minLevel: 15,
  },
  {
    id: 'q_b_fallen_angel',
    rank: 'B',
    title: '堕天使踪迹',
    summary: '天界边缘侦测到堕落圣光，需高阶小队前往确认。',
    reward: '600 金币 + 堕落之羽',
    regionId: 'solar_sanctum',
    minLevel: 30,
  },
  {
    id: 'q_a_void_throne',
    rank: 'A',
    title: '法则之心异变',
    summary: '终章前兆：深渊裂谷深处法则之心裂纹扩大，需各族王级协助。',
    reward: '2000 金币 + 传说装备',
    regionId: 'void_throne',
    minLevel: 50,
  },
  {
    id: 'q_d_tavern_rumor',
    rank: 'D',
    title: '酒馆流言追查',
    summary: '在嘈杂酒馆偷听特定对话（察觉 DC15），追踪走私魔药线索。',
    reward: '40 金币',
    minLevel: 8,
  },
  {
    id: 'q_c_relic',
    rank: 'C',
    title: '遗迹拍卖护送',
    summary: '护送买家穿越精灵之森，途中可能遭遇劫掠。',
    reward: '180 金币',
    regionId: 'relic_auction',
    minLevel: 18,
  },
]
