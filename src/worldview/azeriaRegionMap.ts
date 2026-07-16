/**
 * v2 冒险域 id → 艾泽利亚大陆区域（规则书 Ch1.2 / Ch1.5.2）
 * 只映射，不修改 facilities.ts
 */

export type AzeriaRegionId =
  | 'human_kingdoms'
  | 'elf_forest'
  | 'demon_wastes'
  | 'dragon_snow'
  | 'mermaid_sea'
  | 'abyss_rift'
  | 'celestial_isles'
  | 'beast_wilds'

export interface AzeriaRegionMeta {
  id: AzeriaRegionId
  name: string
  env: string
  danger: string
  /** 规则书 Ch1.5.2 遭遇表锚点标题（用于切片） */
  encounterSectionTitle: string
}

export const AZERIA_REGIONS: Record<AzeriaRegionId, AzeriaRegionMeta> = {
  human_kingdoms: {
    id: 'human_kingdoms',
    name: '人类诸国',
    env: '平原·城邦·农田·河流',
    danger: '★☆☆',
    encounterSectionTitle: '人类诸国·平原道路',
  },
  elf_forest: {
    id: 'elf_forest',
    name: '精灵之森',
    env: '密林·古树·月光湖',
    danger: '★★☆',
    encounterSectionTitle: '精灵之森·密林小径',
  },
  demon_wastes: {
    id: 'demon_wastes',
    name: '魔族荒原',
    env: '戈壁·火山·黑石堡',
    danger: '★★★',
    encounterSectionTitle: '魔族荒原·戈壁与火山带',
  },
  dragon_snow: {
    id: 'dragon_snow',
    name: '永冬雪境',
    env: '雪山·冰湖·龙骨遗迹',
    danger: '★★★★',
    encounterSectionTitle: '永冬雪境·龙族领地',
  },
  mermaid_sea: {
    id: 'mermaid_sea',
    name: '人鱼海域',
    env: '群岛·珊瑚礁·深海',
    danger: '★★☆',
    encounterSectionTitle: '人鱼海域·群岛与深海',
  },
  abyss_rift: {
    id: 'abyss_rift',
    name: '深渊裂谷',
    env: '地下城·熔岩河',
    danger: '★★★★★',
    encounterSectionTitle: '深渊裂谷·地下与熔岩带',
  },
  celestial_isles: {
    id: 'celestial_isles',
    name: '天界浮岛',
    env: '云中城·圣光穹顶',
    danger: '★★★★★',
    encounterSectionTitle: '天界浮岛·云端圣域',
  },
  beast_wilds: {
    id: 'beast_wilds',
    name: '兽人荒野',
    env: '草原·峡谷·部落',
    danger: '★★☆',
    encounterSectionTitle: '兽人荒野·草原与峡谷',
  },
}

/** facilityId（v2 冒险域）→ 艾泽利亚区域 */
export const FACILITY_TO_AZERIA: Record<string, AzeriaRegionId> = {
  solar_sanctum: 'celestial_isles',
  void_throne: 'abyss_rift',
  succubus_office: 'abyss_rift',
  moonwood: 'elf_forest',
  drake_crag: 'dragon_snow',
  tidegate: 'mermaid_sea',
  dice_tavern: 'human_kingdoms',
  relic_auction: 'human_kingdoms',
}

export function resolveAzeriaRegion(facilityId: string | undefined | null): AzeriaRegionMeta | undefined {
  if (!facilityId) return undefined
  const regionId = FACILITY_TO_AZERIA[facilityId]
  return regionId ? AZERIA_REGIONS[regionId] : undefined
}
