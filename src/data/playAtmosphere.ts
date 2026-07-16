/**
 * 局内色情程度 / 探索风格（西幻）
 */

export type EroticIntensity = 'light' | 'medium' | 'high' | 'extreme'
export type ExploreStyle = 'free' | 'guided'

export const EROTIC_INTENSITY_OPTIONS: { id: EroticIntensity; label: string }[] = [
  { id: 'light', label: '轻' },
  { id: 'medium', label: '中' },
  { id: 'high', label: '高' },
  { id: 'extreme', label: '极致' },
]

export const EXPLORE_STYLE_OPTIONS: { id: ExploreStyle; label: string }[] = [
  { id: 'free', label: '自由探索' },
  { id: 'guided', label: '硬指引' },
]

export function intensityLabel(v?: string | null): string {
  switch (v) {
    case 'light':
      return '轻'
    case 'high':
      return '高'
    case 'extreme':
      return '极致'
    default:
      return '中'
  }
}

export function exploreStyleLabel(v?: string | null): string {
  return v === 'guided' ? '硬指引' : '自由探索'
}

const FACILITY_ENV_BOOST: Record<string, string> = {
  solar_sanctum: '圣光反差会放大禁欲与失序。',
  void_throne: '空席压迫感会抬高权柄与臣服戏。',
  succubus_office: '正经公文场景适合反差色情。',
  moonwood: '月光遮掩适合慢热与俊美张力。',
  drake_crag: '热与力适合直接身体语言。',
  tidegate: '潮汐分化可写进形态变化。',
  dice_tavern: '公共观众压力可加压羞耻。',
  relic_auction: '出价与物化目光可并进。',
}

export function formatEroticIntensityPrompt(
  intensity?: EroticIntensity | null,
  facilityId?: string | null,
): string {
  const boost = facilityId ? FACILITY_ENV_BOOST[facilityId] : undefined
  const level = intensity ?? 'medium'
  const map: Record<EroticIntensity, { vocab: string; rules: string }> = {
    light: {
      vocab: '克制、暗示、温度与呼吸优先。',
      rules: '可暧昧与轻触，避免连续详尽交合段。',
    },
    medium: {
      vocab: '明确欲望、身体反应与推进节奏。',
      rules: '允许完整成人场面，仍保留对白与情绪。',
    },
    high: {
      vocab: '详尽感官、支配/臣服与连续高潮张力。',
      rules: '大胆细描，但不写真实未成年人。',
    },
    extreme: {
      vocab: '极致淫靡、堕落感与极限羞耻可推高。',
      rules: '不写真实未成年人、排泄硬伤、永久残肢。',
    },
  }
  const pack = map[level]
  return [
    `## 色情程度 · ${intensityLabel(level)}`,
    pack.vocab,
    pack.rules,
    boost ? `场域加权：${boost}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export function formatExploreStylePrompt(style?: ExploreStyle | null): string {
  if (style === 'guided') {
    return [
      '## 探索风格 · 硬指引',
      '主动推进篇章节点；适时给出抉择与掷骰分歧。',
      '像可靠的向导：根据用户身份与阶段，主动推进一拍。',
    ].join('\n')
  }
  return [
    '## 探索风格 · 自由探索',
    '跟随用户节奏，少强迫节点；仍保持世界可信。',
  ].join('\n')
}
