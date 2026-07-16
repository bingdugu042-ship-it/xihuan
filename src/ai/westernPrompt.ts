/** 西幻万人迷专用提示词 */

import type { Region, Session, SessionDynamicNpc } from '@/types'
import { stageLabel } from './npcGenerator'
import { formatGuideTrackPrompt } from '@/data/facilityGuideTracks'
import { buildHPhasePromptBlock, type HPhaseMode } from './hPhase'
import {
  FEMALE_STAT_LABELS,
  MALE_STAT_LABELS,
  useBodyStatsStore,
} from '@/store/bodyStatsStore'
import { useSettingsStore } from '@/store/settingsStore'
import {
  formatIdentityPerspectivePrompt,
  resolveIdentityRoles,
} from '@/data/identityRoles'
import {
  formatEroticIntensityPrompt,
  formatExploreStylePrompt,
} from '@/data/playAtmosphere'
import { formatCultivationPrompt } from '@/data/cultivation'
import { formatAdventureStatsPrompt } from '@/data/adventureAttributes'
import { useAdventureStatsStore } from '@/store/adventureStatsStore'
import { racePromptBlock } from '@/data/races'
import { usePassportStore } from '@/store/passportStore'
import { HOME_PRESET_MAP } from '@/data/homes'
import { buildAzeriaPromptExtras, isSandboxChat } from './azeriaPrompt'

export function buildWesternPromptExtras(params: {
  region?: Region
  session: Session
  dynamicNpc?: SessionDynamicNpc
}): string {
  const { region, session, dynamicNpc } = params
  const facilityId = region?.id ?? session.regionId
  const sandbox = isSandboxChat(session)
  const hPhaseMode =
    (useSettingsStore.getState().settings.ui.hPhaseMode as HPhaseMode | undefined) ?? 'soft'
  const cultivation = usePassportStore.getState().cultivation
  const homePreset = HOME_PRESET_MAP[usePassportStore.getState().homePresetId]

  const lines: string[] = [buildAzeriaPromptExtras({ region, session, dynamicNpc })]

  // 沙盒：只留氛围与当下必要上下文，不塞指引轨 / D20 压力 / 养成面板
  if (sandbox) {
    const roles = resolveIdentityRoles(facilityId, session.playerIdentityId)
    if (roles) {
      lines.push(
        '',
        '## 身份（轻提示）',
        `你是「${roles.npc.name}」视角；玩家是「${roles.player.name}」。别把身份念成说明书，演出来即可。`,
      )
    }

    if (session.eroticIntensity && session.eroticIntensity !== 'light') {
      lines.push(formatEroticIntensityPrompt(session.eroticIntensity, facilityId))
    }

    if (session.lastDiceSummary) {
      lines.push('', '## 本轮掷骰结果（已发生，顺着演）', session.lastDiceSummary)
    }
    if (session.lastTravelEncounter) {
      lines.push('', '## 旅行遭遇（已发生）', session.lastTravelEncounter)
    }
    if (session.lastTravelWeather) {
      lines.push('', '## 天气（已发生）', session.lastTravelWeather)
    }

    if (homePreset && (session.regionId === 'home_base' || session.playMode === 'home')) {
      lines.push('', '## 家园', homePreset.premise)
    }

    // 仅在 H 进行中才注入阶段块；闲聊不塞
    if (session.hPhase && session.hPhase !== 'idle') {
      lines.push(
        buildHPhasePromptBlock({
          mode: hPhaseMode,
          current: session.hPhase,
          playerTurnsInPhase: session.hPhasePlayerTurns ?? 0,
        }),
      )
    }

    if (dynamicNpc) {
      lines.push(
        '',
        '## 对面这个人',
        `${dynamicNpc.displayName} · ${dynamicNpc.npcArchetype}`,
        `气质：${dynamicNpc.appearance || dynamicNpc.style || '—'}`,
        racePromptBlock((dynamicNpc as { raceId?: string }).raceId),
        `上一拍欲望：${dynamicNpc.desire}`,
        `上一拍内心：${dynamicNpc.innerThought}`,
        `上一拍身体：${dynamicNpc.bodyState}`,
      )
    }

    lines.push(
      '',
      '## 输出提醒',
      '返回 JSON：characterId, text, expression, choices=[], relationshipChange?, memoryEvent?, npcDesire, npcInnerThought, npcBodyState。',
      'npcDesire / npcInnerThought / npcBodyState 每回合必填，各 1 短句，须相对上一拍有变化；禁止复读入场套话。',
      '自由聊：choices 通常为空；不要主动要求投骰或推进阶段。',
    )

    return lines.filter(Boolean).join('\n')
  }

  // —— 叙事台 / 硬指引：保留完整结构 ——
  const roles = resolveIdentityRoles(facilityId, session.playerIdentityId)
  if (roles) lines.push(formatIdentityPerspectivePrompt(roles))

  lines.push(formatEroticIntensityPrompt(session.eroticIntensity, facilityId))
  lines.push(formatExploreStylePrompt(session.exploreStyle))
  lines.push(formatCultivationPrompt(cultivation))

  try {
    const adv = useAdventureStatsStore.getState()
    if (adv.loaded) {
      lines.push(formatAdventureStatsPrompt(adv.attributes, adv.classId))
    }
  } catch {
    /* store 未就绪 */
  }

  if (session.lastTravelEncounter) {
    lines.push('', '## 旅行遭遇掷骰（不可改写）', session.lastTravelEncounter)
  }

  if (session.lastTravelWeather) {
    lines.push('', '## 旅行天气掷骰（不可改写）', session.lastTravelWeather)
  }

  if (session.lastDiceSummary) {
    lines.push('', '## 掷骰约束（不可改写）', session.lastDiceSummary)
  }

  if (homePreset && (session.regionId === 'home_base' || session.playMode === 'home')) {
    lines.push('', '## 家园场景', homePreset.premise, homePreset.description)
  }

  lines.push(
    buildHPhasePromptBlock({
      mode: hPhaseMode,
      current: session.hPhase,
      playerTurnsInPhase: session.hPhasePlayerTurns ?? 0,
    }),
  )

  if (dynamicNpc) {
    lines.push(
      '',
      '## 当前男主快照',
      `名称：${dynamicNpc.displayName} · 场域身份：${dynamicNpc.npcArchetype}`,
      `堕落阶段：${stageLabel(dynamicNpc.corruptionStage)}（${dynamicNpc.corruption}）`,
      `外貌气质：${dynamicNpc.appearance || dynamicNpc.style}`,
      `背景：${dynamicNpc.background || '（入场生成中）'}`,
      racePromptBlock((dynamicNpc as { raceId?: string }).raceId),
      `欲望（上一拍）：${dynamicNpc.desire}`,
      `内心（上一拍）：${dynamicNpc.innerThought}`,
      `身体（上一拍）：${dynamicNpc.bodyState}`,
      '本回合 JSON 必须重写 npcDesire / npcInnerThought / npcBodyState，贴合当前对话进度。',
    )
  }

  const guide = formatGuideTrackPrompt({
    facilityId,
    playMode: session.playMode,
    stageIndex: session.guideStageIndex ?? 0,
    turnsInStage: session.guideTurnsInStage ?? 0,
    exploreStyle: session.exploreStyle,
  })
  if (guide) lines.push(guide)

  try {
    const body = useBodyStatsStore.getState()
    const labels = body.gender === 'male' ? MALE_STAT_LABELS : FEMALE_STAT_LABELS
    const bits = Object.entries(body.stats ?? {})
      .slice(0, 6)
      .map(([k, v]) => `${labels[k] ?? k}:${v}`)
    if (bits.length) lines.push('', '## 玩家身体状态', bits.join(' · '))
  } catch {
    /* store 未就绪 */
  }

  lines.push(
    '',
    '## 输出格式',
    '返回 JSON：characterId, text, expression, choices[], relationshipChange?, memoryEvent?。',
    'choices 可暗示 D20 分歧（说服/魅惑/威压/战斗/机巧，DC12–25）。',
  )

  return lines.filter(Boolean).join('\n')
}
