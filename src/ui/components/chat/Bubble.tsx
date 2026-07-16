import { motion } from 'framer-motion'
import type { ChatMessage } from '@/types'
import { useDataStore } from '@/store/dataStore'
import { useProfileStore } from '@/store/profileStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useSessionStore } from '@/store/sessionStore'
import { characterPlaceholder } from '@/utils/image'
import { stripSpeakerLabelPrefixes } from '@/ai/aiParams'
import { MessageActions } from './MessageActions'
import { NpcStatusBar } from './NpcStatusBar'

const CENTERED_STYLES: Record<
  NonNullable<ChatMessage['bubbleStyle']>,
  { bg: string; color: string; icon?: string; label?: string }
> = {
  default: { bg: 'var(--c-bg-elevated)', color: 'var(--c-text)', icon: '◆' },
  system: { bg: 'var(--c-bg-elevated)', color: 'var(--c-text)', icon: '◆', label: '系统' },
  narrator: {
    bg: 'var(--c-bubble-narrator, var(--c-gold-soft))',
    color: 'var(--c-bubble-narrator-text, var(--c-text))',
    icon: '◎',
    label: '旁白',
  },
  thought: { bg: 'var(--c-accent-soft)', color: 'var(--c-text)', icon: '◇', label: '心声' },
  warning: { bg: 'rgba(224, 90, 106, 0.16)', color: '#c94456', icon: '!', label: '提示' },
  dice: { bg: 'var(--c-gold-soft)', color: 'var(--c-text)', icon: '🎲', label: '判定' },
}

interface BubbleProps {
  message: ChatMessage
  showName: boolean
  onAvatarClick?: (characterId: string) => void
  lockedCharId?: string | null
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export function Bubble({ message, showName, onAvatarClick, lockedCharId }: BubbleProps) {
  const { characters } = useDataStore()
  const { profiles } = useProfileStore()
  const { settings } = useSettingsStore()
  const activeSession = useSessionStore((s) => s.activeSession)
  const isPreview = useSettingsStore((s) => s.settings.ui.characterMode) === 'preview'

  const activeProfile = profiles.find((p) => p.id === settings.ui.activeProfileId)

  const isUser = message.role === 'user'
  const isCharacter = message.role === 'character'
  const isNarrator = message.bubbleStyle === 'narrator'
  const isCentered =
    message.role === 'system' ||
    message.bubbleStyle === 'system' ||
    message.bubbleStyle === 'narrator' ||
    message.bubbleStyle === 'thought' ||
    message.bubbleStyle === 'warning' ||
    message.bubbleStyle === 'dice'

  const character = message.characterId ? characters[message.characterId] : null

  let bubbleBg: string
  let bubbleColor: string
  let icon: string | undefined
  let centerLabel: string | undefined
  if (isCentered) {
    const style = CENTERED_STYLES[message.bubbleStyle ?? 'system']
    bubbleBg = style.bg
    bubbleColor = style.color
    icon = style.icon
    centerLabel = style.label
  } else if (isUser) {
    bubbleBg = 'var(--c-bubble-mine)'
    bubbleColor = '#fff'
  } else {
    bubbleBg = 'var(--c-bubble-her)'
    bubbleColor = 'var(--c-bubble-text)'
  }

  const name = isUser ? (activeProfile?.name ?? '我') : (character?.name ?? '系统')
  const displayText =
    isCharacter || isNarrator
      ? stripSpeakerLabelPrefixes(message.text) || (message.text.trim() ? '……' : '')
      : message.text

  const userAvatarSrc =
    activeProfile?.avatar ||
    (activeProfile ? characterPlaceholder(activeProfile.name, activeProfile.id) : characterPlaceholder('我', 'player'))

  const bubbleShadow = isPreview
    ? '0 6px 22px rgba(0, 0, 0, 0.45)'
    : isUser
      ? '0 6px 20px rgba(168, 74, 74, 0.28), 0 2px 6px rgba(0,0,0,0.1)'
      : isCharacter
        ? '0 6px 18px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(201, 163, 90, 0.12)'
        : isNarrator
          ? '0 4px 16px rgba(201, 163, 90, 0.22), inset 0 1px 0 rgba(255,255,255,0.2)'
          : '0 4px 14px rgba(0, 0, 0, 0.12)'

  const bubbleBorder = isUser
    ? '1px solid rgba(201, 163, 90, 0.45)'
    : isCharacter
      ? '1px solid rgba(201, 163, 90, 0.22)'
      : isNarrator
        ? '1px solid rgba(201, 163, 90, 0.5)'
        : '1px solid rgba(201, 163, 90, 0.18)'

  const dyn = activeSession?.dynamicNpc
  const lastCharMsgId = [...(activeSession?.messages ?? [])]
    .reverse()
    .find((m) => m.role === 'character')?.id
  const showLiveStatus = isCharacter && message.id === lastCharMsgId
  const statusDesire = showLiveStatus
    ? (message.npcDesire ?? dyn?.desire)
    : undefined
  const statusInner = showLiveStatus
    ? (message.npcInnerThought ?? dyn?.innerThought)
    : undefined
  const statusBody = showLiveStatus
    ? (message.npcBodyState ?? dyn?.bodyState)
    : undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`bubble-row flex w-full items-end ${
        isCentered ? 'flex-col items-center' : isUser ? 'flex-row-reverse' : 'flex-row'
      } ${isCharacter ? 'bubble-row--npc' : ''} ${isNarrator ? 'bubble-row--narrator' : ''}`}
    >
      {!isCentered && isUser && (
        <div className="flex flex-col items-end">
          <div className="relative shrink-0">
            <img
              src={userAvatarSrc}
              alt={name}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
              style={{
                border: '1px solid rgba(255,255,255,0.35)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              }}
            />
          </div>
        </div>
      )}

      {!isCentered && isCharacter && showName && (
        <button
          type="button"
          onClick={() => character && onAvatarClick?.(character.id)}
          className="mb-auto mt-1 shrink-0 text-left"
          title={lockedCharId === message.characterId ? '点击解锁背景' : '点击锁定背景立绘'}
        >
          <span
            className="block max-w-[4.5rem] truncate text-[11px] font-medium"
            style={{ color: 'var(--c-primary)' }}
          >
            {name}
            {lockedCharId === message.characterId ? ' 🔒' : ''}
          </span>
        </button>
      )}

      <div
        className={`flex min-w-0 flex-col ${
          isCentered
            ? 'w-[94%] items-center'
            : isUser
              ? 'mr-2.5 max-w-[min(88%,24rem)] items-end'
              : 'ml-1 max-w-[min(92%,26rem)] items-start'
        }`}
      >
        {isUser && message.mentionCharacterId && (
          <span className="mb-1 mr-1 text-[11px]" style={{ color: 'var(--c-primary)' }}>
            @{characters[message.mentionCharacterId]?.name ?? message.mentionCharacterId}
          </span>
        )}

        {isCentered && centerLabel && (
          <span
            className="mb-1 text-[10px] font-medium tracking-wider"
            style={{ color: bubbleColor, opacity: 0.85 }}
          >
            {centerLabel}
          </span>
        )}

        <div
          className={`inline-flex max-w-full flex-col ${isUser ? 'items-end' : 'items-stretch'}`}
        >
          <div
            className={`bubble-body relative px-3.5 py-2 text-[14px] leading-relaxed ${
              isCentered ? 'w-full text-left' : 'w-fit max-w-full'
            } ${isNarrator ? 'bubble-body--narrator' : ''} ${isUser ? 'bubble-body--mine' : ''}`}
            style={{
              fontFamily: 'var(--font-dialogue)',
              color: bubbleColor,
              background: bubbleBg,
              borderRadius: isCentered
                ? 'var(--radius-md)'
                : isUser
                  ? 'var(--radius-md) var(--radius-md) 6px var(--radius-md)'
                  : 'var(--radius-md) var(--radius-md) var(--radius-md) 6px',
              fontSize: isCentered ? 13 : 14,
              boxShadow: bubbleShadow,
              border: bubbleBorder,
            }}
          >
            {icon && isCentered && (
              <span className="mr-1.5 text-xs opacity-70">{icon}</span>
            )}
            <span className="bubble-body__text whitespace-pre-wrap break-words">
              {displayText}
            </span>

            {message.imageUrl && (
              <img
                src={message.imageUrl}
                alt=""
                className="mt-2 max-h-48 w-full rounded-lg object-cover"
              />
            )}
            {message.transfer && (
              <div
                className="mt-2 rounded-lg px-2.5 py-1.5 text-[11px]"
                style={{ background: 'rgba(245,184,92,0.18)', color: 'var(--c-gold)' }}
              >
                💰 转账 {message.transfer.amount} G
                {message.transfer.note ? ` · ${message.transfer.note}` : ''}
              </div>
            )}
            {isCharacter && <MessageActions message={message} />}
          </div>

          <span
            className={`mt-1 text-[9px] ${isUser ? 'self-end' : 'self-start'}`}
            style={{ color: 'var(--c-text-muted)' }}
          >
            {formatTime(message.timestamp)}
          </span>

          {showLiveStatus && (
            <NpcStatusBar
              desire={statusDesire}
              innerThought={statusInner}
              bodyState={statusBody}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}
