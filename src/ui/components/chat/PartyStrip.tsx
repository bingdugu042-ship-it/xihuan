import { useMemo, useState } from 'react'
import { ChevronDown, Users } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { getCharacterImageCandidates, characterPlaceholder } from '@/utils/image'
import { getNpcSnapshot, resolveFocusCharacterId } from '@/utils/focusNpc'
import { isPresetLeadCharacter } from '@/data/regionalLeads'

interface Props {
  /** 嵌在驾驶舱卡内，去掉独立底边条 */
  embedded?: boolean
  /** 由外层（驾驶舱）统一折叠时隐藏本条开关 */
  hideToggle?: boolean
}

/** 在场男主折叠条：新 NPC 入场即多一枚芯片，点击切换焦点 */
export function PartyStrip({ embedded, hideToggle }: Props) {
  const activeSession = useSessionStore((s) => s.activeSession)
  const replyTarget = useUIStore((s) => s.replyTargetCharacterId)
  const focusParticipant = useSessionStore((s) => s.focusParticipant)
  const staticChars = useDataStore((s) => s.characters)
  const runtimeChars = useDataStore((s) => s.runtimeCharacters)
  const characters = useMemo(
    () => ({ ...staticChars, ...runtimeChars }),
    [staticChars, runtimeChars],
  )
  const [collapsed, setCollapsed] = useState(false)

  if (!activeSession || activeSession.participantIds.length === 0) return null

  const focusId = resolveFocusCharacterId(activeSession, replyTarget)
  const n = activeSession.participantIds.length
  const showChips = hideToggle || !collapsed

  return (
    <div
      className={`party-strip no-scrollbar${embedded ? ' party-strip--embedded' : ''}`}
      role="group"
      aria-label="在场男主"
    >
      {!hideToggle && (
        <button
          type="button"
          className="party-strip__toggle"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
        >
          <Users size={12} />
          <span>在场 {n}</span>
          <ChevronDown
            size={12}
            className={`party-strip__chev${collapsed ? ' is-collapsed' : ''}`}
          />
        </button>
      )}

      {showChips &&
        activeSession.participantIds.map((id) => {
          const c = characters[id]
          const snap = getNpcSnapshot(activeSession, id)
          const name = snap?.displayName ?? c?.name ?? id
          const src = c
            ? (getCharacterImageCandidates(c)[0] ?? characterPlaceholder(name, id))
            : characterPlaceholder(name, id)
          const active = focusId === id
          const rel = activeSession.relationships[id]
          const isLead = isPresetLeadCharacter(id)
          return (
            <button
              key={id}
              type="button"
              role="listitem"
              className={`party-strip__chip${active ? ' is-active' : ''}${isLead ? ' party-strip__chip--lead' : ''}`}
              onClick={() => void focusParticipant(id)}
              title={isLead ? `域内主角 · @${name}` : `查看 / @${name}`}
            >
              <img src={src} alt="" className="party-strip__avatar" />
              <span className="party-strip__name">{name}</span>
              {isLead && <span className="party-strip__lead">主角</span>}
              {rel && <span className="party-strip__favor">{rel.favor}</span>}
            </button>
          )
        })}
    </div>
  )
}
