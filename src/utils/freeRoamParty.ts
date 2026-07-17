/** 组装自由游玩群聊参与者：区域预设立绘男主 + 出征编组（上限 4） */

import { getLeadIdsForFacility, getLeadIdsForWorldRegion } from '@/data/regionalLeads'
import { FACILITY_MAP } from '@/data/facilities'
import { useDataStore } from '@/store/dataStore'
import { usePassportStore } from '@/store/passportStore'

export function buildFreeRoamParticipants(
  facilityId: string,
  worldRegionId?: string,
): string[] {
  const { characters, runtimeCharacters } = useDataStore.getState()
  const known = { ...characters, ...runtimeCharacters }
  const party = usePassportStore.getState().partyIds

  const ids: string[] = []
  const push = (id?: string | null) => {
    if (!id || ids.includes(id)) return
    if (known[id]) ids.push(id)
  }

  // 1) 地图大陆区立绘主角（解决 border 与龙域共用设施时的主角区分）
  if (worldRegionId) {
    for (const id of getLeadIdsForWorldRegion(worldRegionId)) push(id)
  }
  // 2) 预设立绘主角（本域固定驻场）
  for (const id of getLeadIdsForFacility(facilityId)) push(id)
  // 3) 出征编组
  for (const id of party) push(id)
  // 4) 设施默认参与者
  const region = useDataStore.getState().regions[facilityId]
  for (const id of region?.defaultParticipants ?? []) push(id)

  return ids.slice(0, 4)
}

/** 玩法入域（非自由游玩）也要带上立绘主角 */
export function buildGuidedParticipants(
  facilityId: string,
  worldRegionId?: string,
): string[] {
  const { characters, runtimeCharacters, regions } = useDataStore.getState()
  const known = { ...characters, ...runtimeCharacters }
  const region = regions[facilityId]
  const ids: string[] = []
  const push = (id?: string | null) => {
    if (!id || ids.includes(id)) return
    if (known[id]) ids.push(id)
  }
  if (worldRegionId) {
    for (const id of getLeadIdsForWorldRegion(worldRegionId)) push(id)
  }
  for (const id of getLeadIdsForFacility(facilityId)) push(id)
  for (const id of region?.defaultParticipants ?? []) push(id)
  return ids.slice(0, 4)
}

export function freeRoamSessionTitle(facilityId: string, hint?: string): string {
  const fac = FACILITY_MAP[facilityId]
  return `${hint ?? fac?.name ?? '本域'} · 自由游玩`
}
