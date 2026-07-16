import { create } from 'zustand'
import { FACILITIES } from '@/data/facilities'
import { getPassportData, putPassportData } from '@/storage/db'
import {
  CONQUEST_DEPENDENCE_THRESHOLD,
  CONQUEST_FAVOR_THRESHOLD,
  CULTIVATION_DEFAULT,
  clampCultivation,
  type CultivationStats,
} from '@/data/cultivation'
import { DEFAULT_HOME_PRESET_ID, HOME_SIZE_LIMIT, PARTY_SIZE_LIMIT } from '@/data/homes'
import type { BondPlacement, BondRecord, BondStatus, PassportData, SavedNpc, StampRecord } from '@/types'

export type { SavedNpc }

interface PassportStore {
  stamps: Record<string, StampRecord>
  roster: SavedNpc[]
  bonds: Record<string, BondRecord>
  partyIds: string[]
  homeIds: string[]
  cultivation: CultivationStats
  homePresetId: string
  loaded: boolean
  load: () => Promise<void>
  stampCount: () => number
  conqueredCount: () => number
  hasStamp: (facilityId: string) => boolean
  addStamp: (facilityId: string, memory?: Partial<StampRecord>) => Promise<void>
  saveNpc: (npc: Omit<SavedNpc, 'id' | 'savedAt' | 'lastSeenAt'> & { id?: string }) => Promise<SavedNpc>
  brandNpc: (id: string) => Promise<void>
  removeNpc: (id: string) => Promise<void>
  setStampMemory: (facilityId: string, memory: Partial<StampRecord>) => Promise<void>
  clearStamps: () => Promise<void>
  upsertBond: (bond: BondRecord) => Promise<void>
  setBondStatus: (characterId: string, status: BondStatus, patch?: Partial<BondRecord>) => Promise<void>
  placeBond: (characterId: string, placement: BondPlacement) => Promise<{ ok: boolean; reason?: string }>
  tryConquer: (params: {
    characterId: string
    displayName: string
    raceId: string
    favor: number
    dependence: number
  }) => Promise<boolean>
  bumpCultivation: (delta: Partial<CultivationStats>) => Promise<void>
  setHomePreset: (presetId: string) => Promise<void>
}

function persist(get: () => PassportStore) {
  const s = get()
  const data: PassportData = {
    stamps: s.stamps,
    roster: s.roster,
    bonds: s.bonds,
    partyIds: s.partyIds,
    homeIds: s.homeIds,
    cultivation: s.cultivation,
    homePresetId: s.homePresetId,
  }
  return putPassportData(data)
}

export const usePassportStore = create<PassportStore>((set, get) => ({
  stamps: {},
  roster: [],
  bonds: {},
  partyIds: [],
  homeIds: [],
  cultivation: { ...CULTIVATION_DEFAULT },
  homePresetId: DEFAULT_HOME_PRESET_ID,
  loaded: false,

  load: async () => {
    const data = await getPassportData()
    set({
      stamps: data.stamps ?? {},
      roster: data.roster ?? [],
      bonds: data.bonds ?? {},
      partyIds: data.partyIds ?? [],
      homeIds: data.homeIds ?? [],
      cultivation: { ...CULTIVATION_DEFAULT, ...(data.cultivation ?? {}) },
      homePresetId: data.homePresetId ?? DEFAULT_HOME_PRESET_ID,
      loaded: true,
    })
  },

  stampCount: () => Object.keys(get().stamps).length,

  conqueredCount: () => Object.values(get().bonds).filter((b) => b.status === 'conquered').length,

  hasStamp: (facilityId) => Boolean(get().stamps[facilityId]),

  addStamp: async (facilityId, memory) => {
    const existing = get().stamps[facilityId]
    const record: StampRecord = {
      ...existing,
      ...memory,
      obtainedAt: existing?.obtainedAt ?? Date.now(),
    }
    set({ stamps: { ...get().stamps, [facilityId]: record } })
    await persist(get)
  },

  saveNpc: async (npc) => {
    const entry: SavedNpc = {
      ...npc,
      id: npc.id ?? `npc_${Date.now()}`,
      branded: npc.branded ?? false,
      corruption: npc.corruption ?? 0,
      snapshot: npc.snapshot ?? {},
      savedAt: Date.now(),
      lastSeenAt: Date.now(),
    }
    const roster = [entry, ...get().roster.filter((r) => r.id !== entry.id)]
    set({ roster })
    await persist(get)
    const raceId = entry.raceId ?? 'demon'
    await get().upsertBond({
      characterId: entry.id,
      displayName: entry.displayName,
      raceId,
      status: entry.bondStatus ?? 'met',
      placement: entry.placement ?? 'none',
    })
    return entry
  },

  brandNpc: async (id) => {
    const roster = get().roster.map((r) =>
      r.id === id ? { ...r, branded: true, corruption: 100 } : r,
    )
    set({ roster })
    await persist(get)
    await get().setBondStatus(id, 'conquered', { conqueredAt: Date.now() })
  },

  removeNpc: async (id) => {
    const roster = get().roster.filter((r) => r.id !== id)
    const bonds = { ...get().bonds }
    delete bonds[id]
    set({
      roster,
      bonds,
      partyIds: get().partyIds.filter((x) => x !== id),
      homeIds: get().homeIds.filter((x) => x !== id),
    })
    await persist(get)
  },

  setStampMemory: async (facilityId, memory) => {
    const existing = get().stamps[facilityId]
    if (!existing) return
    set({
      stamps: {
        ...get().stamps,
        [facilityId]: { ...existing, ...memory },
      },
    })
    await persist(get)
  },

  clearStamps: async () => {
    set({ stamps: {} })
    await persist(get)
  },

  upsertBond: async (bond) => {
    set({ bonds: { ...get().bonds, [bond.characterId]: { ...get().bonds[bond.characterId], ...bond } } })
    await persist(get)
  },

  setBondStatus: async (characterId, status, patch) => {
    const prev = get().bonds[characterId]
    if (!prev && !patch?.displayName) return
    const next: BondRecord = {
      characterId,
      displayName: patch?.displayName ?? prev?.displayName ?? characterId,
      raceId: patch?.raceId ?? prev?.raceId ?? 'demon',
      status,
      placement: patch?.placement ?? prev?.placement ?? 'none',
      favorPeak: patch?.favorPeak ?? prev?.favorPeak,
      conqueredAt: status === 'conquered' ? (patch?.conqueredAt ?? Date.now()) : prev?.conqueredAt,
      memoryText: patch?.memoryText ?? prev?.memoryText,
      memoryImage: patch?.memoryImage ?? prev?.memoryImage,
    }
    set({ bonds: { ...get().bonds, [characterId]: next } })
    await persist(get)
  },

  placeBond: async (characterId, placement) => {
    const bond = get().bonds[characterId]
    if (!bond || bond.status !== 'conquered') {
      return { ok: false, reason: '仅已攻略男主可编入队伍或家园' }
    }
    let partyIds = get().partyIds.filter((id) => id !== characterId)
    let homeIds = get().homeIds.filter((id) => id !== characterId)
    if (placement === 'party') {
      if (partyIds.length >= PARTY_SIZE_LIMIT) return { ok: false, reason: `队伍最多 ${PARTY_SIZE_LIMIT} 人` }
      partyIds = [...partyIds, characterId]
    } else if (placement === 'home') {
      if (homeIds.length >= HOME_SIZE_LIMIT) return { ok: false, reason: `家园最多 ${HOME_SIZE_LIMIT} 人` }
      homeIds = [...homeIds, characterId]
    }
    set({
      partyIds,
      homeIds,
      bonds: {
        ...get().bonds,
        [characterId]: { ...bond, placement },
      },
    })
    await persist(get)
    return { ok: true }
  },

  tryConquer: async ({ characterId, displayName, raceId, favor, dependence }) => {
    if (favor < CONQUEST_FAVOR_THRESHOLD || dependence < CONQUEST_DEPENDENCE_THRESHOLD) return false
    await get().upsertBond({
      characterId,
      displayName,
      raceId,
      status: 'conquered',
      placement: get().bonds[characterId]?.placement ?? 'none',
      favorPeak: favor,
      conqueredAt: Date.now(),
    })
    return true
  },

  bumpCultivation: async (delta) => {
    const cur = get().cultivation
    const next: CultivationStats = {
      allure: clampCultivation(cur.allure + (delta.allure ?? 0)),
      dominion: clampCultivation(cur.dominion + (delta.dominion ?? 0)),
      bloodbond: clampCultivation(cur.bloodbond + (delta.bloodbond ?? 0)),
      intimacy: clampCultivation(cur.intimacy + (delta.intimacy ?? 0)),
    }
    set({ cultivation: next })
    await persist(get)
  },

  setHomePreset: async (presetId) => {
    set({ homePresetId: presetId })
    await persist(get)
  },
}))

/** @deprecated 兼容旧名 —— 使用 usePassportStore */
export const useBondStore = usePassportStore

export function allFacilityIds() {
  return FACILITIES.map((f) => f.id)
}
