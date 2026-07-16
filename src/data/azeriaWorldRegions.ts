/** 艾泽利亚八大区域 · 规则书 Ch1.2 / Ch28 */

export interface AzeriaPoi {
  id: string
  name: string
  blurb: string
  /** 地点背景介绍（给玩家看） */
  lore?: string
  /** 地点世界书短条（进场旁白 / AI 氛围） */
  worldbook?: string
}

export interface AzeriaWorldRegion {
  id: string
  name: string
  env: string
  race: string
  danger: number
  description: string
  /** 本域城邦 / 主地点（可点击） */
  cities: AzeriaPoi[]
  /** 可点 POI（街区/野外/入口），自由游玩换点用 */
  pois: AzeriaPoi[]
  /** 关联游戏内 facility id（若有） */
  facilityIds?: string[]
  /** 本区固定男主 id */
  fixedLeadId?: string
  /** 场景图路径约定 */
  sceneImage?: string
  thumbImage?: string
}

function city(
  id: string,
  name: string,
  blurb: string,
  lore: string,
  worldbook: string,
): AzeriaPoi {
  return { id, name, blurb, lore, worldbook }
}

function poi(
  id: string,
  name: string,
  blurb: string,
  lore: string,
  worldbook: string,
): AzeriaPoi {
  return { id, name, blurb, lore, worldbook }
}

/** 补全缺省 lore / worldbook（兼容旧数据） */
export function resolveLocationCopy(loc: AzeriaPoi, region: AzeriaWorldRegion): Required<AzeriaPoi> {
  const lore =
    loc.lore?.trim() ||
    `「${loc.name}」位于${region.name}（${region.env}）。${loc.blurb}。${region.description}`
  const worldbook =
    loc.worldbook?.trim() ||
    [
      `【地点世界书 · ${loc.name}】`,
      `域：${region.name} · 种族氛围：${region.race} · 危险 ${region.danger}/5`,
      `环境：${region.env}`,
      `要点：${loc.blurb}`,
      region.description,
    ].join('\n')
  return { id: loc.id, name: loc.name, blurb: loc.blurb, lore, worldbook }
}

export function cityNames(region: AzeriaWorldRegion): string[] {
  return region.cities.map((c) => c.name)
}

export const AZERIA_WORLD_REGIONS: AzeriaWorldRegion[] = [
  {
    id: 'central',
    name: '人类诸国',
    env: '平原·城邦·农田·河流',
    race: '人类',
    danger: 1,
    description: '中央平原是你出发的地方。冒险者公会在各城设有分部，商路与委托最为密集。',
    cities: [
      city(
        'c_capital',
        '帝都·光辉之城',
        '帝国心脏，法令与宴会并存',
        '光辉之城是人类诸国的政治与贸易中枢。白石大道通向王宫，夜色里贵族区灯火与公会酒馆的骰声此起彼伏。',
        '【地点世界书 · 帝都·光辉之城】\n人类王权象征。关键词：秩序、委托、密谈、宴会礼仪。\n旅者在此易遇公会职员、贵族与佣兵；冲突多以口舌与筹码化解，硬碰硬会引来卫队。',
      ),
      city(
        'c_border',
        '边境小镇',
        '商路驿站，消息最快',
        '小镇卡在平原与荒野的交界。驿站烟尘里混着情报贩子与落魄骑士，是出发前补给与听八卦的好地方。',
        '【地点世界书 · 边境小镇】\n关键词：驿站、情报、低危遭遇、人情交易。适合热身任务与偶遇。',
      ),
      city(
        'c_port',
        '港口城',
        '河运与走私线索',
        '河港码头昼夜不停。货船、走私舱与水手酒气搅在一起，潮汐门方向的商路从这里分流。',
        '【地点世界书 · 港口城】\n关键词：河运、走私、水手、跨域消息。危险偏低，但金钱与秘密同样烫手。',
      ),
    ],
    pois: [
      poi(
        'c_guild',
        '冒险者公会大厅',
        '委托板与掷骰赌桌同厅',
        '大厅中央是委托板，侧廊摆着骰盅与赌桌。公会职员用印章与契约管着冒险者的野心。',
        '【地点世界书 · 冒险者公会大厅】\n核心玩法：接委托、组队、掷骰赌运气。氛围热闹、规则明确，适合开局建立身份。',
      ),
      poi(
        'c_arena',
        '帝国大竞技场',
        '观众席可下注',
        '砂地上血迹被沙覆盖得很快。观众席的欢呼与下注声压过一切，胜者能换名望，败者只剩嘲笑。',
        '【地点世界书 · 帝国大竞技场】\n关键词：角斗、观众、赌注、名望。冲突公开化，适合展示武力与魅力。',
      ),
      poi(
        'c_noble',
        '贵族区宴会',
        '香水与密谈',
        '烛光、香水与假笑。真正的交易发生在舞池之外的回廊，一句闲话可能换来一场联姻或一场追杀。',
        '【地点世界书 · 贵族区宴会】\n关键词：礼仪、密谈、诱惑与试探。不宜拔剑，宜用言语与目光。',
      ),
      poi(
        'c_docks',
        '河港码头',
        '商船与走私线索',
        '缆绳与潮腥味。夜里灯笼一灭，走私舱门就会轻轻打开。',
        '【地点世界书 · 河港码头】\n关键词：夜航、走私、线人。适合潜入与交易线。',
      ),
    ],
    facilityIds: ['dice_tavern', 'relic_auction'],
    fixedLeadId: 'human_rowan',
    sceneImage: '/assets/world/regions/central/scene.png',
    thumbImage: '/assets/world/regions/central/thumb.png',
  },
  {
    id: 'east',
    name: '精灵之森',
    env: '密林·古树·月光湖',
    race: '精灵',
    danger: 2,
    description: '东方密林深处，精灵族守望着古老魔法与禁忌知识。',
    cities: [
      city(
        'e_silver',
        '银月城',
        '树冠上的精灵都城',
        '银月城筑在巨木层叠之间，月光被镜叶折射成银白。外来者须经试炼或引荐，才能踏上上层廊桥。',
        '【地点世界书 · 银月城】\n精灵政治与魔法中心。关键词：礼法、禁忌知识、月光礼仪。冒犯习俗会被静静排挤。',
      ),
      city(
        'e_arena_city',
        '竞技森林',
        '弓术与贴身格斗的试炼林地',
        '竞技森林是精灵用来磨练战士的活林地。箭道、藤索与近身格斗场交织，胜负决定你在林中的话语权。',
        '【地点世界书 · 竞技森林】\n关键词：弓术、贴身格斗、荣誉试炼。适合以比武、对赌或师徒之名开场。',
      ),
    ],
    pois: [
      poi(
        'e_herb',
        '精灵药草园',
        '禁欲药师的工坊',
        '药草园香气清冽。药师用克制与观察对待一切欲望——包括你的。',
        '【地点世界书 · 精灵药草园】\n关键词：药剂、禁欲与诱惑对照、疗愈。可引出身体状态与用药玩法。',
      ),
      poi(
        'e_arena',
        '竞技森林试炼场',
        '弓术与贴身格斗',
        '林间空地被藤索圈成场地。观众是精灵，规则是古老的：先失态者先败。',
        '【地点世界书 · 竞技森林试炼场】\n关键词：比武、技巧、贴身距离。适合开战/投骰推进。',
      ),
      poi(
        'e_lake',
        '月光湖禁地',
        '湖面映出欲望',
        '湖水如镜，映出的不只是面容。禁地边缘立着警告石碑——仍有人在月圆时前来。',
        '【地点世界书 · 月光湖禁地】\n关键词：镜映、秘密、禁忌欲望。氛围偏静谧与心理张力。',
      ),
      poi(
        'e_root',
        '古树根廊',
        '低语与契约刻痕',
        '根廊深处刻着旧契约。低语像从木头里渗出来，提醒你精灵的誓言比刀锋更久。',
        '【地点世界书 · 古树根廊】\n关键词：契约、低语、古老魔法。适合秘密与铭刻线。',
      ),
    ],
    facilityIds: ['moonwood'],
    fixedLeadId: 'elf_caer',
    sceneImage: '/assets/world/regions/east/scene.png',
    thumbImage: '/assets/world/regions/east/thumb.png',
  },
  {
    id: 'west',
    name: '魔族荒原',
    env: '戈壁·火山·黑石堡',
    race: '魔族',
    danger: 3,
    description: '西部戈壁与魔王城。慕强社会，角斗与血契是日常。',
    cities: [
      city(
        'w_demon',
        '魔王城',
        '慕强者朝圣之地',
        '黑石堡垒压在火山灰上。力量即话语权，弱者连影子都不敢拉长。',
        '【地点世界书 · 魔王城】\n关键词：慕强、血契、臣服与挑战。冲突直接，关系以强弱重写。',
      ),
      city(
        'w_blood_city',
        '血斗场',
        '角斗士街区',
        '血斗场不止是竞技，更是街区本身。胜者喝酒，败者被记住名字——或彻底忘掉。',
        '【地点世界书 · 血斗场】\n关键词：角斗、观众、生存。适合开战与下注叙事。',
      ),
    ],
    pois: [
      poi(
        'w_blood',
        '血斗场入口',
        '角斗士街区入口',
        '入口处铁链与告示牌并列。进去之前，先想好你要赌命还是赌名。',
        '【地点世界书 · 血斗场入口】\n关键词：报名、挑战、围观。开场可试探或直接宣战。',
      ),
      poi(
        'w_market',
        '黑市巷',
        '违禁品与奴隶传闻',
        '巷子没有门牌。违禁品用布裹着，价格用眼神谈。',
        '【地点世界书 · 黑市巷】\n关键词：交易、违禁、灰色信息。小心被当成商品。',
      ),
      poi(
        'w_throne',
        '魔王城门廊',
        '慕强者排队请战',
        '门廊排队的人各怀刀意。能走到王座前的，不多。',
        '【地点世界书 · 魔王城门廊】\n关键词：请战、展示、筛选。适合强势开局。',
      ),
      poi(
        'w_ash',
        '火山灰营地',
        '过夜与劫匪',
        '灰烬里支起帐篷。夜里劫匪与野兽同样悄声。',
        '【地点世界书 · 火山灰营地】\n关键词：露营、遭遇、警戒。危险中等偏高。',
      ),
    ],
    facilityIds: ['succubus_office'],
    fixedLeadId: 'demon_vex',
    sceneImage: '/assets/world/regions/west/scene.png',
    thumbImage: '/assets/world/regions/west/thumb.png',
  },
  {
    id: 'north',
    name: '永冬雪境',
    env: '雪山·冰湖·龙骨遗迹',
    race: '龙族',
    danger: 4,
    description: '极北龙族领地。试炼场与龙鳞装备在此流通。',
    cities: [
      city(
        'n_bone',
        '龙骨神殿',
        '龙族圣地与遗骨圣堂',
        '龙骨神殿由远古龙骸撑起穹顶。风雪在门外咆哮，殿内却燃着不灭的龙息之火。外来旅者若无试炼资格，连门槛都难以靠近。',
        '【地点世界书 · 龙骨神殿】\n龙族圣地。关键词：试炼、龙息、敬畏与占有欲。\n氛围肃穆而危险；对话可围绕资格、贡品、伴侣契约与力量证明展开。',
      ),
      city(
        'n_trial_city',
        '试炼场',
        '龙族战士晋级之地',
        '试炼场嵌在冰崖之间。活下来的人会被记名，失败者只留下鳞片碎屑。',
        '【地点世界书 · 试炼场】\n关键词：晋级、火焰与冰、证明自己。适合开战与高危检定。',
      ),
    ],
    pois: [
      poi(
        'n_trial',
        '龙族试炼场',
        '鳞甲与火焰',
        '场地中央的火圈永不熄。试炼官用龙语宣布规则——听不懂也得懂。',
        '【地点世界书 · 龙族试炼场】\n关键词：鳞甲、火焰、资格战。危险高，回报也高。',
      ),
      poi(
        'n_hot',
        '冰湖温泉',
        '体温对比强烈',
        '冰湖边缘冒着白汽。冷热交界处，龙族与旅者都容易卸下防备——或装出卸下防备。',
        '【地点世界书 · 冰湖温泉】\n关键词：体温、亲密距离、对比感官。适合软性张力与疗愈。',
      ),
      poi(
        'n_vault',
        '宝库解谜厅',
        '机关与财宝',
        '厅内机关与龙文铭文共生。解错一次，热风就会提醒你何为龙的耐心。',
        '【地点世界书 · 宝库解谜厅】\n关键词：解谜、机关、龙晶石。适合智力检定与合作。',
      ),
      poi(
        'n_ridge',
        '龙脊绝壁',
        '风雪中的对峙',
        '绝壁上只有风声。对峙在此发生时，退路比勇气更少。',
        '【地点世界书 · 龙脊绝壁】\n关键词：对峙、风雪、孤立。适合高张力一对一。',
      ),
    ],
    facilityIds: ['drake_crag'],
    fixedLeadId: 'dragon_rhaeg',
    sceneImage: '/assets/world/regions/north/scene.png',
    thumbImage: '/assets/world/regions/north/thumb.png',
  },
  {
    id: 'south',
    name: '人鱼海域',
    env: '群岛·珊瑚礁·深海',
    race: '人鱼',
    danger: 2,
    description: '南方最富庶的商路。岸行魔药是人鱼登陆的关键。',
    cities: [
      city(
        's_coral',
        '珊瑚王庭',
        '歌声与商会',
        '珊瑚王庭浮在浅海之上，歌声即法令。商会大厅与潮汐神殿共用同一座礁石。',
        '【地点世界书 · 珊瑚王庭】\n关键词：商路、歌声、礼仪与诱惑。财富与契约并重。',
      ),
      city(
        's_tide',
        '潮汐门',
        '登陆药剂交易枢纽',
        '潮汐门是人鱼上岸的关口。药剂、通行令与秘密在此交换。',
        '【地点世界书 · 潮汐门】\n关键词：岸行药、通行、跨界。适合交易与潜入。',
      ),
    ],
    pois: [
      poi(
        's_court',
        '珊瑚王庭议厅',
        '歌声与商会',
        '议厅里潮声被歌压住。每一笔大单都像一场小型仪式。',
        '【地点世界书 · 珊瑚王庭议厅】\n关键词：议事、贸易、公开魅力。',
      ),
      poi(
        's_gate',
        '潮汐门关卡',
        '登陆药剂交易',
        '关卡灯火通明。没有药剂的人鱼会被浪潮推回深海。',
        '【地点世界书 · 潮汐门关卡】\n关键词：检查、药剂、身份证明。',
      ),
      poi(
        's_reef',
        '汐门礁湾',
        '沉船与触手传闻',
        '礁湾夜色里有未确认的触须。沉船木材上仍留着抓痕。',
        '【地点世界书 · 汐门礁湾】\n关键词：沉船、传闻、未知生物。危险浮动。',
      ),
      poi(
        's_deep',
        '深潜遗迹',
        '需水下呼吸',
        '遗迹在压力与黑暗里。呼吸术或药剂是门票，好奇心是催命符。',
        '【地点世界书 · 深潜遗迹】\n关键词：深海、遗迹、高压环境。需准备后再入。',
      ),
    ],
    facilityIds: ['tidegate'],
    fixedLeadId: 'mermaid_nyx',
    sceneImage: '/assets/world/regions/south/scene.png',
    thumbImage: '/assets/world/regions/south/thumb.png',
  },
  {
    id: 'under',
    name: '深渊裂谷',
    env: '地下城·熔岩河',
    race: '恶魔/魅魔',
    danger: 5,
    description: '地底最危险区域。法则之心与此相连，角斗坑赌的不只是金币。',
    cities: [
      city(
        'u_desire',
        '欲望之城',
        '契约与欲望的地下都市',
        '欲望之城没有白天。霓虹是魔火，契约是呼吸。走进来的人很少以原来的自己走出去。',
        '【地点世界书 · 欲望之城】\n关键词：契约、欲望、交易灵魂级代价。极度危险，叙事尺度可拉满。',
      ),
      city(
        'u_pit_city',
        '角斗坑',
        '赌注与服从',
        '角斗坑的观众要看血，也要看谁先跪下。',
        '【地点世界书 · 角斗坑】\n关键词：角斗、服从、公开羞辱或荣耀。',
      ),
    ],
    pois: [
      poi(
        'u_pit',
        '深渊角斗坑',
        '赌注与服从',
        '坑底沙是热的。下注声比尖叫更响。',
        '【地点世界书 · 深渊角斗坑】\n关键词：开战、赌注、权力展示。',
      ),
      poi(
        'u_succu',
        '魅魔区街巷',
        '契约文书飞舞',
        '街巷里契约纸片像雪。签名之前，先读第二页。',
        '【地点世界书 · 魅魔区街巷】\n关键词：契约、诱惑、文字陷阱。',
      ),
      poi(
        'u_rift',
        '法则之心裂隙',
        '主线关键地',
        '裂隙边现实会轻轻扭曲。靠近的人会听见「规则」在呼吸。',
        '【地点世界书 · 法则之心裂隙】\n关键词：主线、法则、高危启示。',
      ),
      poi(
        'u_bath',
        '熔岩温泉廊',
        '危险的休憩',
        '温泉是熔岩加热的。放松与灼伤只隔一层薄汽。',
        '【地点世界书 · 熔岩温泉廊】\n关键词：休憩、危险亲密、温度。',
      ),
    ],
    facilityIds: ['void_throne'],
    fixedLeadId: 'succubus_milo',
    sceneImage: '/assets/world/regions/under/scene.png',
    thumbImage: '/assets/world/regions/under/thumb.png',
  },
  {
    id: 'sky',
    name: '天界浮岛',
    env: '云中城·圣光穹顶',
    race: '天使/神族',
    danger: 5,
    description: '天空秘境。天使初见你可能恐惧或好奇——取决于你是否已有天使伴侣。',
    cities: [
      city(
        'sk_cloud',
        '云中圣城',
        '圣光与审判之城',
        '云中圣城悬浮于风暴之上。圣光不暖，只衡量。',
        '【地点世界书 · 云中圣城】\n关键词：审判、圣洁、禁忌接触。关系张力来自规则与欲望的冲突。',
      ),
      city(
        'sk_chain_city',
        '浮岛链',
        '风与失重的通道',
        '浮岛以光桥相连。一步踏空，就是很长的坠落。',
        '【地点世界书 · 浮岛链】\n关键词：通行、失重、高空遭遇。',
      ),
    ],
    pois: [
      poi(
        'sk_dome',
        '圣光穹顶',
        '审判与赦免',
        '穹顶之下无处可藏。赦免与定罪往往发生在同一句颂词里。',
        '【地点世界书 · 圣光穹顶】\n关键词：审判、赦免、公开审视。',
      ),
      poi(
        'sk_plaza',
        '审判广场',
        '众目睽睽',
        '广场四周全是注视。在这里犯错，等于广播。',
        '【地点世界书 · 审判广场】\n关键词：围观、名誉、公开对质。',
      ),
      poi(
        'sk_chain',
        '浮岛链栈道',
        '风与失重感',
        '栈道会在风里轻轻摆。抓紧的可能是栏杆，也可能是某只手。',
        '【地点世界书 · 浮岛链栈道】\n关键词：通行、危险亲密、失重。',
      ),
      poi(
        'sk_lib',
        '天界图书馆',
        '禁书一瞥',
        '禁书区的门只对「被允许好奇的人」开一条缝。',
        '【地点世界书 · 天界图书馆】\n关键词：知识、禁忌、窃读。',
      ),
    ],
    facilityIds: ['solar_sanctum'],
    fixedLeadId: 'angel_seraph',
    sceneImage: '/assets/world/regions/sky/scene.png',
    thumbImage: '/assets/world/regions/sky/thumb.png',
  },
  {
    id: 'border',
    name: '兽人荒野',
    env: '草原·峡谷·部落',
    race: '亚兽人',
    danger: 2,
    description: '部落制荒野。兽人的标记本能是不可逆的伴侣契约。',
    cities: [
      city(
        'b_wind',
        '大风部落',
        '荒野部落中心',
        '大风部落以兽骨图腾为界。篝火、烤肉与较力声是欢迎词，也是警告。',
        '【地点世界书 · 大风部落】\n关键词：部落礼、标记、体力与归属。关系一旦标记，很难撤回。',
      ),
      city(
        'b_camp',
        '角斗营',
        '勇士较力营地',
        '角斗营是流动的荣誉场。赢了有酒，输了有疤。',
        '【地点世界书 · 角斗营】\n关键词：较力、荣誉、围观。',
      ),
    ],
    pois: [
      poi(
        'b_feast',
        '勇士之宴',
        '烤肉与较力',
        '宴席上笑声很大。较力输的人要喝罚酒——或被起哄贴得更近。',
        '【地点世界书 · 勇士之宴】\n关键词：宴会、体力、公开亲密。',
      ),
      poi(
        'b_mark',
        '标记仪式场',
        '气味与归属',
        '仪式场中心有图腾。标记不是比喻，是部落承认的伴侣契约。',
        '【地点世界书 · 标记仪式场】\n关键词：标记、归属、不可逆契约。',
      ),
      poi(
        'b_market',
        '兽骨市集',
        '战利品交易',
        '市集卖骨头、毛皮与故事。每件战利品都带着上一任主人的味道。',
        '【地点世界书 · 兽骨市集】\n关键词：交易、战利品、部落人情。',
      ),
      poi(
        'b_canyon',
        '峡谷猎场',
        '围猎偶遇',
        '峡谷回声会放大脚步。偶遇可能是猎物，也可能是猎人。',
        '【地点世界书 · 峡谷猎场】\n关键词：围猎、偶遇、野外张力。',
      ),
    ],
    facilityIds: ['drake_crag'],
    fixedLeadId: 'beastfolk_wolf',
    sceneImage: '/assets/world/regions/border/scene.png',
    thumbImage: '/assets/world/regions/border/thumb.png',
  },
]

export const AZERIA_WORLD_REGION_MAP = Object.fromEntries(
  AZERIA_WORLD_REGIONS.map((r) => [r.id, r]),
)
