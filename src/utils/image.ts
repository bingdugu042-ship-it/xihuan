import type { CharacterCard } from '@/types'

/** 简易占位图：仅当无任何可用资源时使用 */
export function characterPlaceholder(name: string, seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  const h1 = h
  const h2 = (h + 60) % 360
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='720' viewBox='0 0 480 720'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0' stop-color='hsl(${h1}, 55%, 38%)'/>
        <stop offset='1' stop-color='hsl(${h2}, 50%, 18%)'/>
      </linearGradient>
    </defs>
    <rect width='480' height='720' fill='url(#g)'/>
    <text x='50%' y='46%' font-family='serif' font-size='64' fill='rgba(255,255,255,0.85)' text-anchor='middle' dominant-baseline='middle'>${name}</text>
    <text x='50%' y='54%' font-family='sans-serif' font-size='20' fill='rgba(255,255,255,0.5)' text-anchor='middle' dominant-baseline='middle'>立绘占位</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** 将 /assets/... 加上 Vite base（自定义域名 /，项目站 /-/） */
function withViteBase(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  const normalized = path.startsWith('/') ? path.slice(1) : path
  if (base === '/') return `/${normalized}`
  return `${base}${normalized}`
}

/** 静态资源路径（含 GitHub Pages base） */
export function normalizeAssetPath(src: string | undefined): string | undefined {
  if (!src?.trim()) return undefined
  const s = src.trim()
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s
  const cleaned = s.replace(/^\.\//, '')
  const absolute = cleaned.startsWith('/') ? cleaned : `/${cleaned}`
  return withViteBase(absolute)
}

/** 按优先级收集角色立绘/头像候选 URL（去重） */
export function getCharacterImageCandidates(
  character: CharacterCard,
  expressionKey?: string | null,
): string[] {
  const out: string[] = []
  const push = (p?: string) => {
    const n = normalizeAssetPath(p)
    if (n && !out.includes(n)) out.push(n)
  }

  const exprs = character.expressions ?? {}
  if (expressionKey) push(exprs[expressionKey])
  push(exprs[character.defaultExpression])
  push(exprs.normal)
  for (const p of Object.values(exprs)) push(p)
  push(character.avatar)

  // 约定式素材兜底：当 JSON 中 avatar/expressions 为空时仍可命中目录规范。
  // 对应 plan：`public/assets/characters/{id}/normal.png` 与 `avatar.png`
  push(`/assets/characters/${character.id}/normal.png`)
  push(`/assets/characters/${character.id}/avatar.png`)

  return out
}

/** 解析角色立绘：优先真实图片，最后才占位 */
export function resolveCharacterPortrait(
  character: CharacterCard,
  expressionKey?: string | null,
): string {
  const candidates = getCharacterImageCandidates(character, expressionKey)
  return candidates[0] ?? characterPlaceholder(character.name, character.id)
}

/** @deprecated 请优先使用 resolveCharacterPortrait */
export function resolveImage(src: string | undefined, fallbackName: string, seed: string): string {
  const normalized = normalizeAssetPath(src)
  if (!normalized) return characterPlaceholder(fallbackName, seed)
  return normalized
}
