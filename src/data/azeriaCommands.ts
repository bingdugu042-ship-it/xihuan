/** 艾泽利亚规则书 · $ 指令表（Ch9 / Ch34） */
export interface CommandEntry {
  cmd: string
  desc: string
  insert?: string
}

export const AZERIA_COMMANDS: CommandEntry[] = [
  { cmd: '$面板', desc: '身体与冒险属性面板', insert: '$面板' },
  { cmd: '$地图', desc: '八大区域一览', insert: '$地图' },
  { cmd: '$区域', desc: '当前区域信息', insert: '$区域' },
  { cmd: '$移动', desc: '前往区域（例：$移动 精灵之森）', insert: '$移动 ' },
  { cmd: '$队伍', desc: '同行伴侣与好感', insert: '$队伍' },
  { cmd: '$投骰', desc: '主动检定（例：$投骰 魅惑 DC15）', insert: '$投骰 魅惑 DC15' },
  { cmd: '$天气', desc: '查看当前旅行天气', insert: '$天气' },
  { cmd: '$背包', desc: '查看持有物品', insert: '$背包' },
  { cmd: '$经营', desc: '打开产业经营', insert: '$经营' },
  { cmd: '$赠礼', desc: '打开赠礼面板', insert: '$赠礼' },
  { cmd: '$日历', desc: '纪念日与挑战档案', insert: '$日历' },
  { cmd: '$档案', desc: '挑战记录', insert: '$档案' },
  { cmd: '$仆从', desc: '仆从列表 / 指令 / 转正', insert: '$仆从 列表' },
  { cmd: '$npc', desc: '查看 NPC 模板卡', insert: '$npc ' },
  { cmd: '$外貌', desc: '查看角色外貌描写', insert: '$外貌 ' },
  { cmd: '$互动', desc: '与指定角色日常互动', insert: '$互动 ' },
  { cmd: '$H', desc: '发起亲密（好感≥70）', insert: '$H ' },
  { cmd: '$命令', desc: '对高服从伴侣下令', insert: '$命令 ' },
  { cmd: '$骰子', desc: 'H 场景骰子开/关/混合', insert: '$骰子 状态' },
  { cmd: '$粗口', desc: 'Dirty Talk 等级', insert: '$粗口 关' },
  { cmd: '$公开', desc: '公共场合 H 开关', insert: '$公开 关' },
  { cmd: '$怀孕', desc: '怀孕系统开关', insert: '$怀孕 关' },
  { cmd: '$挑战', desc: '挑战模式', insert: '$挑战 状态' },
  { cmd: '$休息', desc: '短休/长休说明', insert: '$休息' },
  { cmd: '$记录', desc: '保存当前进度', insert: '$记录' },
  { cmd: '$跳过', desc: '跳过当前场景节点', insert: '$跳过' },
  { cmd: '$重置', desc: '请求重置当前场景', insert: '$重置' },
]
