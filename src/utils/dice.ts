/** d20 轻跑团：博德之门式分歧骰 */

import { modifierFromCultivation, type CultivationStats } from '@/data/cultivation'
import { modifierForSkill, type AdventureAttributes } from '@/data/adventureAttributes'

export type DiceSkill = 'persuasion' | 'intimidation' | 'allure' | 'combat' | 'finesse'

export const DICE_SKILL_LABELS: Record<DiceSkill, string> = {
  persuasion: '说服',
  intimidation: '威压',
  allure: '魅惑',
  combat: '战斗',
  finesse: '机巧',
}

export interface DiceCheck {
  skill: DiceSkill
  dc: number
}

export interface DiceRollResult {
  skill: DiceSkill
  skillLabel: string
  roll: number
  modifier: number
  cultivationModifier: number
  adventureModifier: number
  total: number
  dc: number
  success: boolean
  critSuccess: boolean
  critFail: boolean
}

export function rollD20(): number {
  return 1 + Math.floor(Math.random() * 20)
}

export function resolveCheck(
  check: DiceCheck,
  cultivation: CultivationStats,
  adventureAttrs?: AdventureAttributes | null,
): DiceRollResult {
  const roll = rollD20()
  const cultivationModifier = modifierFromCultivation(cultivation, check.skill)
  const adventureModifier = adventureAttrs ? modifierForSkill(adventureAttrs, check.skill) : 0
  const modifier = cultivationModifier + adventureModifier
  const total = roll + modifier
  const critSuccess = roll === 20
  const critFail = roll === 1
  const success = critSuccess || (!critFail && total >= check.dc)
  return {
    skill: check.skill,
    skillLabel: DICE_SKILL_LABELS[check.skill],
    roll,
    modifier,
    cultivationModifier,
    adventureModifier,
    total,
    dc: check.dc,
    success,
    critSuccess,
    critFail,
  }
}

export function formatDiceNarration(result: DiceRollResult): string {
  const mod = result.modifier >= 0 ? `+${result.modifier}` : `${result.modifier}`
  const verdict = result.critSuccess
    ? '大成功'
    : result.critFail
      ? '大失败'
      : result.success
        ? '成功'
        : '失败'
  return `【掷骰 · ${result.skillLabel}】d20=${result.roll} ${mod} → ${result.total} vs DC ${result.dc} → ${verdict}`
}

export function formatDicePromptBlock(result: DiceRollResult): string {
  return [
    '## 本轮掷骰结果（不可改写）',
    formatDiceNarration(result),
    result.success
      ? '剧情必须朝成功方向推进：对方让步/动摇/配合；可带羞耻或臣服色彩，但禁止事后推翻骰果。'
      : '剧情必须体现失败后果：受阻、反击、难堪或局势恶化；禁止硬拗成功。可用魅力余波减轻羞辱，但不可抹掉失败。',
  ].join('\n')
}
