import type { LucideIcon } from 'lucide-react'

export function FeatureCard({
  icon: Icon,
  label,
  sub,
  color,
  onClick,
  badge,
}: {
  icon: LucideIcon
  label: string
  sub: string
  color: string
  onClick: () => void
  badge?: string
}) {
  return (
    <button type="button" className="feature-card press-scale" onClick={onClick}>
      <div className="feature-card__icon" style={{ background: `${color}22`, color }}>
        <Icon size={22} />
      </div>
      <div className="feature-card__body">
        <div className="feature-card__label">{label}</div>
        <div className="feature-card__sub">{sub}</div>
      </div>
      {badge && <span className="feature-card__badge">{badge}</span>}
    </button>
  )
}

export function FeatureCardGrid({ children }: { children: React.ReactNode }) {
  return <div className="feature-card-grid">{children}</div>
}

/** 大图卡片（图鉴/结局/区域） */
export function AtlasCoverCard({
  title,
  subtitle,
  hue,
  letter,
  onClick,
  locked,
}: {
  title: string
  subtitle: string
  hue: string
  letter?: string
  onClick: () => void
  locked?: boolean
}) {
  return (
    <button
      type="button"
      className={`atlas-cover-card press-scale ${locked ? 'atlas-cover-card--locked' : ''}`}
      onClick={onClick}
      disabled={locked}
    >
      <div
        className="atlas-cover-card__art"
        style={{
          background: `linear-gradient(145deg, ${hue} 0%, color-mix(in srgb, ${hue} 40%, #0a0604) 100%)`,
        }}
      >
        {letter && <span className="atlas-cover-card__letter">{letter}</span>}
      </div>
      <div className="atlas-cover-card__info">
        <div className="atlas-cover-card__title">{title}</div>
        <div className="atlas-cover-card__sub">{subtitle}</div>
      </div>
    </button>
  )
}
