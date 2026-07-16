import { FACILITIES, FACILITY_MAP } from '@/data/facilities'
import {
  AZERIA_REGIONS,
  FACILITY_TO_AZERIA,
  resolveAzeriaRegion,
  type AzeriaRegionId,
} from '@/worldview/azeriaRegionMap'
import { usePassportStore } from '@/store/passportStore'
import { useDataStore } from '@/store/dataStore'

export function formatMapPanel(currentFacilityId?: string | null): string {
  const current = currentFacilityId ? resolveAzeriaRegion(currentFacilityId) : undefined
  const lines = [
    '┌──────── 艾泽利亚 · 大地图 ────────┐',
    current ? `│ 当前：${current.name}（${current.danger}）` : '│ 当前：未进入冒险域',
    '├──────────────────────────────────┤',
  ]
  for (const region of Object.values(AZERIA_REGIONS)) {
    const facilityId = Object.entries(FACILITY_TO_AZERIA).find(([, id]) => id === region.id)?.[0]
    const facilityName = facilityId ? FACILITY_MAP[facilityId]?.name : '—'
    const here = current?.id === region.id ? ' ◀' : ''
    lines.push(`│ ${region.name.padEnd(6, ' ')} ${region.danger} · ${facilityName}${here}`)
  }
  lines.push('└──────────────────────────────────┘')
  lines.push('使用 $移动 {区域名} 前往对应冒险入口。')
  return lines.join('\n')
}

export function formatRegionPanel(facilityId?: string | null): string {
  const region = resolveAzeriaRegion(facilityId)
  const facility = facilityId ? FACILITY_MAP[facilityId] : undefined
  if (!region && !facility) return '尚未定位到任何区域。请先进入冒险域或使用 $移动。'
  return [
    `区域：${region?.name ?? '—'}`,
    `环境：${region?.env ?? facility?.scene ?? '—'}`,
    `危险：${region?.danger ?? '—'}`,
    `冒险入口：${facility?.name ?? '—'}`,
    `遭遇表：${region?.encounterSectionTitle ?? '—'}`,
  ].join('\n')
}

export function formatPartyPanel(): string {
  const { partyIds, bonds, roster } = usePassportStore.getState()
  const chars = useDataStore.getState().getAllCharacters()
  const lines = ['┌──────── 队伍编成（上限 4）────────┐']
  if (partyIds.length === 0) {
    lines.push('│ （空）可在图鉴将已攻略男主编入队伍      │')
  } else {
    for (const id of partyIds) {
      const bond = bonds[id]
      const npc = roster.find((r) => r.id === id)
      const card = chars[id]
      const name = bond?.displayName ?? npc?.displayName ?? card?.name ?? id
      const favor = bond?.favorPeak ?? '—'
      lines.push(`│ ${name} · 好感峰值 ${favor}`)
    }
  }
  lines.push('└──────────────────────────────────┘')
  return lines.join('\n')
}

export function resolveMoveTarget(query: string): {
  facilityId: string
  regionName: string
  facilityName: string
  azeriaRegionId?: AzeriaRegionId
} | null {
  const q = query.trim()
  if (!q) return null

  for (const region of Object.values(AZERIA_REGIONS)) {
    if (region.name.includes(q) || q.includes(region.name) || region.id.includes(q)) {
      const facilityId = Object.entries(FACILITY_TO_AZERIA).find(([, id]) => id === region.id)?.[0]
      if (facilityId) {
        return {
          facilityId,
          regionName: region.name,
          facilityName: FACILITY_MAP[facilityId]?.name ?? facilityId,
          azeriaRegionId: region.id,
        }
      }
    }
  }

  for (const f of FACILITIES) {
    if (f.name.includes(q) || q.includes(f.name) || f.id.includes(q)) {
      const regionId = FACILITY_TO_AZERIA[f.id] as AzeriaRegionId | undefined
      return {
        facilityId: f.id,
        regionName: regionId ? AZERIA_REGIONS[regionId].name : f.name,
        facilityName: f.name,
        azeriaRegionId: regionId,
      }
    }
  }

  return null
}
