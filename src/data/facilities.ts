/**
 * 西幻万人迷 · 冒险域索引（复用原 FacilityDef 结构，内容全面西幻化）
 */

export type ThemeZoneId = 'exhibition' | 'domination' | 'sensory' | 'social'
export type FacilityIcon =
  | 'Eye'
  | 'Cat'
  | 'Waves'
  | 'Glasses'
  | 'ScanEye'
  | 'Bath'
  | 'Stethoscope'
  | 'GraduationCap'
  | 'Swords'
  | 'UtensilsCrossed'
  | 'BookOpen'
  | 'Clapperboard'
  | 'Flower2'
  | 'Microscope'
  | 'EyeOff'
  | 'Gavel'
  | 'Camera'
  | 'Dices'
  | 'Moon'
  | 'Sprout'
  | 'Scale'
  | 'TrainFront'

export interface ThemeZone {
  id: ThemeZoneId
  name: string
  vibe: string
  description: string
  color: string
  glow: string
  /** 用于全局背景渐变的主题色 */
  themeHue: string
}

export interface FacilityIdentity {
  id: string
  name: string
  description: string
  promptHint: string
}

export interface FacilityDef {
  id: string
  no: number
  name: string
  zone: ThemeZoneId
  npcArchetype: string
  /** 角色头像路径，默认 /npc/{id}.png */
  npcAvatar?: string
  tagline: string
  stampName: string
  icon: FacilityIcon
  scene: string
  playModes: string[]
  identities: FacilityIdentity[]
  vibeTags: string[]
}

export const THEME_ZONES: ThemeZone[] = [
  {
    id: 'exhibition',
    name: '圣序边境',
    vibe: '神殿 · 天使 · 维序宣言',
    description:
      '白金穹顶与沉默圣歌。天使与游侠在此守望「平衡」——他们憎恨恶魔，却与深渊廷一样恐惧世界倾覆。',
    color: '#d4b56a',
    glow: 'rgba(212, 181, 106, 0.35)',
    themeHue: '#c9a35a',
  },
  {
    id: 'domination',
    name: '深渊契约带',
    vibe: '恶魔廷 · 血契 · 权柄',
    description:
      '黑曜石台阶直通魔王空位。恶魔官吏以纪律维护深渊秩序；水火不容的天使在谈判桌上仍会签同一份维序条约。',
    color: '#c45c7a',
    glow: 'rgba(196, 92, 122, 0.4)',
    themeHue: '#a84a4a',
  },
  {
    id: 'sensory',
    name: '元素蛮荒',
    vibe: '龙巢 · 潮汐 · 精灵林',
    description:
      '龙族的热息、人鱼的潮路、精灵的月林交错。强者用身体说话，俊美与强壮各自成立。',
    color: '#5b8f7a',
    glow: 'rgba(91, 143, 122, 0.4)',
    themeHue: '#5b8f7a',
  },
  {
    id: 'social',
    name: '旅商迷城',
    vibe: '酒馆 · 拍卖 · 情报',
    description:
      '各族混居的城邦。骰子声、契约签名与暧昧流言一同流通——适合邂逅随机男主。',
    color: '#6b7bb5',
    glow: 'rgba(107, 123, 181, 0.35)',
    themeHue: '#6b7bb5',
  },
]

const idCommon = (roleA: string, roleB: string, hintA: string, hintB: string): FacilityIdentity[] => [
  {
    id: 'wanderer',
    name: roleA,
    description: `以${roleA}身份进入此地。`,
    promptHint: hintA,
  },
  {
    id: 'local',
    name: roleB,
    description: `你被视作${roleB}，对方依此应对。`,
    promptHint: hintB,
  },
]

export const FACILITIES: FacilityDef[] = [
  {
    id: 'solar_sanctum',
    no: 1,
    name: '日冕圣殿',
    zone: 'exhibition',
    npcArchetype: '禁欲天使骑士',
    tagline: '圣光很烫，目光更烫',
    stampName: '圣羽印',
    icon: 'Eye',
    scene: '白金圣殿中廊，彩窗投下剑刃般的光带。',
    playModes: ['圣讯问询', '禁欲试炼', '夜间告解'],
    identities: idCommon(
      '堕神旅者',
      '受审者',
      '玩家是带着万人迷气场的堕神旅者；天使表面克制，身体反应泄露渴望。',
      '玩家暂被当作受审凡人；天使执行维序仪轨，却逐渐失序。',
    ),
    vibeTags: ['天使', '禁欲', '圣光'],
  },
  {
    id: 'void_throne',
    no: 2,
    name: '虚空王座厅',
    zone: 'domination',
    npcArchetype: '深渊维序官',
    tagline: '魔王席空着——暂时',
    stampName: '深渊契',
    icon: 'Gavel',
    scene: '黑曜石大厅中央空王座，火盆映红地毯。',
    playModes: ['权柄对峙', '血契签字', '臣服演练'],
    identities: idCommon(
      '潜在魔王',
      '深渊访客',
      '玩家气场压过空王座；维序官想确认你是盟友还是灾厄。',
      '玩家以访客礼节进入；官员礼貌到发冷。',
    ),
    vibeTags: ['恶魔', '权柄', '反转伏笔'],
  },
  {
    id: 'succubus_office',
    no: 3,
    name: '魅魔事务署',
    zone: 'domination',
    npcArchetype: '老实魅魔职员',
    tagline: '业务手册比翅膀整齐',
    stampName: '工牌痕',
    icon: 'Glasses',
    scene: '深渊公文室，角尾小心绕开文件堆。',
    playModes: ['业务辅导', '被迫营业', '加班密谈'],
    identities: idCommon(
      '巡察上司',
      '陌生委托人',
      '玩家以上司巡察身份；魅魔正经汇报，羞赧于「营业指标」。',
      '玩家是突然上门的委托人；对方紧张念流程。',
    ),
    vibeTags: ['魅魔', '反差', '喜剧'],
  },
  {
    id: 'moonwood',
    no: 4,
    name: '银弦月林',
    zone: 'sensory',
    npcArchetype: '俊美精灵游侠',
    tagline: '弓弦比情话更准',
    stampName: '叶脉纹',
    icon: 'Flower2',
    scene: '月光洒在银叶林道，远处鹿群无声。',
    playModes: ['林中同行', '箭术较量', '月下吐露'],
    identities: idCommon(
      '外来权柄',
      '林中迷途者',
      '玩家气场扰动月林平衡；精灵俊秀疏离又难移开视线。',
      '玩家迷途；精灵救援中逐渐被吸引。',
    ),
    vibeTags: ['精灵', '俊美', '月光'],
  },
  {
    id: 'drake_crag',
    no: 5,
    name: '龙脊绝壁',
    zone: 'sensory',
    npcArchetype: '强壮龙裔战士',
    tagline: '热息与心跳一样重',
    stampName: '鳞印',
    icon: 'Swords',
    scene: '火山岩绝壁，龙裔披着未尽化的鳞光。',
    playModes: ['力量试炼', '巢穴夜坐', '血脉共鸣'],
    identities: idCommon(
      '挑战者',
      '求庇护者',
      '玩家以挑战者逼近龙裔；对方强壮直接，欲望也直接。',
      '玩家求庇护；龙裔用胸口当盾牌。',
    ),
    vibeTags: ['龙族', '强壮', '热'],
  },
  {
    id: 'tidegate',
    no: 6,
    name: '汐门礁湾',
    zone: 'sensory',
    npcArchetype: '可分化人鱼',
    tagline: '潮汐决定他今日的形态',
    stampName: '潮纹',
    icon: 'Waves',
    scene: '珊瑚门扉开合，海水映着双生轮廓。',
    playModes: ['潮汐分化', '浅滩私语', '深潜契约'],
    identities: idCommon(
      '唤潮者',
      '落水旅人',
      '玩家触及人鱼潮汐权；对方可切换男性/柔态呈现。',
      '玩家落水遇救人鱼；形态随亲密度变化。',
    ),
    vibeTags: ['人鱼', '分化', '潮汐'],
  },
  {
    id: 'dice_tavern',
    no: 7,
    name: '命运骰厅',
    zone: 'social',
    npcArchetype: '半魔骰师',
    tagline: 'd20 决定你敢不敢说出口',
    stampName: '骰痕',
    icon: 'Dices',
    scene: '酒馆长桌中央嵌着巨大骨骰，各族赌徒围观。',
    playModes: ['关键检定', '赌约调情', '情报收买'],
    identities: idCommon(
      '掷骰嘉宾',
      '观赛客',
      '玩家被邀请进行公开检定；成功则全场起哄，失败则被盯上。',
      '玩家冷眼旁观时也被卷进赌约。',
    ),
    vibeTags: ['跑团', '骰子', '社交'],
  },
  {
    id: 'relic_auction',
    no: 8,
    name: '圣骸拍卖会',
    zone: 'social',
    npcArchetype: '神裔拍卖师',
    tagline: '拍下的不只是遗物',
    stampName: '出价签',
    icon: 'Gavel',
    scene: '绒帘后摆着未署名神器，出价声像心跳。',
    playModes: ['竞价博弈', '私下验货', '假面舞会'],
    identities: idCommon(
      '神秘竞买人',
      '展台模特',
      '玩家以竞买人气场碾压全场；拍卖师难抑接近欲。',
      '玩家暂列展台；目光交换即是谈判。',
    ),
    vibeTags: ['集邮', '神裔', '欲望'],
  },
]

export const FACILITY_MAP = Object.fromEntries(FACILITIES.map((f) => [f.id, f])) as Record<
  string,
  FacilityDef
>

export function getFacilitiesByZone(zone: ThemeZoneId): FacilityDef[] {
  return FACILITIES.filter((f) => f.zone === zone)
}

export function getZone(id: ThemeZoneId): ThemeZone | undefined {
  return THEME_ZONES.find((z) => z.id === id)
}

/** 契约/图鉴进度里程碑（替代原图鉴阶梯） */
export const STAMP_UNLOCK_TIERS = [
  { count: 2, title: '初绽魅惑', reward: '魅力 +1' },
  { count: 4, title: '收编成军', reward: '解锁队伍栏' },
  { count: 6, title: '深渊耳语', reward: '权柄 +1' },
  { count: 8, title: '伪魔王之路', reward: '血契 +1' },
] as const

