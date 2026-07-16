import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import type { CharacterCard as CharacterCardType } from '@/types'
import { resolveCharacterPortrait, normalizeAssetPath, characterPlaceholder } from '@/utils/image'
import { buildCharacterBio } from '@/utils/characterBio'

interface CharacterCardProps {
  character: CharacterCardType
  onChat: () => void
}

export function CharacterCard({ character, onChat }: CharacterCardProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [24, -24])
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [-1.5, 0, 1.5])
  const bio = buildCharacterBio(character)

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onChat}
      className="glass-card w-full overflow-hidden text-left transition-transform active:scale-[0.98]"
      style={{ minHeight: 200 }}
      whileHover={{ scale: 1.01 }}
    >
      <motion.div style={{ y, rotate }} className="flex flex-col">
        <div className="relative h-36 w-full overflow-hidden">
          <img
            src={resolveCharacterPortrait(character)}
            alt={character.name}
            className="h-full w-full object-cover object-top"
            onError={(e) => {
              const t = e.currentTarget
              const avatar = normalizeAssetPath(character.avatar)
              if (!t.dataset.fallback && avatar && t.src !== avatar) {
                t.dataset.fallback = '1'
                t.src = avatar
                return
              }
              if (!t.dataset.placeholder) {
                t.dataset.placeholder = '1'
                t.src = characterPlaceholder(character.name, character.id)
              }
            }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, var(--c-bg) 0%, transparent 55%)' }}
          />
          <div className="absolute bottom-2 left-3 right-3">
            <p className="text-lg font-medium" style={{ fontFamily: 'var(--font-dialogue)', color: 'var(--c-text)' }}>
              {character.name}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--c-accent)' }}>
              {character.title}
            </p>
          </div>
        </div>

        <div className="max-h-32 overflow-y-auto px-3 py-2.5 no-scrollbar">
          <p className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--c-text-dim)' }}>
            {bio}
          </p>
        </div>

        <div
          className="flex items-center justify-center gap-1.5 border-t py-2.5 text-xs"
          style={{ borderColor: 'var(--c-glass-border)', color: 'var(--c-primary)' }}
        >
          <MessageCircle size={14} />
          点击 · 开启线上对话
        </div>
      </motion.div>
    </motion.button>
  )
}
