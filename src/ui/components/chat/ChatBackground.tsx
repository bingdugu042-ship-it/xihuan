import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDataStore } from '@/store/dataStore'
import { useSessionStore } from '@/store/sessionStore'
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

/** 聊天区域背景：跟随当前说话 NPC 的立绘，带遮罩与淡入淡出 */
export function ChatBackground({ characterId, locked }: ChatBackgroundProps) {
  const { characters } = useDataStore()
  const activeSession = useSessionStore((s) => s.activeSession)

  const sprite = useMemo(() => {
    if (!characterId) return null
    const character = characters[characterId]
    if (!character) return null
    const expression = activeSession
      ? getExpressionForChar(
          activeSession.messages,
          characterId,
          character.defaultExpression,
        )
      : character.defaultExpression
    return { character, expression }
  }, [characterId, characters, activeSession])

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
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <AnimatePresence mode="wait">
        {imgSrc && sprite ? (
          <motion.img
            key={characterId}
            src={imgSrc}
            alt={sprite.character.name}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full object-cover object-top"
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
        ) : null}
      </AnimatePresence>

      {/* 全局色调遮罩，保证文字可读 */}
      <div className="chat-bg-scrim absolute inset-0" />
      {/* 用户自定义聊天背景色（半透明叠层） */}
      <div className="chat-bg-custom-tint absolute inset-0" />
      {/* 底部加重遮罩，避免与气泡/输入区冲突 */}
      <div className="chat-bg-veil absolute inset-0" />

      {locked && (
        <div
          className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}
        >
          <span>🔒</span>
          <span>已锁定</span>
        </div>
      )}
    </div>
  )
}
