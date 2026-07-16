import { create } from 'zustand'
import type { AppSettings, UISettings } from '../types'
import { getSettings, putSettings } from '../storage/db'

const DEFAULT_UI: UISettings = {
  themeId: 'default',
  layoutTemplate: 'classic',
  characterMode: 'chat',
  layoutMode: 'portrait',
  volume: 0.8,
  typingSpeed: 35,
  ageConfirmed: false,
  onboardingCompleted: false,
  cutscenePlayed: false,
  chatWidth: typeof window !== 'undefined' ? Math.min(390, Math.round(window.innerWidth)) : 390,
  chatHeight: typeof window !== 'undefined' ? Math.round(window.innerHeight) : 780,
  chatScale: 1,
  activeProfileId: null,
  lightOn: true,
  colorPalette: 'sanctum',
  phoneBackground: '',
  aiContextLength: 50,
  aiCreativity: 50,
  aiOutputLength: 55,
  aiResponseSpeed: 50,
  aiTopP: 80,
  aiFreshness: 40,
  characterEmojiEnabled: true,
  groupInterruptInterval: 3,
  hPhaseMode: 'soft',
  npcApiRefine: false,
  inviteVerified: false,
  inviteRole: undefined,
  inviteCodeUsed: undefined,
  azeriaDiceMode: 'mixed',
  azeriaDirtyTalkLevel: 'off',
  azeriaPublicMode: false,
  azeriaPregnancyEnabled: false,
  azeriaBodyImpactEnabled: true,
  azeriaChallengeMode: 'off',
  playerPreferences: {
    likes: '',
    dislikes: '',
    taboos: '',
    notes: '',
  },
}

const DEFAULT_SETTINGS: AppSettings = {
  api: {
    proxyURL: '',
    text: {
      baseURL: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o-mini',
    },
    image: {
      provider: 'openai',
      baseURL: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'dall-e-3',
    },
    tts: {
      provider: 'browser',
      baseURL: 'https://api.openai.com/v1',
      apiKey: '',
      voiceId: 'zh-CN-XiaoxiaoNeural',
      model: 'tts-1',
      sttModel: 'whisper-1',
    },
  },
  ui: DEFAULT_UI,
}

interface SettingsStore {
  settings: AppSettings
  loaded: boolean
  load: () => Promise<void>
  updateApi: (partial: Partial<AppSettings['api']>) => Promise<void>
  updateUI: (partial: Partial<UISettings>) => Promise<void>
  reset: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  load: async () => {
    const stored = await getSettings()
    const vh = typeof window !== 'undefined' ? Math.round(window.innerHeight) : 780
    const vw = typeof window !== 'undefined' ? Math.min(390, Math.round(window.innerWidth)) : 390
    if (stored) {
      const ui = { ...DEFAULT_UI, ...stored.ui }
      if (ui.chatHeight > vh) ui.chatHeight = vh
      if (ui.chatWidth > vw) ui.chatWidth = vw
      set({
        settings: {
          api: {
            ...DEFAULT_SETTINGS.api,
            ...stored.api,
            text: { ...DEFAULT_SETTINGS.api.text, ...stored.api?.text },
            image: { ...DEFAULT_SETTINGS.api.image, ...stored.api?.image },
            tts: { ...DEFAULT_SETTINGS.api.tts, ...stored.api?.tts },
            proxyURL: '',
          },
          ui,
        },
        loaded: true,
      })
    } else {
      set({ loaded: true })
    }
  },

  updateApi: async (partial) => {
    const next = {
      ...get().settings,
      api: { ...get().settings.api, ...partial },
    }
    set({ settings: next })
    await putSettings(next)
  },

  updateUI: async (partial) => {
    const next = {
      ...get().settings,
      ui: { ...get().settings.ui, ...partial },
    }
    set({ settings: next })
    await putSettings(next)
  },

  reset: async () => {
    set({ settings: DEFAULT_SETTINGS })
    await putSettings(DEFAULT_SETTINGS)
  },
}))
