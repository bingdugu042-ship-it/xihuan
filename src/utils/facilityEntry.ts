import { FACILITY_MAP } from '@/data/facilities'
import { useDataStore } from '@/store/dataStore'
import { useUIStore } from '@/store/uiStore'

/** 是否为西幻冒险域（走身份/玩法入场抽屉） */
export function isAdventureRegion(regionId: string): boolean {
  const region = useDataStore.getState().regions[regionId]
  if (region?.worldId === 'aetherion') return true
  return Boolean(FACILITY_MAP[regionId])
}

/** 打开冒险域入场抽屉 */
export function openFacilityEntry(facilityId: string, opts?: { switchToWorld?: boolean }) {
  const { regions } = useDataStore.getState()
  if (!regions[facilityId]) return false
  useUIStore.getState().openFacilityPlayPage(facilityId)
  if (opts?.switchToWorld !== false) {
    useUIStore.getState().setActiveTab('adventure')
  }
  return true
}
