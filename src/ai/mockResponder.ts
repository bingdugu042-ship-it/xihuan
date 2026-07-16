import type { ChatMessage, Choice, AppSettings, Session, Region } from '../types'
import { getAiParams, clampReplyText } from './aiParams'
import { requestedSpawnCount, wantsNpcSpawn, type SpawnedNpcDraft } from './spawnedNpc'

const EXPRESSIONS = ['normal', 'happy', 'shy', 'surprised']
const SHORT = ['嗯……你说得有道理。', '原来你是这样想的。', '我能感觉到你的认真。']
const MEDIUM = [
  '嗯……你说得有道理。我沉默了一会儿，指尖在扶手上轻轻敲了两下，像是在整理思绪。原来你是这样想的，这倒让我有些意外——不是不喜欢，只是觉得，你比我想象中更坦率。',
  '我能感觉到你话里的认真。周围安静下来，只剩彼此的呼吸。我望着你，忽然觉得，这样说话的时光很值得记住。',
]
const LONG_OPEN =
  '厅堂火光柔和，空气里带着香草与古木混在一起的味道。我听着你的话，一字一句都落在心里。'

let choiceCounter = 0
function makeChoices(max: number): Choice[] {
  if (max <= 0) return []
  choiceCounter += 1
  const pools = [
    ['继续追问', '转移话题', '沉默倾听'],
    ['表示理解', '开玩笑缓解', '认真回应'],
  ]
  const pool = pools[choiceCounter % pools.length]
  return pool.slice(0, max).map((text, i) => ({ id: `c${choiceCounter}_${i}`, text }))
}

const WESTERN_SHORT = [
  '……你这眼神，像要把我看穿。我往旁边半步，留给你一个出口——也留给自己一点余裕。',
  '风里有香草与金属的味道。我说：今天的险境，你想怎么过？我听你的。',
  '你的气息比刚才更近了一点——在艾尔茜利恩，坦率才是通行证。',
]

const WESTERN_MEDIUM = [
  '艾尔茜利恩的规则你我都懂，不必装矜持。我侧过身，让厅堂的火光落在你肩线，指尖在剑柄上轻轻敲了两下，等你给下一步信号。',
  '这里的空气带着古木与香氛混在一起的干净味道。我望着你，把语速放慢：你想先聊，还是先让我带你熟悉动线？',
]

function buildWesternMockText(settings: AppSettings, userText: string, region?: Region): string {
  const { outputCharMax } = getAiParams(settings)
  const place = region?.name ?? '冒险域'
  let body: string
  if (outputCharMax <= 80) {
    body = WESTERN_SHORT[Math.floor(Math.random() * WESTERN_SHORT.length)]
  } else if (outputCharMax <= 400) {
    body = WESTERN_MEDIUM[Math.floor(Math.random() * WESTERN_MEDIUM.length)]
  } else {
    body = [
      `${place}的隔音很好，外面集市的喧嚣像被滤成一层薄雾。`,
      `你方才说的「${userText.slice(0, 16)}」我记下了。作为今天的男主，我不会替你决定——但我会把你的每一个停顿都当成信号。`,
      `如果你愿意，我们可以从最简单的触碰开始，也可以直接告诉我你想要的强度与边界。`,
    ].join('\n\n')
  }
  return clampReplyText(body, outputCharMax)
}

function buildMockText(settings: AppSettings, userText: string): string {
  const { outputCharMax } = getAiParams(settings)
  let body: string
  if (outputCharMax <= 80) {
    body = SHORT[Math.floor(Math.random() * SHORT.length)]
  } else if (outputCharMax <= 400) {
    body = MEDIUM[Math.floor(Math.random() * MEDIUM.length)]
  } else {
    const paras = Math.max(3, Math.ceil(outputCharMax / 500))
    const chunks: string[] = [LONG_OPEN]
    for (let i = 0; i < paras; i++) {
      chunks.push(
        `第 ${i + 1} 段：你方才说的「${userText.slice(0, 12)}」让我想起许多事。风从走廊尽头吹来，带着干净的气息。我试着用更完整的方式回应你——不是敷衍，而是真的想让你听见我此刻的想法。`,
      )
    }
    body = chunks.join('\n\n')
  }
  return clampReplyText(body, outputCharMax)
}

export interface MockAIResult {
  characterId: string
  text: string
  expression: string
  choices: Choice[]
  relationshipChange?: { favor: number; trust: number; dependence: number }
  memoryEvent?: { type: 'milestone' | 'daily' | 'conflict' | 'secret' | 'preference' | 'facility' | 'npc_bond'; text: string }
  npcDesire?: string
  npcInnerThought?: string
  npcBodyState?: string
  hPhase?: import('../types').HPhase
  npcCorruptionDelta?: number
  bodyStatDeltas?: Record<string, number>
  bodyStateLabels?: Partial<Record<'lower' | 'stamina' | 'mind', string>>
  guideAdvance?: boolean
  /** 对话中生成的新男主，写入「在场」条 */
  spawnedNpcs?: import('./spawnedNpc').SpawnedNpcDraft[]
}

export function mockRespond(
  lastUserMessage: ChatMessage,
  participantIds: string[],
  settings: AppSettings,
  forceCharacterId?: string,
  replyMode: 'reply' | 'interrupt' = 'reply',
  interruptedCharacterName?: string,
  ctx?: { session?: Session; region?: Region },
): MockAIResult {
  const isInterrupt = replyMode === 'interrupt'
  const characterId =
    forceCharacterId && participantIds.includes(forceCharacterId)
      ? forceCharacterId
      : participantIds[Math.floor(Math.random() * participantIds.length)]

  let text: string
  if (isInterrupt) {
    const target = interruptedCharacterName ?? '你'
    const snippets = [
      `等等——${target}，你话说完了吗？玩家可还看着呢。`,
      `哼，${target} 别独占风头啊，我也想说两句。`,
      `……${target}，你刚才那语气什么意思？当我不存在？`,
      `${target}，够了。轮到我了——玩家，你听我说。`,
      `（打断 ${target}）诶，怎么只理他不理我啊？`,
    ]
    text = snippets[Math.floor(Math.random() * snippets.length)]
  } else {
    const isWestern = ctx?.region?.worldId === 'aetherion' || ctx?.session?.dynamicNpc
    text = isWestern
      ? buildWesternMockText(settings, lastUserMessage.text, ctx?.region)
      : buildMockText(settings, lastUserMessage.text)
  }

  const expression = EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)]
  const { maxChoices } = getAiParams(settings)
  const choices = isInterrupt ? [] : makeChoices(maxChoices)

  const memoryEvent =
    !isInterrupt && Math.random() < 0.25
      ? {
          type: 'daily' as const,
          text: `玩家说了：「${lastUserMessage.text.slice(0, 20)}」`,
        }
      : undefined

  const isWestern = ctx?.region?.worldId === 'aetherion' || ctx?.session?.dynamicNpc

  const spawnedNpcs: SpawnedNpcDraft[] | undefined =
    !isInterrupt && wantsNpcSpawn(lastUserMessage.text)
      ? mockSpawnDrafts(lastUserMessage.text)
      : undefined

  return {
    characterId,
    text: spawnedNpcs?.length
      ? `${text}\n\n（名单已写入在场条：${spawnedNpcs.map((n) => n.name).join('、')}）`
      : text,
    expression,
    choices,
    relationshipChange: isWestern
      ? undefined
      : {
          favor: Math.floor(Math.random() * 4) + 1,
          trust: Math.floor(Math.random() * 3),
          dependence: Math.floor(Math.random() * 2),
        },
    memoryEvent,
    spawnedNpcs,
    ...(isWestern && !isInterrupt
      ? (() => {
          const session = ctx?.session
          const phase = session?.hPhase ?? 'idle'
          const order = ['idle', 'foreplay', 'main', 'climax', 'afterglow'] as const
          const idx = order.indexOf(phase as (typeof order)[number])
          const nextPhase = order[Math.min(idx + 1, order.length - 1)]
          const turns = session?.guideTurnsInStage ?? 0
          return {
            npcDesire: `想顺着「${(lastUserMessage?.text ?? '你').slice(0, 16)}」把这一拍再推近一点。`,
            npcInnerThought: `这句让他心里一紧——得马上接住，不能冷场。`,
            npcBodyState:
              nextPhase === 'idle'
                ? '神情跟着对话微微变了，目光落在你身上。'
                : nextPhase === 'foreplay'
                  ? '呼吸略沉，指尖有意无意蹭过你的衣缘。'
                  : nextPhase === 'main'
                    ? '体温升高，肌肉绷紧，呼吸贴着你的节奏。'
                    : nextPhase === 'climax'
                      ? '呼吸乱了，几乎压不住当下的冲动。'
                      : '喘息未平，却仍贴着余温不愿松开。',
            npcCorruptionDelta: 2 + Math.floor(Math.random() * 3),
            hPhase: nextPhase,
            guideAdvance: turns >= 1,
            bodyStatDeltas: { sensitivity: 2, exposure: 1 },
            bodyStateLabels: { lower: '湿润', stamina: '喘息', mind: '发懵' },
          }
        })()
      : {}),
  }
}

function mockSpawnDrafts(userText: string): SpawnedNpcDraft[] {
  const n = requestedSpawnCount(userText) ?? 3
  const pool = ['黎川', '沈野', '顾深', '夜澈', '白珩', '晏清', '霍烬', '司徒岚', '裴宴', '云昭']
  return pool.slice(0, n).map((name, i) => ({
    name,
    title: `在场男主·${i + 1}`,
    appearance: '眉眼锋利，衣料贴合肩线，站姿闲散却压得住场。',
    personality: ['沉稳', '好看'],
    background: '因旅者点名而入场，档案当场展开。',
    desire: '想先确认你的目光落在谁身上。',
    innerThought: '被点名了……那就别浪费这一场。',
    bodyState: '站姿松弛，目光却锁着你。',
    gender: '男',
  }))
}
