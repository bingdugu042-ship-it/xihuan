import { create } from 'zustand'
import type { UserProfile } from '../types'
import { listProfiles, putProfile, deleteProfile, genId } from '../storage/db'

const MAX_PROFILES = 3

interface ProfileStore {
  profiles: UserProfile[]
  loaded: boolean
  load: () => Promise<void>
  createProfile: (data: Omit<UserProfile, 'id' | 'createdAt' | 'coins'> & { coins?: number }) => Promise<UserProfile | null>
  updateProfile: (id: string, patch: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => Promise<void>
  removeProfile: (id: string) => Promise<void>
  spendCoins: (profileId: string, amount: number) => Promise<boolean>
  earnCoins: (profileId: string, amount: number) => Promise<void>
  canCreate: () => boolean
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profiles: [],
  loaded: false,

  load: async () => {
    const raw = await listProfiles()
    const profiles = raw.map((p) => ({ ...p, coins: p.coins ?? 500 }))
    set({ profiles, loaded: true })
  },

  createProfile: async (data) => {
    if (get().profiles.length >= MAX_PROFILES) return null
    const profile: UserProfile = {
      ...data,
      coins: data.coins ?? 500,
      id: genId('prof'),
      createdAt: Date.now(),
    }
    await putProfile(profile)
    set((s) => ({ profiles: [...s.profiles, profile] }))
    return profile
  },

  updateProfile: async (id, patch) => {
    const existing = get().profiles.find((p) => p.id === id)
    if (!existing) return
    const next = { ...existing, ...patch }
    await putProfile(next)
    set((s) => ({ profiles: s.profiles.map((p) => (p.id === id ? next : p)) }))
  },

  removeProfile: async (id) => {
    await deleteProfile(id)
    set((s) => ({ profiles: s.profiles.filter((p) => p.id !== id) }))
  },

  spendCoins: async (profileId, amount) => {
    const p = get().profiles.find((x) => x.id === profileId)
    if (!p || p.coins < amount) return false
    await get().updateProfile(profileId, { coins: p.coins - amount })
    return true
  },

  earnCoins: async (profileId, amount) => {
    const p = get().profiles.find((x) => x.id === profileId)
    if (!p || amount <= 0) return
    await get().updateProfile(profileId, { coins: p.coins + Math.round(amount) })
  },

  canCreate: () => get().profiles.length < MAX_PROFILES,
}))
