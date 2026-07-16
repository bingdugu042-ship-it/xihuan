import type { HPhase } from '@/types'

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

/** 入场生成的开场套话——若仍出现在状态栏，说明本回合未真正刷新 */
export function isStaleSpawnNpcStatus(text?: string): boolean {
  if (!text?.trim()) return true
  return /尚未进入状态|对位来开场|体验推到最舒服|气场……值得好好试探|把节奏交给自己来引导/.test(
    text,
  )
}

function stripReplyForStatus(text: string): string {
  return text
    .replace(/\*[^*]+\*/g, ' ')
    .replace(/（[^）]*）/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function bodyFromPhase(hPhase?: HPhase): string {
  switch (hPhase) {
    case 'foreplay':
      return '呼吸略沉，指尖有意无意蹭过你的衣缘，眼神变热。'
    case 'main':
      return '体温升高，肌肉绷紧，呼吸和动作都贴着你的节奏。'
    case 'climax':
      return '呼吸乱了，肌肉发颤，几乎压不住当下的冲动。'
    case 'afterglow':
      return '喘息未平，身体松下来，却仍贴着余温不愿松开。'
    default:
      return '神情跟着对话微微变了，肩膀放松，目光落在你身上。'
  }
}

/**
 * 解析本回合欲望/内心/身体。
 * AI 漏写或仍返回入场套话时，根据本回合回复与阶段推导，保证状态栏会动。
 */
export function resolveNpcStatusFields(params: {
  text: string
  npcDesire?: string
  npcInnerThought?: string
  npcBodyState?: string
  prev?: { desire?: string; innerThought?: string; bodyState?: string }
  hPhase?: HPhase
}): { npcDesire: string; npcInnerThought: string; npcBodyState: string } {
  const beat = stripReplyForStatus(params.text)
  const snippet = clip(beat || '……', 48)

  const pick = (ai?: string, prev?: string, fallback?: string) => {
    const a = ai?.trim()
    if (a && !isStaleSpawnNpcStatus(a)) return clip(a, 180)
    if (fallback) return clip(fallback, 180)
    const p = prev?.trim()
    if (p && !isStaleSpawnNpcStatus(p)) return clip(p, 180)
    return clip(fallback || '—', 180)
  }

  const desireFallback = `这一拍还想把气氛再往前推——${snippet}`
  const innerFallback = `（心里跟着这句转）…${snippet}`
  const bodyFallback = bodyFromPhase(params.hPhase)

  return {
    npcDesire: pick(params.npcDesire, params.prev?.desire, desireFallback),
    npcInnerThought: pick(params.npcInnerThought, params.prev?.innerThought, innerFallback),
    npcBodyState: pick(params.npcBodyState, params.prev?.bodyState, bodyFallback),
  }
}
