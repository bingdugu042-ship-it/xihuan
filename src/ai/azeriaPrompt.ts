import type { Region, Session, SessionDynamicNpc } from '@/types'
import { resolveAzeriaRegion } from '@/worldview/azeriaRegionMap'
import {
  buildContextualRuleBlocks,
  getCoreLawSummary,
  getFinalRulesSummary,
} from '@/worldview/azeriaRulebook'
import { useSettingsStore } from '@/store/settingsStore'

function resolveContext(session: Session): 'travel' | 'combat' | 'h_scene' | 'npc_gen' | 'main_story' {
  if (session.hPhase && session.hPhase !== 'idle') return 'h_scene'
  if (session.playMode?.includes('战') || session.playMode?.includes('角斗')) return 'combat'
  if (session.playMode?.includes('主线') || session.playMode?.includes('阵营')) return 'main_story'
  if (session.dynamicNpc && session.messages.length < 4) return 'npc_gen'
  return 'travel'
}

const DIRTY_TALK_HINT: Record<string, string> = {
  off: '粗口克制，以感官与情感为主。',
  light: '允许轻度粗口。',
  medium: '允许常规粗口。',
  hard: '开放重度词库，叙事质量优先。',
}

/** 是否酒馆式自由聊（少法条、多角色感） */
export function isSandboxChat(session: Session): boolean {
  if (session.exploreStyle === 'guided') return false
  if (session.playMode && session.playMode !== '自由游玩' && session.exploreStyle !== 'free') {
    return false
  }
  return session.playMode === '自由游玩' || (session.exploreStyle ?? 'free') === 'free'
}

/**
 * 艾泽利亚提示词额外块
 * - 沙盒自由聊：世界书当「氛围卡」，像酒馆/角色卡聊天，不塞整本法条
 * - 叙事台/硬指引：才注入场景节选与最终条款
 */
export function buildAzeriaPromptExtras(params: {
  region?: Region
  session: Session
  dynamicNpc?: SessionDynamicNpc
}): string {
  const { region, session, dynamicNpc } = params
  const facilityId = region?.id ?? session.regionId
  const azeriaRegion = resolveAzeriaRegion(facilityId)
  const ui = useSettingsStore.getState().settings.ui
  const dirty = ui.azeriaDirtyTalkLevel ?? 'off'
  const sandbox = isSandboxChat(session)

  if (sandbox) {
    const lines: string[] = [
      '',
      '## Aetherion · Atmosphere Card (Sandbox)',
      'You are co-playing an open-world RP chat with the traveler. Prioritize lived-in character presence over rule adjudication.',
      'Worldbook supplies tone and lore backdrop only — matriarchal continent, races, and current locale ambience. Do not recite statutes; do not demand dice, identity picks, or stage pushes unprompted.',
      'Follow the traveler’s intent: stroll, drink, flirt, encounter, adventure, rest — narrate and converse.',
      'Emphasize checks only when the traveler explicitly asks for dice / combat / judgment; otherwise stay in pure narrative.',
      'Never put speaker labels inside "text". Never break character. Never decide for the traveler.',
      '',
      '### Tone Backbone (brief)',
      getCoreLawSummary().slice(0, 280),
      `Profanity preference: ${DIRTY_TALK_HINT[dirty] ?? DIRTY_TALK_HINT.off}`,
    ]

    if (azeriaRegion) {
      lines.push(
        '',
        '### 你现在所在',
        `${azeriaRegion.name}｜${azeriaRegion.env}`,
        '把地点写成可感知的环境（声、光、气味、人群），让玩家感觉「人在大陆上」。',
      )
    }

    if (session.type === 'group') {
      lines.push(
        '',
        '### 群聊',
        '同场多人时，每次只让一人开口；语气要像活人，可争宠、插话、吃醋，但不要每人轮流念旁白。',
      )
    }

    if (dynamicNpc) {
      lines.push(
        '',
        '### 对面这个人',
        `${dynamicNpc.displayName}（对你的沉沦感 ${dynamicNpc.corruption}%）`,
        '把他写成有欲望、有破绽的角色，别写成数值面板。',
        '',
        '### 状态栏上一拍（须在本回合 JSON 里改写，禁止原样复读）',
        `欲望：${dynamicNpc.desire}`,
        `内心：${dynamicNpc.innerThought}`,
        `身体：${dynamicNpc.bodyState}`,
        '每回合必填 npcDesire / npcInnerThought / npcBodyState，各 1 短句，贴合本拍对话与身体变化。',
      )
    }

    lines.push(
      '',
      '### 自由原则',
      '1. 玩家主导节奏：闲聊就闲聊，推进就推进。',
      '2. 关系变化用 relationshipChange 轻轻回写即可，不要为了填表硬加戏。',
      '3. 重要转折才写 memoryEvent；日常闲聊填 null。',
      '4. 不要每句都塞选项；自由聊时 choices 通常为空。',
      '5. 状态栏三字段每回合更新，让旅者看见欲望/内心/身体在跟着聊。',
    )

    return lines.filter(Boolean).join('\n')
  }

  // —— 叙事台 / 硬指引：保留结构，但比旧版更短 ——
  const diceMode = ui.azeriaDiceMode ?? 'mixed'
  const bodyImpactEnabled = ui.azeriaBodyImpactEnabled ?? true
  const challengeMode = ui.azeriaChallengeMode ?? 'off'

  const lines: string[] = [
    '',
    '## 艾泽利亚 · 叙事台',
    '沉浸扮演当前玩法。规则书是底色，对话仍要自然；不要把回复写成条目列表。',
    '永不跳出角色。text 禁止发言人前缀。',
    '',
    '### 女本位铁则',
    getCoreLawSummary().slice(0, 400),
    '',
    '### 开关',
    `骰子=${diceMode} · 粗口=${dirty} · 公开=${ui.azeriaPublicMode ? 'on' : 'off'} · 怀孕=${ui.azeriaPregnancyEnabled ? 'on' : 'off'} · 身体影响=${bodyImpactEnabled ? 'on' : 'off'} · 挑战=${challengeMode}`,
  ]

  if (azeriaRegion) {
    lines.push('', '### 当前区域', `${azeriaRegion.name}｜${azeriaRegion.env}｜危险 ${azeriaRegion.danger}`)
  }

  lines.push(
    '',
    '### 叙事台',
    '推进当前玩法氛围。关键分歧可给 0–2 个 choices；遇敌时承接战斗结果。',
  )

  if (dynamicNpc) {
    lines.push(
      '',
      '### 对方状态',
      `${dynamicNpc.displayName} · 沉沦阶段 ${dynamicNpc.corruptionStage}（${dynamicNpc.corruption}%）`,
    )
  }

  const ctx = resolveContext(session)
  const blocks = buildContextualRuleBlocks(ctx, azeriaRegion?.encounterSectionTitle)
  // 只取前 1 块，避免每轮灌整本法条
  if (blocks.length) {
    lines.push('', '### 场景提示', blocks[0].slice(0, 600))
  }

  lines.push('', '### 底线', getFinalRulesSummary(400))

  return lines.filter(Boolean).join('\n')
}
