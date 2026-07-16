import { MapPin } from 'lucide-react'
import { FACILITIES } from '@/data/facilities'
import { usePassportStore } from '@/store/passportStore'
import type { FacilityDef } from '@/data/facilities'

interface Props {
  activeId: string | null
  onPick: (f: FacilityDef) => void
  variant?: 'vertical' | 'horizontal' | 'carousel'
  compact?: boolean
  mobile?: boolean
}

export function TemplateFacilityNav({ activeId, onPick, variant = 'vertical', compact, mobile }: Props) {
  const hasStamp = usePassportStore((s) => s.hasStamp)

  if (variant === 'horizontal') {
    return (
      <div className={`no-scrollbar template-facility-scroll flex gap-2 overflow-x-auto py-2 ${mobile ? 'px-2 snap-x snap-mandatory' : 'px-3'}`}>
        {FACILITIES.map((f) => (
          <FacilityChip key={f.id} f={f} active={activeId === f.id} stamped={hasStamp(f.id)} onPick={onPick} neon mobile={mobile} />
        ))}
      </div>
    )
  }

  if (variant === 'carousel') {
    return (
      <div className={`no-scrollbar template-facility-scroll flex gap-2 overflow-x-auto py-3 ${mobile ? 'px-3 snap-x snap-mandatory' : 'gap-3 px-4'}`}>
        {FACILITIES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onPick(f)}
            className={`shrink-0 snap-start rounded-full font-medium transition-transform active:scale-95 ${mobile ? 'min-h-[44px] px-4 text-xs' : 'px-4 py-2 text-[11px]'}`}
            style={{
              background: activeId === f.id ? 'var(--c-primary)' : 'var(--c-surface)',
              color: activeId === f.id ? '#fff' : 'var(--c-text)',
              border: `1px solid ${activeId === f.id ? 'var(--c-primary)' : 'var(--c-border)'}`,
              fontFamily: 'var(--scheme-title-font, inherit)',
            }}
          >
            ◎{f.name}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={`no-scrollbar flex flex-col gap-1 overflow-y-auto ${mobile ? 'p-1' : 'p-2'}`}>
      {FACILITIES.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onPick(f)}
          className={`template-facility-row flex items-center gap-2 rounded-lg text-left transition-all active:scale-[0.98] ${mobile ? 'min-h-[48px] px-3 text-xs' : 'px-2 py-2 text-[11px]'}`}
          style={{
            background: activeId === f.id ? 'var(--c-primary-soft)' : 'transparent',
            border: activeId === f.id ? '1px solid var(--c-primary)' : '1px solid transparent',
            boxShadow: activeId === f.id ? '0 0 12px var(--c-primary-soft)' : 'none',
            color: 'var(--c-text)',
          }}
        >
          <MapPin size={12} style={{ color: activeId === f.id ? 'var(--c-accent)' : 'var(--c-text-dim)' }} />
          <span className="min-w-0 flex-1 truncate">{compact ? f.name : `[${f.stampName}] ${f.name}`}</span>
          {hasStamp(f.id) && (
            <span className="text-[9px]" style={{ color: 'var(--c-accent)' }}>
              ✓
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

function FacilityChip({
  f,
  active,
  stamped,
  onPick,
  neon,
  mobile,
}: {
  f: FacilityDef
  active: boolean
  stamped: boolean
  onPick: (f: FacilityDef) => void
  neon?: boolean
  mobile?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(f)}
      className={`template-facility-chip shrink-0 snap-start rounded-lg whitespace-nowrap transition-transform active:scale-95 ${mobile ? 'min-h-[40px] px-3.5 text-xs' : 'px-3 py-1.5 text-[10px]'}`}
      style={{
        background: active ? 'var(--c-primary-soft)' : 'var(--c-surface)',
        color: active ? 'var(--c-accent)' : 'var(--c-text)',
        border: `1px solid ${active ? 'var(--c-accent)' : 'var(--c-glass-border)'}`,
        boxShadow: active && neon ? '0 0 14px var(--c-accent)' : undefined,
      }}
    >
      {f.name}
      {stamped ? ' ✦' : ''}
    </button>
  )
}
