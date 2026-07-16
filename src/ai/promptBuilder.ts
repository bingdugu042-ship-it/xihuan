import type {
  AppSettings,
  CharacterCard,
  ChatMessage,
  CoreMemory,
  GiftLog,
  PlayerPreferences,
  Region,
  Session,
  UserProfile,
  WorldBook,
} from '@/types'
import type { ChatCompletionMessage } from './openaiClient'
import {
  buildAiBehaviorHints,
  getAiParams,
  getContextMessageCount,
  stripSpeakerLabelPrefixes,
} from './aiParams'

import { buildWesternPromptExtras } from './westernPrompt'
import { formatAtmosphereTurnReminder, resolveIdentityRoles } from '@/data/identityRoles'
import { isSandboxChat } from './azeriaPrompt'
import { spawnHintForPrompt } from './spawnedNpc'

export {
  buildAiBehaviorHints,
  getAiParams,
  clampReplyText,
  stripSpeakerLabelPrefixes,
} from './aiParams'

function clip(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

function formatCharacterBlock(c: CharacterCard, rel?: { favor: number; trust: number; dependence: number }): string {
  const lines = [
    `【${c.name}】id=${c.id} · ${c.title}`,
    `性格：${c.personality.join('、')}`,
    `说话风格：${c.speakingStyle}`,
    `背景：${clip(c.background, 400)}`,
  ]
  if (c.appearance) lines.push(`外貌：${clip(c.appearance, 200)}`)
  if (c.behavior) lines.push(`言行：${clip(c.behavior, 200)}`)
  if (c.memoryRules?.length) lines.push(`需记住：${c.memoryRules.join('；')}`)
  if (c.dialogueExamples?.length) {
    const ex = c.dialogueExamples
      .slice(0, 2)
      .map((d) => `  用户：${d.user}\n  ${c.name}：${d.character}`)
      .join('\n')
    lines.push(`对话示例：\n${ex}`)
  }
  if (rel) {
    lines.push(`当前关系 — 好感${rel.favor} 信任${rel.trust} 依赖${rel.dependence}`)
  }
  const exprKeys = c.expressions ? Object.keys(c.expressions) : []
  lines.push(`可用表情键：${exprKeys.length ? exprKeys.join(', ') : 'normal'}`)
  return lines.join('\n')
}

export function buildSystemPrompt(params: {
  session: Session
  region: Region | undefined
  world: WorldBook | undefined
  characters: CharacterCard[]
  userProfile?: UserProfile
  memories: CoreMemory[]
  gifts: GiftLog[]
  characterEmojiEnabled?: boolean
  settings: AppSettings
  forceCharacterId?: string
  replyMode?: 'reply' | 'interrupt'
  /** 抢话时被插话的角色 id */
  interruptedCharacterId?: string
  playerPreferences?: PlayerPreferences
}): string {
  const {
    session,
    region,
    world,
    characters,
    userProfile,
    memories,
    gifts,
    characterEmojiEnabled,
    settings,
    forceCharacterId,
    replyMode = 'reply',
    interruptedCharacterId,
    playerPreferences,
  } = params
  const isGroup = session.type === 'group'
  const isInterrupt = replyMode === 'interrupt'
  const isAzeriaWorld =
    world?.id === 'azeria' || world?.id === 'aetherion' || region?.worldId === 'azeria' || region?.worldId === 'aetherion'
  const cat =
    region?.category === 'online'
      ? '线上对话（文字为主）'
      : isAzeriaWorld || region?.category === 'offline'
        ? '艾泽利亚冒险现场（可描写动作、感官与环境）'
        : region?.category === 'modern'
          ? '域界外都市场景'
          : '线下场景（可描写动作与环境）'

  const parts: string[] = [
    isSandboxChat(session)
      ? 'You are a professional open-world roleplay companion engine. Stay in character as a living NPC; converse and co-play with the traveler across the continent.'
      : 'You are a professional immersive roleplay dialogue engine. Strictly portray the assigned character and reply in Chinese.',
    'Honor the world’s tone and content boundaries. Never break character. Never mention being an AI or a language model.',
    '',
    '## World',
    world
      ? `${world.worldName}（${world.era}）\n${world.description}\n${isSandboxChat(session) ? `Tone: ${world.contentGuideline}` : `Rules: ${world.rules.join('；')}\nContent guide: ${world.contentGuideline}`}`
      : '（艾泽利亚大陆）',
    '',
    '## Current Scene',
    region
      ? `${region.name} · ${cat}\n${region.premise}\n${region.description}`
      : '未知场景',
  ]

  // 有专属世界书时缩短「当前场景」摘要
  if (isAzeriaWorld && region) {
    parts[parts.length - 1] = isSandboxChat(session)
      ? `${region.name} · ${cat}\n（地点氛围见下方；像人在现场聊天即可）`
      : `${region.name} · ${cat}\n（场域详述见下方叙事台）`
  }

  if (userProfile) {
    parts.push(
      '',
      '## 旅者人设档案（不是域内对位身份）',
      `姓名：${userProfile.name} · ${userProfile.age} · ${userProfile.gender}`,
      `人设：${clip(userProfile.persona || '未设定', 200)}`,
      `环境：${clip(userProfile.livingEnvironment || '—', 120)}`,
      '注意：上方是玩家人物卡；冒险域内的身份对位见后文「身份视角锁定」。',
    )
  }

  const prefsBlock = formatPlayerPreferences(playerPreferences ?? settings.ui.playerPreferences)
  if (prefsBlock) {
    parts.push('', prefsBlock)
  }

  if (isAzeriaWorld || !world) {
    parts.push(
      buildWesternPromptExtras({
        region,
        session,
        dynamicNpc: session.dynamicNpc,
      }),
    )
  }

  parts.push('', '## 参与角色（仅 NPC / 男主；不是用户）')
  for (const c of characters) {
    const roles = resolveIdentityRoles(session.regionId, session.playerIdentityId)
    const npcRoleTag = roles ? `本场域内身份：${roles.npc.name}（不可变成用户的「${roles.player.name}」）` : ''
    parts.push(formatCharacterBlock(c, session.relationships[c.id]))
    if (npcRoleTag) parts.push(npcRoleTag)
    parts.push('')
  }

  const recentGifts = gifts
    .filter((g) => characters.some((c) => c.id === g.characterId))
    .slice(0, 5)
  if (recentGifts.length) {
    parts.push(
      '## 近期礼物',
      recentGifts.map((g) => `- 送给 ${g.characterId}：${g.itemName}`).join('\n'),
      '',
    )
  }

  parts.push('## 长期记忆（所有角色共享，务必参考）', formatMemoriesInline(memories))

  parts.push('', '## AI 对话参数（务必遵守）', buildAiBehaviorHints(settings))

  const spd = getAiParams(settings)
  let includeChoices = spd.includeChoices
  let maxChoices = Math.min(2, spd.maxChoices)
  const hHard =
    world?.id === 'aetherion' &&
    (settings.ui.hPhaseMode ?? 'soft') === 'hard' &&
    !!session.hPhase &&
    session.hPhase !== 'idle'
  if (hHard && !isInterrupt) {
    includeChoices = true
    maxChoices = 2
  }
  // 硬指引：强制给可点选的下一步口令
  if (world?.id === 'aetherion' && session.exploreStyle === 'guided' && !isInterrupt) {
    includeChoices = true
    maxChoices = Math.max(maxChoices, 2)
  }
  // 酒馆式自由聊：默认不要选项按钮，让玩家自己打字
  const sandbox = isSandboxChat(session)
  if (sandbox && !hHard) {
    includeChoices = false
    maxChoices = 0
  }

  const choicesLine =
    isInterrupt || !includeChoices
      ? '  "choices": [],  // 自由聊默认空；勿强塞选项'
      : `  "choices": [{"text":"选项1"},{"text":"选项2"}],  // 0-${maxChoices}个`

  if (isInterrupt && forceCharacterId) {
    const interrupter = characters.find((c) => c.id === forceCharacterId)
    const interrupted = interruptedCharacterId
      ? characters.find((c) => c.id === interruptedCharacterId)
      : null
    const interruptedName = interrupted?.name ?? interruptedCharacterId ?? '另一位角色'
    const lastInterruptedLine = interruptedCharacterId
      ? [...session.messages]
          .reverse()
          .find((m) => m.role === 'character' && m.characterId === interruptedCharacterId)
          ?.text
      : undefined

    parts.push(
      '',
      '## 抢话模式 · 争宠插话（重要）',
      `你扮演 ${interrupter?.name ?? forceCharacterId}，要**强行打断**刚才发言的 ${interruptedName}。`,
      '这不是在回答玩家，而是在**截断、反驳或抢白**另一位角色——营造群聊里争宠、吃醋、抢风头的活人感。',
      '核心动机（择其符合人设者）：吃醋、不甘被冷落、想独占玩家注意、看不惯对方太得意、撒娇求关注、阴阳怪气拆台。',
      `必须针对 ${interruptedName} 刚才说的内容接话，可以质问「你凭什么」「当我不存在吗」「够了」等，但不要逐字复述对方原话。`,
      lastInterruptedLine
        ? `对方刚才是这样说的（供你反驳/截断）：「${clip(lastInterruptedLine, 200)}」`
        : '',
      '约 1–4 句，口语化，带情绪张力；可同时瞥向玩家示好或撒娇，但主要火力对准被插话的角色。',
      `characterId 必须固定为 ${forceCharacterId}。choices 必须为空数组 []。`,
      'relationshipChange 可小幅波动（争宠成功/失败）；memoryEvent 通常为 null。',
    )
  }

  if (sandbox) {
    parts.push(
      '',
      '## Output Contract',
      'Return exactly one JSON object. No markdown fences. No prose outside JSON.',
      '{',
      '  "characterId": "speaking character id",',
      '  "text": "in-character reply (optional *action* beats; conversational, never system broadcast)",',
      '  "expression": "expression key",',
      '  "choices": [],',
      '  "relationshipChange": {"favor":0,"trust":0,"dependence":0},',
      '  "memoryEvent": null,',
      '  "npcDesire": "REQUIRED · what he wants right now (1 short line, THIS beat)",',
      '  "npcInnerThought": "REQUIRED · private thought (1 short line, THIS beat)",',
      '  "npcBodyState": "REQUIRED · body / breath / posture (1 short line, THIS beat)",',
      '  "spawnedNpcs": []',
      '}',
      'REQUIRED every turn: npcDesire + npcInnerThought + npcBodyState. They power the live status bar — must change with the dialogue, never repeat opening boilerplate.',
      'When traveler asks to generate/summon NPCs: fill spawnedNpcs (array of {name,title,appearance,personality,background,desire,innerThought,bodyState}); otherwise [].',
      'Omit npcCorruptionDelta / bodyStatDeltas / guideAdvance / hPhase unless relevant.',
      'Never prefix "text" with speaker labels like「Name：」.',
      isGroup
        ? forceCharacterId
          ? `Group chat: characterId must be ${forceCharacterId}.`
          : `Group chat: characterId must be one of ${characters.map((c) => c.id).join(' / ')}; one speaker per turn.`
        : `Private chat: characterId must be ${characters[0]?.id ?? 'unknown'}.`,
      'Set memoryEvent only on meaningful turns; otherwise null.',
      characterEmojiEnabled !== false
        ? 'Light emoji / kaomoji allowed when it fits the voice.'
        : 'Do not use emoji or kaomoji.',
    )
  } else {
    parts.push(
      '',
      '## 输出格式',
      '只输出一个 JSON 对象，不要 markdown 代码块，不要其他文字：',
      '{',
      '  "characterId": "说话角色的id",',
      '  "text": "角色回复正文（可含动作描写 *星号*）",',
      '  "expression": "表情键，必须从该角色可用表情中选",',
      choicesLine,
      '  "relationshipChange": {"favor":0,"trust":0,"dependence":0},',
      '  "memoryEvent": null 或 {"type":"daily|milestone|conflict|secret|preference|facility|npc_bond","text":"值得长期记住的事"}',
      '  "hPhase": "idle|foreplay|main|climax|afterglow",',
      '  "guideAdvance": false,',
      '  "npcDesire": "男主此刻欲望（必填，1短句，须随本回合变化）",',
      '  "npcInnerThought": "男主内心独白（必填，1短句，须随本回合变化）",',
      '  "npcBodyState": "男主身体状态（必填，1短句，须随本回合变化）",',
      '  "npcCorruptionDelta": 1,',
      '  "bodyStatDeltas": {"sensitivity":1},',
      '  "bodyStateLabels": null 或 {"lower":"湿润","stamina":"喘息","mind":"恍惚"},',
      '  "spawnedNpcs": []',
      '}',
      '严禁在 text 内写发言人前缀。',
      '每回合必须重写 npcDesire / npcInnerThought / npcBodyState，反映本拍欲望与身体变化；禁止复读入场开场套话。',
      '旅者要求生成/召唤男主时：必须填 spawnedNpcs（[{name,title,appearance,personality,background,desire,innerThought,bodyState},…]）；否则填 []。',
      '硬指引模式下：阶段目标完成时 guideAdvance=true。',
      isGroup
        ? isInterrupt && forceCharacterId
          ? `群聊争宠抢话：characterId 固定为 ${forceCharacterId}。`
          : forceCharacterId
            ? `群聊：characterId 固定为 ${forceCharacterId}。`
            : `群聊：characterId 必须是 ${characters.map((c) => c.id).join(' / ')} 之一。`
        : `私聊：characterId 固定为 ${characters[0]?.id ?? 'unknown'}。`,
      'memoryEvent：仅重要事件填写，日常闲聊填 null。',
      characterEmojiEnabled !== false
        ? '可在 text 中适当使用 emoji 与颜文字。'
        : '不要使用 emoji 或颜文字。',
      '关键分歧时可给 0–2 个选项；前端会挂 d20。',
    )
  }

  const lastUser = [...session.messages].reverse().find((m) => m.role === 'user')
  const spawnHint = spawnHintForPrompt(lastUser?.text ?? '')
  if (spawnHint && !isInterrupt) parts.push(spawnHint)

  return parts.join('\n')
}

function formatPlayerPreferences(prefs?: PlayerPreferences): string {
  if (!prefs) return ''
  const likes = prefs.likes?.trim()
  const dislikes = prefs.dislikes?.trim()
  const taboos = prefs.taboos?.trim()
  const notes = prefs.notes?.trim()
  if (!likes && !dislikes && !taboos && !notes) return ''
  const lines = [
    '## 旅者偏好贴纸（男主必须遵守）',
    '以下内容供你调整互动方向。禁忌与避雷视为负面提示词：必须避开，但不要在对话中向玩家照本宣科复述这份清单。',
  ]
  if (likes) lines.push(`喜欢 / 希望：${clip(likes, 400)}`)
  if (dislikes) lines.push(`避雷 / 不想要：${clip(dislikes, 400)}`)
  if (taboos) lines.push(`禁忌（硬性拒绝）：${clip(taboos, 400)}`)
  if (notes) lines.push(`补充：${clip(notes, 280)}`)
  return lines.join('\n')
}

function formatMemoriesInline(memories: CoreMemory[]): string {
  if (memories.length === 0) return '（暂无）'
  return memories
    .slice(0, 24)
    .map((m) => {
      const tag = m.tags?.length ? `#${m.tags.slice(0, 3).join(',')}` : ''
      return `- [${m.type}]${tag} ${clip(m.text, 160)}`
    })
    .join('\n')
}

export function buildChatMessages(params: {
  systemPrompt: string
  session: Session
  characters: Record<string, CharacterCard>
  aiContextLength: number
}): ChatCompletionMessage[] {
  const { systemPrompt, session, characters, aiContextLength } = params
  const historyLimit = getContextMessageCount(aiContextLength)
  const roles = resolveIdentityRoles(session.regionId, session.playerIdentityId)
  const atmosphereReminder = formatAtmosphereTurnReminder({
    roles,
    eroticIntensity: session.eroticIntensity,
    exploreStyle: session.exploreStyle,
  })

  const msgs: ChatCompletionMessage[] = [{ role: 'system', content: systemPrompt }]

  const dialog = session.messages.filter((m) => m.role === 'user' || m.role === 'character')
  const recent = dialog.slice(-historyLimit)

  for (const m of recent) {
    if (m.role === 'user') {
      const mentionName =
        m.mentionCharacterId && characters[m.mentionCharacterId]
          ? characters[m.mentionCharacterId].name
          : null
      let userText = mentionName
        ? `【@${mentionName}】${m.text || '（发送了一张图片）'}`
        : m.text || '（发送了一张图片）'
      if (atmosphereReminder) {
        userText = `${atmosphereReminder}\n${userText}`
      }
      if (m.imageUrl) {
        const parts: import('./openaiClient').ChatContentPart[] = [
          { type: 'text', text: userText },
          { type: 'image_url', image_url: { url: m.imageUrl } },
        ]
        msgs.push({ role: 'user', content: parts })
      } else {
        msgs.push({ role: 'user', content: userText })
      }
    } else if (m.role === 'character' && m.characterId) {
      const name = characters[m.characterId]?.name ?? m.characterId
      const roleName = roles?.npc.name
      const prefix = roleName ? `[${name}/${roleName}]` : `[${name}]`
      const body = stripSpeakerLabelPrefixes(m.text) || '……'
      msgs.push({ role: 'assistant', content: `${prefix}：${body}` })
    }
  }

  return msgs
}

export function validateExpression(
  character: CharacterCard | undefined,
  expression?: string,
): string {
  if (!character) return 'normal'
  const exprs = character.expressions ?? { normal: '' }
  if (expression && expression in exprs) return expression
  return character.defaultExpression || 'normal'
}

export function parseAiJson(raw: string): Record<string, unknown> {
  const trimmed = raw.trim()
  const extractBalancedJsonObject = (input: string): string | null => {
    let inString = false
    let escaped = false
    let depth = 0
    let start = -1
    for (let i = 0; i < input.length; i++) {
      const ch = input[i]
      if (inString) {
        if (escaped) {
          escaped = false
        } else if (ch === '\\') {
          escaped = true
        } else if (ch === '"') {
          inString = false
        }
        continue
      }
      if (ch === '"') {
        inString = true
        continue
      }
      if (ch === '{') {
        if (depth === 0) start = i
        depth++
        continue
      }
      if (ch === '}') {
        depth--
        if (depth === 0 && start >= 0) return input.slice(start, i + 1)
      }
    }
    return null
  }

  try {
    return JSON.parse(trimmed) as Record<string, unknown>
  } catch {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fence) {
      try {
        return JSON.parse(fence[1].trim()) as Record<string, unknown>
      } catch { /* fall through */ }
    }
    const jsonChunk = extractBalancedJsonObject(trimmed)
    if (jsonChunk) {
      try {
        return JSON.parse(jsonChunk) as Record<string, unknown>
      } catch { /* fall through */ }
    }
    const textMatch = trimmed.match(/"text"\s*:\s*"((?:\\.|[^"\\])*)"/)
    if (textMatch) {
      try {
        return { text: JSON.parse(`"${textMatch[1]}"`) }
      } catch {
        return { text: textMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') }
      }
    }
    throw new Error('无法解析 AI 返回的 JSON')
  }
}

/** 解析失败时，将纯文本当作角色回复 */
export function parseAiJsonOrPlain(raw: string, defaultCharacterId: string): Record<string, unknown> {
  try {
    return parseAiJson(raw)
  } catch {
    const plain = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    return { characterId: defaultCharacterId, text: plain || '……' }
  }
}

export function messageToSummaryLines(messages: ChatMessage[], charName: string): string {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'character')
    .map((m) => (m.role === 'user' ? `玩家：${m.text}` : `${charName}：${m.text}`))
    .join('\n')
}
