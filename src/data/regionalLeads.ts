/**
 * 各地区预设立绘男主（有立绘资源）
 * 与 AI 动态生成 NPC 区分：这些 id 固定驻场，立绘作沉浸背景。
 */

import { AZERIA_MAP_HOTSPOTS } from '@/data/azeriaMapHotspots'
import { AZERIA_WORLD_REGION_MAP } from '@/data/azeriaWorldRegions'
import { FACILITY_MAP } from '@/data/facilities'

/** 冒险域 facilityId → 预设立绘男主 */
export const FACILITY_LEAD_IDS: Record<string, string[]> = {
  solar_sanctum: ['angel_seraph', 'angel_brother'],
  drake_crag: ['dragon_rhaeg'],
  moonwood: ['elf_caer'],
  succubus_office: ['demon_vex'],
  dice_tavern: ['human_rowan'],
  relic_auction: ['human_rowan'],
  tidegate: ['mermaid_nyx'],
  void_throne: ['succubus_milo'],
}

/** 大陆区 id（central/sky…）→ 立绘男主（与地图热区一致） */
export function getLeadIdsForWorldRegion(worldRegionId: string): string[] {
  const hotspot = AZERIA_MAP_HOTSPOTS.find((h) => h.regionId === worldRegionId)
  if (hotspot?.leadIds?.length) return [...hotspot.leadIds]
  const fixed = AZERIA_WORLD_REGION_MAP[worldRegionId]?.fixedLeadId
  return fixed ? [fixed] : []
}

export function getLeadIdsForFacility(facilityId: string): string[] {
  const direct = FACILITY_LEAD_IDS[facilityId]
  if (direct?.length) return [...direct]
  // 反查世界区
  for (const region of Object.values(AZERIA_WORLD_REGION_MAP)) {
    if (region.facilityIds?.includes(facilityId) && region.fixedLeadId) {
      return getLeadIdsForWorldRegion(region.id).length
        ? getLeadIdsForWorldRegion(region.id)
        : [region.fixedLeadId]
    }
  }
  return []
}

const ALL_LEAD_IDS = new Set<string>([
  ...Object.values(FACILITY_LEAD_IDS).flat(),
  ...AZERIA_MAP_HOTSPOTS.flatMap((h) => h.leadIds),
  ...Object.values(AZERIA_WORLD_REGION_MAP)
    .map((r) => r.fixedLeadId)
    .filter(Boolean) as string[],
])

/** 是否为预设立绘主角（非 AI 临时动态男主） */
export function isPresetLeadCharacter(characterId: string | null | undefined): boolean {
  if (!characterId) return false
  if (ALL_LEAD_IDS.has(characterId)) return true
  // 动态男主 id 通常带 dyn_ / runtime 前缀
  if (/^(dyn_|npc_|runtime_)/i.test(characterId)) return false
  return false
}

export function leadLabelForFacility(facilityId: string): string {
  const fac = FACILITY_MAP[facilityId]
  const leads = getLeadIdsForFacility(facilityId)
  if (!leads.length) return fac?.name ?? facilityId
  return `${fac?.name ?? facilityId} · 域内主角 ${leads.length} 人`
}
