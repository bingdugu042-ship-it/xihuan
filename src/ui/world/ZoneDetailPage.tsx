import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Sparkles } from 'lucide-react'
import { FACILITIES, THEME_ZONES, type ThemeZoneId } from '@/data/facilities'
import { getFacilityLore } from '@/data/facilityLore'
import { useDataStore } from '@/store/dataStore'
import { usePassportStore } from '@/store/passportStore'
import { FacilityPlayPage } from '@/ui/facility/FacilityPlayPage'
import { facilityAssetPath } from '@/data/facilityHandbook'
import { resolveAzeriaRegion } from '@/worldview/azeriaRegionMap'

interface ZoneDetailPageProps {
  zoneId: ThemeZoneId
  onClose: () => void
}

export function ZoneDetailPage({ zoneId, onClose }: ZoneDetailPageProps) {
  const zone = THEME_ZONES.find((z) => z.id === zoneId)!
  const facilities = FACILITIES.filter((f) => f.zone === zoneId)
  const { regions } = useDataStore()
  const hasStamp = usePassportStore((s) => s.hasStamp)
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null)

  const selectedFacility = selectedFacilityId ? FACILITIES.find((f) => f.id === selectedFacilityId) : null

  return (
    <motion.div
      className="zone-detail"
      style={{ '--zone-color': zone.color, '--zone-glow': zone.glow } as React.CSSProperties}
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
    >
      {/* 顶部标题区 */}
      <div className="zone-detail__header">
        <button type="button" className="zone-detail__back" onClick={onClose} aria-label="返回西大陆地图">
          <X size={22} />
        </button>
        <div className="zone-detail__title-block">
          <span className="zone-detail__vibe">{zone.vibe}</span>
          <h2 className="zone-detail__name">{zone.name}</h2>
        </div>
        <div className="zone-detail__count">
          <Sparkles size={14} />
          {facilities.filter((f) => hasStamp(f.id)).length}/{facilities.length}
        </div>
      </div>

      {/* 地区介绍 */}
      <div className="zone-detail__intro">
        <div className="zone-detail__intro-icon">
          <MapPin size={20} />
        </div>
        <p className="zone-detail__intro-text">{zone.description}</p>
      </div>

      {/* 冒险域列表 */}
      <div className="zone-detail__list">
        {facilities.map((f, i) => {
          const stamped = hasStamp(f.id)
          const disabled = !regions[f.id]
          const lore = getFacilityLore(f.id)
          const azeriaRegion = resolveAzeriaRegion(f.id)
          return (
            <motion.div
              key={f.id}
              className={`zone-facility-card ${stamped ? 'zone-facility-card--stamped' : ''} ${disabled ? 'zone-facility-card--disabled' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => !disabled && setSelectedFacilityId(f.id)}
            >
              <div className="zone-facility-card__thumb">
                <img
                  src={facilityAssetPath(f.id, 'thumb')}
                  alt=""
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                {stamped && <span className="zone-facility-card__stamp">{f.stampName}</span>}
              </div>
              <div className="zone-facility-card__body">
                <div className="zone-facility-card__meta">
                  <span className="zone-facility-card__no">#{String(f.no).padStart(2, '0')}</span>
                  <span className="zone-facility-card__zone-tag" style={{ color: zone.color }}>
                    {zone.name}
                  </span>
                </div>
                <h3 className="zone-facility-card__name">{f.name}</h3>
                <p className="zone-facility-card__tagline">{f.tagline}</p>
                <p className="zone-facility-card__scene">{lore.scene}</p>
                {azeriaRegion && (
                  <p className="zone-facility-card__scene" style={{ marginTop: 6, color: 'var(--hb-ocean)' }}>
                    危险度：{azeriaRegion.danger} · 遭遇表：{azeriaRegion.encounterSectionTitle}
                  </p>
                )}
                <div className="zone-facility-card__modes">
                  {lore.modes.slice(0, 3).map((m) => (
                    <span key={m.title} className="zone-facility-card__mode">
                      {m.title}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* 冒险域详情弹层 */}
      <AnimatePresence>
        {selectedFacility && (
          <div className="zone-facility-modal" onClick={() => setSelectedFacilityId(null)}>
            <motion.div
              className="zone-facility-modal__sheet"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              onClick={(e) => e.stopPropagation()}
            >
              <FacilityPlayPage facility={selectedFacility} onClose={() => setSelectedFacilityId(null)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
