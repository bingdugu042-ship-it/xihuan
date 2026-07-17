import { create } from 'zustand'
import type { Region } from '../types'
import { listCustomRegions, putCustomRegion, deleteCustomRegion, genId } from '../storage/db'

interface CustomRegionInput {
  name: string
  premise: string
  participantIds: string[]
  type: 'private' | 'group'
  description?: string
  mapNote?: string
  mapStyle?: string
  mapX?: number
  mapY?: number
  worldbook?: string
}

interface CustomRegionStore {
  regions: Region[]
  loaded: boolean
  load: () => Promise<void>
  add: (data: CustomRegionInput) => Promise<Region>
  update: (id: string, patch: Partial<CustomRegionInput>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useCustomRegionStore = create<CustomRegionStore>((set, get) => ({
  regions: [],
  loaded: false,

  load: async () => {
    const regions = await listCustomRegions()
    set({ regions, loaded: true })
  },

  add: async (data) => {
    const region: Region = {
      id: genId('rgn'),
      worldId: 'aetherion',
      name: data.name,
      premise: data.premise,
      description: data.description?.trim() || data.premise || '用户自定义线下地点',
      sceneBg: '',
      defaultParticipants: data.participantIds,
      type: data.type,
      category: 'offline',
      custom: true,
      mapNote: data.mapNote,
      mapStyle: data.mapStyle,
      mapX: data.mapX,
      mapY: data.mapY,
      worldbook:
        data.worldbook?.trim() ||
        `【自定义地点 · ${data.name}】\n位置/角标：${data.mapNote || '未标注'}\n样式：${data.mapStyle || '未定'}\n${data.premise}`,
    }
    await putCustomRegion(region)
    set((s) => ({ regions: [...s.regions, region] }))
    return region
  },

  update: async (id, patch) => {
    const prev = get().regions.find((r) => r.id === id)
    if (!prev) return
    const next: Region = {
      ...prev,
      name: patch.name ?? prev.name,
      premise: patch.premise ?? prev.premise,
      description: patch.description ?? prev.description,
      defaultParticipants: patch.participantIds ?? prev.defaultParticipants,
      type: patch.type ?? prev.type,
      mapNote: patch.mapNote ?? prev.mapNote,
      mapStyle: patch.mapStyle ?? prev.mapStyle,
      mapX: patch.mapX ?? prev.mapX,
      mapY: patch.mapY ?? prev.mapY,
      worldbook: patch.worldbook ?? prev.worldbook,
    }
    await putCustomRegion(next)
    set((s) => ({ regions: s.regions.map((r) => (r.id === id ? next : r)) }))
  },

  remove: async (id) => {
    await deleteCustomRegion(id)
    set((s) => ({ regions: s.regions.filter((r) => r.id !== id) }))
  },
}))

export function mergeRegions(
  staticRegions: Record<string, Region>,
  custom: Region[],
): Record<string, Region> {
  return { ...staticRegions, ...Object.fromEntries(custom.map((r) => [r.id, r])) }
}
