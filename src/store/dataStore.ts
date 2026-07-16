import { create } from 'zustand'
import type { CharacterCard, WorldBook, Region, ThemePack } from '../types'

interface DataState {
  characters: Record<string, CharacterCard>
  runtimeCharacters: Record<string, CharacterCard>
  worlds: Record<string, WorldBook>
  regions: Record<string, Region>
  theme: ThemePack | null
  loaded: boolean
  /** 当前选中的世界（单世界模板默认取第一个） */
  currentWorldId: string | null

  loadAll: () => Promise<void>
  registerRuntimeCharacter: (card: CharacterCard) => void
  getAllCharacters: () => Record<string, CharacterCard>
  getCharacter: (id: string) => CharacterCard | undefined
  getRegion: (id: string) => Region | undefined
  getWorld: (id: string) => WorldBook | undefined
}

/**
 * 从 game/ 目录加载静态数据包。
 * 用 Vite 的 import.meta.glob 在构建期把 JSON 全部内联，
 * 换皮时只需替换 game/ 目录内容，重新构建即可。
 */
const characterModules = import.meta.glob('/game/characters/*.json', {
  eager: true,
  import: 'default',
})
const worldModules = import.meta.glob('/game/worlds/*.json', {
  eager: true,
  import: 'default',
})
const regionModules = import.meta.glob('/game/regions/*.json', {
  eager: true,
  import: 'default',
})
const themeModule = import.meta.glob('/game/theme.json', {
  eager: true,
  import: 'default',
})

function indexById<T extends { id: string }>(mods: Record<string, unknown>): Record<string, T> {
  const out: Record<string, T> = {}
  for (const [path, mod] of Object.entries(mods)) {
    const data = mod as T
    if (data && data.id) {
      out[data.id] = data
    } else {
      console.warn(`[dataStore] ${path} 缺少 id 字段，已跳过`)
    }
  }
  return out
}

export const useDataStore = create<DataState>((set, get) => ({
  characters: {},
  runtimeCharacters: {},
  worlds: {},
  regions: {},
  theme: null,
  loaded: false,
  currentWorldId: null,

  loadAll: async () => {
    const characters = indexById<CharacterCard>(characterModules)
    const worlds = indexById<WorldBook>(worldModules)
    const regions = indexById<Region>(regionModules)
    const theme = (Object.values(themeModule)[0] as ThemePack) ?? null
    const currentWorldId = worlds.azeria ? 'azeria' : worlds.aetherion ? 'aetherion' : Object.keys(worlds)[0] ?? null

    set({ characters, worlds, regions, theme, currentWorldId, loaded: true })
  },

  registerRuntimeCharacter: (card) => {
    set((s) => ({
      runtimeCharacters: { ...s.runtimeCharacters, [card.id]: card },
    }))
  },

  getAllCharacters: () => ({ ...get().characters, ...get().runtimeCharacters }),

  getCharacter: (id) => get().runtimeCharacters[id] ?? get().characters[id],
  getRegion: (id) => get().regions[id],
  getWorld: (id) => get().worlds[id],
}))
