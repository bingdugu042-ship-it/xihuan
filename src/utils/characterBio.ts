export function buildCharacterBio(c: {
  title: string
  background: string
  appearance?: string
  behavior?: string
  personality: string[]
}): string {
  const parts = [
    c.title,
    c.background,
    c.appearance,
    c.behavior,
    c.personality.length ? `性格：${c.personality.join(' · ')}` : '',
  ].filter(Boolean)
  return parts.join('\n\n')
}
