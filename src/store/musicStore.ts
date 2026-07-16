import { create } from 'zustand'
import type { MusicTrack } from '../types'
import { listMusicTracks, putMusicTrack, deleteMusicTrack, genId } from '../storage/db'

interface MusicStore {
  tracks: MusicTrack[]
  loaded: boolean
  playingId: string | null
  isPaused: boolean
  orbVisible: boolean
  load: () => Promise<void>
  addTrack: (name: string, src: string) => Promise<MusicTrack>
  removeTrack: (id: string) => Promise<void>
  playTrack: (id: string) => void
  togglePause: () => void
  pauseAll: () => void
  stopAll: () => void
  setOrbVisible: (v: boolean) => void
}

export const useMusicStore = create<MusicStore>((set) => ({
  tracks: [],
  loaded: false,
  playingId: null,
  isPaused: true,
  orbVisible: false,

  load: async () => {
    const tracks = await listMusicTracks()
    set({ tracks, loaded: true })
  },

  addTrack: async (name, src) => {
    const track: MusicTrack = { id: genId('mus'), name, src, createdAt: Date.now() }
    await putMusicTrack(track)
    set((s) => ({ tracks: [track, ...s.tracks] }))
    return track
  },

  removeTrack: async (id) => {
    await deleteMusicTrack(id)
    set((s) => ({
      tracks: s.tracks.filter((t) => t.id !== id),
      playingId: s.playingId === id ? null : s.playingId,
      isPaused: s.playingId === id ? true : s.isPaused,
      orbVisible: s.playingId === id ? false : s.orbVisible,
    }))
  },

  playTrack: (id) => set({ playingId: id, isPaused: false, orbVisible: true }),

  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),

  pauseAll: () => set({ isPaused: true }),

  stopAll: () => set({ playingId: null, isPaused: true, orbVisible: false }),

  setOrbVisible: (v) => set({ orbVisible: v }),
}))

/** 全局音频元素，确保暂停/停止可靠 */
let sharedAudio: HTMLAudioElement | null = null

export function getSharedMusicAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio()
    sharedAudio.loop = true
    sharedAudio.preload = 'auto'
  }
  return sharedAudio
}

export function hardStopMusicAudio(): void {
  const a = sharedAudio
  if (!a) return
  a.pause()
  a.currentTime = 0
  a.removeAttribute('src')
  a.load()
}
