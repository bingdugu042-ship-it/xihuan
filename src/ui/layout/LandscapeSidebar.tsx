import { useMemo } from 'react'
import { Crown, MapPin } from 'lucide-react'
import { TomeNav } from './TomeNav'
import { useUIStore } from '@/store/uiStore'
import { usePassportStore } from '@/store/passportStore'
import { useCurrentLocationLabel } from '@/hooks/useCurrentLocationLabel'
import { CULTIVATION_LABELS, type CultivationKey } from '@/data/cultivation'

export function LandscapeSidebar() {
  const activeTab = useUIStore((s) => s.activeTab)
  const regionHue = useUIStore((s) => s.regionHue)
  const cultivation = usePassportStore((s) => s.cultivation)
  const conqueredCount = usePassportStore((s) => s.conqueredCount)
  const partyIds = usePassportStore((s) => s.partyIds)
  const homeIds = usePassportStore((s) => s.homeIds)
  const location = useCurrentLocationLabel()

  const regionName = useMemo(() => {
    if (activeTab === 'adventure' || activeTab === 'world') return '艾泽利亚'
    const labels: Record<string, string> = {
      chat: '沉浸',
      rulebook: '规则书',
      party: '队伍',
      home: '家园',
      atlas: '图鉴',
      settings: '设置',
    }
    return labels[activeTab] ?? '预言之书'
  }, [activeTab])

  const primaryCultivation = useMemo(() => {
    const keys = Object.keys(CULTIVATION_LABELS) as CultivationKey[]
    return keys
      .map((k) => ({ key: k, value: cultivation[k], label: CULTIVATION_LABELS[k].name }))
      .sort((a, b) => b.value - a.value)[0]
  }, [cultivation])

  return (
    <aside className="tome-sidebar">
      <div className="tome-sidebar__brand">
        <span className="tome-sidebar__rune">◈</span>
        <div>
          <p className="tome-sidebar__title">AETHERION</p>
          <p className="tome-sidebar__subtitle">预言之书</p>
        </div>
      </div>

      <div className="tome-sidebar__hero">
        <div className="tome-sidebar__hero-seal">明</div>
        <div className="tome-sidebar__hero-info">
          <p className="tome-sidebar__hero-name">明月笙</p>
          <p className="tome-sidebar__hero-title">堕落英雄 · 征服者</p>
        </div>
      </div>

      <div className="tome-sidebar__region">
        <div
          className="tome-sidebar__region-glow"
          style={{ background: regionHue ?? '#c9a35a' }}
        />
        <div className="tome-sidebar__region-icon">
          <MapPin size={12} />
        </div>
        <div className="tome-sidebar__region-info">
          <p className="tome-sidebar__region-name">{regionName}</p>
          <p className="tome-sidebar__region-sub">{location}</p>
        </div>
      </div>

      <div className="tome-sidebar__nav">
        <TomeNav />
      </div>

      <div className="tome-sidebar__summary">
        <div className="tome-sidebar__summary-item">
          <Crown size={12} />
          <span>{conqueredCount()}</span>
          <small>已攻略</small>
        </div>
        <div className="tome-sidebar__summary-divider" />
        <div className="tome-sidebar__summary-item">
          <span>{partyIds.length}</span>
          <small>队伍</small>
        </div>
        <div className="tome-sidebar__summary-divider" />
        <div className="tome-sidebar__summary-item">
          <span>{homeIds.length}</span>
          <small>家园</small>
        </div>
      </div>

      {primaryCultivation && (
        <div className="tome-sidebar__cult">
          <span className="tome-sidebar__cult-dot" style={{ background: regionHue ?? '#c9a35a' }} />
          <span className="tome-sidebar__cult-label">{primaryCultivation.label}</span>
          <span className="tome-sidebar__cult-value">{primaryCultivation.value}</span>
        </div>
      )}

      <div className="tome-sidebar__footer">
        <p>英雄 · 明月笙</p>
      </div>
    </aside>
  )
}
