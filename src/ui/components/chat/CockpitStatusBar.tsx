import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  BookOpen,
  Compass,
  Dices,
  Flame,
  MapPin,
  User,
  Users,
  X,
} from 'lucide-react'
import { FACILITY_MAP } from '@/data/facilities'
import { useDataStore } from '@/store/dataStore'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore, type ImmersionMode } from '@/store/uiStore'
import { useMobileKeyboardInset } from '@/hooks/useMobileKeyboardInset'
import { buildFocusNpcView, resolveFocusCharacterId } from '@/utils/focusNpc'
import { GuideProgressBar } from './GuideProgressBar'
import { PartyStrip } from './PartyStrip'
import { NpcStatusBar } from './NpcStatusBar'
import type { DeckTab } from './ChatTopStatusDeck'

interface Props {
  deckTab: DeckTab
  onDeckTabChange: (tab: DeckTab) => void
  embedded?: boolean
}

/** 沉浸驾驶舱：模式 + 地点 + 在场男主 + 焦点关系 + 折叠芯片 */
export function CockpitStatusBar({ deckTab, onDeckTabChange, embedded }: Props) {
  const activeSession = useSessionStore((s) => s.activeSession)
  const immersionMode = useUIStore((s) => s.immersionMode)
  const setImmersionMode = useUIStore((s) => s.setImmersionMode)
  const replyTarget = useUIStore((s) => s.replyTargetCharacterId)
  const { keyboardOpen } = useMobileKeyboardInset()
  const staticChars = useDataStore((s) => s.characters)
  const runtimeChars = useDataStore((s) => s.runtimeCharacters)
  const characters = useMemo(
    () => ({ ...staticChars, ...runtimeChars }),
    [staticChars, runtimeChars],
  )
  const [bodyOpen, setBodyOpen] = useState(false)

  if (!activeSession) return null

  const facility = FACILITY_MAP[activeSession.regionId]
  const place = facility?.name ?? activeSession.title ?? '未知地点'
  const focusId = resolveFocusCharacterId(activeSession, replyTarget)
  const focusView = buildFocusNpcView(activeSession, focusId, characters)
  const rel = focusId ? activeSession.relationships[focusId] : null
  const dyn = focusView?.dyn
  const partyN = activeSession.participantIds.length
  const focusName = focusView?.name ?? '—'

  const setMode = (mode: ImmersionMode) => setImmersionMode(mode)
  const toggleDeck = (t: Exclude<DeckTab, null>) => onDeckTabChange(deckTab === t ? null : t)

  const openNpcBody = () => {
    if (!focusView) {
      onDeckTabChange('npc')
      return
    }
    setBodyOpen(true)
  }

  if (keyboardOpen) {
    return (
      <div className="cockpit-status cockpit-status--compact no-scrollbar">
        <div className="cockpit-status__compact-row">
          <span className="cockpit-status__place">{place}</span>
          <span className="cockpit-status__compact-sep">·</span>
          <span className="cockpit-status__compact-name">{focusName}</span>
          {rel && (
            <>
              <span className="cockpit-status__compact-sep">·</span>
              <span className="cockpit-status__compact-favor">
                <Flame size={10} /> {rel.favor}
              </span>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="cockpit-status no-scrollbar">
        <div className="cockpit-status__top">
          <div className="cockpit-status__modes">
            <button
              type="button"
              className={`cockpit-status__mode${immersionMode === 'narrative' ? ' is-active' : ''}`}
              onClick={() => setMode('narrative')}
            >
              <BookOpen size={12} /> 叙事台
            </button>
            <button
              type="button"
              className={`cockpit-status__mode${immersionMode === 'explore' ? ' is-active' : ''}`}
              onClick={() => setMode('explore')}
            >
              <Compass size={12} /> 探索厅
            </button>
          </div>
          <div className="cockpit-status__row">
            <span className="cockpit-status__place">{place}</span>
            <span className="cockpit-status__meta">
              <Users size={11} /> {partyN}人
              {activeSession.playMode ? ` · ${activeSession.playMode}` : ''}
            </span>
          </div>
        </div>

        <PartyStrip embedded />

        {focusView && (
          <div className="cockpit-status__npc">
            <span className="cockpit-status__npc-name">
              {focusName}
              {dyn ? ` · ${dyn.corruptionStage}` : partyN > 1 ? ' · 焦点' : ''}
            </span>
            <div className="cockpit-status__meters">
              {rel && (
                <>
                  <span>
                    <Flame size={10} /> 好感 {rel.favor}
                  </span>
                  <span>信任 {rel.trust}</span>
                  <span>依赖 {rel.dependence}</span>
                </>
              )}
              {dyn && (
                <>
                  <span>堕落 {dyn.corruption}%</span>
                  <span>关注 {dyn.attention}%</span>
                </>
              )}
            </div>
          </div>
        )}

        {immersionMode === 'narrative' && <GuideProgressBar />}
        {immersionMode === 'explore' && (
          <p className="cockpit-status__hint">
            <Dices size={10} /> 自由探索：投骰 / 用药 / 开战可从下方行动坞或加号进入
          </p>
        )}

        <div className="cockpit-status__chips">
          <button
            type="button"
            className={`cockpit-chip${deckTab === 'player' ? ' is-active' : ''}`}
            onClick={() => toggleDeck('player')}
          >
            <User size={12} /> 旅者
          </button>
          <button type="button" className="cockpit-chip" onClick={openNpcBody}>
            <Activity size={12} /> 身体
          </button>
          {partyN > 0 && (
            <button
              type="button"
              className={`cockpit-chip${deckTab === 'npc' ? ' is-active' : ''}`}
              onClick={() => toggleDeck('npc')}
            >
              <Flame size={12} /> 角色
            </button>
          )}
          {!embedded && (
            <button
              type="button"
              className={`cockpit-chip${deckTab === 'facility' ? ' is-active' : ''}`}
              onClick={() => toggleDeck('facility')}
            >
              <MapPin size={12} /> 玩法
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {bodyOpen && focusView && (
          <motion.div
            className="npc-body-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBodyOpen(false)}
          >
            <motion.div
              className="npc-body-modal__panel"
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <header className="npc-body-modal__head">
                <h3>{focusView.name} · 身体状态</h3>
                <button type="button" onClick={() => setBodyOpen(false)} aria-label="关闭">
                  <X size={16} />
                </button>
              </header>
              {dyn && (
                <p className="npc-body-modal__meta">
                  {dyn.gender} · {dyn.ageFeel} · {dyn.bodyType}
                </p>
              )}
              <NpcStatusBar
                variant="panel"
                desire={focusView.desire}
                innerThought={focusView.innerThought}
                bodyState={focusView.bodyState}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
