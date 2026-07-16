/** 组装自由游玩群聊参与者：区域男主 + 出征编组（上限 4） */

import { AZERIA_MAP_HOTSPOTS } from '@/data/azeriaMapHotspots'
import { AZERIA_WORLD_REGION_MAP } from '@/data/azeriaWorldRegions'
import { FACILITY_MAP } from '@/data/facilities'
import { useDataStore } from '@/store/dataStore'
import { usePassportStore } from '@/store/passportStore'
import { resolveAzeriaRegion } from '@/worldview/azeriaRegionMap'

export function buildFreeRoamParticipants(facilityId: string): string[] {
  const { characters, runtimeCharacters } = useDataStore.getState()
  const known = { ...characters, ...runtimeCharacters }
  const party = usePassportStore.getState().partyIds
  const azeria = resolveAzeriaRegion(facilityId)
  const world = azeria ? AZERIA_WORLD_REGION_MAP[azeria.id] : null
  const hotspot = AZERIA_MAP_HOTSPOTS.find((h) => h.regionId === world?.id)

  const ids: string[] = []
  const push = (id?: string | null) => {
    if (!id || ids.includes(id)) return
    if (known[id]) ids.push(id)
  }

  push(world?.fixedLeadId)
  for (const id of hotspot?.leadIds ?? []) push(id)
  for (const id of party) push(id)

  // 设施默认参与者
  const region = useDataStore.getState().regions[facilityId]
  for (const id of region?.defaultParticipants ?? []) push(id)

  // 至少保留空数组 → createSession 会动态生成 NPC
  return ids.slice(0, 4)
}

export function freeRoamSessionTitle(facilityId: string, hint?: string): string {
  const fac = FACILITY_MAP[facilityId]
  return `${hint ?? fac?.name ?? '本域'} · 自由游玩`
}
