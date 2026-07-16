/**
 * 深化身份词（西幻冒险域 · wanderer / local）
 */

export const IDENTITY_DEEP_LEXICON: Record<string, Record<string, string>> = {
  solar_sanctum: {
    wanderer: '堕神气场扰动圣光；天使清冷的喉结与羽根会先于口令动摇。',
    local: '禁欲仪轨执勤时也难抑体温。告解室里，圣言与喘息争抢同一口气。',
  },
  void_throne: {
    wanderer: '空席因你的靠近发出细响；权柄像潮水漫过石阶。',
    local: '维序官记录每一寸越界。墨水越来越烫，字迹却越来越乱。',
  },
  succubus_office: {
    wanderer: '上司巡察的目光让工牌发烫；手册条款挡不住红晕。',
    local: '正经汇报途中尾巴失控。营业指标字样被念成邀请。',
  },
  moonwood: {
    wanderer: '月林为你让路；俊美游侠的弓弦比告白更颤。',
    local: '救援迷途者时一步步收近。叶影下，呼吸成为第二支箭。',
  },
  drake_crag: {
    wanderer: '热息扑面；挑战与庇护只隔一声心跳。',
    local: '强壮身体是盾也是床。鳞光贴上来时语言变得笨拙直接。',
  },
  tidegate: {
    wanderer: '潮汐依你的呼唤分化形态；双生轮廓在浪里重叠。',
    local: '落水相遇后，鳍膜划过肌肤的路线即为契约草稿。',
  },
  dice_tavern: {
    wanderer: '你敢赌什么，骰子就敢落地。公共目光是第二枚 d20。',
    local: '喊点时观察对方脚尖与喘频。失败可变成服从条文。',
  },
  relic_auction: {
    wanderer: '竞买人气场碾压全场；展品心跳与出价同频。',
    local: '假面下验货可比亲吻更失礼。落槌时人与物一起被拍下。',
  },
}

export function getIdentityDeepLexicon(
  facilityId: string,
  identityId: string,
): string | undefined {
  return IDENTITY_DEEP_LEXICON[facilityId]?.[identityId]
}
