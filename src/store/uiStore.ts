import { create } from 'zustand'
import { FACILITY_MAP } from '@/data/facilities'

type SidebarTab = 'sessions' | 'archived' | 'characters' | 'regions' | 'settings'
export type FlowStage = 'splash' | 'onboarding' | 'cutscene' | 'invite' | 'main'
export type MainTab = 'adventure' | 'chat' | 'rulebook' | 'tavern' | 'atlas' | 'settings' | 'world' | 'passport' | 'phone' | 'party' | 'home'
export type TavernSubView =
  | 'hub'
  | 'quests'
  | 'departure'
  | 'recruit'
  | 'photo_stone'
  | 'shop'
  | 'party'
  | 'roster'
  | 'residents'
  | 'servants'
  | 'arena'
  | 'forum'
  | 'gossip'
  | 'commissions'
  | 'diary'
  | 'reputation'
  | 'industry'
  | 'obedience'
  | 'adventurer'
  | 'backpack'
  | 'gifts'
  | 'craft'
  | 'faction'
  | 'calendar'
export type AtlasSubView =
  | 'hub'
  | 'endings'
  | 'ending_detail'
  | 'regions'
  | 'region_detail'
  | 'bonds'
  | 'monsters'
  | 'titles'
  | 'story'
  | 'cities'
  | 'faction'
  | 'stamps'
export type FacilityPageStage = 'overview' | 'identity' | 'entering'
export type ImmersionMode = 'narrative' | 'explore'
export type ActionSheetKind = null | 'potion' | 'move' | 'dice'

export interface CombatPayload {
  enemyName: string
  dc: number
  regionId?: string
  /** 竞技场开战时发奖金 */
  prize?: boolean
}

export type PhoneApp =
  | 'home'
  | 'music'
  | 'relationship'
  | 'shop'
  | 'profile'
  | 'memory'
  | 'diary'
  | 'monitor'
  | 'album'
  | 'roster'
  | 'body'
  | 'commands'
  | 'passport'
  | 'forum'
  | 'brand'
  | 'homebase'
  | 'recruit'
  | 'prefs'

export interface AppToast {
  id: string
  title: string
  message?: string
}

export interface PendingTravelEncounter {
  facilityId: string
  roll: number
  formatted: string
}

interface UIStore {
  sidebarOpen: boolean
  sidebarTab: SidebarTab
  newSessionModalOpen: boolean
  memoryPanelOpen: boolean
  relationshipPanelOpen: boolean

  /** 顶层流程阶段 */
  flowStage: FlowStage
  /** 主页面底部 tab */
  activeTab: MainTab
  /** 世界 tab 中选中的冒险域 */
  selectedRegionId: string | null
  /** 新建会话弹窗预设的地区（点世界 tab 车票时注入） */
  presetRegionId: string | null
  /** 冒险域玩法页是否打开 */
  facilityPlayPageOpen: boolean
  /** 冒险域玩法页当前步骤 */
  facilityPageStage: FacilityPageStage
  /** 冒险域玩法页中选中的设施 */
  selectedFacilityId: string | null
  /** 冒险域玩法页中选中的身份 */
  selectedIdentityId: string | null
  /** 手机内当前打开的 App */
  phoneApp: PhoneApp
  /** 酒馆子页面 */
  tavernSubView: TavernSubView
  /** 图鉴子页面 */
  atlasSubView: AtlasSubView
  /** 图鉴详情 id（结局/区域等） */
  atlasDetailId: string | null
  /** 关系/送礼等选中的角色 */
  phoneFocusCharId: string | null
  /** 世界树弹窗 */
  worldTreeModalOpen: boolean
  /** 史诗存档（存档）提示 */
  sandOfTimeModalOpen: boolean
  /** 输入栏 + 号菜单 */
  composerPlusOpen: boolean
  /** 沉浸聊天 · 左侧域界栏 */
  chatFacilityRailOpen: boolean
  /** 沉浸聊天 · 右侧男主栏 */
  chatNpcRailOpen: boolean
  /** 右侧身体数据面板展开 */
  chatNpcBodyOpen: boolean
  /** 群聊 @ 指定下一条由谁回复 */
  replyTargetCharacterId: string | null

  /** 沉浸双模式：叙事台 / 探索厅 */
  immersionMode: ImmersionMode
  /** 战斗叠层 */
  combatOpen: boolean
  combat: CombatPayload | null
  /** 行动坞弹层 */
  actionSheet: ActionSheetKind

  /** 保留男主弹窗 */
  saveNpcModalOpen: boolean
  /** 余韵后契约邀请弹窗 */
  stampOfferModalOpen: boolean
  /** 转账弹窗 */
  transferModalOpen: boolean
  /** 语音通话 */
  voiceCallOpen: boolean
  /** 图片选择（拍照/发图） */
  imagePickerOpen: boolean
  imagePickerPurpose: 'photo' | 'image'
  /** 表情选择 */
  emojiPickerOpen: boolean
  /** 全局完成提示 */
  toast: AppToast | null
  /** 设置里重看开机动画 */
  openingReplay: boolean
  flowReplayNonce: number
  /** 当前区域主题色（影响全局背景渐变） */
  regionHue: string | null
  /** $移动 或入域前掷出的旅行遭遇（进入同 facility 时复用） */
  pendingTravelEncounter: PendingTravelEncounter | null
  setRegionHue: (hue: string | null) => void
  setPendingTravelEncounter: (enc: PendingTravelEncounter | null) => void

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarTab: (tab: SidebarTab) => void
  setNewSessionModalOpen: (open: boolean) => void
  setMemoryPanelOpen: (open: boolean) => void
  setRelationshipPanelOpen: (open: boolean) => void

  setFlowStage: (stage: FlowStage) => void
  setActiveTab: (tab: MainTab) => void
  setSelectedRegionId: (id: string | null) => void
  setPresetRegionId: (id: string | null) => void
  openFacilityPlayPage: (facilityId: string) => void
  closeFacilityPlayPage: () => void
  setFacilityPageStage: (stage: FacilityPageStage) => void
  setSelectedIdentityId: (id: string | null) => void
  setPhoneFocusCharId: (id: string | null) => void
  setPhoneApp: (app: PhoneApp) => void
  setTavernSubView: (view: TavernSubView) => void
  setAtlasSubView: (view: AtlasSubView, detailId?: string | null) => void
  setWorldTreeModalOpen: (open: boolean) => void
  setSandOfTimeModalOpen: (open: boolean) => void
  setComposerPlusOpen: (open: boolean) => void
  setChatFacilityRailOpen: (open: boolean) => void
  setChatNpcRailOpen: (open: boolean) => void
  toggleChatFacilityRail: () => void
  toggleChatNpcRail: () => void
  setChatNpcBodyOpen: (open: boolean) => void
  setReplyTargetCharacterId: (id: string | null) => void
  setImmersionMode: (mode: ImmersionMode) => void
  openCombat: (payload: CombatPayload) => void
  closeCombat: () => void
  setActionSheet: (sheet: ActionSheetKind) => void
  setSaveNpcModalOpen: (open: boolean) => void
  setStampOfferModalOpen: (open: boolean) => void
  setTransferModalOpen: (open: boolean) => void
  setVoiceCallOpen: (open: boolean) => void
  setImagePickerOpen: (open: boolean, purpose?: 'photo' | 'image') => void
  setEmojiPickerOpen: (open: boolean) => void
  showToast: (title: string, message?: string) => void
  clearToast: () => void
  replayOpeningAnimation: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  sidebarTab: 'sessions',
  newSessionModalOpen: false,
  memoryPanelOpen: false,
  relationshipPanelOpen: false,

  flowStage: 'splash',
  activeTab: 'world',
  selectedRegionId: null,
  presetRegionId: null,
  facilityPlayPageOpen: false,
  facilityPageStage: 'overview',
  selectedFacilityId: null,
  selectedIdentityId: null,
  phoneFocusCharId: null,
  phoneApp: 'home' as PhoneApp,
  tavernSubView: 'hub' as TavernSubView,
  atlasSubView: 'hub' as AtlasSubView,
  atlasDetailId: null,
  worldTreeModalOpen: false,
  sandOfTimeModalOpen: false,
  composerPlusOpen: false,
  chatFacilityRailOpen: true,
  chatNpcRailOpen: true,
  chatNpcBodyOpen: true,
  replyTargetCharacterId: null,
  immersionMode: 'explore' as ImmersionMode,
  combatOpen: false,
  combat: null,
  actionSheet: null as ActionSheetKind,
  saveNpcModalOpen: false,
  stampOfferModalOpen: false,
  transferModalOpen: false,
  voiceCallOpen: false,
  imagePickerOpen: false,
  imagePickerPurpose: 'image' as 'photo' | 'image',
  emojiPickerOpen: false,
  toast: null,
  openingReplay: false,
  flowReplayNonce: 0,
  regionHue: null,
  pendingTravelEncounter: null,
  setRegionHue: (hue) => set({ regionHue: hue }),
  setPendingTravelEncounter: (enc) => set({ pendingTravelEncounter: enc }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setNewSessionModalOpen: (open) => set({ newSessionModalOpen: open }),
  setMemoryPanelOpen: (open) => set({ memoryPanelOpen: open }),
  setRelationshipPanelOpen: (open) => set({ relationshipPanelOpen: open }),

  setFlowStage: (stage) => set({ flowStage: stage }),
  setActiveTab: (tab) => set({ activeTab: tab, tavernSubView: 'hub', atlasSubView: 'hub', atlasDetailId: null }),
  setSelectedRegionId: (id) => set({ selectedRegionId: id }),
  setPresetRegionId: (id) => set({ presetRegionId: id }),
  openFacilityPlayPage: (facilityId) => {
    const firstIdentity = FACILITY_MAP[facilityId]?.identities[0]?.id ?? null
    set({
      facilityPlayPageOpen: true,
      facilityPageStage: 'overview',
      selectedFacilityId: facilityId,
      selectedIdentityId: firstIdentity,
    })
  },
  closeFacilityPlayPage: () =>
    set({
      facilityPlayPageOpen: false,
      facilityPageStage: 'overview',
      selectedFacilityId: null,
      selectedIdentityId: null,
    }),
  setFacilityPageStage: (stage) => set({ facilityPageStage: stage }),
  setSelectedIdentityId: (id) => set({ selectedIdentityId: id }),
  setPhoneFocusCharId: (id) => set({ phoneFocusCharId: id }),
  setPhoneApp: (app) => set({ phoneApp: app }),
  setTavernSubView: (view) => set({ tavernSubView: view }),
  setAtlasSubView: (view, detailId) =>
    set({ atlasSubView: view, atlasDetailId: detailId === undefined ? null : detailId }),
  setWorldTreeModalOpen: (open) => set({ worldTreeModalOpen: open }),
  setSandOfTimeModalOpen: (open) => set({ sandOfTimeModalOpen: open }),
  setComposerPlusOpen: (open) => set({ composerPlusOpen: open }),
  setChatFacilityRailOpen: (open) => set({ chatFacilityRailOpen: open }),
  setChatNpcRailOpen: (open) => set({ chatNpcRailOpen: open }),
  toggleChatFacilityRail: () => set((s) => ({ chatFacilityRailOpen: !s.chatFacilityRailOpen })),
  toggleChatNpcRail: () => set((s) => ({ chatNpcRailOpen: !s.chatNpcRailOpen })),
  setChatNpcBodyOpen: (open) => set({ chatNpcBodyOpen: open }),
  setReplyTargetCharacterId: (id) => set({ replyTargetCharacterId: id }),
  setImmersionMode: (mode) => set({ immersionMode: mode }),
  openCombat: (payload) => set({ combatOpen: true, combat: payload }),
  closeCombat: () => set({ combatOpen: false, combat: null }),
  setActionSheet: (sheet) => set({ actionSheet: sheet }),
  setSaveNpcModalOpen: (open) => set({ saveNpcModalOpen: open }),
  setStampOfferModalOpen: (open) => set({ stampOfferModalOpen: open }),
  setTransferModalOpen: (open) => set({ transferModalOpen: open }),
  setVoiceCallOpen: (open) => set({ voiceCallOpen: open }),
  setImagePickerOpen: (open, purpose) =>
    set((s) => ({
      imagePickerOpen: open,
      imagePickerPurpose: purpose ?? s.imagePickerPurpose,
    })),
  setEmojiPickerOpen: (open) => set({ emojiPickerOpen: open }),
  showToast: (title, message) => {
    const id = `toast_${Date.now()}`
    set({ toast: { id, title, message } })
    window.setTimeout(() => {
      set((s) => (s.toast?.id === id ? { toast: null } : s))
    }, 3200)
  },
  clearToast: () => set({ toast: null }),
  replayOpeningAnimation: () =>
    set((s) => ({
      openingReplay: true,
      flowReplayNonce: s.flowReplayNonce + 1,
      flowStage: 'splash',
      sidebarOpen: false,
      composerPlusOpen: false,
      newSessionModalOpen: false,
      memoryPanelOpen: false,
      relationshipPanelOpen: false,
      facilityPlayPageOpen: false,
      facilityPageStage: 'overview',
      selectedFacilityId: null,
      selectedIdentityId: null,
      transferModalOpen: false,
      saveNpcModalOpen: false,
      stampOfferModalOpen: false,
      voiceCallOpen: false,
      imagePickerOpen: false,
      emojiPickerOpen: false,
      worldTreeModalOpen: false,
      sandOfTimeModalOpen: false,
    })),
}))
