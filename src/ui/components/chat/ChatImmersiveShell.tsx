import { useEffect, useMemo, useState } from 'react'
import { ChatTopStatusDeck, type DeckTab } from './ChatTopStatusDeck'
import { ChatStream } from './ChatStream'
import { Composer } from './Composer'
import { ChatBackground } from './ChatBackground'
import { ChatAiErrorBar } from './ChatAiErrorBar'
import { CockpitStatusBar } from './CockpitStatusBar'
import { ActionDock } from './ActionDock'
import { CombatOverlay } from './CombatOverlay'
import { Header } from './Header'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { useMobileKeyboardInset } from '@/hooks/useMobileKeyboardInset'

interface Props {
  isPreview?: boolean
  embedded?: boolean
}

/** 沉浸驾驶舱：叙事台 / 探索厅双模式 */
export function ChatImmersiveShell({ isPreview, embedded }: Props) {
  const [deckTab, setDeckTab] = useState<DeckTab>(null)
  const [lockedCharId, setLockedCharId] = useState<string | null>(null)
  const activeSession = useSessionStore((s) => s.activeSession)
  const replyTargetCharacterId = useUIStore((s) => s.replyTargetCharacterId)
  const setImmersionMode = useUIStore((s) => s.setImmersionMode)
  const actionSheet = useUIStore((s) => s.actionSheet)
  const { keyboardOpen } = useMobileKeyboardInset()

  useEffect(() => {
    if (!activeSession) return
    const free =
      activeSession.playMode === '自由游玩' || (activeSession.exploreStyle ?? 'free') === 'free'
    const guided = activeSession.exploreStyle === 'guided'
    if (guided || (activeSession.playMode && activeSession.playMode !== '自由游玩')) {
      setImmersionMode('narrative')
    } else if (free) {
      setImmersionMode('explore')
    }
  }, [activeSession?.id, activeSession?.playMode, activeSession?.exploreStyle, setImmersionMode])

  useEffect(() => {
    if (keyboardOpen) setDeckTab(null)
  }, [keyboardOpen])

  const currentCharId = useMemo(() => {
    if (!activeSession) return null
    const { participantIds, messages } = activeSession
    if (replyTargetCharacterId && participantIds.includes(replyTargetCharacterId)) {
      return replyTargetCharacterId
    }
    const lastCharMsg = [...messages]
      .reverse()
      .find((m) => m.role === 'character' && m.characterId && participantIds.includes(m.characterId))
    return lastCharMsg?.characterId ?? participantIds[0] ?? null
  }, [activeSession, replyTargetCharacterId])

  const backgroundCharId = lockedCharId ?? currentCharId

  const handleAvatarClick = (charId: string) => {
    setLockedCharId((prev) => (prev === charId ? null : charId))
    useUIStore.getState().setReplyTargetCharacterId(charId)
  }

  const composerPlusOpen = useUIStore((s) => s.composerPlusOpen)
  const showActionDock = (!keyboardOpen || Boolean(actionSheet)) && !composerPlusOpen

  return (
    <div
      className={`chat-immersive cockpit relative flex h-full min-h-0 w-full flex-col${composerPlusOpen ? ' chat-immersive--plus-open' : ''}`}
    >
      <ChatBackground characterId={backgroundCharId} locked={!!lockedCharId} />

      {!embedded && <Header currentCharacterId={currentCharId} />}

      {!isPreview && (
        <div className="cockpit-chrome relative z-20 shrink-0">
          <CockpitStatusBar
            deckTab={deckTab}
            onDeckTabChange={setDeckTab}
            embedded={embedded}
          />
          <ChatTopStatusDeck
            embedded={embedded}
            tab={deckTab}
            onTabChange={setDeckTab}
            overlayOnly
          />
        </div>
      )}

      {!isPreview && <ChatAiErrorBar />}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {deckTab && (
          <button
            type="button"
            className="chat-top-deck__backdrop absolute inset-0 z-10"
            aria-label="收起状态面板"
            onClick={() => setDeckTab(null)}
          />
        )}
        <ChatStream onAvatarClick={handleAvatarClick} lockedCharId={lockedCharId} />
      </div>

      {!isPreview && showActionDock && <ActionDock />}
      {!isPreview && <Composer />}
      {!isPreview && <CombatOverlay />}
    </div>
  )
}
