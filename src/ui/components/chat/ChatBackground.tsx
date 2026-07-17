import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDataStore } from '@/store/dataStore'
import { useSessionStore } from '@/store/sessionStore'
import { isPresetLeadCharacter } from '@/data/regionalLeads'
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

interface ChatBackgroundProps {
  characterId: string | null
  locked?: boolean
}

/**
 * 聊天背景：预设立绘男主用「透明毛玻璃」露出立绘；
 * 动态 AI NPC 若无立绘则走柔和氛围底。
 */
export function ChatBackground({ characterId, locked }: ChatBackgroundProps) {
  const { characters, runtimeCharacters } = useDataStore()
  const activeSession = useSessionStore((s) => s.activeSession)
  const allChars = useMemo(
    () => ({ ...characters, ...runtimeCharacters }),
    [characters, runtimeCharacters],
  )

  const sprite = useMemo(() => {
    if (!characterId) return null
    const character = allChars[characterId]
    if (!character) return null
    const expression = activeSession
      ? getExpressionForChar(
          activeSession.messages,
          characterId,
          character.defaultExpression,
        )
      : character.defaultExpression
    return { character, expression }
  }, [characterId, allChars, activeSession])

  const isLead = isPresetLeadCharacter(characterId)

  const candidates = useMemo(() => {
    if (!sprite) return []
    return getCharacterImageCandidates(sprite.character, sprite.expression)
  }, [sprite])

  const [srcIndex, setSrcIndex] = useState(0)
  const candidatesKey = candidates.join('|')

  useEffect(() => {
    setSrcIndex(0)
  }, [characterId, sprite?.expression, candidatesKey])

  const imgSrc = useMemo(() => {
    if (!sprite) return null
    return candidates[srcIndex] ?? resolveCharacterPortrait(sprite.character, sprite.expression)
  }, [candidates, srcIndex, sprite])

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden chat-bg-root${
        isLead ? ' chat-bg-root--lead' : ' chat-bg-root--dynamic'
      }`}
    >
      <AnimatePresence mode="wait">
        {imgSrc && sprite ? (
          <motion.img
            key={`${characterId}-${imgSrc}`}
            src={imgSrc}
            alt={sprite.character.name}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={`chat-bg-portrait h-full w-full object-cover object-top${
              isLead ? ' chat-bg-portrait--lead' : ''
            }`}
            draggable={false}
            onError={(e) => {
              const t = e.currentTarget
              const next = srcIndex + 1
              if (next < candidates.length) {
                setSrcIndex(next)
                return
              }
              if (!t.dataset.placeholder) {
                t.dataset.placeholder = '1'
                t.src = characterPlaceholder(sprite.character.name, sprite.character.id)
              }
            }}
          />
        ) : (
          <motion.div
            key="empty-bg"
            className="chat-bg-fallback absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* 毛玻璃雾面：预设立绘更透，动态 NPC 更遮 */}
      <div className="chat-bg-frost absolute inset-0" aria-hidden />
      <div className="chat-bg-scrim absolute inset-0" />
      <div className="chat-bg-custom-tint absolute inset-0" />
      <div className="chat-bg-veil absolute inset-0" />

      {isLead && sprite && (
        <div className="chat-bg-lead-badge">
          <span>域内主角</span>
          <strong>{sprite.character.name}</strong>
        </div>
      )}

      {locked && (
        <div className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-medium"
          style={{ background: 'rgba(0,0,0,0.45)', color: '#fff8ee' }}
        >
          已锁定立绘
        </div>
      )}
    </div>
  )
}
