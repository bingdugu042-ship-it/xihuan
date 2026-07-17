/** 艾泽利亚大陆地图热区 · 基于 public/assets/worldmap/azeria/map.png (576×1024) */

export const AZERIA_MAP_SIZE = { width: 576, height: 1024 } as const

export interface AzeriaMapHotspot {
  regionId: string
  /** 0–100 百分比坐标（相对地图左上） */
  xPct: number
  yPct: number
  /** 主城邦显示名（红圈城邦） */
  cityLabel: string
  /** 立绘角色 id */
  leadIds: string[]
  hue: string
}

/**
 * 热区对齐标注图红圈：
 * 天界浮岛 / 永冬雪境龙标 / 中央帝都 / 精灵之森 / 魔族荒原 /
 * 兽人荒野(白狼) / 人鱼海域 / 深渊裂谷
 */
export const AZERIA_MAP_HOTSPOTS: AzeriaMapHotspot[] = [
  {
    regionId: 'sky',
    xPct: 50,
    yPct: 11,
    cityLabel: '云中圣城',
    leadIds: ['angel_seraph', 'angel_brother'],
    hue: '#f0e6c8',
  },
  {
    regionId: 'north',
    xPct: 48,
    yPct: 27,
    cityLabel: '龙骨神殿',
    leadIds: ['dragon_rhaeg'],
    hue: '#9ec8e8',
  },
  {
    regionId: 'east',
    xPct: 82,
    yPct: 40,
    cityLabel: '银月城',
    leadIds: ['elf_caer'],
    hue: '#a8d4b0',
  },
  {
    regionId: 'west',
    xPct: 14,
    yPct: 42,
    cityLabel: '魔王城',
    leadIds: ['demon_vex'],
    hue: '#c45c5c',
  },
  {
    regionId: 'central',
    xPct: 50,
    yPct: 49,
    cityLabel: '光辉之城·帝都',
    leadIds: ['human_rowan'],
    hue: '#e8c878',
  },
  {
    regionId: 'border',
    xPct: 22,
    yPct: 62,
    cityLabel: '大风部落',
    leadIds: ['beastfolk_wolf'],
    hue: '#c8b890',
  },
  {
    regionId: 'south',
    xPct: 74,
    yPct: 76,
    cityLabel: '珊瑚王庭',
    leadIds: ['mermaid_nyx'],
    hue: '#4ecdc4',
  },
  {
    regionId: 'under',
    xPct: 30,
    yPct: 88,
    cityLabel: '欲望之城',
    leadIds: ['succubus_milo'],
    hue: '#a84a8a',
  },
]

/** 冒险者酒馆 · 帝都东南侧（驻留 / 大厅闲聊入口） */
export const AZERIA_TAVERN_PIN = {
  id: 'adventurer_tavern',
  xPct: 61,
  yPct: 54,
  label: '冒险者酒馆',
  hue: '#d4a574',
  facilityId: 'dice_tavern',
  leadId: 'human_rowan',
} as const

export function hotspotToPx(h: AzeriaMapHotspot): { x: number; y: number } {
  return {
    x: (h.xPct / 100) * AZERIA_MAP_SIZE.width,
    y: (h.yPct / 100) * AZERIA_MAP_SIZE.height,
  }
}
