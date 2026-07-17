import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Compass, Sparkles, X } from 'lucide-react'
import { FACILITY_MAP, THEME_ZONES } from '@/data/facilities'
import { getFacilityLore } from '@/data/facilityLore'
import { getFacilityWorldbook } from '@/data/facilityWorldbook'
import { facilityAssetPath } from '@/data/facilityHandbook'
import { resolveIdentityRoles } from '@/data/identityRoles'
import { getLeadIdsForFacility } from '@/data/regionalLeads'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { useDataStore } from '@/store/dataStore'
import { usePassportStore } from '@/store/passportStore'
import { getCharacterImageCandidates, characterPlaceholder } from '@/utils/image'
import type { FacilityDef } from '@/data/facilities'

interface FacilityPlayPageProps {
  facility?: FacilityDef | null
  onClose?: () => void
}

/** 冒险域玩法页 · 身份/玩法 或 自由游玩入域 */
export function FacilityPlayPage({ facility: propFacility, onClose }: FacilityPlayPageProps = {}) {
  const {
    facilityPlayPageOpen,
    facilityPageStage,
    selectedFacilityId,
    selectedIdentityId,
    closeFacilityPlayPage,
    setFacilityPageStage,
    setSelectedIdentityId,
    setActiveTab,
  } = useUIStore()
  const createSession = useSessionStore((s) => s.createSession)
  const { regions, characters, runtimeCharacters } = useDataStore()
  const hasStamp = usePassportStore((s) => s.hasStamp)

  const facility = useMemo(
    () => propFacility ?? (selectedFacilityId ? FACILITY_MAP[selectedFacilityId] : null),
    [propFacility, selectedFacilityId],
  )

  const [tearing, setTearing] = useState(false)
  const [selectedPlayMode, setSelectedPlayMode] = useState<string | null>(null)

  const allChars = useMemo(
    () => ({ ...characters, ...runtimeCharacters }),
    [characters, runtimeCharacters],
  )

  const leadChars = useMemo(() => {
    if (!facility) return []
    return getLeadIdsForFacility(facility.id)
      .map((id) => allChars[id])
      .filter(Boolean)
  }, [facility, allChars])

  const counterpartHint = useMemo(() => {
    if (!facility || !selectedIdentityId) return null
    const roles = resolveIdentityRoles(facility.id, selectedIdentityId)
    if (!roles) return null
    return `你将以「${roles.player.name}」入域；对面男主扮演「${roles.npc.name}」`
  }, [facility, selectedIdentityId])

  if (!facility) return null
  if (!propFacility && !facilityPlayPageOpen) return null

  const zone = THEME_ZONES.find((z) => z.id === facility.zone)!
  const stamped = hasStamp(facility.id)
  const lore = getFacilityLore(facility.id)
  const worldbook = getFacilityWorldbook(facility.id)
  const modes = worldbook?.playModes ?? lore.modes.map((m) => ({ title: m.title, description: m.desc }))
  const modeList = modes.map((m) => m.title)

  const enter = async (opts?: { freeRoam?: boolean }) => {
    const region = regions[facility.id]
    if (!region) return
    const freeRoam = Boolean(opts?.freeRoam)
    setFacilityPageStage('entering')
    setTearing(true)
    await new Promise((r) => setTimeout(r, 600))
    const { buildFreeRoamParticipants, buildGuidedParticipants, freeRoamSessionTitle } = await import('@/utils/freeRoamParty')
    const pids = freeRoam
      ? buildFreeRoamParticipants(facility.id)
      : buildGuidedParticipants(facility.id)
    await createSession({
      regionId: facility.id,
      participantIds: pids,
      type: freeRoam ? (pids.length > 1 ? 'group' : 'private') : region.type ?? 'private',
      title: freeRoam ? freeRoamSessionTitle(facility.id) : facility.name,
      withIntro: true,
      playerIdentityId: freeRoam ? undefined : selectedIdentityId ?? facility.identities[0]?.id,
      playMode: freeRoam ? '自由游玩' : selectedPlayMode ?? modeList[0] ?? undefined,
      exploreStyle: freeRoam ? 'free' : selectedPlayMode ? 'guided' : 'free',
    })
    useUIStore.getState().setImmersionMode(freeRoam ? 'explore' : 'narrative')
    setTearing(false)
    setFacilityPageStage('overview')
    setSelectedPlayMode(null)
    onClose?.()
    closeFacilityPlayPage()
    setActiveTab('chat')
  }

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    onClose?.()
    if (!propFacility) closeFacilityPlayPage()
  }

  const card = (
    <div className={`facility-play-card ${tearing ? 'facility-play-card--tearing' : ''}`}>
      <div className="facility-play-card__scroll no-scrollbar">
        <div className="facility-play-card__handle" aria-hidden />
        <div className="facility-play-card__header">
          <div className="facility-play-card__title">
            <div className="facility-play-card__meta">
              <span className="facility-play-card__no">#{String(facility.no).padStart(2, '0')}</span>
              {stamped && (
                <span className="facility-play-card__stamped">
                  <Sparkles size={10} /> 已契约 · 仍可继续玩
                </span>
              )}
            </div>
            <h3 className="facility-play-card__name">{facility.name}</h3>
          </div>
          <button
            type="button"
            className="facility-play-card__close"
            onClick={handleClose}
            aria-label="返回"
          >
            <X size={16} />
          </button>
        </div>

        <span
          className="facility-play-card__zone"
          style={{ background: zone.color + '1a', color: zone.color }}
        >
          {zone.name}
        </span>

        {leadChars.length > 0 && (
          <div className="facility-play-card__leads">
            <p className="facility-play-card__section-label">域内主角 · 预设立绘</p>
            <p className="facility-play-card__leads-hint">
              固定驻场；聊天背景为透明毛玻璃，能透出立绘。其余空位由 AI 动态生成。
            </p>
            <div className="facility-play-card__leads-row">
              {leadChars.map((c) => {
                const src =
                  getCharacterImageCandidates(c)[0] ?? characterPlaceholder(c.name, c.id)
                return (
                  <div key={c.id} className="facility-play-card__lead">
                    <img src={src} alt="" />
                    <div>
                      <strong>{c.name}</strong>
                      <span>{c.title}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="facility-play-card__lore">
          <div className="facility-play-card__lore-thumb">
            <img
              src={facilityAssetPath(facility.id, 'scene')}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
          <p className="facility-play-card__lore-scene">{lore.scene}</p>
          <p className="facility-play-card__lore-seal">
            <Sparkles size={10} /> 契约方式：{lore.seal}
          </p>
        </div>

        <div className="facility-play-card__free-block">
          <p className="facility-play-card__section-label">自由游玩</p>
          <p className="facility-play-card__free-desc">
            不选身份、不做强制检定。直接接入 AI，在大世界里随便走、随便聊；好感与成就会同步到酒馆与图鉴。
          </p>
          <button
            type="button"
            className="facility-play-card__free-btn"
            disabled={facilityPageStage === 'entering'}
            onClick={(e) => {
              e.stopPropagation()
              void enter({ freeRoam: true })
            }}
          >
            <Compass size={14} />
            自由游玩 · 接入 AI
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="facility-play-card__mode-block">
          <p className="facility-play-card__section-label">或选择玩法（可选）</p>
          <div className="facility-play-card__lore-modes">
            {modes.map((m) => {
              const selected = selectedPlayMode === m.title
              return (
                <button
                  key={m.title}
                  type="button"
                  className={`facility-play-card__lore-mode facility-play-card__lore-mode--pick ${selected ? 'facility-play-card__lore-mode--selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedPlayMode(m.title)
                  }}
                >
                  <strong>{m.title}</strong>
                  <span>{m.description}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="facility-play-card__identities">
          <p className="facility-play-card__section-label">选择你的身份（玩法入域时）</p>
          {facility.identities.map((identity) => {
            const selected = selectedIdentityId === identity.id
            const roles = resolveIdentityRoles(facility.id, identity.id)
            return (
              <button
                key={identity.id}
                type="button"
                className={`facility-play-card__identity ${selected ? 'facility-play-card__identity--selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedIdentityId(identity.id)
                }}
              >
                <span className="facility-play-card__identity-name">{identity.name}</span>
                <p className="facility-play-card__identity-desc">{identity.description}</p>
                {roles && (
                  <p className="facility-play-card__identity-npc">
                    对面将是：{roles.npc.name}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="facility-play-card__footer">
        {counterpartHint && (
          <p className="facility-play-card__footer-hint">{counterpartHint}</p>
        )}
        <button
          type="button"
          className="facility-play-card__enter"
          disabled={facilityPageStage === 'entering'}
          onClick={(e) => {
            e.stopPropagation()
            void enter({ freeRoam: !selectedIdentityId && !selectedPlayMode })
          }}
        >
          {facilityPageStage === 'entering'
            ? '检票中…'
            : selectedPlayMode
              ? `进入 · ${selectedPlayMode}`
              : selectedIdentityId
                ? '踏入域界'
                : '自由游玩 · 直接进入'}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )

  if (propFacility) return card

  return (
    <AnimatePresence>
      {facilityPlayPageOpen && (
        <>
          <motion.div
            key="facility-play-backdrop"
            className="facility-play-page__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            key="facility-play-sheet"
            className="facility-play-page__sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            onClick={(e) => e.stopPropagation()}
          >
            {card}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
