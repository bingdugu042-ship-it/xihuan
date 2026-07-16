import { motion } from 'framer-motion'
import { MapPin, Stamp, X } from 'lucide-react'
import { THEME_ZONES } from '@/data/facilities'
import { FACILITY_HANDBOOK, facilityAssetPath } from '@/data/facilityHandbook'
import type { FacilityDef } from '@/data/facilities'

interface Props {
  facility: FacilityDef
  stamped: boolean
  disabled: boolean
  onClose: () => void
  onEnter: () => void
}

/** 点击冒险域后 · 手册体导览简报（先入再前往） */
export function FacilityBriefSheet({ facility, stamped, disabled, onClose, onEnter }: Props) {
  const zone = THEME_ZONES.find((z) => z.id === facility.zone)
  const entry = FACILITY_HANDBOOK[facility.id]
  const sceneSrc = facilityAssetPath(facility.id, 'scene')

  return (
    <>
      <motion.div
        key="backdrop"
        className="facility-brief-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        key="sheet"
        className="facility-brief-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        role="dialog"
        aria-label={`${facility.name} 导览`}
      >
        <div className="facility-brief-sheet__handle" />

        <button type="button" className="facility-brief-sheet__close" onClick={onClose} aria-label="关闭">
          <X size={20} />
        </button>

        <div className="facility-brief-sheet__hero">
          <img
            src={sceneSrc}
            alt=""
            className="facility-brief-sheet__img"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <div className="facility-brief-sheet__hero-fallback" aria-hidden />
          <div className="facility-brief-sheet__hero-overlay">
            <span className="facility-brief-sheet__no">{String(facility.no).padStart(2, '0')}</span>
            <h2>{facility.name}</h2>
            <p>{entry?.brochureLine ?? facility.tagline}</p>
          </div>
        </div>

        <div className="facility-brief-sheet__body">
          <div className="facility-brief-sheet__meta">
            <span style={{ color: zone?.color }}>{zone?.name}</span>
            <span>男主 · {facility.npcArchetype}</span>
            {stamped && (
              <span className="facility-brief-sheet__stamped">
                <Stamp size={11} /> 已契约「{facility.stampName}」
              </span>
            )}
          </div>

          {entry && (
            <>
              <section>
                <h3>园区简介</h3>
                <p>{entry.scene}</p>
              </section>
              <section>
                <h3>体验要点</h3>
                <ul>
                  {entry.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>契约仪式</h3>
                <p>{entry.stampNote}</p>
              </section>
            </>
          )}

          <p className="facility-brief-sheet__note">
            男主由域界实时缔结，每次到访气质与分寸皆不同。
          </p>
        </div>

        <div className="facility-brief-sheet__actions">
          <button type="button" className="facility-brief-sheet__btn facility-brief-sheet__btn--ghost" onClick={onClose}>
            返回手册
          </button>
          <button
            type="button"
            className="facility-brief-sheet__btn facility-brief-sheet__btn--primary"
            disabled={disabled}
            onClick={onEnter}
          >
            <MapPin size={16} />
            前往冒险域
          </button>
        </div>
      </motion.div>
    </>
  )
}
