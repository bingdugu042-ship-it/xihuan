import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useDataStore } from '@/store/dataStore'
import { useSessionStore } from '@/store/sessionStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'
import {
  getCharacterImageCandidates,
  resolveCharacterPortrait,
  characterPlaceholder,
} from '@/utils/image'

function getExpressionForChar(
  messages: { role: string; characterId?: string; expression?: string }[],
  charId: string,
  defaultExpression: string,
): string {
  const lastMsg = [...messages]
    .reverse()
    .find((m) => m.role === 'character' && m.characterId === charId)
  return lastMsg?.expression ?? defaultExpression
}

/** 纯立绘背景：谁发言显示谁（群聊/私聊统一单立绘切换） */
export function CharacterStage() {
  const { characters } = useDataStore()
  const { activeSession } = useSessionStore()
  const { settings } = useSettingsStore()
  const replyTargetCharacterId = useUIStore((s) => s.replyTargetCharacterId)
  const mode = settings.ui.characterMode

  const isGroup = activeSession?.type === 'group'

  const focusedCharId = useMemo(() => {
    if (!activeSession) return null
    const { participantIds, messages } = activeSession

    if (replyTargetCharacterId && participantIds.includes(replyTargetCharacterId)) {
      return replyTargetCharacterId
    }

    const lastCharMsg = [...messages]
      .reverse()
      .find(
        (m) =>
          m.role === 'character' &&
          m.characterId &&
          participantIds.includes(m.characterId),
      )
    if (lastCharMsg?.characterId) return lastCharMsg.characterId

    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (
      lastUser?.mentionCharacterId &&
      participantIds.includes(lastUser.mentionCharacterId)
    ) {
      return lastUser.mentionCharacterId
    }

    if (!isGroup && participantIds[0]) return participantIds[0]
    return null
  }, [activeSession, replyTargetCharacterId, isGroup])

  const sprite = useMemo(() => {
    if (!activeSession || !focusedCharId) return null
    const character = characters[focusedCharId]
    if (!character) return null
    const expression = getExpressionForChar(
      activeSession.messages,
      focusedCharId,
      character.defaultExpression,
    )
    return { character, expression }
  }, [activeSession, focusedCharId, characters])

  const candidates = useMemo(() => {
    if (!sprite) return []
    return getCharacterImageCandidates(sprite.character, sprite.expression)
  }, [sprite])

  const [srcIndex, setSrcIndex] = useState(0)

  useEffect(() => {
    setSrcIndex(0)
  }, [focusedCharId, sprite?.expression, candidates.join('|')])

  const imgSrc =
    candidates[srcIndex] ??
    (sprite ? resolveCharacterPortrait(sprite.character, sprite.expression) : null)

  if (!activeSession) {
    return (
      <div className="absolute inset-0" style={{ background: 'var(--bg-gradient)' }} aria-hidden />
    )
  }

  if (!sprite || !imgSrc) {
    return (
      <div className="absolute inset-0" style={{ background: 'var(--bg-gradient)' }} aria-hidden />
    )
  }

  const { character, expression } = sprite

  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const t = e.currentTarget
    const next = srcIndex + 1
    if (next < candidates.length) {
      setSrcIndex(next)
      return
    }
    if (!t.dataset.placeholder) {
      t.dataset.placeholder = '1'
      t.src = characterPlaceholder(character.name, character.id)
    }
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.img
          key={`${character.id}-${expression}-${srcIndex}`}
          src={imgSrc}
          alt={character.name}
          className="absolute inset-0 h-full w-full object-cover object-top float-soft"
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          draggable={false}
          onError={onImgError}
        />
      </AnimatePresence>

      {mode === 'chat' && <div className="character-fade-mask pointer-events-none absolute inset-0" />}

      {mode === 'preview' && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.18) 100%)' }}
        />
      )}
    </div>
  )
}
