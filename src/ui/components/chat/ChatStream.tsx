import { useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useDataStore } from '@/store/dataStore'
import { Bubble } from './Bubble'
import { ChoiceBar } from './ChoiceBar'

function formatDivider(ts: number) {
  const now = new Date()
  const d = new Date(ts)
  const isToday = d.toDateString() === now.toDateString()
  const isYesterday = new Date(now.getTime() - 86400000).toDateString() === d.toDateString()
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `今天 ${time}`
  if (isYesterday) return `昨天 ${time}`
  return d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function shouldShowDivider(prev: number, curr: number) {
  return curr - prev > 5 * 60 * 1000
}

interface ChatStreamProps {
  onAvatarClick?: (characterId: string) => void
  lockedCharId?: string | null
}

export function ChatStream({ onAvatarClick, lockedCharId }: ChatStreamProps) {
  const { activeSession, aiReplying } = useSessionStore()
  const mode = useSettingsStore((s) => s.settings.ui.characterMode)
  const { characters } = useDataStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [activeSession?.messages.length, aiReplying])

  const typingCharacter = useMemo(() => {
    if (!activeSession || !aiReplying) return null
    const msgs = activeSession.messages
    const last = msgs[msgs.length - 1]
    if (last?.role === 'character' && last.characterId) {
      return characters[last.characterId]
    }
    return characters[activeSession.participantIds[0]]
  }, [activeSession, aiReplying, characters])

  if (!activeSession) {
    return (
      <div className="relative z-10 flex flex-1 items-end justify-center px-6 pb-6">
        <div
          className="max-w-[280px] px-5 py-4 text-center"
          style={{
            background: 'var(--c-glass)',
            border: '1px solid var(--c-glass-border)',
            borderRadius: 'var(--radius-lg)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
            还没有对话
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
            点左上角菜单新建，或去「世界」选地点
          </p>
        </div>
      </div>
    )
  }

  const isGroup = activeSession.type === 'group'
  const lastMsg = activeSession.messages[activeSession.messages.length - 1]
  const hasChoices = lastMsg?.role === 'character' && (lastMsg.choices?.length ?? 0) > 0
  const isInterruptTyping = aiReplying && isGroup && lastMsg?.role === 'character'

  return (
    <div
      ref={scrollRef}
      className={`no-scrollbar relative z-10 flex-1 overflow-y-auto px-3 py-4 ${mode === 'preview' ? 'chat-stream--preview' : ''}`}
      style={{ paddingBottom: hasChoices ? 0 : 8 }}
    >
      <div className="flex flex-col gap-4">
        {activeSession.messages.length === 0 ? (
          <div className="mt-12 text-center">
            <div
              className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: 'var(--c-primary-soft)' }}
            >
              <span className="text-2xl">✦</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--c-text-dim)' }}>
              说点什么开始这段故事吧
            </p>
          </div>
        ) : (
          activeSession.messages.map((m, i) => {
            const prev = activeSession.messages[i - 1]
            const showDivider = !prev || shouldShowDivider(prev.timestamp, m.timestamp)
            return (
              <div key={m.id} className="flex flex-col gap-4">
                {showDivider && (
                  <div className="flex items-center justify-center gap-3 py-1">
                    <div className="h-px flex-1" style={{ background: 'var(--c-divider)' }} />
                    <span className="text-[10px]" style={{ color: 'var(--c-text-muted)' }}>
                      {formatDivider(m.timestamp)}
                    </span>
                    <div className="h-px flex-1" style={{ background: 'var(--c-divider)' }} />
                  </div>
                )}
                <Bubble
                  message={m}
                  showName={isGroup || m.role === 'character'}
                  onAvatarClick={onAvatarClick}
                  lockedCharId={lockedCharId}
                />
              </div>
            )
          })
        )}

        {aiReplying && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full items-end gap-2"
          >
            {isGroup && typingCharacter && (
              <span className="mb-1 text-[11px] font-medium" style={{ color: 'var(--c-primary)' }}>
                {typingCharacter.name}
              </span>
            )}
            <div
              className="flex items-center gap-1 px-3.5 py-2.5"
              style={{
                background: 'var(--c-bubble-her)',
                borderRadius: 'var(--radius-md) var(--radius-md) var(--radius-md) 6px',
                border: '1px solid rgba(42,158,196,0.12)',
              }}
            >
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ color: 'var(--c-text-dim)' }} />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.15s]"
                style={{ color: 'var(--c-text-dim)' }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.3s]"
                style={{ color: 'var(--c-text-dim)' }}
              />
              <span className="ml-1 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
                {isInterruptTyping ? '有人抢话中…' : '正在输入…'}
              </span>
            </div>
          </motion.div>
        )}
      </div>
      {hasChoices && <ChoiceBar choices={lastMsg.choices!} />}
    </div>
  )
}
