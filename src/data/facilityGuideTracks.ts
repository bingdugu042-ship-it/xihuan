/**
 * 8 冒险域 · 硬指引阶段轨
 * 每域固定：入场 → 聚焦玩法 → 深入 → 峰值 → 契约仪式
 * 玩法节点优先用入域所选 playMode；否则取 worldbook 前几个玩法标题。
 */

import { getFacilityWorldbook, matchPlayMode } from '@/data/facilityWorldbook'
import { FACILITY_MAP } from '@/data/facilities'

export interface GuideStage {
  id: string
  title: string
  /** 给 AI / UI 的短提示 */
  hint: string
  /** 是否契约节点（完成后可开契约弹窗） */
  isSeal?: boolean
}

/** 每阶段至少这么多次玩家发言后，允许自动推进 */
export const GUIDE_TURNS_PER_STAGE = 2

export function buildFacilityGuideTrack(
  facilityId: string | undefined | null,
  playMode?: string | null,
): GuideStage[] {
  if (!facilityId) return defaultTrack('当前冒险域')
  const book = getFacilityWorldbook(facilityId)
  const fac = FACILITY_MAP[facilityId]
  const name = book?.name ?? fac?.name ?? '当前冒险域'
  const stamp = book?.stamp ?? fac?.stampName ?? '完成体验后契约'
  const focused = book ? matchPlayMode(book, playMode) : undefined

  const enter: GuideStage = {
    id: 'enter',
    title: '入场接触',
    hint: `在「${name}」完成见面与氛围铺垫：空间、气味、对白中点明身份与今日流程。`,
  }

  const mid: GuideStage[] = []
  if (focused) {
    mid.push({
      id: 'play_focus',
      title: focused.title,
      hint: focused.description.slice(0, 180),
    })
    mid.push({
      id: 'play_deep',
      title: `${focused.title} · 深入`,
      hint: `把「${focused.title}」推到身体层面：器械/触碰/旁观压力到位，欲望与身体状态必须外化。`,
    })
  } else if (book?.playModes?.length) {
    const modes = book.playModes.slice(0, 3)
    for (let i = 0; i < modes.length; i++) {
      const m = modes[i]
      mid.push({
        id: `play_${i}`,
        title: m.title,
        hint: m.description.slice(0, 160),
      })
    }
  } else {
    mid.push({
      id: 'play_core',
      title: '核心体验',
      hint: `围绕「${name}」主玩法推进身体互动与欲望外化。`,
    })
  }

  const peak: GuideStage = {
    id: 'peak',
    title: '峰值结算',
    hint: '本冒险域核心玩法到达峰值（高潮/展示完成/落槌等），同时回写身体面板与堕落。',
  }

  const seal: GuideStage = {
    id: 'seal',
    title: '契约仪式',
    hint: `执行本冒险域契约：${stamp}。盖完仍可继续玩，勿强迫离场。`,
    isSeal: true,
  }

  return [enter, ...mid, peak, seal]
}

function defaultTrack(name: string): GuideStage[] {
  return [
    { id: 'enter', title: '入场接触', hint: `在「${name}」见面并铺气氛。` },
    { id: 'play_core', title: '核心体验', hint: '推进主玩法与身体互动。' },
    { id: 'peak', title: '峰值结算', hint: '到达体验峰值并结算状态。' },
    {
      id: 'seal',
      title: '契约仪式',
      hint: '完成契约仪式，盖完仍可继续玩。',
      isSeal: true,
    },
  ]
}

export function getGuideStage(
  facilityId: string | undefined | null,
  playMode: string | undefined | null,
  index: number,
): GuideStage | undefined {
  const track = buildFacilityGuideTrack(facilityId, playMode)
  if (!track.length) return undefined
  const i = Math.max(0, Math.min(index, track.length - 1))
  return track[i]
}

export function formatGuideTrackPrompt(params: {
  facilityId?: string | null
  playMode?: string | null
  stageIndex: number
  turnsInStage: number
  exploreStyle?: 'free' | 'guided' | null
}): string {
  const track = buildFacilityGuideTrack(params.facilityId, params.playMode)
  if (!track.length) return ''
  const idx = Math.max(0, Math.min(params.stageIndex, track.length - 1))
  const current = track[idx]
  const next = track[idx + 1]
  const lines = [
    '',
    '## 本冒险域剧情阶段轨（硬指引进度）',
    `总阶段：${track.length} · 当前第 ${idx + 1}/${track.length}「${current.title}」`,
    `本阶段目标：${current.hint}`,
    `本阶段玩家互动：${params.turnsInStage} 次（≥${GUIDE_TURNS_PER_STAGE} 次后可推进）`,
    `阶段列表：${track.map((s, i) => `${i + 1}.${s.title}`).join(' → ')}`,
  ]
  if (next) {
    lines.push(`下一阶段：${next.title}${next.isSeal ? '（契约）' : ''}`)
  } else {
    lines.push('已在最终契约阶段：引导契约仪式，JSON 可设 guideAdvance=true 收束。')
  }
  if (params.exploreStyle === 'guided') {
    lines.push(
      '硬指引强制：正文末尾「下一步：…」必须服务当前阶段目标。',
      'JSON 字段 guideAdvance：true=本回合完成当前阶段并进入下一阶段；false=仍留在本阶段。',
      `当本阶段玩家互动≥${GUIDE_TURNS_PER_STAGE} 且体验已明显完成时，优先 guideAdvance=true。`,
      '同步推进 hPhase（idle→foreplay→main→climax→afterglow），并给出 npcCorruptionDelta≥1、npcDesire/npcInnerThought/npcBodyState、bodyStatDeltas。',
    )
  } else {
    lines.push(
      '自由探索：可不严格跟阶段轨，但仍建议随体验写入 guideAdvance / hPhase / 状态增量。',
      '若用户明显完成核心体验并进入收尾，可 guideAdvance 直至契约阶段。',
    )
  }
  return lines.join('\n')
}
