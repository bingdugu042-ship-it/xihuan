import { useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Flame, MapPin, Stamp, User, Activity } from 'lucide-react'
import { ensureNpcBioFields } from '@/ai/npcGenerator'
import { FACILITIES, FACILITY_MAP, THEME_ZONES } from '@/data/facilities'
import { openFacilityEntry, isAdventureRegion } from '@/utils/facilityEntry'
import {
  EROTIC_INTENSITY_OPTIONS,
  EXPLORE_STYLE_OPTIONS,
  intensityLabel,
  exploreStyleLabel,
} from '@/data/playAtmosphere'
import { useBodyStatsStore, FEMALE_STAT_LABELS, MALE_STAT_LABELS } from '@/store/bodyStatsStore'
import { useDataStore } from '@/store/dataStore'
import { usePassportStore } from '@/store/passportStore'
import { useProfileStore } from '@/store/profileStore'
import { useSessionStore } from '@/store/sessionStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'
import { useIsMobileLayout } from '@/ui/layout/templates/shared/useIsMobileLayout'
import {
  buildFocusNpcView,
  resolveFocusCharacterId,
} from '@/utils/focusNpc'
import { ChatPortraitPanel } from './ChatPortraitPanel'
import { NpcStatusBar } from './NpcStatusBar'
import { NpcBioCard } from './NpcBioCard'
import { GuideProgressBar } from './GuideProgressBar'

type DeckTab = 'player' | 'npc' | 'facility' | null

export type { DeckTab }

const GLASS = {
  bar: 'var(--immerse-chrome)',
  panel: 'var(--immerse-chrome-strong)',
  border: 'var(--immerse-chrome-border)',
}

interface Props {
  embedded?: boolean
  tab: DeckTab
  onTabChange: (tab: DeckTab) => void
  /** 仅渲染展开浮层（芯片条已并入驾驶舱） */
  overlayOnly?: boolean
}

/** 顶部半透明折叠状态层 — 展开为浮层，不挤压聊天宽度与高度 */
export function ChatTopStatusDeck({ embedded, tab, onTabChange, overlayOnly }: Props) {
  const { gender, stats, stateLabels, loaded, load } = useBodyStatsStore()
  const { profiles } = useProfileStore()
  const activeProfileId = useSettingsStore((s) => s.settings.ui.activeProfileId)
  const { regions, characters: staticChars, runtimeCharacters } = useDataStore()
  const activeSession = useSessionStore((s) => s.activeSession)
  const updateDynamicNpc = useSessionStore((s) => s.updateDynamicNpc)
  const hasStamp = usePassportStore((s) => s.hasStamp)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const setSaveNpcModalOpen = useUIStore((s) => s.setSaveNpcModalOpen)
  const replyTarget = useUIStore((s) => s.replyTargetCharacterId)
  const setSessionEroticIntensity = useSessionStore((s) => s.setSessionEroticIntensity)
  const setSessionExploreStyle = useSessionStore((s) => s.setSessionExploreStyle)
  const showToast = useUIStore((s) => s.showToast)
  const mobile = useIsMobileLayout()

  useEffect(() => {
    if (!loaded) void load()
  }, [loaded, load])

  const characters = useMemo(
    () => ({ ...staticChars, ...runtimeCharacters }),
    [staticChars, runtimeCharacters],
  )
  const profile = profiles.find((p) => p.id === activeProfileId)
  const focusId = resolveFocusCharacterId(activeSession, replyTarget)
  const focusView = buildFocusNpcView(activeSession, focusId, characters)
  const npc = focusView?.dyn
  const labels = gender === 'male' ? MALE_STAT_LABELS : FEMALE_STAT_LABELS
  const topKeys = Object.keys(labels).slice(0, 3)
  const heat =
    topKeys.length > 0
      ? Math.round(topKeys.reduce((s, k) => s + (stats[k] ?? 0), 0) / topKeys.length)
      : 0
  const activeFacilityId = activeSession?.regionId ?? null
  const facilityName =
    (activeFacilityId && FACILITY_MAP[activeFacilityId]?.name) ||
    (activeFacilityId && regions[activeFacilityId]?.name) ||
    null
  const total = FACILITIES.length
  const playerShort = (profile?.name ?? '旅者').slice(0, mobile ? 2 : 8)
  const explore = exploreStyleLabel(activeSession?.exploreStyle)
  const intensity = intensityLabel(activeSession?.eroticIntensity)
  const travelHint = activeSession?.lastTravelEncounter?.split('\n')?.[0] ?? null

  const toggle = (t: Exclude<DeckTab, null>) => onTabChange(tab === t ? null : t)

  const close = () => onTabChange(null)

  const enterFacility = (facilityId: string) => {
    if (isAdventureRegion(facilityId)) {
      openFacilityEntry(facilityId)
      close()
      return
    }
    const region = regions[facilityId]
    if (!region) return
    useSessionStore.getState().createSession({
      regionId: facilityId,
      participantIds: region.defaultParticipants ?? [],
      type: region.type ?? 'private',
      title: FACILITIES.find((f) => f.id === facilityId)?.name ?? region.name,
      withIntro: true,
    }).then(() => {
      setActiveTab('chat')
      close()
    })
  }

  const openNpcBodyPanel = () => {
    onTabChange('npc')
  }

  const correctGenderToMale = () => {
    if (!npc) return
    const fixed = ensureNpcBioFields({ ...npc, gender: '男' })
    void updateDynamicNpc({
      gender: '男',
      appearance: fixed.appearance,
      background: fixed.background,
    })
    showToast('已纠正为男')
  }

  const stamps = usePassportStore((s) => s.stamps)
  const stampedTotal = Object.keys(stamps).length

  return (
    <div
      className={`chat-top-deck relative z-20 ${overlayOnly ? 'chat-top-deck--overlay shrink-0' : 'shrink-0'}`}
    >
      {!overlayOnly && (
        <div
          className={`chat-top-deck__bar flex items-center gap-1 ${mobile ? 'chat-top-deck__bar--mobile px-1.5 py-1' : 'px-2 py-1.5'}`}
          style={{
            background: GLASS.bar,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: `1px solid ${GLASS.border}`,
          }}
        >
          <button
            type="button"
            onClick={() => toggle('player')}
            className={`chat-top-chip flex shrink-0 items-center gap-1 rounded-lg text-left ${
              mobile ? 'max-w-[4.5rem] px-1.5 py-1' : 'min-h-[32px] flex-1 gap-1.5 px-2 py-1'
            } ${tab === 'player' ? 'chat-top-chip--active' : ''}`}
            title={`${profile?.name ?? '旅者'} · ${stateLabels.lower ?? '—'} ${heat}%`}
            aria-label={`旅者 ${profile?.name ?? ''}`}
          >
            <User size={mobile ? 11 : 12} style={{ color: 'var(--c-primary)', flexShrink: 0 }} />
            <span
              className={`truncate font-medium ${mobile ? 'text-[9px]' : 'min-w-0 flex-1 text-[10px]'}`}
              style={{ color: 'var(--c-text)' }}
            >
              {playerShort}
            </span>
            {!mobile && (
              <span
                className="max-w-[4.5rem] truncate text-[9px] opacity-70"
                style={{ color: 'var(--c-text-dim)' }}
              >
                {(stateLabels.lower ?? '—').slice(0, 6)} {heat}%
              </span>
            )}
            {!mobile && (
              <ChevronDown
                size={12}
                className={`shrink-0 transition-transform ${tab === 'player' ? 'rotate-180' : ''}`}
                style={{ color: 'var(--c-text-dim)' }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={openNpcBodyPanel}
            className={`chat-top-chip chat-top-chip--body flex shrink-0 items-center justify-center rounded-lg ${
              mobile ? 'h-8 w-8 px-0' : 'min-h-[32px] gap-1 px-2 py-1'
            }`}
            title="角色身体状态"
            aria-label="角色身体状态"
          >
            <Activity size={mobile ? 12 : 12} style={{ color: 'var(--c-accent)' }} />
            {!mobile && (
              <span className="text-[9px] font-medium" style={{ color: 'var(--c-text)' }}>
                身体
              </span>
            )}
          </button>

          {npc && (
            <button
              type="button"
              onClick={() => toggle('npc')}
              className={`chat-top-chip flex min-w-0 items-center gap-1 rounded-lg text-left ${
                mobile
                  ? 'min-w-[42%] flex-[1.6] px-2 py-1'
                  : 'min-h-[32px] flex-1 gap-1.5 px-2 py-1'
              } ${tab === 'npc' ? 'chat-top-chip--active' : ''}`}
              title={`${npc.displayName} · 堕${npc.corruption}%`}
            >
              <Flame size={mobile ? 12 : 12} className="shrink-0" style={{ color: 'var(--c-accent)' }} />
              <span
                className="min-w-0 flex-1 truncate font-medium text-[11px] leading-tight"
                style={{ color: 'var(--c-text)' }}
              >
                {npc.displayName}
              </span>
              <span className="shrink-0 text-[8px]" style={{ color: 'var(--c-text-dim)' }}>
                角色
              </span>
              <ChevronDown
                size={mobile ? 11 : 12}
                className={`shrink-0 transition-transform ${tab === 'npc' ? 'rotate-180' : ''}`}
                style={{ color: 'var(--c-text-dim)' }}
              />
            </button>
          )}

          {!embedded && (
            <button
              type="button"
              onClick={() => toggle('facility')}
              className={`chat-top-chip flex min-w-0 shrink items-center gap-1 rounded-lg text-left ${
                mobile ? 'max-w-[30%] flex-1 px-1.5 py-1' : 'min-h-[32px] shrink-0 px-2 py-1'
              } ${tab === 'facility' ? 'chat-top-chip--active' : ''}`}
              aria-label="地点与玩法"
              title={[facilityName, activeSession?.playMode, intensity, explore, travelHint]
                .filter(Boolean)
                .join(' · ')}
            >
              <MapPin size={mobile ? 11 : 12} className="shrink-0" style={{ color: 'var(--c-accent)' }} />
              <span
                className={`min-w-0 truncate ${mobile ? 'text-[9px] font-medium' : 'max-w-[88px] text-[9px]'}`}
                style={{ color: mobile ? 'var(--c-text)' : 'var(--c-text-dim)' }}
              >
                {mobile
                  ? (facilityName?.replace(/中心|域界|馆|室$/u, '') ?? explore)
                  : activeSession
                    ? [activeSession.playMode, intensity, explore].filter(Boolean).join('·') ||
                      `${stampedTotal}/${total}`
                    : `${stampedTotal}/${total}`}
              </span>
              <ChevronDown
                size={mobile ? 10 : 12}
                className={`shrink-0 transition-transform ${tab === 'facility' ? 'rotate-180' : ''}`}
                style={{ color: 'var(--c-text-dim)' }}
              />
            </button>
          )}
        </div>
      )}

      {!overlayOnly && <GuideProgressBar />}

      <AnimatePresence>
        {tab && (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className={`chat-top-deck__panel absolute left-0 right-0 z-30 max-h-[min(72vh,560px)] overflow-y-auto border-b px-3 py-3 shadow-lg ${
              overlayOnly ? 'top-0' : 'top-full'
            }`}
            style={{
              background: GLASS.panel,
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              borderColor: GLASS.border,
              color: 'var(--immerse-ink)',
            }}
          >
            {tab === 'player' && (
              <div className="space-y-2 text-[10px] leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
                <p>
                  <span style={{ color: 'var(--c-primary)' }}>下身 · </span>
                  {stateLabels.lower ?? '—'}
                  <span className="mx-1.5 opacity-30">|</span>
                  <span style={{ color: 'var(--c-primary)' }}>体力 · </span>
                  {stateLabels.stamina ?? '—'}
                  <span className="mx-1.5 opacity-30">|</span>
                  <span style={{ color: 'var(--c-primary)' }}>意识 · </span>
                  {stateLabels.mind ?? '—'}
                </p>
                <div className="flex flex-wrap gap-x-3">
                  {topKeys.map((k) => (
                    <span key={k}>
                      {labels[k]} {stats[k] ?? 0}%
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('tavern')
                    useUIStore.getState().setTavernSubView('adventurer')
                    close()
                  }}
                  className="text-[9px] underline"
                  style={{ color: 'var(--c-accent)' }}
                >
                  完整身体面板 →
                </button>
              </div>
            )}

            {tab === 'npc' && focusView && (
              <div className="space-y-3">
                {(activeSession?.participantIds.length ?? 0) > 1 && (
                  <p className="text-[10px]" style={{ color: 'var(--immerse-ink-dim)' }}>
                    当前焦点：{focusView.name} · 点上方「在场」芯片可切换
                  </p>
                )}
                <div className="flex gap-3">
                  <div className="w-[108px] shrink-0">
                    <ChatPortraitPanel />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-[12px] font-medium" style={{ color: 'var(--immerse-ink)' }}>
                      {focusView.name}
                    </p>
                    {npc ? (
                      <>
                        <p className="text-[9px]" style={{ color: 'var(--immerse-ink-dim)' }}>
                          {npc.gender} · {npc.ageFeel} · {npc.bodyType} · {npc.style}
                        </p>
                        <p className="text-[9px]" style={{ color: 'var(--immerse-ink-dim)' }}>
                          堕落 {npc.corruption}% · 关注 {npc.attention}% · 独占 {npc.possessiveness}%
                        </p>
                        {npc.gender !== '男' && (
                          <button
                            type="button"
                            onClick={correctGenderToMale}
                            className="rounded-lg px-2 py-1 text-[9px] font-medium"
                            style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
                          >
                            纠正为男
                          </button>
                        )}
                      </>
                    ) : focusView.card ? (
                      <>
                        <p className="text-[9px]" style={{ color: 'var(--immerse-ink-dim)' }}>
                          {focusView.card.title}
                        </p>
                        <p className="text-[9px] leading-relaxed" style={{ color: 'var(--immerse-ink-dim)' }}>
                          {focusView.card.personality?.slice(0, 3).join(' · ')}
                        </p>
                      </>
                    ) : null}
                  </div>
                </div>

                {npc ? (
                  <NpcBioCard npc={npc} />
                ) : focusView.card ? (
                  <div className="space-y-2 text-[11px] leading-relaxed" style={{ color: 'var(--immerse-ink)' }}>
                    {focusView.card.appearance && (
                      <p>
                        <span style={{ color: 'var(--c-primary)' }}>外貌 · </span>
                        {focusView.card.appearance}
                      </p>
                    )}
                    {focusView.card.background && (
                      <p>
                        <span style={{ color: 'var(--c-accent)' }}>背景 · </span>
                        {focusView.card.background}
                      </p>
                    )}
                  </div>
                ) : null}

                <NpcStatusBar
                  variant="panel"
                  desire={focusView.desire}
                  innerThought={focusView.innerThought}
                  bodyState={focusView.bodyState}
                />

                <div className="flex flex-wrap gap-2">
                  {npc && (
                    <button
                      type="button"
                      onClick={() => setSaveNpcModalOpen(true)}
                      className="text-[9px] underline"
                      style={{ color: 'var(--c-accent)' }}
                    >
                      保留男主
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('tavern')
                      useUIStore.getState().setTavernSubView('party')
                      close()
                    }}
                    className="text-[9px] underline"
                    style={{ color: 'var(--c-primary)' }}
                  >
                    名册 →
                  </button>
                </div>
              </div>
            )}

            {tab === 'facility' && !embedded && (
              <div className="space-y-3">
                {activeSession && (
                  <div className="space-y-2 rounded-xl px-2 py-2" style={{ background: 'rgba(0,0,0,0.12)' }}>
                    <p className="text-[9px] font-medium" style={{ color: 'var(--c-text)' }}>
                      局内调节 · 下一回合立即生效
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {EROTIC_INTENSITY_OPTIONS.map((opt) => {
                        const on = (activeSession.eroticIntensity ?? 'medium') === opt.id
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => void setSessionEroticIntensity(opt.id)}
                            className="rounded-full px-2 py-0.5 text-[9px]"
                            style={{
                              background: on ? 'var(--c-primary)' : 'rgba(255,255,255,0.08)',
                              color: on ? '#fff' : 'var(--c-text-dim)',
                            }}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {EXPLORE_STYLE_OPTIONS.map((opt) => {
                        const on = (activeSession.exploreStyle ?? 'free') === opt.id
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => void setSessionExploreStyle(opt.id)}
                            className="rounded-full px-2 py-0.5 text-[9px]"
                            style={{
                              background: on ? 'var(--c-accent)' : 'rgba(255,255,255,0.08)',
                              color: on ? '#1a3d52' : 'var(--c-text-dim)',
                            }}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[10px]">
                  <Stamp size={12} style={{ color: 'var(--c-accent)' }} />
                  <span style={{ color: 'var(--c-text)' }}>集邮 {stampedTotal}/{total}</span>
                </div>
                {THEME_ZONES.map((zone) => {
                  const list = FACILITIES.filter((f) => f.zone === zone.id)
                  return (
                    <div key={zone.id}>
                      <p className="mb-1 text-[9px]" style={{ color: zone.color }}>
                        {zone.name}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {list.map((f) => {
                          const active = activeFacilityId === f.id
                          const disabled = !regions[f.id]
                          return (
                            <button
                              key={f.id}
                              type="button"
                              disabled={disabled}
                              onClick={() => void enterFacility(f.id)}
                              className="chat-facility-pill rounded-full px-2.5 py-1 text-[9px] font-medium transition-all active:scale-95 disabled:opacity-35"
                              style={{
                                background: active
                                  ? 'var(--c-primary-soft)'
                                  : 'rgba(28, 47, 58, 0.06)',
                                color: active ? 'var(--c-primary)' : 'var(--immerse-ink-dim)',
                                border: active
                                  ? '1px solid rgba(31, 122, 148, 0.45)'
                                  : '1px solid var(--immerse-chrome-border)',
                                boxShadow: active ? '0 2px 8px rgba(31, 122, 148, 0.16)' : undefined,
                              }}
                            >
                              {f.name}
                              {hasStamp(f.id) ? ' ✓' : ''}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
