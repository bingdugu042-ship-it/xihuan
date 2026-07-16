/** 伴侣赠礼 · 规则书 Ch29 */

export interface AzeriaGiftDef {
  id: string
  name: string
  races: string[]
  favorBonus: number
  note: string
  price: number
}

export const AZERIA_GIFTS: AzeriaGiftDef[] = [
  {
    id: 'gift_moon_mushroom',
    name: '月光蘑菇干',
    races: ['elf'],
    favorBonus: 8,
    note: '他的耳朵尖高兴得抖了整整一分钟',
    price: 60,
  },
  {
    id: 'gift_dragon_crystal',
    name: '龙晶石',
    races: ['dragon'],
    favorBonus: 10,
    note: '放在巢穴金币堆最顶端',
    price: 120,
  },
  {
    id: 'gift_hand_knife',
    name: '手工锻造的小刀',
    races: ['human', 'beastfolk'],
    favorBonus: 7,
    note: '他会一直戴着——哪怕是睡觉',
    price: 80,
  },
  {
    id: 'gift_pearl',
    name: '珍珠项链',
    races: ['mermaid'],
    favorBonus: 9,
    note: '戴着游回海里向同伴炫耀',
    price: 100,
  },
  {
    id: 'gift_ancient_tome',
    name: '上古魔法书',
    races: ['angel', 'god'],
    favorBonus: 12,
    note: '「这一本是你给我的，所以不一样。」',
    price: 150,
  },
  {
    id: 'gift_abyss_chocolate',
    name: '深渊黑巧克力',
    races: ['succubus', 'demon'],
    favorBonus: 8,
    note: '舍不得吃，放在枕头底下——第二天化了',
    price: 70,
  },
  {
    id: 'gift_hair_knot',
    name: '你的一缕头发编成的绳结',
    races: ['*'],
    favorBonus: 15,
    note: '比任何契约都牢固的绑定',
    price: 0,
  },
]

export const FACTIONS = [
  {
    id: 'none' as const,
    name: '未选定',
    desc: '主线第三章后解锁阵营选择。',
  },
  {
    id: 'guardian' as const,
    name: '守护者同盟',
    desc: '天使·神族·部分人类：请停止攻略，以免加速崩坏。',
  },
  {
    id: 'liberation' as const,
    name: '解放战线',
    desc: '魔族·恶魔·堕天使：砸碎牢笼，重建秩序。',
  },
  {
    id: 'neutral' as const,
    name: '中立调停',
    desc: '精灵·人鱼·龙族：寻找第三条路。',
  },
  {
    id: 'private' as const,
    name: '你的私军',
    desc: '伴侣们只听你的——但将面对各方联合施压。',
  },
]

export type FactionId = (typeof FACTIONS)[number]['id']

export const CRAFT_RECIPES = [
  {
    id: 'craft_desire_mid',
    name: '中级欲火药剂',
    need: '龙涎香 + 魅魔蜜露 + 月光蘑菇',
    cost: 90,
    resultItemId: 'pot_desire_mid',
    resultName: '中级欲火药剂',
  },
  {
    id: 'craft_heal',
    name: '初级治疗药水',
    need: '药草 ×3 + 清水',
    cost: 25,
    resultItemId: 'pot_heal_minor',
    resultName: '初级治疗药水',
  },
  {
    id: 'craft_antidote',
    name: '解毒剂',
    need: '解毒草 + 矿泉',
    cost: 40,
    resultItemId: 'pot_antidote',
    resultName: '解毒剂',
  },
]
