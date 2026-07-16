/** 配色方案：经典（暖/夜）| 西欧圣殿白金 */
export type ColorPalette = 'classic' | 'sanctum'

/**
 * theme.json 会把暗色 --c-bg 写进 :root inline；
 * 圣殿模式必须整套淡色系一并覆盖，否则输入框变「黑煤炭」+ 深墨字看不见。
 */
const SANCTUM_VARS: Record<string, string> = {
  '--c-bg': '#faf7f1',
  '--c-bg-soft': '#f3eee6',
  '--c-bg-elevated': '#ffffff',
  '--c-panel': 'rgba(255, 255, 255, 0.96)',
  '--c-glass': 'rgba(255, 255, 255, 0.96)',
  '--c-glass-border': 'rgba(90, 66, 24, 0.32)',
  '--c-border': 'rgba(90, 66, 24, 0.4)',
  '--c-text': '#0f0d0a',
  '--c-text-dim': '#2a241c',
  '--c-text-muted': '#4a4338',
  '--c-primary': '#5a4218',
  '--c-primary-soft': 'rgba(90, 66, 24, 0.14)',
  '--c-gold': '#6b5420',
  '--c-gold-soft': 'rgba(107, 84, 32, 0.16)',
  '--c-accent': '#6b3e2a',
  '--c-accent-soft': 'rgba(107, 62, 42, 0.14)',
  '--c-mint': '#2f4a38',
  '--c-mint-soft': 'rgba(47, 74, 56, 0.14)',
  '--c-bubble-mine': 'linear-gradient(145deg, #8a6a2e 0%, #5a4218 100%)',
  '--c-bubble-her': '#ffffff',
  '--c-bubble-text': '#0f0d0a',
  '--c-bubble-narrator': '#f3ede0',
  '--c-bubble-narrator-text': '#2a2214',
  '--immerse-ink': '#0f0d0a',
  '--immerse-ink-dim': '#2a241c',
  '--immerse-chrome': 'rgba(255, 252, 247, 0.92)',
  '--immerse-chrome-strong': 'rgba(255, 252, 247, 0.98)',
  '--immerse-chrome-border': 'rgba(90, 66, 24, 0.28)',
}

export function applyAmbiance(opts: {
  colorPalette?: ColorPalette | null
  lightOn?: boolean | null
}): void {
  const palette = opts.colorPalette ?? 'sanctum'
  const root = document.documentElement

  if (palette === 'sanctum') {
    root.dataset.ambiance = 'sanctum'
    root.dataset.palette = 'sanctum'
    root.style.colorScheme = 'light'
    for (const [k, v] of Object.entries(SANCTUM_VARS)) {
      root.style.setProperty(k, v)
    }
    return
  }

  root.dataset.palette = 'classic'
  root.dataset.ambiance = opts.lightOn ? 'warm' : 'gloom'
  root.style.colorScheme = opts.lightOn ? 'light' : 'dark'
  for (const k of Object.keys(SANCTUM_VARS)) {
    root.style.removeProperty(k)
  }
}

/** @deprecated 兼容旧调用：仅开灯时切经典暖/夜 */
export function applyAmbianceLight(lightOn: boolean): void {
  applyAmbiance({ colorPalette: 'classic', lightOn })
}
