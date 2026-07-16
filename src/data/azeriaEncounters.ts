import type { AzeriaRegionId } from '@/worldview/azeriaRegionMap'

export interface EncounterBand {
  min: number
  max: number
  text: string
}

export const AZERIA_ENCOUNTER_TABLES: Record<AzeriaRegionId, EncounterBand[]> = {
  human_kingdoms: [
    { min: 1, max: 1, text: '大失败——强盗团伏击（5-8 名强盗）' },
    { min: 2, max: 4, text: '遭遇落单强盗（2-3 人）' },
    { min: 5, max: 7, text: '路边有重伤倒地的旅行商人' },
    { min: 8, max: 12, text: '无事发生。安静的旅途' },
    { min: 13, max: 15, text: '遇到商队——可交易/同行' },
    { min: 16, max: 17, text: '遇到独行冒险者（可招募/攻略判定）' },
    { min: 18, max: 19, text: '皇家信使——紧急委托（报酬翻倍）' },
    { min: 20, max: 20, text: '大成功——路边隐藏宝箱（1d100 金币+随机魔法物品）' },
  ],
  elf_forest: [
    { min: 1, max: 1, text: '误入精灵禁地——被守卫包围（魅力 DC20）' },
    { min: 2, max: 4, text: '被食人藤蔓攻击（DC15 逃脱）' },
    { min: 5, max: 7, text: '发现月光湖——可休息恢复全部 HP' },
    { min: 8, max: 10, text: '遇到精灵巡逻队（态度取决于声望）' },
    { min: 11, max: 14, text: '精灵歌声——感知 DC15 追踪源头' },
    { min: 15, max: 17, text: '发现精灵药草园——可采集 1d6 株' },
    { min: 18, max: 19, text: '救助受伤精灵——精灵之森声望 +10' },
    { min: 20, max: 20, text: '大成功——古树树洞传说级弓' },
  ],
  demon_wastes: [
    { min: 1, max: 1, text: '魔物暴走群（10+ 只）' },
    { min: 2, max: 5, text: '落单高级魔物（DC18 战斗力）' },
    { min: 6, max: 8, text: '魔族巡逻队（态度取决于声望）' },
    { min: 9, max: 11, text: '沙尘暴——体质豁免 DC15' },
    { min: 12, max: 14, text: '废弃魔族前哨——可扎营' },
    { min: 15, max: 16, text: '独行魔族战士——可挑战/招募' },
    { min: 17, max: 18, text: '露天矿石——稀有锻造材料' },
    { min: 19, max: 19, text: '黑市秘密据点' },
    { min: 20, max: 20, text: '大成功——古老魔族遗迹入口' },
  ],
  dragon_snow: [
    { min: 1, max: 1, text: '暴风雪——体质豁免 DC18，失败力竭 +1' },
    { min: 2, max: 5, text: '龙盘旋——潜行 DC20 或魅力判定' },
    { min: 6, max: 8, text: '冰原狼群（4-6 只）' },
    { min: 9, max: 11, text: '龙骨遗迹——可采集龙晶石' },
    { min: 12, max: 15, text: '暴风雪后的寂静。无事发生' },
    { min: 16, max: 17, text: '温泉——完全恢复' },
    { min: 18, max: 19, text: '友善亚龙——驯兽 DC18' },
    { min: 20, max: 20, text: '大成功——龙族古老宝库' },
  ],
  mermaid_sea: [
    { min: 1, max: 1, text: '海怪袭击——大型海兽（DC20）' },
    { min: 2, max: 4, text: '风暴——体质豁免 DC15' },
    { min: 5, max: 7, text: '人鱼商队——可交易' },
    { min: 8, max: 11, text: '无名珊瑚岛——可扎营' },
    { min: 12, max: 14, text: '海豚群伴游——感知 DC12 带路' },
    { min: 15, max: 17, text: '沉船——可潜水打捞' },
    { min: 18, max: 19, text: '人鱼歌声——感知 DC15 追踪' },
    { min: 20, max: 20, text: '大成功——海底秘境入口' },
  ],
  abyss_rift: [
    { min: 1, max: 1, text: '岩浆喷发——敏捷豁免 DC18（3d6 火焰）' },
    { min: 2, max: 4, text: '恶魔突袭——2-4 只中阶恶魔' },
    { min: 5, max: 7, text: '魅魔拦路——魅力 DC18 抵抗诱惑' },
    { min: 8, max: 10, text: '深渊菌田——可采集孢子' },
    { min: 11, max: 13, text: '堕天使——态度取决于天使伴侣' },
    { min: 14, max: 16, text: '深渊黑市' },
    { min: 17, max: 18, text: '隐蔽熔岩温泉——可休息' },
    { min: 19, max: 19, text: '深渊魔王招募官' },
    { min: 20, max: 20, text: '大成功——传说武器「欲望之刃」' },
  ],
  celestial_isles: [
    { min: 1, max: 1, text: '被天界守卫视为入侵者——立即驱逐' },
    { min: 2, max: 5, text: '巡逻智天使——态度取决于天使伴侣' },
    { min: 6, max: 10, text: '神族文字碎片——奥秘 DC20 解读' },
    { min: 11, max: 15, text: '天界圣泉——全状态恢复+24h 圣光祝福' },
    { min: 16, max: 18, text: '座天使——魅力 DC15 搭话' },
    { min: 19, max: 19, text: '神族邀请——直接剧情事件' },
    { min: 20, max: 20, text: '大成功——天界图书馆短暂开放' },
  ],
  beast_wilds: [
    { min: 1, max: 1, text: '敌对部落袭击（8-10 名兽人战士）' },
    { min: 2, max: 5, text: '凶狠魔兽（DC16）' },
    { min: 6, max: 8, text: '兽人战斗仪式——可挑战勇士' },
    { min: 9, max: 12, text: '游荡兽人猎人' },
    { min: 13, max: 15, text: '峡谷温泉——可休息' },
    { min: 16, max: 17, text: '兽人商人——兽骨装备' },
    { min: 18, max: 19, text: '救助兽人幼崽——部落声望 +20' },
    { min: 20, max: 20, text: '大成功——勇士之宴' },
  ],
}
