/**
 * 玩家操控角色卡（旅者）—— 与「冒险者档案 / 我的模板」同一套数据。
 * AI 只把这份卡当作「对面在跟谁说话」的对象，绝不替玩家扮演。
 */

import type { UserProfile } from '@/types'
import { ADVENTURE_CLASSES, ATTR_LABELS, type AttrKey } from '@/data/adventureAttributes'
import { useAdventureStatsStore } from '@/store/adventureStatsStore'

function clip(s: string, n: number) {
  const t = s.trim()
  if (t.length <= n) return t
  return `${t.slice(0, n)}…`
}

/** 组装写入 system prompt 的「玩家角色」块 */
export function buildTravelerCardBlock(userProfile?: UserProfile | null): string {
  if (!userProfile) {
    return [
      '## 玩家操控角色（旅者）',
      '尚未保存冒险者档案。请把用户发言当作未具名旅者，仍严禁 AI 用第一人称扮演旅者。',
    ].join('\n')
  }

  let adventureLine = ''
  try {
    const adv = useAdventureStatsStore.getState()
    const cls = ADVENTURE_CLASSES.find((c) => c.id === adv.classId)
    const attrs = (Object.keys(ATTR_LABELS) as AttrKey[])
      .map((k) => `${ATTR_LABELS[k]}${adv.attributes[k]}`)
      .join(' / ')
    adventureLine = [
      `冒险职业：${cls?.name ?? '未选'} · Lv.${adv.level ?? 1}`,
      adv.race ? `冒险种族：${adv.race}` : '',
      adv.bodyType ? `体型气质：${adv.bodyType}` : '',
      adv.background ? `冒险背景：${clip(adv.background, 220)}` : '',
      attrs ? `六维：${attrs}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  } catch {
    /* store 未就绪 */
  }

  return [
    '## 玩家操控角色（旅者 · 冒险者档案）',
    '这份卡 = 设置「我的模板」= 酒馆「冒险者档案」。用户每一句都是在扮演此角色。',
    `姓名：${userProfile.name}`,
    `年龄：${userProfile.age || '未填'} · 性别：${userProfile.gender || '未填'}`,
    userProfile.persona ? `人设自述：${clip(userProfile.persona, 500)}` : '人设自述：未填',
    userProfile.assets ? `资产/身份：${clip(userProfile.assets, 160)}` : '',
    userProfile.livingEnvironment ? `居住环境：${clip(userProfile.livingEnvironment, 160)}` : '',
    userProfile.homeLayout ? `家庭布置：${clip(userProfile.homeLayout, 160)}` : '',
    adventureLine,
    '',
    '### 视角铁律（禁止错乱）',
    `1. 用户消息 = 「${userProfile.name}」在说话/行动；你（AI）绝不能用 ${userProfile.name} 的第一人称写回复。`,
    '2. 你只扮演在场男主 / NPC；回复 JSON 的 text 只能是男主视角。',
    '3. 不要把旅者写成男主，不要把男主口吻套到旅者身上，不要替旅者做决定或代打字。',
    '4. 域内「身份对位」若存在：旅者扮演玩家侧身份，男主扮演对面身份——两边不能互换。',
  ]
    .filter(Boolean)
    .join('\n')
}

/** 给历史用户句加上说话人标注，防止模型视角漂移 */
export function prefixTravelerUtterance(
  text: string,
  userProfile?: UserProfile | null,
): string {
  const name = userProfile?.name?.trim() || '旅者'
  return `【玩家操控·${name}】${text}`
}
