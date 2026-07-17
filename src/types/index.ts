/* ============================================================
   核心数据类型 —— 模板的契约
   引擎代码只认这些类型，不认任何具体角色/世界内容
   ============================================================ */

/** 关系值维度（0-100） */
export interface Relationship {
  /** 好感度 */
  favor: number
  /** 信任度 */
  trust: number
  /** 依赖度 */
  dependence: number
}

/** 角色卡 —— game/characters/<id>.json */
export interface CharacterCard {
  id: string
  name: string
  title: string
  personality: string[]
  speakingStyle: string
  background: string
  greeting: string
  /** 列表用小头像 */
  avatar: string
  /** 竖版立绘 + 多表情切换 */
  expressions: Record<string, string>
  /** 默认表情键 */
  defaultExpression: string
  /** 语音配置（用户填 API） */
  voice: {
    /** 兼容类型：openai / edge / browser / custom */
    provider: 'openai' | 'edge' | 'browser' | 'custom'
    voiceId: string
    /** 自定义 TTS 端点（provider=custom 时用） */
    endpoint?: string
  }
  /** 初始关系 */
  initialRelationship: Relationship
  /** AI 记忆规则提示 */
  memoryRules: string[]
  /** 内置生图提示词（内容由作者填，引擎按表情取用） */
  imagePrompts?: Record<
    string,
    {
      positive: string
      negative: string
      params?: Record<string, unknown>
    }
  >

  /* ---------- 详细人设（写进系统提示词，供 AI 扮演） ---------- */
  /** 物种与主要身体特征 */
  appearance?: string
  /** 身体细节与穿着 */
  clothing?: string
  /** 性格、行为与言行举止 */
  behavior?: string
  /** 身体特征列表（来自特征总览表） */
  physicalTraits?: string[]
  /** 精神特征列表（来自特征总览表） */
  mentalTraits?: string[]
  /** 爱好、噱头与独特之处 */
  hobbies?: string[]
  /** 能力 / 技能 */
  abilities?: string[]
  /** 与其他角色的关系描述（key=对方角色名/id，value=关系说明） */
  relationships?: Record<string, string>
  /** 补充信息（契约体系中的职责、世界规则约束等） */
  extraNotes?: string
  /** 对话示例（few-shot，引导 AI 语气） */
  dialogueExamples?: { user: string; character: string }[]
  /** 西幻：种族 id */
  raceId?: string
  /** 是否固定男主（图鉴种子） */
  fixedLead?: boolean
  /** 主分布世界区域 id（azeriaWorldRegions） */
  homeRegionId?: string
  /** 主驻扎冒险域 / facility id */
  homeFacilityId?: string
}

/** 世界书 —— game/worlds/<id>.json */
export interface WorldBook {
  id: string
  worldName: string
  era: string
  description: string
  rules: string[]
  locations: Record<string, string>
  importantNPCs: string[]
  /** 内容尺度 */
  tone: 'sfw' | 'teen' | 'nsfw'
  /** 内容指引（写进系统提示词） */
  contentGuideline: string
}

/** 地区 / 频道 —— 定义一段对话的前提场景 */
export interface Region {
  id: string
  /** 所属世界 id */
  worldId?: string
  name: string
  /** 给 AI 的前提（例如"大家在线上群聊"或"线下咖啡馆"） */
  premise: string
  description: string
  /** 背景图 */
  sceneBg: string
  /** BGM */
  bgm?: string
  /** 默认参与者（可被 session 覆盖） */
  defaultParticipants: string[]
  /** 对话类型 */
  type: 'private' | 'group'
  /** 分类：线上 / 线下 / 现代社会 */
  category?: 'online' | 'offline' | 'modern'
  /** 解锁所需好感（现代社会） */
  unlockFavor?: number
  /** 最大对话轮数（现代社会） */
  maxTurns?: number
  /** 用户自定义世界树地点 */
  custom?: boolean
  /** 自定义地图角标文案 */
  mapNote?: string
  /** 地点视觉样式描述 */
  mapStyle?: string
  /** 地图百分比坐标 0-100 */
  mapX?: number
  mapY?: number
  /** 地点世界书（AI 读取） */
  worldbook?: string
  /** 西幻万人迷：主题区 */
  themeZone?: 'exhibition' | 'domination' | 'sensory' | 'social'
  /** 西幻万人迷：域界 NPC 固定类型 */
  npcArchetype?: string
  facilityNo?: number
}

/** 主题包 —— game/theme.json */
export interface ThemePack {
  name: string
  colors: {
    bg: string
    bgSoft: string
    panel: string
    primary: string
    primarySoft: string
    text: string
    textDim: string
    border: string
    bubbleMine: string
    bubbleHer: string
    bubbleText: string
  }
  fonts: {
    ui: string
    dialogue: string
  }
  assets: {
    chatBg?: string
    frame?: string
    logo?: string
  }
}

/* ============================================================
   会话 / 消息（运行时数据，存 IndexedDB）
   ============================================================ */

export type MessageRole = 'user' | 'character' | 'system'

/** 轻跑团技能检定（可选挂在选项上） */
export type DiceSkill = 'persuasion' | 'intimidation' | 'allure' | 'combat' | 'finesse'

export interface DiceCheck {
  skill: DiceSkill
  dc: number
}

export interface Choice {
  id: string
  text: string
  /** 若存在，点击选项时先掷 d20 再发送（结果写入旁白） */
  check?: DiceCheck
}

export interface RelationshipChange {
  favor?: number
  trust?: number
  dependence?: number
}

export interface ChatMessage {
  id: string
  role: MessageRole
  /** role=character 时，说话角色的 id */
  characterId?: string
  text: string
  /** 角色当前表情键 */
  expression?: string
  /** AI 给出的选项 */
  choices?: Choice[]
  /** 本条消息带来的关系变化 */
  relationshipChange?: RelationshipChange
  /** 记忆事件标记 */
  memoryEvent?: {
    type: 'milestone' | 'daily' | 'conflict' | 'secret' | 'preference' | 'facility' | 'npc_bond'
    text: string
  }
  /** 本条消息附带的图片（base64 data url） */
  imageUrl?: string
  /** 转账信息 */
  transfer?: { amount: number; note?: string }
  /** 气泡样式 */
  bubbleStyle?: 'default' | 'system' | 'narrator' | 'thought' | 'warning' | 'dice'
  /** 群聊 @ 指定由哪位角色回复 */
  mentionCharacterId?: string
  /** NPC 本条消息时的欲望 */
  npcDesire?: string
  /** NPC 本条消息时的内心想法 */
  npcInnerThought?: string
  /** NPC 本条消息时的身体状态 */
  npcBodyState?: string
  timestamp: number
}

/** 会话状态：active 进行中 / archived 史诗存档封存 */
export type SessionStatus = 'active' | 'archived'

export interface Session {
  id: string
  title: string
  /** 所属地区 */
  regionId: string
  /** 参与角色 id 列表（private 时长度=1） */
  participantIds: string[]
  type: 'private' | 'group'
  /** 每角色独立关系值 */
  relationships: Record<string, Relationship>
  /** 会话级消息流 */
  messages: ChatMessage[]
  status: SessionStatus
  createdAt: number
  updatedAt: number
  /** 封存时的备注（史诗存档） */
  archiveNote?: string
  /** 现代社会限时出行 */
  modernTrip?: {
    companionId: string
    turnsRemaining: number
  }
  /** 群聊：自上次抢话以来经过的对话轮数 */
  groupRoundsSinceInterrupt?: number
  /** 西幻万人迷：本场动态男主（当前焦点互动位） */
  dynamicNpc?: SessionDynamicNpc
  /** 西幻万人迷：本场曾出场的男主快照（多人时切换焦点用） */
  npcRoster?: Record<string, SessionDynamicNpc>
  /** 西幻万人迷：玩家在本冒险域选择的身份 */
  playerIdentityId?: string
  /** 西幻万人迷：本场 NPC 对位身份（由玩家身份推导，写入后固定） */
  npcIdentityId?: string
  /** 局内色情程度：轻 / 中 / 高 / 极致 */
  eroticIntensity?: 'light' | 'medium' | 'high' | 'extreme'
  /** 探索风格：自由探索 / 硬指引 */
  exploreStyle?: 'free' | 'guided'
  /** 西幻万人迷：本场选中的玩法（对应设施 worldbook.playModes） */
  playMode?: string
  /** H 场景阶段推进 */
  hPhase?: HPhase
  /** 当前 H 阶段内玩家已互动次数（硬模式推进门槛） */
  hPhasePlayerTurns?: number
  /** 硬指引：本冒险域剧情阶段下标（0 起） */
  guideStageIndex?: number
  /** 硬指引：当前阶段内玩家互动次数 */
  guideTurnsInStage?: number
  /** 本场是否已提示过契约/契约 */
  stampPrompted?: boolean
  /** 上一轮掷骰摘要（供下一轮 AI 提示词使用，用后可清） */
  lastDiceSummary?: string
  /** 西幻万人迷：男主欲望条 */
  npcDesire?: string
  /** 西幻万人迷：男主内心独白 */
  npcInnerThought?: string
  /** 西幻万人迷：堕落值增量 0-5 */
  npcCorruptionDelta?: number
  /** 是否已提示过保留男主 */
  saveNpcDismissed?: boolean
  /** 最近一次旅行遭遇掷骰结果（1d20） */
  travelEncounterRoll?: number
  /** 最近一次旅行遭遇描述（供 AI 强制执行） */
  lastTravelEncounter?: string
  /** 最近一次旅行天气掷骰结果（1d20） */
  travelWeatherRoll?: number
  /** 最近一次旅行天气描述（供 AI 参考） */
  lastTravelWeather?: string
}

/** 西幻万人迷 H 四阶段 + 空闲 */
export type HPhase = 'idle' | 'foreplay' | 'main' | 'climax' | 'afterglow'

/** 会话内动态男主快照（规则书 Ch3） */
export interface SessionDynamicNpc {
  id: string
  displayName: string
  facilityId: string
  facilityName: string
  npcArchetype: string
  corruption: number
  corruptionStage: 1 | 2 | 3 | 4 | 5
  attention: number
  possessiveness: number
  desire: string
  innerThought: string
  /** 当前身体状态描述（瞬时） */
  bodyState: string
  gender: string
  ageFeel: string
  bodyType: string
  style: string
  /** 外貌描写（入域生成，可润色） */
  appearance: string
  /** 背景故事（入域生成，可润色） */
  background: string
  personality: string[]
  activePassive: string
  kinks: string[]
}

/** 跨会话核心记忆（统一记忆池，characterId 固定为 shared） */
export const SHARED_MEMORY_CHARACTER_ID = 'shared'

export interface CoreMemory {
  id: string
  characterId: string
  text: string
  type: 'milestone' | 'daily' | 'conflict' | 'secret' | 'preference' | 'facility' | 'npc_bond'
  /** 来源会话 */
  originSessionId: string
  timestamp: number
  /** 分层标签：检索时优先匹配 */
  tags?: string[]
  /** 关联冒险域 id */
  facilityId?: string
}

/* ============================================================
   设置 / API 配置
   ============================================================ */

export interface ApiSettings {
  /** CORS 代理（Cloudflare Worker 等），手机/公网部署必填 */
  proxyURL?: string
  /** 文本模型 */
  text: {
    baseURL: string
    apiKey: string
    model: string
  }
  /** 图像模型 */
  image: {
    provider: 'openai' | 'sdwebui' | 'custom'
    baseURL: string
    apiKey: string
    model: string
  }
  /** TTS（用户自由填） */
  tts: {
    provider: 'openai' | 'edge' | 'browser' | 'custom'
    baseURL: string
    apiKey: string
    voiceId: string
    /** TTS 模型，如 tts-1 */
    model: string
    /** STT 模型，如 whisper-1（留空则用浏览器语音识别） */
    sttModel: string
  }
}

/** 界面布局模板：classic=原版底部导航，scheme_*=三栏/霓虹/温泉参考布局 */
export type LayoutTemplateId = 'classic' | 'scheme_a' | 'scheme_b' | 'scheme_c'

/** 旅者偏好（男主读取；禁忌作负面提示词，勿向玩家复述清单） */
export interface PlayerPreferences {
  likes: string
  dislikes: string
  taboos: string
  notes: string
}

export interface UISettings {
  /** 当前主题 id */
  themeId: string
  /** 界面布局模板 */
  layoutTemplate: LayoutTemplateId
  /** 立绘模式：preview 纯看图 / chat 聊天毛玻璃 */
  characterMode: 'preview' | 'chat'
  /** 主界面方向：竖版书页 / 横版桌面 */
  layoutMode: 'portrait' | 'landscape'
  /** 音量 0-1 */
  volume: number
  /** 打字机速度 ms/字 */
  typingSpeed: number
  /** 是否已通过年龄提示 */
  ageConfirmed: boolean
  /** 是否已完成首次入住表单 */
  onboardingCompleted: boolean
  /** 是否已播放过开场动画 */
  cutscenePlayed: boolean
  /** 聊天界面宽度（px） */
  chatWidth: number
  /** 聊天界面高度（px） */
  chatHeight: number
  /** 整体界面缩放（0.6 - 1.3） */
  chatScale: number
  /** 当前选中的用户模板 id */
  activeProfileId: string | null
  /** 开灯：true=霓虹暖色 / false=暗色氛围（仅 classic 配色生效） */
  lightOn: boolean
  /**
   * 全局配色方案
   * classic = 原暖湾/夜港
   * sanctum = 西欧圣殿白金
   */
  colorPalette?: 'classic' | 'sanctum'
  /** 手机桌面背景（base64 / url） */
  phoneBackground: string
  /** 旅者偏好贴纸 */
  playerPreferences?: PlayerPreferences
  /** 用户自定义配色 / 气泡透明度 */
  customColors?: {
    bg?: string
    text?: string
    accent?: string
    bubbleMine?: string
    bubbleMineOpacity?: number
    bubbleHer?: string
    bubbleHerOpacity?: number
    bubbleNarrator?: string
    bubbleNarratorOpacity?: number
    bubbleNarratorText?: string
    /** 聊天区背景色（盖在立绘上的色调） */
    chatBg?: string
    chatBgOpacity?: number
  }
  /** AI 上下文长度（1-100，越大携带越多历史） */
  aiContextLength: number
  /** AI 活跃度/创造性（1-100，越大越发散） */
  aiCreativity: number
  /** AI 单次输出长度（1-100，越大一次回复越长） */
  aiOutputLength: number
  /** AI 回复速度偏好（1-100，越大越优先快速返回） */
  aiResponseSpeed: number
  /** 取样聚焦 top_p 映射（10-100） */
  aiTopP?: number
  /** 去重/新鲜度 → presence & frequency penalty（0-100） */
  aiFreshness?: number
  /** 最近一次文本 API 测连结果 */
  apiTextLastStatus?: {
    ok: boolean
    message: string
    at: number
  }
  /** 角色回复时是否使用 emoji/颜文字 */
  characterEmojiEnabled: boolean
  /** 群聊抢话间隔（0=关闭，2-20=每 N 轮对话后其他角色可能抢话） */
  groupInterruptInterval: number
  /**
   * H 阶段模式
   * soft=软引导（AI 可灵活设 hPhase）
   * hard=硬状态机（每阶段至少 1 次互动才前进一格）
   */
  hPhaseMode?: 'soft' | 'hard'
  /** 入域生成男主后，是否用文本 API 润色人设（需已配置 API） */
  npcApiRefine?: boolean
  /** 是否已通过邀请码验证 */
  inviteVerified?: boolean
  /** 邀请码角色：admin / user */
  inviteRole?: 'admin' | 'user'
  /** 本次验证使用的邀请码（脱敏存储可选） */
  inviteCodeUsed?: string
  /** 艾泽利亚：H 场景骰子模式 */
  azeriaDiceMode?: 'on' | 'off' | 'mixed'
  /** 艾泽利亚：粗口强度 */
  azeriaDirtyTalkLevel?: 'off' | 'light' | 'medium' | 'hard'
  /** 艾泽利亚：是否允许公共场合 H */
  azeriaPublicMode?: boolean
  /** 艾泽利亚：怀孕系统开关 */
  azeriaPregnancyEnabled?: boolean
  /** 艾泽利亚：身体影响判定（关闭则不进行身体数值结算/回写） */
  azeriaBodyImpactEnabled?: boolean
  /** 艾泽利亚：挑战模式（Ch33） */
  azeriaChallengeMode?: 'off' | 'all_dice' | 'abstinence' | 'all_races'
}

/** 用户模板（最多 3 个）—— 玩家自身的人设，注入系统提示词 */
export interface UserProfile {
  id: string
  name: string
  /** base64 头像 */
  avatar: string
  age: string
  gender: string
  /** 资产 */
  assets: string
  /** 居住环境 */
  livingEnvironment: string
  /** 家庭布置 */
  homeLayout: string
  /** 人设自述 */
  persona: string
  /** 可花费的资产（契约币） */
  coins: number
  createdAt: number
}

export interface AppSettings {
  api: ApiSettings
  ui: UISettings
}

/* ---------------- 商城 / 礼物 ---------------- */

/** 用户上传的音乐 */
export interface MusicTrack {
  id: string
  name: string
  /** data url / blob url */
  src: string
  createdAt: number
}

/** AI 生成 / 保存的相册图片 */
export interface AlbumImage {
  id: string
  url: string
  prompt?: string
  source: 'chat' | 'monitor' | 'album' | 'photo'
  createdAt: number
}

/** 持久化的 AI 生成记录（看法/日记/监控等） */
export interface GeneratedRecord {
  id: string
  type: 'opinion' | 'diary' | 'monitor' | 'forum' | 'commission' | 'roster_beat'
  title: string
  content: string
  imageUrl?: string
  /** 关联角色、会话、日期等 */
  meta?: Record<string, string>
  createdAt: number
}

/** 商城商品（默认目录 + 用户自定义） */
export interface ShopItem {
  id: string
  name: string
  desc: string
  price: number
  /** 自定义图片（base64 / data url），为空则纯文字展示 */
  image?: string
  /** 是否用户自定义 */
  custom?: boolean
  /** 艾泽利亚商店分类 */
  category?: 'equipment' | 'potion' | 'scroll' | 'magic' | 'souvenir'
  /** 规则书效果摘要 */
  effect?: string
}

/** 库存条目 */
export interface InventoryEntry {
  itemId: string
  count: number
}

/** 送礼记录（用于让 AI「读取」你送过的东西） */
export interface GiftLog {
  id: string
  characterId: string
  itemId: string
  itemName: string
  at: number
}

/* ---------------- 西幻万人迷 / 兼容西幻扩展 ---------------- */

export type PlayerGender = 'female' | 'male' | 'other'

export type BondStatus = 'unmet' | 'met' | 'courting' | 'conquered'
export type BondPlacement = 'none' | 'party' | 'home'
/** 羁绊角色类型：伴侣 / 仆从（规则书 Ch20） */
export type BondRole = 'partner' | 'servant'

/** 攻略图鉴条目（集邮 → 队伍/家园） */
export interface BondRecord {
  characterId: string
  displayName: string
  raceId: string
  status: BondStatus
  placement: BondPlacement
  /** 伴侣或仆从，默认 partner */
  role?: BondRole
  favorPeak?: number
  conqueredAt?: number
  memoryText?: string
  memoryImage?: string
}

/** 玩家保留的邂逅 NPC（动态快照，兼容旧 SavedNpc） */
export interface SavedNpc {
  id: string
  displayName: string
  facilityId: string
  facilityName: string
  npcArchetype: string
  branded: boolean
  corruption: number
  snapshot: Record<string, string>
  savedAt: number
  lastSeenAt: number
  raceId?: string
  bondStatus?: BondStatus
  placement?: BondPlacement
}

export interface StampRecord {
  obtainedAt: number
  memoryText?: string
  memoryImage?: string
  memoryCharacterId?: string
}

export interface CultivationStats {
  allure: number
  dominion: number
  bloodbond: number
  intimacy: number
}

/** 图鉴兼容 + 西幻图鉴/队伍/家园 */
export interface PassportData {
  stamps: Record<string, StampRecord>
  roster: SavedNpc[]
  bonds?: Record<string, BondRecord>
  partyIds?: string[]
  homeIds?: string[]
  cultivation?: CultivationStats
  homePresetId?: string
}

export interface BodyStatsData {
  gender: PlayerGender
  stats: Record<string, number>
  stateLabels: Record<string, string>
}

export interface AdventureStatsData {
  attributes: import('@/data/adventureAttributes').AdventureAttributes
  classId?: import('@/data/adventureAttributes').AdventureClassId
  race?: string
  bodyType?: string
  background?: string
  level?: number
  /** 累计经验 */
  xp?: number
  /** 可分配技能点（每升一级 +1） */
  skillPoints?: number
}

/** Region 扩展：自定义地图角标 */
export interface CustomMapPinFields {
  /** 地图位置描述 / 角标文案 */
  mapNote?: string
  /** 样式：古堡、林地、废墟等 */
  mapStyle?: string
  /** 0-100 百分比坐标（可选） */
  mapX?: number
  mapY?: number
}
