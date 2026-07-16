/**
 * 冒险域世界书 —— 西幻内容内联（不再依赖西幻 worldbooks 目录）
 */
import { FACILITY_MAP } from './facilities'

export interface FacilityPlayModeBook {
  title: string
  description: string
}

export interface FacilityWorldbook {
  id: string
  name: string
  facilityNo: number
  scene: string
  stamp: string
  playModes: FacilityPlayModeBook[]
}

function fromFacility(id: string): FacilityWorldbook | undefined {
  const f = FACILITY_MAP[id]
  if (!f) return undefined
  return {
    id: f.id,
    name: f.name,
    facilityNo: f.no,
    scene: f.scene,
    stamp: f.stampName,
    playModes: f.playModes.map((title) => ({
      title,
      description: `在「${f.name}」推进「${title}」：感官、权力与亲和并进，尊重掷骰结果与身份锁定。`,
    })),
  }
}

export function getFacilityWorldbook(facilityId: string | undefined | null): FacilityWorldbook | undefined {
  if (!facilityId) return undefined
  return fromFacility(facilityId)
}

export function matchPlayMode(
  book: FacilityWorldbook,
  playMode?: string | null,
): FacilityPlayModeBook | undefined {
  if (!playMode?.trim()) return undefined
  const q = playMode.trim()
  const exact = book.playModes.find((m) => m.title === q)
  if (exact) return exact
  return book.playModes.find((m) => m.title.includes(q) || q.includes(m.title))
}

export function formatFacilityWorldbookPrompt(
  facilityId: string | undefined,
  playMode?: string | null,
): string {
  const book = getFacilityWorldbook(facilityId)
  if (!book) return ''
  const focused = matchPlayMode(book, playMode)
  const lines = [
    `## 冒险域世界书 · ${book.name}`,
    `场景：${book.scene}`,
    `契约印记：${book.stamp}（完成后仍可继续冒险）`,
  ]
  if (focused) {
    lines.push(`当前篇章：${focused.title}`, focused.description)
  } else {
    lines.push(`可选篇章：${book.playModes.map((m) => m.title).join(' / ')}`)
  }
  return lines.join('\n')
}

/** 旧 glob 已移除，保留空表以免外部引用报错 */
export const FACILITY_WORLDBOOKS: Record<string, FacilityWorldbook> = {}
