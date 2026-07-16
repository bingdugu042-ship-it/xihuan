import type { CharacterCard, Region, SessionDynamicNpc } from '@/types'
import { genId } from '@/storage/db'
import { FACILITY_MAP } from '@/data/facilities'
import { resolveIdentityRoles } from '@/data/identityRoles'

const PICK = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

/** 动态男主默认强制男性（女本位向） */
const DEFAULT_GENDER = '男'
const AGE_FEELS = ['少年感', '青年', '壮年', '成熟', '年龄不详']
const BODY_TYPES = ['匀称', '精瘦', '肌肉型', '高挑', '宽肩', '野性', '修长']
const STYLES = ['清秀', '俊朗', '冷酷', '温柔', '知性', '妖异', '邻家']
const PERSONALITIES = ['温柔', '冷漠', '热情', '傲娇', '腹黑', '天然', '狂野', '内敛', '话痨', '羞怯']
const ACTIVE_PASSIVE = ['完全主动', '偏主动', '可主可被', '偏被动', '完全被动']
const KINKS = ['口交', '乳交', 'BDSM', '露出', '羞耻Play', '角色扮演', '温水', '冰火', '深喉', '连续高潮', '支配', '服从']

const STAGE_NAMES: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '服务者',
  2: '沉迷者',
  3: '执念者',
  4: '绑定者',
  5: '烙印',
}

export function corruptionStageFromValue(n: number): 1 | 2 | 3 | 4 | 5 {
  if (n >= 100) return 5
  if (n >= 76) return 4
  if (n >= 51) return 3
  if (n >= 26) return 2
  return 1
}

function randomDisplayName(): string {
  const family = ['苍', '凛', '玄', '烬', '夜', '岚', '墨', '朔', '珩', '澈']
  const given = ['川', '野', '渊', '白', '黎', '修', '衡', '远', '烬', '岚']
  return `${PICK(family)}${PICK(given)}`
}

function buildAppearance(params: {
  name: string
  gender: string
  ageFeel: string
  bodyType: string
  style: string
  archetype: string
}): string {
  const { name, gender, ageFeel, bodyType, style, archetype } = params
  const details = [
    `${name}看上去是${ageFeel}的${gender}，担任「${archetype}」。`,
    `体型偏${bodyType}，整体气质${style}：肩颈线条干净，眼神里带着职业训练后的专注。`,
    `衣料贴合时更能见腰腹与腿线的起伏；皮肤在域界火光下会浮出一层薄汗与体温。`,
  ]
  return details.join('')
}

function buildBackground(params: {
  name: string
  facilityName: string
  archetype: string
  gender: string
  ageFeel: string
  personality: string[]
  activePassive: string
  kinks: string[]
  playerRoleName?: string
}): string {
  const {
    name,
    facilityName,
    archetype,
    gender,
    ageFeel,
    personality,
    activePassive,
    kinks,
    playerRoleName,
  } = params
  return [
    `「${name}」是艾尔茜利恩「${facilityName}」的驻场男主，本场职分为「${archetype}」。`,
    `${ageFeel} · ${gender}。曾在维序边域完成契约流程，长期驻守此地。`,
    `性格偏向${personality.join('、')}，互动上${activePassive}；私底下的性癖倾向包括${kinks.slice(0, 3).join('、')}。`,
    playerRoleName
      ? `对今天选定「${playerRoleName}」身份的旅者，会严格按对位关系推进体验，同时把逐渐升温的私人欲望藏在仪轨里。`
      : `对旅者既保持职业引导，也会在节奏合适时释放更私人的欲望与占有欲。`,
  ].join('')
}

/** 旧存档缺字段时补齐外貌/背景 */
export function ensureNpcBioFields(npc: SessionDynamicNpc): SessionDynamicNpc {
  const appearance =
    npc.appearance?.trim() ||
    buildAppearance({
      name: npc.displayName,
      gender: npc.gender || '不详',
      ageFeel: npc.ageFeel || '成熟',
      bodyType: npc.bodyType || '匀称',
      style: npc.style || '清秀',
      archetype: npc.npcArchetype || '男主',
    })
  const background =
    npc.background?.trim() ||
    buildBackground({
      name: npc.displayName,
      facilityName: npc.facilityName,
      archetype: npc.npcArchetype || '男主',
      gender: npc.gender || '不详',
      ageFeel: npc.ageFeel || '成熟',
      personality: npc.personality?.length ? npc.personality : ['沉稳'],
      activePassive: npc.activePassive || '可主可被',
      kinks: npc.kinks?.length ? npc.kinks : ['角色扮演'],
    })
  if (appearance === npc.appearance && background === npc.background) return npc
  return { ...npc, appearance, background }
}

/** 从会话快照重建 CharacterCard（多轮/刷新后 runtimeCharacters 丢失时用） */
export function cardFromDynamicNpc(npc: SessionDynamicNpc): CharacterCard {
  const bio = ensureNpcBioFields(npc)
  return {
    id: bio.id,
    name: bio.displayName,
    title: `${bio.facilityName}·${bio.npcArchetype}`,
    personality: bio.personality ?? [],
    speakingStyle: `${bio.activePassive}；${bio.style}气质。称呼旅者为「你」。`,
    background: bio.background,
    appearance: bio.appearance,
    greeting: '',
    avatar: '',
    expressions: { normal: '', shy: '', smug: '' },
    defaultExpression: 'normal',
    voice: { provider: 'browser', voiceId: 'zh-CN-XiaoxiaoNeural' },
    initialRelationship: { favor: 10, trust: 8, dependence: 0 },
    memoryRules: [`记住旅者在${bio.facilityName}的偏好与节奏`],
    behavior: `${STAGE_NAMES[bio.corruptionStage]}阶段：专业与个人欲望并行。`,
  }
}

export function spawnDynamicNpcForFacility(region: Region, playerIdentityId?: string): {
  meta: SessionDynamicNpc
  card: CharacterCard
} {
  const facility = FACILITY_MAP[region.id]
  const roles = resolveIdentityRoles(region.id, playerIdentityId)
  const gender = DEFAULT_GENDER
  const ageFeel = PICK(AGE_FEELS)
  const bodyType = PICK(BODY_TYPES)
  const style = PICK(STYLES)
  const personality = [PICK(PERSONALITIES), PICK(PERSONALITIES)].filter((v, i, a) => a.indexOf(v) === i)
  const activePassive = PICK(ACTIVE_PASSIVE)
  const kinks = Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => PICK(KINKS)).filter(
    (v, i, a) => a.indexOf(v) === i,
  )
  const displayName = randomDisplayName()
  const id = genId('npc')

  // NPC 职称为对位身份名，绝不用玩家选的那一个
  const archetype = roles?.npc.name ?? region.npcArchetype ?? facility?.npcArchetype ?? '男主'
  const playerRole = roles?.player
  const npcRole = roles?.npc

  const appearance = buildAppearance({
    name: displayName,
    gender,
    ageFeel,
    bodyType,
    style,
    archetype,
  })
  const background = buildBackground({
    name: displayName,
    facilityName: region.name,
    archetype,
    gender,
    ageFeel,
    personality,
    activePassive,
    kinks,
    playerRoleName: playerRole?.name,
  })

  const meta: SessionDynamicNpc = {
    id,
    displayName,
    facilityId: region.id,
    facilityName: region.name,
    npcArchetype: archetype,
    corruption: 5 + Math.floor(Math.random() * 10),
    corruptionStage: 1,
    attention: 15 + Math.floor(Math.random() * 20),
    possessiveness: Math.floor(Math.random() * 12),
    desire: playerRole
      ? `作为「${archetype}」，配合这位「${playerRole.name}」把${region.name}的体验推到最舒服。`
      : `想先确认你是否愿意在${region.name}里把节奏交给自己来引导。`,
    innerThought: playerRole
      ? `对方选了「${playerRole.name}」……那我就是「${archetype}」，得按这个对位来开场。`
      : `这位旅者的气场……值得好好试探一下。`,
    bodyState: '呼吸平稳，神情自若，身体尚未进入状态。',
    gender,
    ageFeel,
    bodyType,
    style,
    appearance,
    background,
    personality,
    activePassive,
    kinks,
  }
  meta.corruptionStage = corruptionStageFromValue(meta.corruption)

  const card: CharacterCard = {
    id,
    name: displayName,
    title: `${region.name}·${archetype}`,
    personality,
    speakingStyle: `以「${archetype}」身份互动；${activePassive}；${style}气质。称呼旅者为「你」（对方是「${playerRole?.name ?? '旅者'}」）。`,
    background,
    appearance,
    greeting: buildGreeting(region.name, archetype, displayName, style, playerRole?.name, npcRole?.name),
    avatar: '',
    expressions: { normal: '', shy: '', smug: '' },
    defaultExpression: 'normal',
    voice: { provider: 'browser', voiceId: 'zh-CN-XiaoxiaoNeural' },
    initialRelationship: { favor: 10, trust: 8, dependence: 0 },
    memoryRules: [
      `记住旅者在${region.name}的偏好与节奏`,
      playerRole
        ? `用户固定是「${playerRole.name}」——把他/她当作「${playerRole.name}」对待，不要抢这个身份`
        : '',
      npcRole
        ? `我自己固定是「${npcRole.name}」——只用这个身份说话与行动`
        : '',
    ].filter(Boolean),
    behavior: `${STAGE_NAMES[meta.corruptionStage]}阶段：以「${archetype}」身份专业与欲望并行；用户是「${playerRole?.name ?? '旅者'}」。`,
  }

  return { meta, card }
}

function buildGreeting(
  facilityName: string,
  archetype: string,
  name: string,
  style: string,
  playerRoleName?: string,
  npcRoleName?: string,
): string {
  const role = npcRoleName ?? archetype
  const lines = [
    `欢迎进入${facilityName}。我是${name}——今天在这里担任「${role}」。`,
  ]
  if (playerRoleName) {
    lines.push(`你选了「${playerRoleName}」……那我这边就按「${role}」来配合你。`)
  } else {
    lines.push(`这里的规则对你来说应该已经很熟悉了——不必拘束，你想从哪里开始，我们就从哪里开始。`)
  }
  lines.push(
    style === '温柔'
      ? `我会慢慢带你熟悉这个空间，你只要告诉我，什么力度、什么节奏让你最舒服。`
      : `别紧张。你要的是体验，我要的是让你记住今天——说吧，你想先试哪一种？`,
  )
  return lines.join('\n')
}

export function stageLabel(stage: 1 | 2 | 3 | 4 | 5): string {
  return STAGE_NAMES[stage]
}

export function bumpDynamicNpc(npc: SessionDynamicNpc, delta = 3): SessionDynamicNpc {
  const corruption = Math.min(100, npc.corruption + delta)
  return {
    ...npc,
    corruption,
    corruptionStage: corruptionStageFromValue(corruption),
    attention: Math.min(100, npc.attention + 2),
  }
}
