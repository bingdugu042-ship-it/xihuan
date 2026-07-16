import type { ShopItem } from '@/types'

/** 酒馆商店 · 装备/魔道具/药剂（规则书 Ch2 节选） */
export const TAVERN_GEAR_ITEMS: ShopItem[] = [
  {
    id: 'gear_dagger',
    name: '龙鳞匕首',
    desc: '轻型武器，1d6+敏捷。无视火焰抗性。龙族伴侣羁绊 Lv.5 可赠。',
    price: 280,
    category: 'equipment',
    effect: '近战 +1d6，火焰穿透',
  },
  {
    id: 'gear_scale_armor',
    name: '龙鳞甲',
    desc: 'AC 18，火焰抗性，体温自动调节。龙族伴侣 Lv.8 可赠。',
    price: 1200,
    category: 'equipment',
    effect: 'AC +18',
  },
  {
    id: 'gear_rope_magic',
    name: '魔力绳索',
    desc: '以魔力织成，固定目标四肢。公会/魔法学院可购。',
    price: 150,
    category: 'magic',
    effect: '束缚判定 +2',
  },
  {
    id: 'pot_heal_minor',
    name: '初级治疗药水',
    desc: '恢复 2d4+2 HP。冒险者公会常备。',
    price: 45,
    category: 'potion',
    effect: 'HP +2d4+2',
  },
  {
    id: 'pot_stamina',
    name: '耐力合剂',
    desc: '长时奔跑/抗疲劳，体质检定 +2 持续 1 小时。',
    price: 65,
    category: 'potion',
    effect: 'CON 检定 +2',
  },
  {
    id: 'pot_desire_mid',
    name: '中级欲火药剂',
    desc: '龙涎香 + 魅魔蜜露 + 月光蘑菇。需毒素/专注抵抗 DC15。',
    price: 180,
    category: 'potion',
    effect: '催情 DC15',
  },
  {
    id: 'scroll_feather',
    name: '天使羽毛坠',
    desc: '天使伴侣可每日一次传送到你身边（需已有天使伴侣）。',
    price: 500,
    category: 'magic',
    effect: '每日传送×1',
  },
  {
    id: 'scroll_whisper',
    name: '低语卷轴',
    desc: '在 30 尺内对一名目标植入一句暗示（意志 DC18）。',
    price: 220,
    category: 'magic',
    effect: '暗示 DC18',
  },
  {
    id: 'gear_collar',
    name: '支配项圈',
    desc: '伴侣专用。服从度≥50% 后装备，H 场景指令扩展。',
    price: 350,
    category: 'equipment',
    effect: '服从指令 +1 档',
  },
  {
    id: 'pot_antidote',
    name: '解毒剂',
    desc: '抵抗毒药、酒精、媚药。毒素抵抗检定 +4。',
    price: 55,
    category: 'potion',
    effect: '毒素抵抗 +4',
  },
]

export const SHOP_CATEGORY_LABEL: Record<NonNullable<ShopItem['category']>, string> = {
  equipment: '装备',
  potion: '药剂',
  scroll: '卷轴',
  magic: '魔道具',
  souvenir: '纪念品',
}
