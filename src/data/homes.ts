/** 家园预设环境 */

export interface HomePreset {
  id: string
  name: string
  tagline: string
  premise: string
  description: string
}

export const HOME_PRESETS: HomePreset[] = [
  {
    id: 'obsidian_keep',
    name: '黑曜石城堡',
    tagline: '魔王席位的空王座倒影',
    premise: '你们身处黑曜石城堡大厅，火盆映着深红地毯；墙壁上挂着尚未署名的魔王徽记。',
    description: '适合权柄与仪式感谈话、收编宣誓、夜间议事。',
  },
  {
    id: 'moonlit_bower',
    name: '月影寝殿',
    tagline: '软帷与安静心跳',
    premise: '月影寝殿安静而暧昧，纱帐垂落，烛火只留一盏。空气里有冷香与体温的余韵。',
    description: '适合亲密、宠溺养成与成人向细描。',
  },
  {
    id: 'forbidden_garden',
    name: '禁忌花园',
    tagline: '夜开的花听得懂契约',
    premise: '禁忌花园的藤蔓会跟着你们的语气收紧或松开，花瓣在低语时微微发亮。',
    description: '适合慢节奏日常与多人数闲谈。',
  },
  {
    id: 'abyss_spa',
    name: '深渊温泉廊',
    tagline: '热雾掩盖圣徽',
    premise: '深渊温泉廊蒸汽升腾，石壁刻着天使与恶魔共用的维序铭文，此刻都被热雾模糊。',
    description: '适合放松、疗伤后的亲密与半公开张力。',
  },
  {
    id: 'starfall_library',
    name: '星坠藏书阁',
    tagline: '旧神留下的页脚批注',
    premise: '星坠藏书阁里漂浮着未合上的古籍，窗外是永夜星河。适合低声争论神学与命运。',
    description: '适合世界观揭秘、神堕伏笔与智性拉扯。',
  },
]

export const HOME_PRESET_MAP = Object.fromEntries(HOME_PRESETS.map((h) => [h.id, h]))

export const DEFAULT_HOME_PRESET_ID = 'moonlit_bower'

/** 队伍人数上限草案 */
export const PARTY_SIZE_LIMIT = 4
/** 家园常驻人数上限草案 */
export const HOME_SIZE_LIMIT = 8
