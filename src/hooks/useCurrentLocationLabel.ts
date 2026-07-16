import { useMemo } from 'react'
import { FACILITY_MAP } from '@/data/facilities'
import { AZERIA_WORLD_REGION_MAP } from '@/data/azeriaWorldRegions'
import { AZERIA_MAP_HOTSPOTS } from '@/data/azeriaMapHotspots'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'

/** 顶栏中心：始终显示当前所在地区 / 城邦 */
export function useCurrentLocationLabel(): string {
  const activeSession = useSessionStore((s) => s.activeSession)
  const selectedRegionId = useUIStore((s) => s.selectedRegionId)
  const selectedFacilityId = useUIStore((s) => s.selectedFacilityId)
  const facilityPlayPageOpen = useUIStore((s) => s.facilityPlayPageOpen)

  return useMemo(() => {
    if (facilityPlayPageOpen && selectedFacilityId) {
      return FACILITY_MAP[selectedFacilityId]?.name ?? '未知域界'
    }
    if (activeSession?.regionId) {
      const facility = FACILITY_MAP[activeSession.regionId]
      if (facility?.name) return facility.name
    }
    if (selectedRegionId) {
      const city = AZERIA_MAP_HOTSPOTS.find((h) => h.regionId === selectedRegionId)?.cityLabel
      if (city) return city
      return AZERIA_WORLD_REGION_MAP[selectedRegionId]?.name ?? '艾泽利亚'
    }
    return '艾泽利亚'
  }, [activeSession, selectedRegionId, selectedFacilityId, facilityPlayPageOpen])
}
