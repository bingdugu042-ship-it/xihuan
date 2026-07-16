import type { UISettings } from '@/types'

const STYLE_ID = 'user-custom-colors'

export type CustomColors = NonNullable<UISettings['customColors']>

/** 聊天外观预设 */
export const CHAT_APPEARANCE_PRESETS: Array<{
  id: string
  label: string
  colors: CustomColors
}> = [
  {
    id: 'default',
    label: '默认海湾',
    colors: {},
  },
  {
    id: 'coral-soft',
    label: '珊瑚半透',
    colors: {
      bubbleMine: '#d96b7a',
      bubbleMineOpacity: 0.78,
      bubbleHer: '#ffffff',
      bubbleHerOpacity: 0.72,
      bubbleNarrator: '#f5b85c',
      bubbleNarratorOpacity: 0.45,
      bubbleNarratorText: '#8a5a12',
      chatBg: '#1c2f3a',
      chatBgOpacity: 0.22,
    },
  },
  {
    id: 'lagoon',
    label: '深蓝湾',
    colors: {
      bubbleMine: '#2a9ec4',
      bubbleMineOpacity: 0.88,
      bubbleHer: '#e8f6fb',
      bubbleHerOpacity: 0.82,
      bubbleNarrator: '#7ec8e3',
      bubbleNarratorOpacity: 0.4,
      bubbleNarratorText: '#0f4c5c',
      chatBg: '#0a1f2e',
      chatBgOpacity: 0.28,
    },
  },
  {
    id: 'ink',
    label: '墨色半透',
    colors: {
      bubbleMine: '#2c3038',
      bubbleMineOpacity: 0.72,
      bubbleHer: '#ffffff',
      bubbleHerOpacity: 0.55,
      bubbleNarrator: '#c9a86c',
      bubbleNarratorOpacity: 0.38,
      bubbleNarratorText: '#5c4a28',
      chatBg: '#12151c',
      chatBgOpacity: 0.35,
    },
  },
  {
    id: 'rose-glass',
    label: '玫瑰玻璃',
    colors: {
      bubbleMine: '#e8919a',
      bubbleMineOpacity: 0.65,
      bubbleHer: '#fff5f6',
      bubbleHerOpacity: 0.68,
      bubbleNarrator: '#f0c4a8',
      bubbleNarratorOpacity: 0.5,
      bubbleNarratorText: '#7a4a3a',
      chatBg: '#3a2030',
      chatBgOpacity: 0.2,
    },
  },
  {
    id: 'clear',
    label: '高透清爽',
    colors: {
      bubbleMine: '#2a9ec4',
      bubbleMineOpacity: 0.45,
      bubbleHer: '#ffffff',
      bubbleHerOpacity: 0.42,
      bubbleNarrator: '#f5b85c',
      bubbleNarratorOpacity: 0.32,
      bubbleNarratorText: '#6b4a10',
      chatBg: '#1c2f3a',
      chatBgOpacity: 0.12,
    },
  },
]

function clamp01(n: number | undefined, fallback = 1): number {
  if (typeof n !== 'number' || Number.isNaN(n)) return fallback
  return Math.min(1, Math.max(0.12, n))
}

/** #rgb / #rrggbb → rgba(...) */
export function colorWithOpacity(color: string, opacity: number): string {
  const c = color.trim()
  if (c.startsWith('rgba(') || c.startsWith('rgb(') || c.startsWith('linear-gradient')) {
    return c
  }
  let hex = c.replace('#', '')
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((ch) => ch + ch)
      .join('')
  }
  if (hex.length !== 6) return c
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${clamp01(opacity)})`
}

/** 应用用户拖拽色板的配色覆盖 */
export function applyCustomColors(colors?: UISettings['customColors']): void {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!colors || Object.keys(colors).length === 0) {
    if (el) el.remove()
    return
  }
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ID
    document.head.appendChild(el)
  }
  const lines: string[] = [':root {']
  if (colors.bg) {
    lines.push(`  --c-bg: ${colors.bg};`)
    lines.push(`  --bg-gradient: linear-gradient(180deg, ${colors.bg} 0%, ${colors.bg} 100%);`)
  }
  if (colors.text) {
    lines.push(`  --c-text: ${colors.text};`)
    lines.push(`  --c-bubble-text: ${colors.text};`)
  }
  if (colors.accent) {
    lines.push(`  --c-primary: ${colors.accent};`)
    lines.push(`  --c-accent: ${colors.accent};`)
  }
  if (colors.bubbleMine) {
    lines.push(
      `  --c-bubble-mine: ${colorWithOpacity(colors.bubbleMine, clamp01(colors.bubbleMineOpacity, 0.88))};`,
    )
  }
  if (colors.bubbleHer) {
    lines.push(
      `  --c-bubble-her: ${colorWithOpacity(colors.bubbleHer, clamp01(colors.bubbleHerOpacity, 0.82))};`,
    )
  }
  if (colors.bubbleNarrator) {
    lines.push(
      `  --c-bubble-narrator: ${colorWithOpacity(colors.bubbleNarrator, clamp01(colors.bubbleNarratorOpacity, 0.42))};`,
    )
  }
  if (colors.bubbleNarratorText) {
    lines.push(`  --c-bubble-narrator-text: ${colors.bubbleNarratorText};`)
  }
  if (colors.chatBg) {
    lines.push(
      `  --c-chat-bg-tint: ${colorWithOpacity(colors.chatBg, clamp01(colors.chatBgOpacity, 0.22))};`,
    )
  }
  lines.push('}')
  el.textContent = lines.join('\n')
}
