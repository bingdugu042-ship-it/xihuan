import { create } from 'zustand'
import type {
  Session,
  ChatMessage,
  Choice,
  RelationshipChange,
  Relationship,
  CoreMemory,
} from '../types'
import {
  listSessions,
  putSession,
  getSession,
  deleteSession,
  putMemory,
  genId,
} from '../storage/db'
import { useDataStore } from './dataStore'
import { buildIntroMessages, SHARED_MEMORY_CHARACTER_ID } from '@/utils/sessionIntro'
import { generateCharacterReply, hasTextApiConfigured } from '@/ai/textClient'
import { mockRespond } from '@/ai/mockResponder'
import { useSettingsStore } from './settingsStore'
import { useProfileStore } from './profileStore'
import { useShopStore } from './shopStore'
import { usePassportStore } from './passportStore'
import { useUIStore } from './uiStore'
import { MAIN_STORY, useAzeriaProgressStore } from './azeriaProgressStore'
import { AZERIA_ENDINGS } from '@/data/azeriaEndings'
import { spawnDynamicNpcForFacility, bumpDynamicNpc, corruptionStageFromValue, cardFromDynamicNpc, ensureNpcBioFields } from '@/ai/npcGenerator'
import { draftToDynamicNpc, type SpawnedNpcDraft } from '@/ai/spawnedNpc'
import { refineNpcWithApi } from '@/ai/npcRefine'
import { enrichMemoryMeta } from '@/ai/memoryUtils'
import { resolveHPhase, type HPhaseMode } from '@/ai/hPhase'
import { isSandboxChat } from '@/ai/azeriaPrompt'
import { resolveNpcStatusFields } from '@/ai/npcStatus'
import { archiveNpcToRoster } from '@/utils/focusNpc'
import {
  buildFacilityGuideTrack,
  GUIDE_TURNS_PER_STAGE,
} from '@/data/facilityGuideTracks'
import { handleSlashCommand, formatBodyPanel } from '@/commands/commandHandler'
import { FACILITY_MAP } from '@/data/facilities'
import { resolveIdentityRoles } from '@/data/identityRoles'
import {
  formatTravelEncounterMessage,
  rollTravelEncounterForFacility,
} from '@/utils/travelEncounter'
import type { EroticIntensity, ExploreStyle } from '@/data/playAtmosphere'
import { useBodyStatsStore } from './bodyStatsStore'
import type { CharacterCard, HPhase, SessionDynamicNpc } from '../types'
import { syncWorldProgressFromChat } from '@/utils/syncWorldProgress'

let activeAiAbort: AbortController | null = null

interface SessionStore {
  sessions: Session[]
  activeSessionId: string | null
  activeSession: Session | null
  loading: boolean
  aiReplying: boolean
  aiError: string | null

  loadSessions: () => Promise<void>
  createSession: (params: {
    regionId: string
    participantIds: string[]
    type: 'private' | 'group'
    title?: string
    withIntro?: boolean
    playerIdentityId?: string
    playMode?: string
    eroticIntensity?: EroticIntensity
    exploreStyle?: ExploreStyle
  }) => Promise<Session>
  /** 更新本场玩法（注入下一轮 AI 提示词） */
  setSessionPlayMode: (playMode: string) => Promise<void>
  setSessionEroticIntensity: (eroticIntensity: EroticIntensity) => Promise<void>
  setSessionExploreStyle: (exploreStyle: ExploreStyle) => Promise<void>
  switchSession: (id: string) => Promise<void>
  closeActiveSession: () => void

  appendUserMessage: (text: string, options?: {
    imageUrl?: string
    bubbleStyle?: ChatMessage['bubbleStyle']
    transfer?: { amount: number; note?: string }
    mentionCharacterId?: string
    skipAi?: boolean
  }) => Promise<void>
  appendCharacterMessage: (params: {
    characterId: string
    text: string
    expression?: string
    choices?: Choice[]
    relationshipChange?: RelationshipChange
    memoryEvent?: { type: CoreMemory['type']; text: string }
    npcDesire?: string
    npcInnerThought?: string
    npcBodyState?: string
    hPhase?: HPhase
    npcCorruptionDelta?: number
    bodyStatDeltas?: Record<string, number>
    bodyStateLabels?: Partial<Record<'lower' | 'stamina' | 'mind', string>>
    /** 硬指引：本回合是否推进设施阶段 */
    guideAdvance?: boolean
    /** 主线章节是否推进 */
    mainAdvance?: boolean
    endingHint?: string
    /** 对话生成的新男主 → 导入「在场」 */
    spawnedNpcs?: SpawnedNpcDraft[]
  }) => Promise<void>

  archiveSession: (id: string, note?: string) => Promise<void>
  removeSession: (id: string) => Promise<void>
  renameSession: (id: string, title: string) => Promise<void>
  getMaxFavor: (characterId: string) => number
  getCharacterRelationship: (characterId: string) => Relationship
  sendGiftExchange: (characterId: string, itemName: string) => Promise<void>
  sendTransfer: (amount: number, note?: string) => Promise<boolean>
  regenerateLastCharacterReply: () => Promise<void>
  requestAiReply: (options?: { regenerate?: boolean }) => Promise<void>
  cancelAiReply: () => void
  clearAiError: () => void
  appendSystemMessage: (text: string, style?: ChatMessage['bubbleStyle']) => Promise<void>
  setLastDiceSummary: (summary: string | undefined) => Promise<void>
  updateMessageText: (messageId: string, text: string) => Promise<void>
  updateDynamicNpc: (patch: Partial<SessionDynamicNpc>) => Promise<void>
  setCharacterRelationship: (
    characterId: string,
    patch: Partial<Relationship>,
  ) => Promise<void>
  setHPhase: (phase: HPhase) => Promise<void>
  dismissSaveNpcPrompt: (retain?: boolean) => Promise<void>
  /** 从名册召唤已烙印男主到当前会话 */
  summonSavedNpc: (savedId: string) => Promise<boolean>
  /** 切换在场焦点男主（更新定向 + 必要时提升为 dynamicNpc） */
  focusParticipant: (characterId: string) => Promise<void>
}

function applySpawnedNpcsToSession(
  session: Session,
  drafts: SpawnedNpcDraft[] | undefined,
): Session {
  if (!drafts?.length) return session

  const region = useDataStore.getState().regions[session.regionId]
  const facilityFallback = {
    id: session.regionId,
    name: FACILITY_MAP[session.regionId]?.name ?? region?.name ?? '现场',
  }

  let npcRoster = { ...(session.npcRoster ?? {}) }
  if (session.dynamicNpc) {
    npcRoster = archiveNpcToRoster(session, session.dynamicNpc)
  }

  const participantIds = [...session.participantIds]
  const relationships = { ...session.relationships }
  const existingNames = new Set(
    participantIds.map((id) => {
      const fromRoster = npcRoster[id]?.displayName
      if (fromRoster) return fromRoster
      return useDataStore.getState().getCharacter(id)?.name ?? id
    }),
  )

  const joinedNames: string[] = []
  let firstNewId: string | undefined

  for (const draft of drafts) {
    if (existingNames.has(draft.name)) continue
    const { meta, card } = draftToDynamicNpc(draft, region, facilityFallback)
    useDataStore.getState().registerRuntimeCharacter(card)
    npcRoster[meta.id] = meta
    if (!participantIds.includes(meta.id)) participantIds.push(meta.id)
    if (!relationships[meta.id]) {
      relationships[meta.id] = { ...(card.initialRelationship ?? { favor: 0, trust: 0, dependence: 0 }) }
    }
    existingNames.add(meta.displayName)
    joinedNames.push(meta.displayName)
    if (!firstNewId) firstNewId = meta.id
  }

  if (!joinedNames.length) return session

  // 保留原焦点男主；新人都进名册与在场条
  const dynamicNpc = session.dynamicNpc ?? (firstNewId ? npcRoster[firstNewId] : undefined)

  const tip: ChatMessage = {
    id: genId('msg'),
    role: 'system',
    bubbleStyle: 'narrator',
    text:
      joinedNames.length === 1
        ? `✨ ${joinedNames[0]} 已入场，可在上方「在场」切换查看角色详情。`
        : `✨ ${joinedNames.length} 位男主已入场：${joinedNames.join('、')}。可在上方「在场」切换查看角色详情。`,
    timestamp: Date.now() + 4,
  }

  if (participantIds.length > 1) {
    useUIStore.getState().setReplyTargetCharacterId(
      session.dynamicNpc?.id ?? firstNewId ?? participantIds[0],
    )
  }

  useUIStore.getState().showToast(
    joinedNames.length === 1 ? `${joinedNames[0]} 已入场` : `${joinedNames.length} 位男主已入场`,
    '点上方「在场」查看详情',
  )

  return {
    ...session,
    participantIds,
    relationships,
    type: participantIds.length > 1 ? 'group' : session.type,
    dynamicNpc,
    npcRoster,
    messages: [...session.messages, tip],
    updatedAt: Date.now(),
  }
}

function initRelationships(participantIds: string[]): Record<string, Relationship> {
  const chars = useDataStore.getState().getAllCharacters()
  const out: Record<string, Relationship> = {}
  for (const id of participantIds) {
    const c = chars[id]
    out[id] = c ? { ...c.initialRelationship } : { favor: 0, trust: 0, dependence: 0 }
  }
  return out
}

function applyWesternNpcPatch(
  session: Session,
  patch: {
    npcDesire?: string
    npcInnerThought?: string
    npcBodyState?: string
    hPhase?: HPhase
    npcCorruptionDelta?: number
  },
  /** 本回合发言角色；仅当与 dynamicNpc / 名册对应时回写状态 */
  speakerId?: string,
): Session {
  if (!session.dynamicNpc) {
    // 即使无 dynamicNpc，仍允许更新 hPhase
    if (!patch.hPhase) return session
    const phaseChanged = patch.hPhase !== session.hPhase
    return {
      ...session,
      hPhase: patch.hPhase,
      hPhasePlayerTurns: phaseChanged ? 0 : session.hPhasePlayerTurns,
    }
  }

  const targetId = speakerId ?? session.dynamicNpc.id
  const isFocusDyn = session.dynamicNpc.id === targetId

  if (isFocusDyn) {
    let dynamicNpc = { ...session.dynamicNpc }
    if (patch.npcDesire) dynamicNpc.desire = patch.npcDesire
    if (patch.npcInnerThought) dynamicNpc.innerThought = patch.npcInnerThought
    if (patch.npcBodyState) dynamicNpc.bodyState = patch.npcBodyState
    if (patch.npcCorruptionDelta) {
      dynamicNpc = bumpDynamicNpc(dynamicNpc, patch.npcCorruptionDelta)
    }
    const nextPhase = patch.hPhase ?? session.hPhase
    const phaseChanged = !!patch.hPhase && patch.hPhase !== session.hPhase
    const npcRoster = {
      ...(session.npcRoster ?? {}),
      [dynamicNpc.id]: dynamicNpc,
    }
    return {
      ...session,
      dynamicNpc,
      npcRoster,
      hPhase: nextPhase,
      hPhasePlayerTurns: phaseChanged ? 0 : session.hPhasePlayerTurns,
    }
  }

  // 非当前 dynamicNpc：只更新名册里该男主的状态条
  const prev = session.npcRoster?.[targetId]
  if (!prev && !patch.npcDesire && !patch.npcInnerThought && !patch.npcBodyState) {
    if (!patch.hPhase) return session
    const phaseChanged = patch.hPhase !== session.hPhase
    return {
      ...session,
      hPhase: patch.hPhase,
      hPhasePlayerTurns: phaseChanged ? 0 : session.hPhasePlayerTurns,
    }
  }

  const base = prev ?? {
    ...session.dynamicNpc,
    id: targetId,
    displayName: targetId,
  }
  let entry = { ...base }
  if (patch.npcDesire) entry.desire = patch.npcDesire
  if (patch.npcInnerThought) entry.innerThought = patch.npcInnerThought
  if (patch.npcBodyState) entry.bodyState = patch.npcBodyState
  if (patch.npcCorruptionDelta) {
    entry = bumpDynamicNpc(entry, patch.npcCorruptionDelta)
  }
  const nextPhase = patch.hPhase ?? session.hPhase
  const phaseChanged = !!patch.hPhase && patch.hPhase !== session.hPhase
  return {
    ...session,
    npcRoster: { ...(session.npcRoster ?? {}), [targetId]: entry },
    hPhase: nextPhase,
    hPhasePlayerTurns: phaseChanged ? 0 : session.hPhasePlayerTurns,
  }
}

function maybePromptSaveNpc(session: Session) {
  if (!session.dynamicNpc || session.saveNpcDismissed) return
  const charMsgs = session.messages.filter((m) => m.role === 'character').length
  if (charMsgs >= 5 && session.dynamicNpc.corruption >= 18) {
    useUIStore.getState().setSaveNpcModalOpen(true)
  }
}

function applyChange(base: Relationship, change?: RelationshipChange): Relationship {
  if (!change) return base
  const clamp = (n: number) => Math.max(0, Math.min(100, n))
  return {
    favor: clamp(base.favor + (change.favor ?? 0)),
    trust: clamp(base.trust + (change.trust ?? 0)),
    dependence: clamp(base.dependence + (change.dependence ?? 0)),
  }
}

async function persist(session: Session) {
  await putSession(session)
}

function pickInterruptCharacter(
  participantIds: string[],
  interruptedId: string,
  relationships: Record<string, Relationship>,
): string | null {
  const pool = participantIds.filter((id) => id !== interruptedId)
  if (pool.length === 0) return null

  const speakerFavor = relationships[interruptedId]?.favor ?? 50
  const jealous = pool.filter((id) => (relationships[id]?.favor ?? 0) <= speakerFavor + 10)
  const candidates = jealous.length > 0 ? jealous : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/** 是否触发争宠抢话：到达间隔必触发，否则吃醋角色有概率打断 */
function shouldJealousyInterrupt(
  session: Session,
  speakerId: string,
  interval: number,
  rounds: number,
): boolean {
  if (rounds >= interval) return true
  const rels = session.relationships
  const speakerFavor = rels[speakerId]?.favor ?? 50
  const jealousPool = session.participantIds.filter(
    (id) => id !== speakerId && (rels[id]?.favor ?? 0) <= speakerFavor + 8,
  )
  if (jealousPool.length === 0) return false
  return Math.random() < 0.32
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  activeSession: null,
  loading: false,
  aiReplying: false,
  aiError: null,

  loadSessions: async () => {
    set({ loading: true })
    const sessions = await listSessions()
    for (const s of sessions) {
      const all = useDataStore.getState().getAllCharacters()
      if (s.dynamicNpc && !all[s.dynamicNpc.id]) {
        useDataStore.getState().registerRuntimeCharacter(cardFromDynamicNpc(s.dynamicNpc))
      }
      if (s.npcRoster) {
        for (const npc of Object.values(s.npcRoster)) {
          if (!useDataStore.getState().getAllCharacters()[npc.id]) {
            useDataStore.getState().registerRuntimeCharacter(cardFromDynamicNpc(npc))
          }
        }
      }
    }
    const active = sessions.find((s) => s.status === 'active' && s.id === get().activeSessionId)
    set({
      sessions,
      loading: false,
      activeSession: active ?? get().activeSession,
    })
  },

  getMaxFavor: (characterId) => {
    let max = useDataStore.getState().getAllCharacters()[characterId]?.initialRelationship.favor ?? 0
    for (const s of get().sessions) {
      const f = s.relationships[characterId]?.favor
      if (f != null) max = Math.max(max, f)
    }
    return max
  },

  getCharacterRelationship: (characterId) => {
    const chars = useDataStore.getState().getAllCharacters()[characterId]
    const base = chars?.initialRelationship ?? { favor: 0, trust: 0, dependence: 0 }
    let best = { ...base }
    for (const s of get().sessions) {
      const r = s.relationships[characterId]
      if (r && r.favor >= best.favor) best = { ...r }
    }
    const active = get().activeSession?.relationships[characterId]
    if (active) return active
    return best
  },

  createSession: async ({
    regionId,
    participantIds,
    type,
    title,
    withIntro = true,
    playerIdentityId,
    playMode,
    eroticIntensity = 'medium',
    exploreStyle = 'free',
  }) => {
    const { characters, regions } = useDataStore.getState()
    const region = regions[regionId]
    const now = Date.now()
    let pids = [...participantIds]
    let dynamicNpc: Session['dynamicNpc']
    let mergedChars = { ...characters, ...useDataStore.getState().runtimeCharacters }

    const isAzeriaWorld = region?.worldId === 'aetherion' || region?.worldId === 'azeria'
    if (isAzeriaWorld && pids.length === 0) {
      let spawned = spawnDynamicNpcForFacility(region, playerIdentityId)
      const settings = useSettingsStore.getState().settings
      if (settings.ui.npcApiRefine) {
        const identityHint = playerIdentityId
          ? (() => {
              const roles = resolveIdentityRoles(region.id, playerIdentityId)
              if (!roles) return FACILITY_MAP[region.id]?.identities.find((i) => i.id === playerIdentityId)?.promptHint
              return `玩家是「${roles.player.name}」；NPC 必须是「${roles.npc.name}」。玩家：${roles.player.promptHint}；NPC：${roles.npc.promptHint}`
            })()
          : undefined
        spawned = await refineNpcWithApi({
          spawned,
          settings,
          region,
          playMode,
          identityHint,
        })
      }
      useDataStore.getState().registerRuntimeCharacter(spawned.card)
      dynamicNpc = ensureNpcBioFields(spawned.meta)
      pids = [spawned.card.id]
      mergedChars = { ...mergedChars, [spawned.card.id]: spawned.card }
    }

    const firstName = pids[0] ? mergedChars[pids[0]]?.name : ''
    const roles = resolveIdentityRoles(regionId, playerIdentityId)
    const pendingEnc = useUIStore.getState().pendingTravelEncounter
    let travelEncounterRoll: number | undefined
    let lastTravelEncounter: string | undefined

    if (isAzeriaWorld && regionId !== 'home_base') {
      if (pendingEnc?.facilityId === regionId) {
        travelEncounterRoll = pendingEnc.roll
        lastTravelEncounter = pendingEnc.formatted
        useUIStore.getState().setPendingTravelEncounter(null)
      } else {
        const enc = rollTravelEncounterForFacility(regionId)
        if (enc) {
          travelEncounterRoll = enc.roll
          lastTravelEncounter = formatTravelEncounterMessage(enc)
        }
      }
    }

    const session: Session = {
      id: genId('ses'),
      title: title ?? (dynamicNpc ? `${dynamicNpc.displayName} · ${region?.name ?? '对话'}` : firstName ? `${firstName} · ${region?.name ?? '对话'}` : '新对话'),
      regionId,
      participantIds: pids,
      type,
      relationships: initRelationships(pids),
      messages: [],
      status: 'active',
      createdAt: now,
      updatedAt: now,
      groupRoundsSinceInterrupt: type === 'group' ? 0 : undefined,
      dynamicNpc,
      npcRoster: dynamicNpc ? { [dynamicNpc.id]: dynamicNpc } : undefined,
      playerIdentityId,
      npcIdentityId: roles?.npc.id,
      eroticIntensity,
      exploreStyle,
      playMode,
      hPhase: isAzeriaWorld ? 'idle' : undefined,
      hPhasePlayerTurns: 0,
      guideStageIndex: isAzeriaWorld ? 0 : undefined,
      guideTurnsInStage: 0,
      travelEncounterRoll,
      lastTravelEncounter,
    }
    if (withIntro) {
      session.messages = buildIntroMessages(session, region, mergedChars)
      if (lastTravelEncounter) {
        session.messages.push({
          id: genId('msg'),
          role: 'system',
          text: lastTravelEncounter,
          bubbleStyle: 'system',
          timestamp: now,
        })
      }
    }
    await persist(session)
    set((s) => ({
      sessions: [session, ...s.sessions],
      activeSessionId: session.id,
      activeSession: session,
    }))
    return session
  },

  setSessionPlayMode: async (playMode) => {
    const { activeSession } = get()
    if (!activeSession) return
    const next = {
      ...activeSession,
      playMode,
      guideStageIndex: 0,
      guideTurnsInStage: 0,
      updatedAt: Date.now(),
    }
    await persist(next)
    set((s) => ({
      activeSession: next,
      sessions: s.sessions.map((x) => (x.id === next.id ? next : x)),
    }))
  },

  setSessionEroticIntensity: async (eroticIntensity) => {
    const { activeSession } = get()
    if (!activeSession) return
    const next = { ...activeSession, eroticIntensity, updatedAt: Date.now() }
    await persist(next)
    set((s) => ({
      activeSession: next,
      sessions: s.sessions.map((x) => (x.id === next.id ? next : x)),
    }))
    useUIStore.getState().showToast(`色情程度 → ${eroticIntensity === 'light' ? '轻度' : eroticIntensity === 'medium' ? '中度' : eroticIntensity === 'high' ? '高度' : '极致'}`)
  },

  setSessionExploreStyle: async (exploreStyle) => {
    const { activeSession } = get()
    if (!activeSession) return
    const next = { ...activeSession, exploreStyle, updatedAt: Date.now() }
    await persist(next)
    set((s) => ({
      activeSession: next,
      sessions: s.sessions.map((x) => (x.id === next.id ? next : x)),
    }))
    useUIStore.getState().showToast(exploreStyle === 'free' ? '已切换：自由探索' : '已切换：硬指引')
  },

  switchSession: async (id) => {
    useUIStore.getState().setReplyTargetCharacterId(null)
    const cached = get().sessions.find((x) => x.id === id)
    const session = cached ?? (await getSession(id))
    if (!session) return
    if (session.dynamicNpc) {
      const all = useDataStore.getState().getAllCharacters()
      if (!all[session.dynamicNpc.id]) {
        useDataStore.getState().registerRuntimeCharacter(cardFromDynamicNpc(session.dynamicNpc))
      }
    }
    set({ activeSessionId: id, activeSession: session })
  },

  closeActiveSession: () => {
    useUIStore.getState().setReplyTargetCharacterId(null)
    set({ activeSessionId: null, activeSession: null })
  },

  appendUserMessage: async (text, options) => {
    const { activeSession } = get()
    if (!activeSession) return

    if (text.trim().startsWith('$')) {
      const cmd = await handleSlashCommand(text)
      if (cmd.handled) {
        if (!cmd.skipAi) {
          await get().requestAiReply()
        }
        return
      }
    }

    const msg: ChatMessage = {
      id: genId('msg'),
      role: 'user',
      text,
      imageUrl: options?.imageUrl,
      bubbleStyle: options?.bubbleStyle,
      transfer: options?.transfer,
      mentionCharacterId: options?.mentionCharacterId,
      timestamp: Date.now(),
    }
    let next: Session = {
      ...activeSession,
      messages: [...activeSession.messages, msg],
      updatedAt: Date.now(),
      hPhasePlayerTurns: (activeSession.hPhasePlayerTurns ?? 0) + 1,
      guideTurnsInStage: (activeSession.guideTurnsInStage ?? 0) + 1,
    }

    await persist(next)
    set((s) => ({
      activeSession: next,
      sessions: s.sessions.map((x) => (x.id === next.id ? next : x)),
    }))

    if (!options?.skipAi) {
      void get().requestAiReply()
    }
  },

  appendCharacterMessage: async ({
    characterId,
    text,
    expression,
    choices,
    relationshipChange,
    memoryEvent,
    npcDesire,
    npcInnerThought,
    npcBodyState,
    hPhase,
    npcCorruptionDelta,
    bodyStatDeltas,
    bodyStateLabels,
    guideAdvance,
    mainAdvance,
    endingHint,
    spawnedNpcs,
  }) => {
    const { activeSession } = get()
    if (!activeSession) return

    const mode =
      (useSettingsStore.getState().settings.ui.hPhaseMode as HPhaseMode | undefined) ?? 'soft'
    const resolvedPhase = resolveHPhase({
      mode,
      current: activeSession.hPhase,
      proposed: hPhase,
      playerTurnsInPhase: activeSession.hPhasePlayerTurns ?? 0,
    })

    const sandbox = isSandboxChat(activeSession)

    // 沙盒自由聊：不强制每回合涨堕落；叙事台才做「漏写保底」
    const intensity = activeSession.eroticIntensity ?? 'medium'
    const minCorr =
      intensity === 'light' ? 1 : intensity === 'medium' ? 2 : intensity === 'high' ? 3 : 4
    const corrDelta = sandbox
      ? typeof npcCorruptionDelta === 'number' && npcCorruptionDelta > 0
        ? npcCorruptionDelta
        : 0
      : typeof npcCorruptionDelta === 'number' && npcCorruptionDelta > 0
        ? npcCorruptionDelta
        : minCorr

    const track = buildFacilityGuideTrack(activeSession.regionId, activeSession.playMode)
    let stageIndex = activeSession.guideStageIndex ?? 0
    let turnsInStage = activeSession.guideTurnsInStage ?? 0
    const guided = activeSession.exploreStyle === 'guided'
    const canAutoAdvance = turnsInStage >= GUIDE_TURNS_PER_STAGE
    // 自由聊不自动推阶段；只有硬指引或 AI 显式 guideAdvance
    const shouldAdvance = sandbox
      ? Boolean(guideAdvance)
      : Boolean(guideAdvance) ||
        (guided && canAutoAdvance) ||
        (!guided && canAutoAdvance && turnsInStage >= GUIDE_TURNS_PER_STAGE + 1)

    const bodyImpactEnabled =
      !sandbox && (useSettingsStore.getState().settings.ui.azeriaBodyImpactEnabled ?? true)

    let stageAdvanced = false
    if (shouldAdvance && stageIndex < track.length - 1) {
      stageIndex += 1
      turnsInStage = 0
      stageAdvanced = true
    }

    const statusFields = resolveNpcStatusFields({
      text,
      npcDesire,
      npcInnerThought,
      npcBodyState,
      prev: activeSession.dynamicNpc
        ? {
            desire: activeSession.dynamicNpc.desire,
            innerThought: activeSession.dynamicNpc.innerThought,
            bodyState: activeSession.dynamicNpc.bodyState,
          }
        : undefined,
      hPhase: resolvedPhase,
    })

    const msg: ChatMessage = {
      id: genId('msg'),
      role: 'character',
      characterId,
      text,
      expression,
      choices,
      relationshipChange,
      memoryEvent,
      npcDesire: statusFields.npcDesire,
      npcInnerThought: statusFields.npcInnerThought,
      npcBodyState: statusFields.npcBodyState,
      timestamp: Date.now(),
    }

    const nextRelationships = { ...activeSession.relationships }
    if (relationshipChange && nextRelationships[characterId]) {
      nextRelationships[characterId] = applyChange(
        nextRelationships[characterId],
        relationshipChange,
      )
    }

    let next: Session = {
      ...activeSession,
      messages: [...activeSession.messages, msg],
      relationships: nextRelationships,
      updatedAt: Date.now(),
      guideStageIndex: stageIndex,
      guideTurnsInStage: turnsInStage,
    }
    next = applyWesternNpcPatch(
      next,
      {
        npcDesire: statusFields.npcDesire,
        npcInnerThought: statusFields.npcInnerThought,
        npcBodyState: statusFields.npcBodyState,
        hPhase: resolvedPhase,
        npcCorruptionDelta: corrDelta,
      },
      characterId,
    )
    // 骰果/遭遇已用于本轮生成，写回后清除，避免永久绑架剧情
    next = {
      ...next,
      lastDiceSummary: undefined,
      lastTravelEncounter: undefined,
      travelEncounterRoll: undefined,
      lastTravelWeather: undefined,
      travelWeatherRoll: undefined,
    }

    // 身体面板保底微涨（AI 未回写时）
    let writeDeltas = bodyStatDeltas
    let writeLabels = bodyStateLabels
    if (bodyImpactEnabled) {
      if (!writeDeltas || !Object.keys(writeDeltas).length) {
        const gender = useBodyStatsStore.getState().gender
        writeDeltas =
          gender === 'male'
            ? { physical: 1, exposure: 1, ejaculationStamina: 1 }
            : { sensitivity: 1 + Math.floor(Math.random() * 2), exposure: 1, climaxStamina: 1 }
      }
      if (!writeLabels) {
        writeLabels = {
          lower: resolvedPhase === 'idle' ? '发热' : '湿意加重',
          stamina: '呼吸加快',
          mind: stageAdvanced ? '被带入下一阶段' : '沉浸中',
        }
      }
    } else {
      // 关闭身体影响判定：不写入身体数值/状态回写
      writeDeltas = undefined
      writeLabels = undefined
    }

    await persist(next)

    // 攻略阈值：好感/依赖达标 → 图鉴「已攻略」；同步酒馆/声望/称号
    const rel = nextRelationships[characterId]
    if (rel) {
      const prevFavor = activeSession.relationships[characterId]?.favor ?? rel.favor
      void syncWorldProgressFromChat({
        characterId,
        regionId: next.regionId,
        rel,
        favorDelta: rel.favor - prevFavor,
      })
    }

    if (bodyImpactEnabled && (writeDeltas || writeLabels)) {
      await useBodyStatsStore.getState().applyAiWriteback({
        deltas: writeDeltas,
        labels: writeLabels,
      })
      if ((bodyStatDeltas || bodyStateLabels) && bodyImpactEnabled) {
        useUIStore.getState().showToast('身体状态已更新', '可打开手机「身体档案」或输入 $面板')
      }
    }

    if (memoryEvent) {
      const fac = FACILITY_MAP[next.regionId]
      const charName = useDataStore.getState().getCharacter(characterId)?.name
      const enriched = enrichMemoryMeta({
        type: memoryEvent.type,
        text: memoryEvent.text,
        characterId,
        characterName: charName,
        facilityId: next.regionId,
        facilityName: fac?.name ?? next.dynamicNpc?.facilityName,
        playMode: next.playMode,
      })
      await putMemory({
        id: genId('mem'),
        characterId: SHARED_MEMORY_CHARACTER_ID,
        text: `[${characterId}] ${memoryEvent.text}`,
        type: enriched.type,
        facilityId: enriched.facilityId,
        tags: enriched.tags,
        originSessionId: next.id,
        timestamp: Date.now(),
      })
    }

    if (stageAdvanced) {
      const stage = track[stageIndex]
      const tip: ChatMessage = {
        id: genId('msg'),
        role: 'system',
        bubbleStyle: 'system',
        text: `阶段推进 · ${stageIndex + 1}/${track.length}「${stage?.title ?? '下一阶段'}」`,
        timestamp: Date.now() + 1,
      }
      next = {
        ...next,
        messages: [...next.messages, tip],
        updatedAt: Date.now(),
      }
      await persist(next)
      useUIStore.getState().showToast(
        `阶段 ${stageIndex + 1}/${track.length}`,
        stage?.title ?? '剧情推进',
      )
    }

    // 主线章节 / 结局提示（AI JSON → 图鉴进度）
    if (mainAdvance) {
      const progress = useAzeriaProgressStore.getState()
      const cur = progress.mainChapter ?? 1
      if (cur < 6) {
        const nextChapter = cur + 1
        await progress.setMainChapter(nextChapter)
        const chapterMeta = MAIN_STORY[nextChapter - 1]
        const tip: ChatMessage = {
          id: genId('msg'),
          role: 'system',
          bubbleStyle: 'system',
          text: `主线推进 · 第 ${nextChapter}/6 章「${chapterMeta?.title ?? '下一章'}」`,
          timestamp: Date.now() + 4,
        }
        next = {
          ...next,
          messages: [...next.messages, tip],
          updatedAt: Date.now(),
        }
        await persist(next)
        useUIStore.getState().showToast(
          `主线 · 第 ${nextChapter}/6 章`,
          chapterMeta?.title ?? '剧情推进',
        )
      }
    }

    if (endingHint) {
      const ending =
        AZERIA_ENDINGS.find((e) => e.id === endingHint) ||
        AZERIA_ENDINGS.find((e) => e.letter.toLowerCase() === endingHint.toLowerCase()) ||
        AZERIA_ENDINGS.find((e) => e.name.includes(endingHint))
      if (ending) {
        await useAzeriaProgressStore.getState().unlockEnding(ending.id)
        const tip: ChatMessage = {
          id: genId('msg'),
          role: 'system',
          bubbleStyle: 'narrator',
          text: `旁白：命运线隐约显形——结局「${ending.letter} · ${ending.name}」已记入图鉴。`,
          timestamp: Date.now() + 5,
        }
        next = {
          ...next,
          messages: [...next.messages, tip],
          updatedAt: Date.now(),
        }
        await persist(next)
        useUIStore.getState().showToast(`结局线 · ${ending.letter}`, ending.name)
      }
    }

    // 契约：进入契约阶段，或首次进入余韵
    const sealStage = track[stageIndex]
    const reachedSeal =
      Boolean(sealStage?.isSeal) && stageAdvanced && !next.stampPrompted
    const enteredAfterglow =
      resolvedPhase === 'afterglow' && activeSession.hPhase !== 'afterglow' && !next.stampPrompted
    if (reachedSeal || enteredAfterglow) {
      const bodyMsg: ChatMessage = {
        id: genId('msg'),
        role: 'system',
        bubbleStyle: 'system',
        text: `身体状态结算\n${formatBodyPanel()}`,
        timestamp: Date.now() + 2,
      }
      const tipMsg: ChatMessage = {
        id: genId('msg'),
        role: 'system',
        bubbleStyle: 'narrator',
        text: reachedSeal
          ? '旁白：契约仪式已就绪。你可以申请契约（盖完仍可继续玩），也可以把这位男主留在名册里。'
          : '旁白：余韵落下。你可以申请契约（盖完仍可继续玩），也可以把这位男主留在名册里。',
        timestamp: Date.now() + 3,
      }
      next = {
        ...next,
        messages: [...next.messages, bodyMsg, tipMsg],
        stampPrompted: true,
        updatedAt: Date.now(),
      }
      await persist(next)
      useUIStore.getState().setStampOfferModalOpen(true)
      if (next.dynamicNpc && !next.saveNpcDismissed) {
        useUIStore.getState().setSaveNpcModalOpen(true)
      }
    }

    next = applySpawnedNpcsToSession(next, spawnedNpcs)
    if (spawnedNpcs?.length) {
      await persist(next)
    }

    set((s) => ({
      activeSession: next,
      sessions: s.sessions.map((x) => (x.id === next.id ? next : x)),
    }))
    if (!(reachedSeal || enteredAfterglow)) maybePromptSaveNpc(next)
  },

  archiveSession: async (id, note) => {
    const session = get().sessions.find((x) => x.id === id)
    if (!session) return
    const next: Session = {
      ...session,
      status: 'archived',
      archiveNote: note ?? '史诗存档封存',
      updatedAt: Date.now(),
    }
    await persist(next)
    set((s) => ({
      sessions: s.sessions.map((x) => (x.id === id ? next : x)),
      activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
      activeSession: s.activeSessionId === id ? null : s.activeSession,
    }))
  },

  removeSession: async (id) => {
    await deleteSession(id)
    set((s) => ({
      sessions: s.sessions.filter((x) => x.id !== id),
      activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
      activeSession: s.activeSessionId === id ? null : s.activeSession,
    }))
  },

  renameSession: async (id, title) => {
    const session = get().sessions.find((x) => x.id === id)
    if (!session) return
    const next: Session = { ...session, title, updatedAt: Date.now() }
    await persist(next)
    set((s) => ({
      sessions: s.sessions.map((x) => (x.id === id ? next : x)),
      activeSession: s.activeSession?.id === id ? next : s.activeSession,
    }))
  },

  sendGiftExchange: async (_characterId, itemName) => {
    const { activeSession } = get()
    if (!activeSession) return
    const now = Date.now()
    const userGiftMsg: ChatMessage = {
      id: genId('msg'),
      role: 'user',
      text: `🎁 送出了「${itemName}」`,
      bubbleStyle: 'system',
      timestamp: now,
    }
    const next: Session = {
      ...activeSession,
      messages: [...activeSession.messages, userGiftMsg],
      updatedAt: Date.now(),
    }
    await persist(next)
    set((s) => ({
      activeSession: next,
      sessions: s.sessions.map((x) => (x.id === next.id ? next : x)),
    }))
    await get().requestAiReply()
  },

  sendTransfer: async (amount, note) => {
    const { activeSession } = get()
    if (!activeSession || amount <= 0) return false
    const settings = useSettingsStore.getState().settings
    const profile = useProfileStore.getState().profiles.find(
      (p) => p.id === settings.ui.activeProfileId,
    )
    if (!profile) return false
    const ok = await useProfileStore.getState().spendCoins(profile.id, amount)
    if (!ok) return false
    const noteText = note?.trim() ? ` · ${note.trim()}` : ''
    await get().appendUserMessage(`💰 转账 ${amount} G${noteText}`, {
      bubbleStyle: 'system',
      transfer: { amount, note },
    })
    return true
  },

  regenerateLastCharacterReply: async () => {
    await get().requestAiReply({ regenerate: true })
  },

  appendSystemMessage: async (text, style = 'warning') => {
    const { activeSession } = get()
    if (!activeSession) return
    const msg: ChatMessage = {
      id: genId('msg'),
      role: 'system',
      text,
      bubbleStyle: style,
      timestamp: Date.now(),
    }
    const next: Session = {
      ...activeSession,
      messages: [...activeSession.messages, msg],
      updatedAt: Date.now(),
    }
    await persist(next)
    set((s) => ({
      activeSession: next,
      sessions: s.sessions.map((x) => (x.id === next.id ? next : x)),
    }))
  },

  setLastDiceSummary: async (summary) => {
    const { activeSession } = get()
    if (!activeSession) return
    const next: Session = {
      ...activeSession,
      lastDiceSummary: summary,
      updatedAt: Date.now(),
    }
    await persist(next)
    set((s) => ({
      activeSession: next,
      sessions: s.sessions.map((x) => (x.id === next.id ? next : x)),
    }))
  },

  cancelAiReply: () => {
    activeAiAbort?.abort()
    activeAiAbort = null
    set({ aiReplying: false })
  },

  clearAiError: () => set({ aiError: null }),

  requestAiReply: async (options) => {
    if (get().aiReplying) return
    let { activeSession } = get()
    if (!activeSession) return

    if (options?.regenerate) {
      const msgs = [...activeSession.messages]
      let lastUserIdx = -1
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'user') {
          lastUserIdx = i
          break
        }
      }
      if (lastUserIdx < 0) return
      while (msgs.length > lastUserIdx + 1 && msgs[msgs.length - 1].role === 'character') {
        msgs.pop()
      }
      const trimmed: Session = { ...activeSession, messages: msgs, updatedAt: Date.now() }
      await persist(trimmed)
      set((s) => ({
        activeSession: trimmed,
        sessions: s.sessions.map((x) => (x.id === trimmed.id ? trimmed : x)),
      }))
      activeSession = trimmed
    }

    const msgs = activeSession.messages
    let lastUser: ChatMessage | undefined
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUser = msgs[i]
        break
      }
    }
    if (!lastUser) return

    activeAiAbort?.abort()
    const abortCtrl = new AbortController()
    activeAiAbort = abortCtrl
    const { signal } = abortCtrl

    set({ aiReplying: true, aiError: null })
    try {
      const settings = useSettingsStore.getState().settings
      const dataStore = useDataStore.getState()
      // 动态男主卡仅在内存：多轮/刷新丢失时从 session.dynamicNpc 重建，避免 expressions 空引用
      if (activeSession.dynamicNpc) {
        const npcId = activeSession.dynamicNpc.id
        const all = dataStore.getAllCharacters()
        if (!all[npcId]) {
          dataStore.registerRuntimeCharacter(cardFromDynamicNpc(activeSession.dynamicNpc))
        }
      }
      const { getAllCharacters, regions, worlds } = useDataStore.getState()
      const characters = getAllCharacters()
      const region = regions[activeSession.regionId]
      const profiles = useProfileStore.getState().profiles
      const gifts = useShopStore.getState().gifts
      const profile = profiles.find((p) => p.id === settings.ui.activeProfileId)

      const forceCharacterId =
        lastUser.mentionCharacterId &&
        activeSession.participantIds.includes(lastUser.mentionCharacterId)
          ? lastUser.mentionCharacterId
          : undefined

      const result = hasTextApiConfigured(settings)
        ? await generateCharacterReply({
            session: activeSession,
            lastUserMessage: lastUser,
            settings,
            characters,
            regions,
            worlds,
            userProfile: profile,
            gifts,
            forceCharacterId,
            signal,
          })
        : mockRespond(lastUser, activeSession.participantIds, settings, forceCharacterId, 'reply', undefined, {
            session: activeSession,
            region,
          })

      if (signal.aborted) return

      await get().appendCharacterMessage(result)

      const interval = settings.ui.groupInterruptInterval ?? 0
      const skipInterrupt = options?.regenerate || !!forceCharacterId
      let currentSession = get().activeSession
      if (!currentSession) return

      const newRounds = (currentSession.groupRoundsSinceInterrupt ?? 0) + 1
      const shouldInterrupt =
        !skipInterrupt &&
        currentSession.type === 'group' &&
        interval > 0 &&
        currentSession.participantIds.length >= 2 &&
        shouldJealousyInterrupt(currentSession, result.characterId, interval, newRounds)

      if (shouldInterrupt) {
        const interruptedId = result.characterId
        const interruptId = pickInterruptCharacter(
          currentSession.participantIds,
          interruptedId,
          currentSession.relationships,
        )
        if (interruptId) {
          const interruptResult = hasTextApiConfigured(settings)
            ? await generateCharacterReply({
                session: currentSession,
                lastUserMessage: lastUser,
                settings,
                characters,
                regions,
                worlds,
                userProfile: profile,
                gifts,
                forceCharacterId: interruptId,
                replyMode: 'interrupt',
                interruptedCharacterId: interruptedId,
                signal,
              })
            : mockRespond(
                lastUser,
                currentSession.participantIds,
                settings,
                interruptId,
                'interrupt',
                characters[interruptedId]?.name,
                { session: currentSession, region },
              )
          if (signal.aborted) return
          await get().appendCharacterMessage(interruptResult)
          currentSession = get().activeSession!
          const resetSession: Session = {
            ...currentSession,
            groupRoundsSinceInterrupt: 0,
            updatedAt: Date.now(),
          }
          await persist(resetSession)
          set((s) => ({
            activeSession: resetSession,
            sessions: s.sessions.map((x) => (x.id === resetSession.id ? resetSession : x)),
          }))
        } else {
          const patched: Session = {
            ...currentSession,
            groupRoundsSinceInterrupt: newRounds,
            updatedAt: Date.now(),
          }
          await persist(patched)
          set((s) => ({
            activeSession: patched,
            sessions: s.sessions.map((x) => (x.id === patched.id ? patched : x)),
          }))
        }
      } else {
        const patched: Session = {
          ...currentSession,
          groupRoundsSinceInterrupt: newRounds,
          updatedAt: Date.now(),
        }
        await persist(patched)
        set((s) => ({
          activeSession: patched,
          sessions: s.sessions.map((x) => (x.id === patched.id ? patched : x)),
        }))
      }
    } catch (e) {
      if (signal.aborted) return
      const raw = e instanceof Error ? e.message : 'AI 请求失败'
      const errMsg = /Key|密钥|401|403/i.test(raw)
        ? '鉴权失败，请检查 API Key'
        : /空回复|未返回/i.test(raw)
          ? '模型空回复，请检查 Key / 模型 / 代理'
          : /网络|fetch|Failed|proxy|超时|timeout/i.test(raw)
            ? '网络或代理异常，请检查连接'
            : raw.slice(0, 80)
      set({ aiError: errMsg })
      await get().appendSystemMessage(`⚠ ${errMsg}`)
    } finally {
      if (activeAiAbort === abortCtrl) activeAiAbort = null
      set({ aiReplying: false })
      // 用户在生成期间又发了消息：继续排下一轮回复
      if (!signal.aborted) {
        const session = get().activeSession
        const last = session?.messages[session.messages.length - 1]
        if (last?.role === 'user') {
          queueMicrotask(() => {
            void get().requestAiReply()
          })
        }
      }
    }
  },

  updateMessageText: async (messageId, text) => {
    const { activeSession } = get()
    if (!activeSession) return
    const next: Session = {
      ...activeSession,
      messages: activeSession.messages.map((m) => (m.id === messageId ? { ...m, text } : m)),
      updatedAt: Date.now(),
    }
    await persist(next)
    set((s) => ({
      activeSession: next,
      sessions: s.sessions.map((x) => (x.id === next.id ? next : x)),
    }))
  },

  updateDynamicNpc: async (patch) => {
    const { activeSession } = get()
    if (!activeSession?.dynamicNpc) return
    const dynamicNpc = { ...activeSession.dynamicNpc, ...patch }
    const next: Session = {
      ...activeSession,
      dynamicNpc,
      npcRoster: {
        ...(activeSession.npcRoster ?? {}),
        [dynamicNpc.id]: dynamicNpc,
      },
      updatedAt: Date.now(),
    }
    await persist(next)
    set((s) => ({
      activeSession: next,
      sessions: s.sessions.map((x) => (x.id === next.id ? next : x)),
    }))
  },

  setCharacterRelationship: async (characterId, patch) => {
    const { activeSession } = get()
    if (!activeSession) return
    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
    const prev = activeSession.relationships[characterId] ?? {
      favor: 0,
      trust: 0,
      dependence: 0,
    }
    const next: Session = {
      ...activeSession,
      relationships: {
        ...activeSession.relationships,
        [characterId]: {
          favor: clamp(patch.favor ?? prev.favor),
          trust: clamp(patch.trust ?? prev.trust),
          dependence: clamp(patch.dependence ?? prev.dependence),
        },
      },
      updatedAt: Date.now(),
    }
    await persist(next)
    set((s) => ({
      activeSession: next,
      sessions: s.sessions.map((x) => (x.id === next.id ? next : x)),
    }))
  },

  setHPhase: async (phase) => {
    const { activeSession } = get()
    if (!activeSession) return
    const next: Session = {
      ...activeSession,
      hPhase: phase,
      hPhasePlayerTurns: 0,
      updatedAt: Date.now(),
    }
    await persist(next)
    set((s) => ({
      activeSession: next,
      sessions: s.sessions.map((x) => (x.id === next.id ? next : x)),
    }))
  },

  dismissSaveNpcPrompt: async (retain) => {
    const { activeSession } = get()
    if (!activeSession?.dynamicNpc) return
    if (retain) {
      const npc = activeSession.dynamicNpc
      await usePassportStore.getState().saveNpc({
        id: npc.id,
        displayName: npc.displayName,
        facilityId: npc.facilityId,
        facilityName: npc.facilityName,
        npcArchetype: npc.npcArchetype,
        corruption: npc.corruption,
        branded: false,
        snapshot: {
          desire: npc.desire,
          innerThought: npc.innerThought,
          personality: npc.personality.join('、'),
          style: npc.style,
          gender: npc.gender,
          ageFeel: npc.ageFeel,
          bodyType: npc.bodyType,
          activePassive: npc.activePassive,
          kinks: npc.kinks.join('、'),
          bodyState: npc.bodyState,
          appearance: npc.appearance ?? '',
          speakingStyle: useDataStore.getState().getCharacter(npc.id)?.speakingStyle ?? '',
          background: npc.background || useDataStore.getState().getCharacter(npc.id)?.background || '',
          greeting: useDataStore.getState().getCharacter(npc.id)?.greeting ?? '',
        },
      })
      useUIStore.getState().showToast('已保留男主', npc.displayName)
    }
    const next: Session = {
      ...activeSession,
      saveNpcDismissed: true,
      updatedAt: Date.now(),
    }
    await persist(next)
    set((s) => ({
      activeSession: next,
      sessions: s.sessions.map((x) => (x.id === next.id ? next : x)),
    }))
    useUIStore.getState().setSaveNpcModalOpen(false)
  },

  focusParticipant: async (characterId) => {
    const { activeSession } = get()
    if (!activeSession) return
    if (!activeSession.participantIds.includes(characterId)) return

    useUIStore.getState().setReplyTargetCharacterId(characterId)

    if (activeSession.dynamicNpc?.id === characterId) return

    const snap = activeSession.npcRoster?.[characterId]
    if (!snap) return

    let npcRoster = { ...(activeSession.npcRoster ?? {}) }
    if (activeSession.dynamicNpc) {
      npcRoster = archiveNpcToRoster(activeSession, activeSession.dynamicNpc)
    }
    npcRoster[snap.id] = snap

    const next: Session = {
      ...activeSession,
      dynamicNpc: snap,
      npcRoster,
      updatedAt: Date.now(),
    }
    await persist(next)
    set((s) => ({
      activeSession: next,
      sessions: s.sessions.map((x) => (x.id === next.id ? next : x)),
    }))
  },

  summonSavedNpc: async (savedId) => {
    const { activeSession } = get()
    if (!activeSession) {
      useUIStore.getState().showToast('请先进入冒险域对话')
      return false
    }
    const hit = usePassportStore.getState().roster.find((n) => n.id === savedId)
    if (!hit?.branded) {
      useUIStore.getState().showToast('仅可召唤已烙印的男主')
      return false
    }

    const snap = hit.snapshot ?? {}
    const personality = (snap.personality ?? '烙印、独占').split(/[、,，]/).filter(Boolean)
    const kinks = (snap.kinks ?? '').split(/[、,，]/).filter(Boolean)
    const card: CharacterCard = {
      id: hit.id,
      name: hit.displayName,
      title: `${hit.facilityName}·${hit.npcArchetype}`,
      personality: personality.length ? personality : ['烙印', '独占'],
      speakingStyle: snap.speakingStyle || '烙印男主，对旅者有强烈独占欲。',
      background: snap.background || `已烙印男主，来自${hit.facilityName}。`,
      greeting: snap.greeting || `${hit.displayName}应召唤而来：「我来了。今天，你只能看着我。」`,
      avatar: '',
      expressions: { normal: '', shy: '', smug: '' },
      defaultExpression: 'normal',
      voice: { provider: 'browser', voiceId: 'zh-CN-XiaoxiaoNeural' },
      initialRelationship: { favor: 55, trust: 45, dependence: 30 },
      memoryRules: ['烙印后优先响应旅者召唤', `出身域界：${hit.facilityName}`],
      behavior: '烙印阶段：独占欲极强，但服从旅者指令。',
    }
    useDataStore.getState().registerRuntimeCharacter(card)

    const meta: SessionDynamicNpc = ensureNpcBioFields({
      id: hit.id,
      displayName: hit.displayName,
      facilityId: activeSession.regionId,
      facilityName: FACILITY_MAP[activeSession.regionId]?.name ?? hit.facilityName,
      npcArchetype: hit.npcArchetype,
      corruption: Math.max(hit.corruption, 100),
      corruptionStage: corruptionStageFromValue(Math.max(hit.corruption, 100)),
      attention: 92,
      possessiveness: 88,
      desire: snap.desire ?? '只想独占你此刻的全部注意力。',
      innerThought: snap.innerThought ?? '终于又见到你了……',
      bodyState: snap.bodyState ?? '呼吸略快，目光锁定你。',
      gender: snap.gender ?? '不详',
      ageFeel: snap.ageFeel ?? '成熟',
      bodyType: snap.bodyType ?? '匀称',
      style: snap.style ?? '妖异',
      appearance: snap.appearance ?? '',
      background: snap.background || card.background,
      personality: card.personality,
      activePassive: snap.activePassive ?? '完全主动',
      kinks: kinks.length ? kinks : ['独占'],
    })

    const relationships = { ...activeSession.relationships }
    if (!relationships[hit.id]) {
      relationships[hit.id] = { ...card.initialRelationship }
    }

    let npcRoster = { ...(activeSession.npcRoster ?? {}) }
    if (
      activeSession.dynamicNpc &&
      activeSession.dynamicNpc.id !== meta.id
    ) {
      npcRoster = archiveNpcToRoster(activeSession, activeSession.dynamicNpc)
    }
    npcRoster[meta.id] = meta

    const next: Session = {
      ...activeSession,
      participantIds: activeSession.participantIds.includes(hit.id)
        ? activeSession.participantIds
        : [...activeSession.participantIds, hit.id],
      type: activeSession.participantIds.includes(hit.id) && activeSession.participantIds.length === 1
        ? activeSession.type
        : activeSession.participantIds.length >= 1
          ? 'group'
          : activeSession.type,
      relationships,
      dynamicNpc: meta,
      npcRoster,
      updatedAt: Date.now(),
    }
    // 至少保持私聊若原本只有一人被替换
    if (!activeSession.participantIds.includes(hit.id) && activeSession.participantIds.length <= 1) {
      next.participantIds = [hit.id]
      next.type = 'private'
    }

    // 多人时把焦点切到新入场男主
    if (next.participantIds.length > 1) {
      useUIStore.getState().setReplyTargetCharacterId(hit.id)
    }

    const callMsg: ChatMessage = {
      id: genId('msg'),
      role: 'system',
      bubbleStyle: 'narrator',
      text: `✨ ${hit.displayName} 应召唤而来，落在「${next.dynamicNpc?.facilityName}」。`,
      timestamp: Date.now(),
    }
    const greetMsg: ChatMessage = {
      id: genId('msg'),
      role: 'character',
      characterId: hit.id,
      text: card.greeting,
      expression: 'smug',
      timestamp: Date.now() + 1,
    }
    next.messages = [...next.messages, callMsg, greetMsg]

    await persist(next)
    set((s) => ({
      activeSession: next,
      sessions: s.sessions.map((x) => (x.id === next.id ? next : x)),
    }))
    await usePassportStore.getState().saveNpc({
      ...hit,
      branded: true,
      snapshot: hit.snapshot,
    })
    return true
  },
}))
