import { create } from 'zustand'
import type { Region } from '../types'
import { listCustomRegions, putCustomRegion, deleteCustomRegion, genId } from '../storage/db'

interface CustomRegionStore {
  regions: Region[]
  loaded: boolean
  load: () => Promise<void>
  add: (data: { name: string; premise: string; participantIds: string[]; type: 'private' | 'group' }) => Promise<Region>
  remove: (id: string) => Promise<void>
}

export const useCustomRegionStore = create<CustomRegionStore>((set) => ({
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
      description: '用户自定义线下地点',
      sceneBg: '',
      defaultParticipants: data.participantIds,
      type: data.type,
      category: 'offline',
      custom: true,
    }
    await putCustomRegion(region)
    set((s) => ({ regions: [...s.regions, region] }))
    return region
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
