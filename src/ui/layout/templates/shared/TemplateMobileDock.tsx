import { MapPin, MessageCircle, PanelRight } from 'lucide-react'

export type TemplateDockTab = 'chat' | 'facilities' | 'status'

interface Props {
  active: TemplateDockTab
  onChat: () => void
  onFacilities: () => void
  onStatus: () => void
  /** 方案 B 顶栏已有设施条时可隐藏「设施」 */
  hideFacilities?: boolean
  labels?: Partial<Record<TemplateDockTab, string>>
}

export function TemplateMobileDock({
  active,
  onChat,
  onFacilities,
  onStatus,
  hideFacilities,
  labels,
}: Props) {
  const items: { id: TemplateDockTab; icon: typeof MapPin; label: string; onClick: () => void }[] = [
    ...(hideFacilities
      ? []
      : [{ id: 'facilities' as const, icon: MapPin, label: labels?.facilities ?? '设施', onClick: onFacilities }]),
    { id: 'chat', icon: MessageCircle, label: labels?.chat ?? '对话', onClick: onChat },
    { id: 'status', icon: PanelRight, label: labels?.status ?? '状态', onClick: onStatus },
  ]

  return (
    <nav
      className="template-mobile-dock flex shrink-0 items-stretch justify-around border-t"
      style={{
        borderColor: 'var(--c-glass-border)',
        background: 'var(--c-surface)',
        backdropFilter: 'blur(12px)',
      }}
      aria-label="模板导航"
    >
      {items.map(({ id, icon: Icon, label, onClick }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            type="button"
            onClick={onClick}
            className="template-dock-btn flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
            style={{ color: isActive ? 'var(--c-primary)' : 'var(--c-text-dim)' }}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
