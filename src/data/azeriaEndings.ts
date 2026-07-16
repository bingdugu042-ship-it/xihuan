/** 多结局系统 · 规则书 Ch13 */

export interface AzeriaEnding {
  id: string
  letter: string
  name: string
  condition: string
  description: string
  /** 占位图渐变色 */
  hue: string
}

export const AZERIA_ENDINGS: AzeriaEnding[] = [
  {
    id: 'ending_a',
    letter: 'A',
    name: '女神永眠',
    condition: '终章选择让女神陨落，与伴侣们联手重建世界秩序',
    description:
      '法则消失，世界重置。你与伴侣们成为新世界的缔造者。此后每一个种族都可以自由爱任何人——但你的伴侣们仍然只爱你。',
    hue: '#6b4c9a',
  },
  {
    id: 'ending_b',
    letter: 'B',
    name: '法则永存',
    condition: '拯救女神，主动切断自身与法则之心的连接',
    description:
      '法则恢复。你失去让一切雄性倾倒的「法则级魅力」——但伴侣们用行动证明，他们爱你与法则无关。此后好感不会降。',
    hue: '#4a7a9a',
  },
  {
    id: 'ending_c',
    letter: 'C',
    name: '第三条路',
    condition: '与精灵/人鱼/龙族合作，分散法则之心力量',
    description:
      '法则不再集中在你一人身上。每个种族随机诞生女本位继承人。你不再是唯一焦点，但羁绊不变。',
    hue: '#3a9e7a',
  },
  {
    id: 'ending_d',
    letter: 'D',
    name: '魔王结局',
    condition: '加入魔族解放战线，建立深渊新秩序',
    description: '你成为深渊新主。魔族/恶魔伴侣成为左右手。世界混乱但深渊崛起——你从冒险者变成了魔王。',
    hue: '#8a3a4a',
  },
  {
    id: 'ending_e',
    letter: 'E',
    name: '神族结局',
    condition: '加入守护者，与神族修补法则后升入天界',
    description: '你成为天界一员，与天使/神族伴侣永恒相伴。凡间伴侣可偶尔来访。',
    hue: '#d4c06a',
  },
  {
    id: 'ending_f',
    letter: 'F',
    name: '后宫结局',
    condition: '攻略全部八种族且好感100，终章选择「私军」',
    description:
      '你不站任何阵营。凭借跨种族伴侣势力，开创第九领地——所有种族都可以来的、以你为中心的中立领土。',
    hue: '#c96b8a',
  },
  {
    id: 'ending_g',
    letter: 'G',
    name: '独自远行',
    condition: '拒绝所有阵营，独自一人离开大陆',
    description:
      '法则崩坏，你离开大陆。伴侣们各自成为种族领袖。多年后，大陆流传关于你的传说——那个让各族之王倾倒的冒险者。',
    hue: '#5a6a7a',
  },
]
