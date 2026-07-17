/** 酒馆生活玩法 · AI / mock 生成 */

import type { AppSettings } from '@/types'
import {
  ROSTER_BEAT_LABELS,
  type CommissionJob,
  type CommissionLootItem,
  type CommissionOutcome,
  type ForumTag,
  type ForumThread,
  type RosterBeatAction,
} from '@/data/tavernLife'
import { hasTextApiConfigured } from '@/ai/textClient'
import { buildGlobalWorldContext } from '@/ai/worldContext'
import { DEFAULT_SHOP } from '@/store/shopStore'

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function extractJson<T>(raw: string): T | null {
  const trimmed = raw.trim()
  try {
    return JSON.parse(trimmed) as T
  } catch {
    /* continue */
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence?.[1]) {
    try {
      return JSON.parse(fence[1].trim()) as T
    } catch {
      /* continue */
    }
  }
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as T
    } catch {
      return null
    }
  }
  return null
}

async function askJson(settings: AppSettings, system: string, user: string): Promise<string> {
  const { text: api } = settings.api
  const { chatCompletion } = await import('./openaiClient')
  return chatCompletion({
    baseURL: api.baseURL,
    apiKey: api.apiKey,
    model: api.model,
    temperature: 0.88,
    maxTokens: 1800,
    proxyURL: settings.api.proxyURL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })
}

export interface ForumBoardResult {
  hotTitles: string[]
  threads: ForumThread[]
}

function mockForumBoard(): ForumBoardResult {
  const now = Date.now()
  const t1: ForumThread = {
    id: uid('post'),
    tag: '求助',
    title: '【求助】告示牌上那张新的委托有人接了吗？',
    author: '@民兵队长哈罗德',
    body: '旧磨坊附近又有野狼咬死羊了。告示牌写着二十银币悬赏，怎么到现在还没能打的冒险者接？有人知道详情吗？',
    hot: true,
    commentCount: 2,
    replies: [
      {
        author: '@酒馆老板娘莉娜',
        text: '听老汤姆说村里来了个暗夜精灵，说不定是冒险者。你去磨坊边再看看？',
      },
      {
        author: '@民兵队长哈罗德',
        text: '精灵？先别吹了……我再去告示牌盯一眼。',
      },
    ],
    createdAt: now - 3600_000,
  }
  const t2: ForumThread = {
    id: uid('post'),
    tag: '灌水',
    title: '【灌水】有没有人今天在莫奈教堂附近看到一个长翅膀的暗夜精灵？',
    author: '@铁匠老汤姆',
    body: '清晨打铁时瞥见一道黑影掠过教堂尖顶，像有翅膀。不是醉了吧？',
    hot: true,
    commentCount: 1,
    replies: [
      {
        author: '@旅商凯恩',
        text: '天界边境最近不太平，别乱盯着看。',
      },
    ],
    createdAt: now - 7200_000,
  }
  return {
    hotTitles: [t1.title, t2.title],
    threads: [t1, t2],
  }
}

export async function generateForumBoard(settings: AppSettings): Promise<ForumBoardResult> {
  if (!hasTextApiConfigured(settings)) return mockForumBoard()
  try {
    const raw = await askJson(
      settings,
      '你是艾泽利亚大陆「撰旅奇说」酒馆论坛的编辑。只输出一个 JSON 对象，不要 markdown。女本位世界，口吻像村民/冒险者闲聊。',
      `生成今日酒馆杂谈：
{
  "hotTitles": ["标题1","标题2"],
  "threads": [
    {
      "tag": "灌水|求助|传闻|委托线索",
      "title": "带【标签】的标题",
      "author": "@称呼",
      "body": "正文 2-4 句",
      "hot": true,
      "replies": [{"author":"@xx","text":"..."}]
    }
  ]
}
需要 2 条热搜标题，2 条完整帖（每帖 1-2 条回复）。`,
    )
    const parsed = extractJson<{
      hotTitles?: string[]
      threads?: {
        tag?: string
        title?: string
        author?: string
        body?: string
        hot?: boolean
        replies?: { author?: string; text?: string }[]
      }[]
    }>(raw)
    if (!parsed?.threads?.length) return mockForumBoard()
    const tags: ForumTag[] = ['灌水', '求助', '传闻', '委托线索']
    const threads: ForumThread[] = parsed.threads.slice(0, 4).map((t) => {
      const tag = (tags.includes(t.tag as ForumTag) ? t.tag : '传闻') as ForumTag
      const replies = (t.replies ?? []).slice(0, 4).map((r) => ({
        author: r.author?.trim() || '@路人',
        text: r.text?.trim() || '……',
      }))
      return {
        id: uid('post'),
        tag,
        title: t.title?.trim() || `【${tag}】今日杂谈`,
        author: t.author?.trim() || '@匿名',
        body: t.body?.trim() || '……',
        hot: Boolean(t.hot),
        commentCount: replies.length,
        replies,
        createdAt: Date.now(),
      }
    })
    return {
      hotTitles: (parsed.hotTitles?.length ? parsed.hotTitles : threads.map((x) => x.title)).slice(0, 3),
      threads,
    }
  } catch {
    return mockForumBoard()
  }
}

function mockCommissions(): CommissionJob[] {
  return [
    {
      id: uid('job'),
      title: '教堂夜巡（临时）',
      reward: 80,
      employer: '莫奈教堂 · 事务处',
      summary: '夜班看守侧门，驱散闲人，记录可疑动静。',
      tags: ['夜班', '同城', '经验优先'],
      location: '莫奈教堂侧廊',
      timeSlot: '今夜 22:00–04:00',
      staminaCost: 2,
      risk: '若遇盗贼受伤，教堂不承担医药费。',
      status: 'open',
    },
    {
      id: uid('job'),
      title: '商路信差',
      reward: 45,
      employer: '旅商公会',
      summary: '把密封信件送到东门外驿站，当日往返。',
      tags: ['同城', '轻活'],
      location: '东门驿站',
      timeSlot: '今日午后',
      staminaCost: 1,
      risk: '雨天泥泞可能导致延误，无额外补偿。',
      status: 'open',
    },
    {
      id: uid('job'),
      title: '旧磨坊清狼',
      reward: 120,
      employer: '民兵队',
      summary: '驱散旧磨坊附近狼群，带回狼耳为证。',
      tags: ['危险', '野外'],
      location: '旧磨坊外围',
      timeSlot: '今日黄昏前',
      staminaCost: 2,
      risk: '可能一无所获，甚至空手而归。',
      status: 'open',
    },
  ]
}

export async function generateCommissionBoard(settings: AppSettings): Promise<CommissionJob[]> {
  if (!hasTextApiConfigured(settings)) return mockCommissions()
  try {
    const worldHint = buildGlobalWorldContext().slice(0, 600)
    const raw = await askJson(
      settings,
      '你是艾泽利亚村庄「委托会」告示牌文书。只输出 JSON，不要 markdown。可结合当前节日氛围出题。',
      `${worldHint ? `世界语境（节选）：\n${worldHint}\n\n` : ''}生成 3~4 条可接日工委托（动态、可刷新）：
{
  "jobs": [
    {
      "title": "岗位名",
      "reward": 80,
      "employer": "雇主",
      "summary": "一句话简介",
      "tags": ["夜班","同城"],
      "location": "地点",
      "timeSlot": "时段",
      "staminaCost": 1,
      "risk": "风险说明"
    }
  ]
}
reward 为金币整数 20-200；staminaCost 为 1 或 2。有节日时至少 1 条与节日相关。`,
    )
    const parsed = extractJson<{
      jobs?: {
        title?: string
        reward?: number
        employer?: string
        summary?: string
        tags?: string[]
        location?: string
        timeSlot?: string
        staminaCost?: number
        risk?: string
      }[]
    }>(raw)
    if (!parsed?.jobs?.length) return mockCommissions()
    return parsed.jobs.slice(0, 4).map((j) => ({
      id: uid('job'),
      title: j.title?.trim() || '临时差事',
      reward: Math.max(10, Math.round(Number(j.reward) || 40)),
      employer: j.employer?.trim() || '告示牌',
      summary: j.summary?.trim() || '一份说不清的差事。',
      tags: (j.tags ?? ['同城']).slice(0, 4),
      location: j.location?.trim() || '村口',
      timeSlot: j.timeSlot?.trim() || '今日',
      staminaCost: Math.min(2, Math.max(1, Math.round(Number(j.staminaCost) || 1))),
      risk: j.risk?.trim() || '结果未可知。',
      status: 'open' as const,
    }))
  } catch {
    return mockCommissions()
  }
}

export interface CommissionResolveResult {
  narrative: string
  outcome: CommissionOutcome
  coinsDelta: number
  staminaSpent: number
  items: CommissionLootItem[]
}

function shopCatalogHint(): string {
  return DEFAULT_SHOP.slice(0, 12)
    .map((i) => `${i.id}:${i.name}`)
    .join('；')
}

function normalizeLoot(raw: unknown, outcome: CommissionOutcome): CommissionLootItem[] {
  if (outcome === 'fail' || !Array.isArray(raw)) return []
  const out: CommissionLootItem[] = []
  for (const row of raw.slice(0, 3)) {
    if (!row || typeof row !== 'object') continue
    const r = row as { itemId?: string; name?: string; count?: number; desc?: string }
    const name = String(r.name ?? '').trim()
    if (!name) continue
    const known = DEFAULT_SHOP.find(
      (i) => i.id === r.itemId || i.name === name || i.name.includes(name) || name.includes(i.name),
    )
    out.push({
      itemId: known?.id ?? r.itemId,
      name: known?.name ?? name,
      count: Math.min(5, Math.max(1, Math.round(Number(r.count) || 1))),
      desc: r.desc?.trim() || known?.desc,
    })
  }
  return out
}

function mockResolve(job: CommissionJob): CommissionResolveResult {
  const roll = Math.random()
  if (roll < 0.25) {
    return {
      narrative: `你接了「${job.title}」，却在半路被雨和岔路耽误。忙活一场，雇主只叹了口气，报酬泡了汤。`,
      outcome: 'fail',
      coinsDelta: 0,
      staminaSpent: job.staminaCost,
      items: [],
    }
  }
  if (roll < 0.55) {
    const coins = Math.round(job.reward * 0.45)
    return {
      narrative: `「${job.title}」只完成了一半：${job.summary} 雇主勉强认可，塞给你一点辛苦钱。`,
      outcome: 'partial',
      coinsDelta: coins,
      staminaSpent: job.staminaCost,
      items: [{ itemId: 'pot_heal_minor', name: '初级治疗药水', count: 1 }],
    }
  }
  return {
    narrative: `你按时抵达${job.location}，按约定完成「${job.title}」。过程磕磕绊绊，但证据齐全，雇主如数付清报酬。`,
    outcome: 'success',
    coinsDelta: job.reward,
    staminaSpent: job.staminaCost,
    items: [{ itemId: 'pot_desire_mid', name: '中级欲火药剂', count: 1 }],
  }
}

/**
 * 委托成功判定（由 AI 叙事结算）：
 * - success：目标基本达成，接近标价金币，可掉落 0~2 件道具
 * - partial：证据不足/超时，30%~60% 金币，偶发小道具
 * - fail：未达成，金币 0，无掉落
 */
export async function resolveCommissionRun(
  settings: AppSettings,
  job: CommissionJob,
  playerName: string,
): Promise<CommissionResolveResult> {
  if (!hasTextApiConfigured(settings)) return mockResolve(job)
  try {
    const worldHint = buildGlobalWorldContext().slice(0, 500)
    const raw = await askJson(
      settings,
      '你是艾泽利亚委托结算旁白与判定官。只输出 JSON。根据风险与合理剧情判定 success/partial/fail。',
      `${worldHint ? `世界语境：\n${worldHint}\n\n` : ''}旅者「${playerName}」接取委托：
标题：${job.title}
雇主：${job.employer}
简介：${job.summary}
地点：${job.location}
标价报酬：${job.reward} 金币
体力消耗：${job.staminaCost}
风险：${job.risk}

判定标准：
- success：按时抵达、完成关键证据/任务目标
- partial：完成一半或证据不全
- fail：未完成或一无所获

已知道具目录（优先用这些 id）：${shopCatalogHint()}

输出：
{
  "narrative": "过程事件 120-220 字（含关键转折）",
  "outcome": "success|partial|fail",
  "coinsDelta": 0,
  "staminaSpent": ${job.staminaCost},
  "items": [{"itemId":"pot_heal_minor","name":"初级治疗药水","count":1}]
}
fail 时 coinsDelta=0 且 items=[]；partial 金币约为标价 30%-60%；success 接近标价，可给 0-2 件道具。`,
    )
    const parsed = extractJson<{
      narrative?: string
      outcome?: string
      coinsDelta?: number
      staminaSpent?: number
      items?: unknown
    }>(raw)
    if (!parsed?.narrative) return mockResolve(job)
    const outcome =
      parsed.outcome === 'fail' || parsed.outcome === 'partial' || parsed.outcome === 'success'
        ? parsed.outcome
        : 'partial'
    let coins = Math.max(0, Math.round(Number(parsed.coinsDelta) || 0))
    if (outcome === 'fail') coins = 0
    return {
      narrative: parsed.narrative.trim(),
      outcome,
      coinsDelta: coins,
      staminaSpent: Math.min(2, Math.max(1, Math.round(Number(parsed.staminaSpent) || job.staminaCost))),
      items: normalizeLoot(parsed.items, outcome),
    }
  } catch {
    return mockResolve(job)
  }
}

function mockRosterBeat(name: string, action: RosterBeatAction): string {
  const label = ROSTER_BEAT_LABELS[action]
  switch (action) {
    case 'errand':
      return `你把一袋信件塞给${name}。「跑腿。」他应了一声，脚步轻得像怕惊动整条街。回来时衣角沾着尘，却把回执递到你掌心——指尖温热，眼神却躲着你。`
    case 'warmbed':
      return `${name}被你按进被褥里。「暖床。」他耳尖发红，却还是乖乖侧身腾出位置。呼吸渐渐和你同频，窗外夜风都懒得敲门。`
    case 'standby':
      return `你点名「战斗待命」。${name}检查刀柄与护甲，站到你身侧半步外：「随时。」短短一句，像把整片战场都收进了你的影子里。`
    case 'promote':
      return `你郑重说「转正」。${name}愣了半息，才低声问：「……真的？」随即单膝触地，声音发紧：「那从今夜起，我就是你名单上的人了。」`
    default:
      return `${name}执行了「${label}」，留下一段说不清的余韵。`
  }
}

export async function generateRosterBeat(
  settings: AppSettings,
  params: {
    characterName: string
    action: RosterBeatAction
    background?: string
  },
): Promise<string> {
  const { characterName, action, background } = params
  const label = ROSTER_BEAT_LABELS[action]
  if (!hasTextApiConfigured(settings)) return mockRosterBeat(characterName, action)
  try {
    const { text: api } = settings.api
    const { chatCompletion } = await import('./openaiClient')
    const text = await chatCompletion({
      baseURL: api.baseURL,
      apiKey: api.apiKey,
      model: api.model,
      temperature: 0.9,
      maxTokens: 400,
      proxyURL: settings.api.proxyURL,
      messages: [
        {
          role: 'system',
          content:
            '你是艾泽利亚沉浸旁白。写一段 80-180 字的短剧情：旅者对男主下达指令后的互动。女本位，有画面感，可含一句对话。不要列表，不要提 AI。',
        },
        {
          role: 'user',
          content: `男主：${characterName}\n指令：${label}\n背景：${(background ?? '').slice(0, 200) || '试炼员'}`,
        },
      ],
    })
    return text.trim() || mockRosterBeat(characterName, action)
  } catch {
    return mockRosterBeat(characterName, action)
  }
}
