import type { SessionDynamicNpc } from '@/types'
import { ensureNpcBioFields } from '@/ai/npcGenerator'

function BioBlock({
  label,
  text,
  accent,
}: {
  label: string
  text: string
  accent: string
}) {
  if (!text.trim()) return null
  return (
    <div
      className="npc-bio-block rounded-xl px-2.5 py-2"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <p className="npc-bio-block__label mb-1 text-[10px] font-bold tracking-wide" style={{ color: accent }}>
        {label}
      </p>
      <p className="npc-bio-block__text whitespace-pre-wrap break-words text-[11px] leading-relaxed">
        {text}
      </p>
    </div>
  )
}

/** 男主档案：姓名/性别/年龄/体型/外貌/背景/身体 */
export function NpcBioCard({ npc }: { npc: SessionDynamicNpc }) {
  const bio = ensureNpcBioFields(npc)
  const bodyInfo = [
    `体型：${bio.bodyType}`,
    `气质：${bio.style}`,
    bio.activePassive ? `互动倾向：${bio.activePassive}` : '',
    bio.kinks?.length ? `性癖倾向：${bio.kinks.slice(0, 4).join('、')}` : '',
    bio.bodyState ? `此刻身体：${bio.bodyState}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        <span
          className="rounded-full px-2 py-0.5"
          style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
        >
          姓名 · {bio.displayName}
        </span>
        <span
          className="rounded-full px-2 py-0.5"
          style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
        >
          性别 · {bio.gender}
        </span>
        <span
          className="rounded-full px-2 py-0.5"
          style={{ background: 'var(--c-gold-soft)', color: 'var(--c-gold)' }}
        >
          年龄感 · {bio.ageFeel}
        </span>
        <span
          className="rounded-full px-2 py-0.5"
          style={{ background: 'rgba(58,158,154,0.16)', color: 'var(--c-mint)' }}
        >
          身份 · {bio.npcArchetype}
        </span>
      </div>

      {bio.personality?.length > 0 && (
        <p className="text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
          性格：{bio.personality.join(' · ')}
        </p>
      )}

      <BioBlock label="外貌" text={bio.appearance} accent="var(--c-primary)" />
      <BioBlock label="身体信息" text={bodyInfo} accent="var(--c-gold)" />
      <BioBlock label="背景故事" text={bio.background} accent="var(--c-accent)" />
    </div>
  )
}
