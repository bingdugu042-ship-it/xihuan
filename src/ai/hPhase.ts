/** H 四阶段状态机 — 规则书 §12.3 / §13.2 */

import type { HPhase } from '@/types'

export type HPhaseMode = 'soft' | 'hard'

export const H_PHASE_ORDER: HPhase[] = ['idle', 'foreplay', 'main', 'climax', 'afterglow']

export const H_PHASE_LABEL: Record<HPhase, string> = {
  idle: '空闲',
  foreplay: '前戏',
  main: '正戏',
  climax: '高潮',
  afterglow: '余韵',
}

export function nextHPhase(current: HPhase): HPhase {
  if (current === 'afterglow') return 'idle'
  const idx = H_PHASE_ORDER.indexOf(current)
  if (idx < 0) return 'foreplay'
  return H_PHASE_ORDER[Math.min(idx + 1, H_PHASE_ORDER.length - 1)]
}

/**
 * 解析 AI 提议的阶段。
 * - soft：接受任意合法阶段
 * - hard：每阶段至少 1 次玩家互动后才可前进一格，禁止跳阶段/倒退
 */
export function resolveHPhase(params: {
  mode: HPhaseMode
  current?: HPhase
  proposed?: HPhase
  playerTurnsInPhase: number
}): HPhase | undefined {
  const { mode, proposed, playerTurnsInPhase } = params
  const current = params.current ?? 'idle'

  // AI 未给阶段：玩家互动足够则软/硬都自动推进一格（避免永远卡在 idle）
  if (!proposed) {
    if (playerTurnsInPhase >= 2 && current !== 'afterglow') {
      return nextHPhase(current)
    }
    return current
  }

  if (proposed === current) return proposed

  if (mode === 'soft') return proposed

  // afterglow → idle 收尾
  if (current === 'afterglow' && proposed === 'idle') {
    return playerTurnsInPhase >= 1 ? 'idle' : current
  }

  const curIdx = H_PHASE_ORDER.indexOf(current)
  const propIdx = H_PHASE_ORDER.indexOf(proposed)
  if (curIdx < 0 || propIdx < 0) return current
  if (propIdx < curIdx) return current // 禁止倒退
  if (playerTurnsInPhase < 1) return current // 本阶段尚无玩家推进
  // 最多前进一格（即使 AI 跳到 climax）
  return nextHPhase(current)
}

export function buildHPhasePromptBlock(params: {
  mode: HPhaseMode
  current?: HPhase
  playerTurnsInPhase: number
}): string {
  const current = params.current ?? 'idle'
  const next = nextHPhase(current)
  const lines = [
    '',
    '## H 阶段推进',
    `模式：${params.mode === 'hard' ? '硬状态机' : '软引导'}`,
    `当前阶段：${H_PHASE_LABEL[current]}（${current}）`,
    '阶段顺序：空闲(idle) → 前戏(foreplay) → 正戏(main) → 高潮(climax) → 余韵(afterglow) → 可回 idle',
  ]

  if (params.mode === 'hard') {
    lines.push(
      `硬规则：JSON 的 hPhase 只能保持「${current}」或前进到下一阶段「${next}」。禁止跳阶段、禁止倒退。`,
      `本阶段玩家互动次数：${params.playerTurnsInPhase}；${params.playerTurnsInPhase < 1 ? '尚不足 1 次，禁止推进阶段。' : '可以推进到下一阶段。'}`,
      '每阶段至少一次玩家选项或明确表态后方可进入下一阶段。choices 最多 2 个；非 idle 时应尽量给选项。',
    )
  } else {
    lines.push(
      '软规则：可按情境设置 hPhase，仍建议按四阶段递进，不要无铺垫直接高潮。',
      'choices 最多 2 个。',
    )
  }

  lines.push(
    'JSON 字段 hPhase 取值：idle | foreplay | main | climax | afterglow',
    '可选 bodyStatDeltas：对玩家身体面板合法 key 的微调（整数 -3~+8，平常 +1~+3）',
    '可选 bodyStateLabels：{ "lower","stamina","mind" } 自然语言状态',
    '必填 npcDesire / npcInnerThought / npcBodyState：男主本拍欲望、内心、身体短句，须随对话变化',
  )

  return lines.join('\n')
}
