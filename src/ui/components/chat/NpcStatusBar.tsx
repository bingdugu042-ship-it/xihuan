import { motion } from 'framer-motion'

interface StatusRowProps {
  label: string
  text?: string
  accent: string
  soft: string
}

function StatusRow({ label, text, accent, soft }: StatusRowProps) {
  const content = (text ?? '').trim() || '—'
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="npc-status-row"
      style={{
        background: soft,
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <span className="npc-status-row__label" style={{ color: accent }}>
        {label}
      </span>
      <p className="npc-status-row__text" style={{ color: 'var(--c-bubble-text, var(--c-text))' }}>
        {content}
      </p>
    </motion.div>
  )
}

interface NpcStatusBarProps {
  desire?: string
  innerThought?: string
  bodyState?: string
  /** bubble：气泡下；panel：顶栏/侧栏展开 */
  variant?: 'bubble' | 'panel'
}

/** NPC 欲望 / 内心 / 身体 · 标签在上、全文换行，不再截断 */
export function NpcStatusBar({
  desire,
  innerThought,
  bodyState,
  variant = 'bubble',
}: NpcStatusBarProps) {
  const hasAny = Boolean(desire?.trim() || innerThought?.trim() || bodyState?.trim())
  if (!hasAny) return null

  return (
    <div
      className={`npc-status-bar npc-status-bar--${variant}`}
      role="group"
      aria-label="男主状态"
    >
      <StatusRow
        label="欲望"
        text={desire}
        accent="var(--c-accent)"
        soft="var(--c-accent-soft)"
      />
      <StatusRow
        label="内心"
        text={innerThought}
        accent="var(--c-primary)"
        soft="var(--c-primary-soft)"
      />
      <StatusRow
        label="身体"
        text={bodyState}
        accent="var(--c-gold)"
        soft="var(--c-gold-soft)"
      />
    </div>
  )
}
