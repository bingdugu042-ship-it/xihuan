/** 酒馆驻留 / 大厅聊天入场 */

import { HOME_PRESET_MAP } from '@/data/homes'
import { usePassportStore } from '@/store/passportStore'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { useDataStore } from '@/store/dataStore'

const TAVERN_REGION_ID = 'dice_tavern'
const TAVERN_LEAD_ID = 'human_rowan'

export function getTavernResidentIds(): string[] {
  return usePassportStore.getState().homeIds.filter(Boolean)
}

/** 与驻留对象私语 */
export async function enterTavernStayPrivate(characterId: string): Promise<void> {
  const pass = usePassportStore.getState()
  const preset = HOME_PRESET_MAP[pass.homePresetId]
  const name = pass.bonds[characterId]?.displayName ?? characterId
  await useSessionStore.getState().createSession({
    type: 'private',
    regionId: TAVERN_REGION_ID,
    participantIds: [characterId],
    title: `酒馆驻留 · ${name}`,
    playMode: 'home',
    withIntro: true,
  })
  await pass.bumpCultivation({ intimacy: 1 })
  useUIStore.getState().setImmersionMode('explore')
  useUIStore.getState().setActiveTab('chat')
  useUIStore.getState().showToast('已进入私语', preset?.name ?? '酒馆驻留')
}

/** 与多名驻留对象群聊 */
export async function enterTavernStayGroup(): Promise<void> {
  const pass = usePassportStore.getState()
  const ids = getTavernResidentIds()
  if (ids.length < 2) {
    useUIStore.getState().showToast('群聊至少需要 2 名驻留对象')
    return
  }
  const preset = HOME_PRESET_MAP[pass.homePresetId]
  await useSessionStore.getState().createSession({
    type: 'group',
    regionId: TAVERN_REGION_ID,
    participantIds: ids,
    title: `酒馆驻留群聊 · ${preset?.name ?? '阁楼'}`,
    playMode: 'home',
    withIntro: true,
  })
  await pass.bumpCultivation({ intimacy: 1, allure: 1 })
  useUIStore.getState().setImmersionMode('explore')
  useUIStore.getState().setActiveTab('chat')
  useUIStore.getState().showToast('群聊已开启', '世界书已注入驻留氛围')
}

/** 酒馆大厅闲聊：域内主角 + 驻留 + 出征编组 */
export async function enterTavernHallChat(): Promise<void> {
  const { characters, runtimeCharacters, regions } = useDataStore.getState()
  const known = { ...characters, ...runtimeCharacters }
  if (!regions[TAVERN_REGION_ID]) {
    useUIStore.getState().showToast('酒馆数据未载入', '请检查游戏数据')
    return
  }
  const pass = usePassportStore.getState()
  const ids: string[] = []
  const push = (id?: string | null) => {
    if (!id || ids.includes(id) || !known[id]) return
    ids.push(id)
  }
  push(TAVERN_LEAD_ID)
  for (const id of pass.homeIds) push(id)
  for (const id of pass.partyIds) push(id)
  for (const id of regions[TAVERN_REGION_ID]?.defaultParticipants ?? []) push(id)

  await useSessionStore.getState().createSession({
    type: ids.length > 1 ? 'group' : 'private',
    regionId: TAVERN_REGION_ID,
    participantIds: ids.slice(0, 4),
    title: '冒险者酒馆 · 大厅闲聊',
    playMode: '自由游玩',
    exploreStyle: 'free',
    withIntro: true,
  })
  await useSessionStore.getState().appendSystemMessage(
    '【抵达 · 冒险者酒馆】\n壁炉噼啪作响，告示板上钉着委托与旅人字条。驻留对象若在场，可在此闲聊、接单或安排出征。',
    'narrator',
  )
  useUIStore.getState().setImmersionMode('explore')
  useUIStore.getState().setActiveTab('chat')
  useUIStore.getState().showToast('已进入酒馆', '可与在场角色对话')
}

/** 打开酒馆功能大厅（委托/驻留/编组） */
export function openTavernHub(): void {
  const ui = useUIStore.getState()
  ui.setTavernSubView('hub')
  ui.setActiveTab('tavern')
}
