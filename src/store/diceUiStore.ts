import { create } from 'zustand'
import type { DiceRollResult } from '@/utils/dice'
import { formatDiceNarration } from '@/utils/dice'
import { useSessionStore } from '@/store/sessionStore'

export interface DiceOverlayPayload {
  result: DiceRollResult
  title?: string
  /** 动画结束后写入聊天，默认 true */
  commitToChat?: boolean
}

interface DiceUiStore {
  open: boolean
  payload: DiceOverlayPayload | null
  skipAnimation: boolean
  show: (payload: DiceOverlayPayload) => void
  hide: () => void
  setSkipAnimation: (v: boolean) => void
}

export const useDiceUiStore = create<DiceUiStore>((set) => ({
  open: false,
  payload: null,
  skipAnimation: false,
  show: (payload) => set({ open: true, payload }),
  hide: () => set({ open: false, payload: null }),
  setSkipAnimation: (v) => set({ skipAnimation: v }),
}))

/** 播放骰子动画并在结束后 resolve */
export async function playDiceAnimation(payload: DiceOverlayPayload): Promise<DiceRollResult> {
  const store = useDiceUiStore.getState()
  if (store.skipAnimation) {
    if (payload.commitToChat !== false) {
      await useSessionStore.getState().appendSystemMessage(formatDiceNarration(payload.result), 'dice')
    }
    return payload.result
  }

  return new Promise((resolve) => {
    const onDone = (e: Event) => {
      const detail = (e as CustomEvent<DiceRollResult>).detail
      window.removeEventListener('azeria-dice-done', onDone)
      resolve(detail ?? payload.result)
    }
    window.addEventListener('azeria-dice-done', onDone)
    useDiceUiStore.getState().show(payload)
  })
}
