/**
 * 设施 lore — UI 展示用薄层。正文来自 game/worldbooks（规则书 §2.3）。
 * 保留本文件是为了兼容既有 import；勿再手写长设定。
 */
import { getFacilityWorldbook } from './facilityWorldbook'

export interface FacilityLore {
  scene: string
  modes: { title: string; desc: string }[]
  seal: string
}

export function getFacilityLore(id: string): FacilityLore {
  const book = getFacilityWorldbook(id)
  if (!book) return { scene: '', modes: [], seal: '' }
  return {
    scene: book.scene,
    modes: book.playModes.map((m) => ({ title: m.title, desc: m.description })),
    seal: book.stamp,
  }
}

/** @deprecated 请用 getFacilityLore / getFacilityWorldbook */
export const FACILITY_LORE: Record<string, FacilityLore> = new Proxy(
  {} as Record<string, FacilityLore>,
  {
    get(_t, prop: string) {
      return getFacilityLore(prop)
    },
  },
)
