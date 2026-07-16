/**
 * 远征手册 · 冒险域导览文案（西幻）
 */

import { FACILITIES } from './facilities'

export interface FacilityHandbookEntry {
  scene: string
  highlights: string[]
  stampNote: string
  brochureLine: string
}

const BASE: Record<string, FacilityHandbookEntry> = {
  solar_sanctum: {
    brochureLine: '圣光很烫，目光更烫。',
    scene: '白金圣殿中廊，彩窗光刃切过石板。禁欲天使在此执行维序仪轨。',
    highlights: ['圣讯问询与禁欲试炼', '夜间告解打开裂缝'],
    stampNote: '圣羽印——光羽扫过后留下的淡痕。',
  },
  void_throne: {
    brochureLine: '空王座仍在等待署名。',
    scene: '黑曜石大厅中央空着魔王席，火盆映红地毯。',
    highlights: ['权柄对峙', '血契签字与臣服演练'],
    stampNote: '深渊契——火漆压在空席阴影里。',
  },
  succubus_office: {
    brochureLine: '业务手册比翅膀整齐。',
    scene: '深渊公文室，角尾小心地绕开文件堆。',
    highlights: ['正经汇报与被迫营业', '加班密谈'],
    stampNote: '工牌痕——章印盖在工牌背面。',
  },
  moonwood: {
    brochureLine: '弓弦比情话更准。',
    scene: '月光银叶林道，鹿群无声远去。',
    highlights: ['林中同行', '月下吐露'],
    stampNote: '叶脉纹——银叶拓印于腕侧。',
  },
  drake_crag: {
    brochureLine: '热息与心跳一样重。',
    scene: '火山岩绝壁，龙裔披着未尽化的鳞光。',
    highlights: ['力量试炼', '血脉共鸣'],
    stampNote: '鳞印——温热的鳞纹拓本。',
  },
  tidegate: {
    brochureLine: '潮汐决定他今日的形态。',
    scene: '珊瑚门扉开合，海水映出双生轮廓。',
    highlights: ['潮汐分化', '深潜契约'],
    stampNote: '潮纹——随体温起伏的水印。',
  },
  dice_tavern: {
    brochureLine: 'd20 决定你敢不敢说出口。',
    scene: '长桌中央嵌着骨骰，各族赌徒围观。',
    highlights: ['关键检定', '赌约调情'],
    stampNote: '骰痕——骨骰压出的凹印。',
  },
  relic_auction: {
    brochureLine: '拍下的不只是遗物。',
    scene: '绒帘后摆着未署名神器，出价声像心跳。',
    highlights: ['竞价博弈', '假面舞会'],
    stampNote: '出价签——流金签名落在契约页。',
  },
}

export const FACILITY_HANDBOOK: Record<string, FacilityHandbookEntry> = Object.fromEntries(
  FACILITIES.map((f) => {
    const entry = BASE[f.id] ?? {
      brochureLine: f.tagline,
      scene: f.scene,
      highlights: f.playModes.slice(0, 2),
      stampNote: `${f.stampName}——冒险契约印记。`,
    }
    return [f.id, entry]
  }),
)

export function facilityAssetPath(facilityId: string, kind: 'scene' | 'thumb' = 'scene'): string {
  // 目录规范：`public/assets/regions/{facilityId}/{scene|thumb}.png`
  // 历史上曾使用 webp，但当前优先保证可运行占位资源。
  return `/assets/regions/${facilityId}/${kind}.png`
}
