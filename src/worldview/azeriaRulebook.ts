/**
 * 艾泽利亚规则书 · 章节索引与切片（SSOT：项目根目录 .md）
 */
import rulebookRaw from '../../艾泽利亚大陆_女本位冒险规则书.md?raw'

export interface AzeriaChapter {
  id: string
  title: string
  /** 展示用序号，如「一」「三十四」 */
  ordinal: string
}

/** 一级章节目录（与规则书 ## 标题对齐） */
export const AZERIA_CHAPTERS: AzeriaChapter[] = [
  { id: 'ch01', ordinal: '一', title: '世界基石' },
  { id: 'ch02', ordinal: '二', title: '冒险装备与物品系统' },
  { id: 'ch03', ordinal: '三', title: '玩家——冒险者设定' },
  { id: 'ch04', ordinal: '四', title: '种族体系' },
  { id: 'ch05', ordinal: '五', title: '养成与经营系统' },
  { id: 'ch07-map', ordinal: '七', title: '地图与冒险流程' },
  { id: 'ch07-h', ordinal: '七', title: 'H事件与NSFW机制' },
  { id: 'ch08-npc', ordinal: '八', title: 'NPC动态生成系统' },
  { id: 'ch08-scenes', ordinal: '八', title: '场景细则——H场景触发场景库' },
  { id: 'ch09', ordinal: '九', title: '用户指令系统' },
  { id: 'ch10', ordinal: '十', title: '开局流程' },
  { id: 'ch11', ordinal: '十一', title: '主线剧情——女神陨落与法则崩坏' },
  { id: 'ch12', ordinal: '十二', title: '阵营系统' },
  { id: 'ch13', ordinal: '十三', title: '多结局系统' },
  { id: 'ch14', ordinal: '十四', title: 'NPC服从/堕落系统' },
  { id: 'ch15', ordinal: '十五', title: '魔法体系深化' },
  { id: 'ch16', ordinal: '十六', title: '媚药/催情物品系统' },
  { id: 'ch17', ordinal: '十七', title: '束缚/调教道具系统' },
  { id: 'ch18', ordinal: '十八', title: '多人H具体规则' },
  { id: 'ch19', ordinal: '十九', title: '公共场合H判定与社会反应' },
  { id: 'ch20', ordinal: '二十', title: '仆从/奴隶系统' },
  { id: 'ch21', ordinal: '二十一', title: '竞技场/角斗系统' },
  { id: 'ch22', ordinal: '二十二', title: '称号/声望系统' },
  { id: 'ch23', ordinal: '二十三', title: '怀孕/生育系统' },
  { id: 'ch24', ordinal: '二十四', title: '怪物图鉴' },
  { id: 'ch25', ordinal: '二十五', title: '制作与附魔系统' },
  { id: 'ch26', ordinal: '二十六', title: 'NSFW场景扩展' },
  { id: 'ch27', ordinal: '二十七', title: 'AI叙事风格指导' },
  { id: 'ch28', ordinal: '二十八', title: '八大区域城市指南' },
  { id: 'ch29', ordinal: '二十九', title: '伴侣专属节日与赠送系统' },
  { id: 'ch30', ordinal: '三十', title: '最终规则条款' },
  { id: 'ch31', ordinal: '三十一', title: '魔法卷轴与特殊物品' },
  { id: 'ch32', ordinal: '三十二', title: '跨种族旅行事件' },
  { id: 'ch33', ordinal: '三十三', title: '进阶玩法——自定义挑战模式' },
  { id: 'ch34', ordinal: '三十四', title: '全部指令速查表' },
]

const FULL_TEXT = rulebookRaw

function clip(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}\n\n…（规则书节选，完整内容见游戏内规则书）`
}

/** 按 ## 标题提取章节正文 */
export function extractSectionByHeading(headingFragment: string): string {
  const pattern = new RegExp(
    `##[^\\n]*${headingFragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`,
  )
  const m = FULL_TEXT.match(pattern)
  return m?.[1]?.trim() ?? ''
}

/** 按章节 id 取正文 */
export function getChapterBody(chapterId: string): string {
  const ch = AZERIA_CHAPTERS.find((c) => c.id === chapterId)
  if (!ch) return ''
  const body = extractSectionByHeading(ch.title)
  if (body) return body
  return extractSectionByHeading(`${ch.ordinal}、${ch.title}`)
}

/** 按遭遇表小标题切片（Ch1.5.2） */
export function getEncounterTable(sectionTitle: string, maxChars = 2200): string {
  const body = extractSectionByHeading(sectionTitle)
  return clip(body, maxChars)
}

/** 女本位核心法则（Ch1.1）— 始终可注入的短摘要 */
export function getCoreLawSummary(): string {
  const section = extractSectionByHeading('1.1 女本位法则')
  if (section) return clip(section, 1200)
  return [
    '艾泽利亚第一条不可违逆的法则：一切雄性智慧生灵的欲望、忠诚、乃至存在意义，最终都将指向「她」——玩家冒险者。',
    '玩家是法则的地上化身；不需攻略任何人，是他们在攻略你。描写焦点始终在玩家感受与对方的失控。',
  ].join('\n')
}

/** 最终规则条款 Ch30 */
export function getFinalRulesSummary(maxChars = 1500): string {
  return clip(extractSectionByHeading('三十、最终规则条款'), maxChars)
}

export function getFullRulebookText(): string {
  return FULL_TEXT
}

export type AzeriaPromptContext = 'travel' | 'combat' | 'h_scene' | 'npc_gen' | 'main_story'

/** 按游玩上下文组 prompt 用规则块（控制 token） */
export function buildContextualRuleBlocks(ctx: AzeriaPromptContext, encounterTitle?: string): string[] {
  const blocks: string[] = [getCoreLawSummary()]

  switch (ctx) {
    case 'travel':
      blocks.push(clip(extractSectionByHeading('1.5.1 旅行规则'), 900))
      if (encounterTitle) blocks.push(getEncounterTable(encounterTitle))
      break
    case 'combat':
      blocks.push(clip(extractSectionByHeading('1.4.6 战斗系统'), 1400))
      blocks.push(clip(extractSectionByHeading('1.4.8 状态效果'), 800))
      break
    case 'h_scene':
      blocks.push(clip(extractSectionByHeading('6.1 H场景骰子开关'), 600))
      blocks.push(clip(extractSectionByHeading('6.5 H场景四阶段递进规范'), 1200))
      blocks.push(clip(extractSectionByHeading('27.1 女本位H叙事节奏模板'), 700))
      break
    case 'npc_gen':
      blocks.push(clip(extractSectionByHeading('7.2 NPC生成维度表'), 1600))
      blocks.push(clip(extractSectionByHeading('7.4 NPC外貌描写规范'), 900))
      break
    case 'main_story':
      blocks.push(clip(extractSectionByHeading('11.1 故事前提'), 1000))
      blocks.push(clip(extractSectionByHeading('12.1 四大阵营'), 800))
      break
    default:
      break
  }

  blocks.push(getFinalRulesSummary(800))
  return blocks.filter(Boolean)
}
