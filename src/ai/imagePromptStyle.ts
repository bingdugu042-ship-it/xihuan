/**
 * 艾泽利亚生图风格规范（规则书驱动）
 * 所有经 contentClient / 留影石 / 合照的提示词都会套用本层。
 */

/** 正面风格锚点 · 半写实西幻、高细节、电影光 */
export const AZERIA_IMAGE_STYLE_POSITIVE = [
  'western high fantasy illustration',
  'semi-realistic anime style',
  'cinematic lighting',
  'high detail',
  'rich atmosphere',
  'painterly texture',
  'medieval fantasy costumes',
  'Azeria continent lore-accurate',
].join(', ')

/** 负面限制 · 避免现代/低幼/崩坏构图 */
export const AZERIA_IMAGE_STYLE_NEGATIVE = [
  'modern clothing',
  'smartphone',
  'car',
  'skyscraper',
  'low quality',
  'blurry',
  'deformed hands',
  'extra limbs',
  'text',
  'watermark',
  'logo',
  'chibi',
  'cute sticker style',
  'overly glossy plastic skin',
  'purple neon cyberpunk',
].join(', ')

export type ImagePromptKind = 'world_map' | 'region' | 'character' | 'photo' | 'generic'

export interface ComposedImagePrompt {
  prompt: string
  negative: string
  kind: ImagePromptKind
}

/** 将用户/场景描述套入规则书风格壳 */
export function composeAzeriaImagePrompt(
  subject: string,
  kind: ImagePromptKind = 'generic',
  extra?: string,
): ComposedImagePrompt {
  const framing =
    kind === 'world_map'
      ? 'top-down fantasy continent map, labeled regions optional as subtle landmarks, parchment border, epic scale'
      : kind === 'region'
        ? 'landscape establishing shot, no modern elements, immersive environment, wide vista'
        : kind === 'character'
          ? 'single male character portrait, waist-up or full body, clear face, standing pose, clean background soft bokeh'
          : kind === 'photo'
            ? 'group portrait composition, adventure aftermath mood'
            : 'fantasy scene'

  const prompt = [AZERIA_IMAGE_STYLE_POSITIVE, framing, subject.trim(), extra?.trim()]
    .filter(Boolean)
    .join(', ')
    .slice(0, 2800)

  return {
    prompt,
    negative: AZERIA_IMAGE_STYLE_NEGATIVE,
    kind,
  }
}

/** 部分兼容 API 只吃单字符串：把 negative 缩写进提示尾注 */
export function flattenPromptForApi(composed: ComposedImagePrompt, maxLen = 900): string {
  const negHint = `Avoid: ${composed.negative}`
  const full = `${composed.prompt}. ${negHint}`
  return full.slice(0, maxLen)
}
