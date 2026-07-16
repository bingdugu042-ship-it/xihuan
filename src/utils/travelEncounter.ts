import { AZERIA_ENCOUNTER_TABLES } from '@/data/azeriaEncounters'
import type { AzeriaRegionId } from '@/worldview/azeriaRegionMap'
import { FACILITY_TO_AZERIA, AZERIA_REGIONS } from '@/worldview/azeriaRegionMap'
import { rollD20 } from '@/utils/dice'

export interface TravelEncounterResult {
  roll: number
  regionId: AzeriaRegionId
  regionName: string
  text: string
  critSuccess: boolean
  critFail: boolean
}

export function rollTravelEncounter(
  regionId: AzeriaRegionId,
  regionName: string,
): TravelEncounterResult {
  const roll = rollD20()
  const table = AZERIA_ENCOUNTER_TABLES[regionId]
  const band = table.find((b) => roll >= b.min && roll <= b.max)
  return {
    roll,
    regionId,
    regionName,
    text: band?.text ?? '旅途平静，未记录特殊遭遇。',
    critSuccess: roll === 20,
    critFail: roll === 1,
  }
}

export function formatTravelEncounterMessage(result: TravelEncounterResult): string {
  const tag = result.critSuccess ? '大成功' : result.critFail ? '大失败' : '遭遇'
  return [
    `【旅行遭遇 · ${result.regionName}】1d20=${result.roll} → ${tag}`,
    result.text,
    '下一条叙事必须体现此遭遇结果，不可无视或改写骰果。',
  ].join('\n')
}

export function formatTravelEncounterPrompt(result: TravelEncounterResult): string {
  return [
    '## 旅行遭遇掷骰（不可改写）',
    formatTravelEncounterMessage(result),
  ].join('\n')
}

/** 按冒险域 facilityId 掷旅行遭遇；非艾泽利亚映射区域返回 null */
export function rollTravelEncounterForFacility(facilityId: string): TravelEncounterResult | null {
  const regionId = FACILITY_TO_AZERIA[facilityId] as AzeriaRegionId | undefined
  if (!regionId) return null
  const region = AZERIA_REGIONS[regionId]
  return rollTravelEncounter(regionId, region.name)
}
