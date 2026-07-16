import type { ThemePack } from '../types'

/** 把 ThemePack 的颜色/字体注入 :root CSS 变量 */
export function applyTheme(theme: ThemePack): void {
  const root = document.documentElement
  const { colors, fonts } = theme
  const sanctum = root.dataset.ambiance === 'sanctum' || root.dataset.palette === 'sanctum'

  // 圣殿白金：只吃字体，不吃暗色主题的浅金字（否则菜单奶油底上看不清）
  if (!sanctum) {
    root.style.setProperty('--c-bg', colors.bg)
    root.style.setProperty('--c-bg-soft', colors.bgSoft)
    root.style.setProperty('--c-panel', colors.panel)
    root.style.setProperty('--c-primary', colors.primary)
    root.style.setProperty('--c-primary-soft', colors.primarySoft)
    root.style.setProperty('--c-text', colors.text)
    root.style.setProperty('--c-text-dim', colors.textDim)
    root.style.setProperty('--c-border', colors.border)
    root.style.setProperty('--c-bubble-mine', colors.bubbleMine)
    root.style.setProperty('--c-bubble-her', colors.bubbleHer)
    root.style.setProperty('--c-bubble-text', colors.bubbleText)
  }

  root.style.setProperty('--font-ui', fonts.ui)
  root.style.setProperty('--font-dialogue', fonts.dialogue)
}

/** 清除主题注入的 CSS 变量，回到 index.css 的默认值 */
export function clearTheme(): void {
  const root = document.documentElement
  const keys = [
    '--c-bg',
    '--c-bg-soft',
    '--c-panel',
    '--c-primary',
    '--c-primary-soft',
    '--c-text',
    '--c-text-dim',
    '--c-border',
    '--c-bubble-mine',
    '--c-bubble-her',
    '--c-bubble-text',
    '--font-ui',
    '--font-dialogue',
  ]
  for (const k of keys) root.style.removeProperty(k)
}
