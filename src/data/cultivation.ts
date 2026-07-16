/** 轻养成四维 · 草案（可调） */

export type CultivationKey = 'allure' | 'dominion' | 'bloodbond' | 'intimacy'

export interface CultivationStats {
  allure: number
  dominion: number
  bloodbond: number
  intimacy: number
}

export const CULTIVATION_LABELS: Record<CultivationKey, { name: string; hint: string }> = {
  allure: { name: '魅力', hint: '万人迷本源 · 加成说服/魅惑骰' },
  dominion: { name: '权柄', hint: '堕神气场 · 加成威压骰' },
  bloodbond: { name: '血契', hint: '深渊羁绊 · 加成战斗/契约骰' },
  intimacy: { name: '宠溺', hint: '家园养成 · 加成亲密与依赖回写' },
}

/** 上限刻意压低 —— 「轻养成」 */
export const CULTIVATION_MAX = 20
export const CULTIVATION_DEFAULT: CultivationStats = {
  allure: 3,
  dominion: 2,
  bloodbond: 1,
  intimacy: 2,
}

/** 攻略成功：好感门槛草案 */
export const CONQUEST_FAVOR_THRESHOLD = 72
/** 依赖门槛草案 */
export const CONQUEST_DEPENDENCE_THRESHOLD = 55

export function clampCultivation(n: number): number {
  return Math.max(0, Math.min(CULTIVATION_MAX, Math.round(n)))
}

export function modifierFromCultivation(stats: CultivationStats, skill: string): number {
  switch (skill) {
    case 'persuasion':
      return Math.floor(stats.allure / 4)
    case 'allure':
      return Math.floor(stats.allure / 3) + Math.floor(stats.intimacy / 5)
    case 'intimidation':
      return Math.floor(stats.dominion / 3)
    case 'combat':
      return Math.floor(stats.bloodbond / 3) + Math.floor(stats.dominion / 5)
    case 'finesse':
      return Math.floor((stats.allure + stats.intimacy) / 8)
    default:
      return Math.floor(stats.allure / 5)
  }
}

export function formatCultivationPrompt(stats: CultivationStats): string {
  return [
    '## 堕神轻养成（当前）',
    `魅力 ${stats.allure}/${CULTIVATION_MAX} · 权柄 ${stats.dominion}/${CULTIVATION_MAX} · 血契 ${stats.bloodbond}/${CULTIVATION_MAX} · 宠溺 ${stats.intimacy}/${CULTIVATION_MAX}`,
    '成长缓慢：日常互动约 +0~1，关键事件/契约最多 +2。勿让数值跳变解释剧情崩坏。',
    '万人迷吸引力循序渐进：初期仅动摇心神，中期难抑接近欲，后期可引诸神主动堕落——但仍需铺垫。',
  ].join('\n')
}
