import { useEffect, useMemo, useState } from 'react'
import { ImagePlus, RefreshCw, Sparkles } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useSessionStore } from '@/store/sessionStore'
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

/** 右侧栏 · 男主立绘区 */
export function ChatPortraitPanel() {
  const { characters } = useDataStore()
  const activeSession = useSessionStore((s) => s.activeSession)
  const replyTargetCharacterId = useUIStore((s) => s.replyTargetCharacterId)
  const setActiveTab = useUIStore((s) => s.setActiveTab)

  const focusedCharId = useMemo(() => {
    if (!activeSession) return null
    const { participantIds, messages } = activeSession
    if (replyTargetCharacterId && participantIds.includes(replyTargetCharacterId)) {
      return replyTargetCharacterId
    }
    const lastCharMsg = [...messages]
      .reverse()
      .find((m) => m.role === 'character' && m.characterId && participantIds.includes(m.characterId))
    if (lastCharMsg?.characterId) return lastCharMsg.characterId
    if (participantIds[0]) return participantIds[0]
    return null
  }, [activeSession, replyTargetCharacterId])

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

  const cyclePortrait = () => {
    if (candidates.length > 1) {
      setSrcIndex((i) => (i + 1) % candidates.length)
    }
  }

  if (!activeSession) {
    return (
      <div
        className="chat-portrait-panel flex aspect-[3/4] items-center justify-center rounded-lg text-[10px]"
        style={{ background: 'var(--c-bg-soft)', color: 'var(--c-text-dim)' }}
      >
        暂无男主
      </div>
    )
  }

  const name = activeSession.dynamicNpc?.displayName ?? sprite?.character.name ?? '男主'

  return (
    <div className="chat-portrait-panel space-y-2">
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-lg"
        style={{ border: '1px solid var(--c-glass-border)', background: 'var(--c-bg-soft)' }}
      >
        {imgSrc && sprite ? (
          <img
            src={imgSrc}
            alt={name}
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
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-2 text-center text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
            <Sparkles size={20} style={{ color: 'var(--c-accent)' }} />
            <span>{name}</span>
            <span className="opacity-70">动态男主 · 立绘待生成</span>
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.55))' }}
        />
        <p className="absolute bottom-2 left-2 right-2 truncate text-[10px] font-medium" style={{ color: '#fff' }}>
          {name}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab('tavern')
            useUIStore.getState().setTavernSubView('photo_stone')
          }}
          className="chat-portrait-btn flex flex-col items-center gap-0.5 rounded-lg py-2 text-[9px]"
          style={{ background: 'var(--c-bg-soft)', color: 'var(--c-text-dim)', border: '1px solid var(--c-border)' }}
        >
          <Sparkles size={14} style={{ color: 'var(--c-accent)' }} />
          留影石
        </button>
        <button
          type="button"
          onClick={cyclePortrait}
          className="chat-portrait-btn flex flex-col items-center gap-0.5 rounded-lg py-2 text-[9px]"
          style={{ background: 'var(--c-bg-soft)', color: 'var(--c-text-dim)', border: '1px solid var(--c-border)' }}
        >
          <RefreshCw size={14} style={{ color: 'var(--c-primary)' }} />
          刷图
        </button>
        <button
          type="button"
          onClick={() => useUIStore.getState().setImagePickerOpen(true, 'image')}
          className="chat-portrait-btn flex flex-col items-center gap-0.5 rounded-lg py-2 text-[9px]"
          style={{ background: 'var(--c-bg-soft)', color: 'var(--c-text-dim)', border: '1px solid var(--c-border)' }}
        >
          <ImagePlus size={14} style={{ color: 'var(--c-primary)' }} />
          换图
        </button>
      </div>
    </div>
  )
}
