import { Check } from 'lucide-react'
import { facilityAssetPath } from '@/data/facilityHandbook'
import type { FacilityDef } from '@/data/facilities'

interface FacilitySignBoardProps {
  facility: FacilityDef
  stamped: boolean
  disabled: boolean
}

/** 游域界项目立牌 · 梯形指示牌风格 */
export function FacilitySignBoard({ facility, stamped, disabled }: FacilitySignBoardProps) {
  return (
    <div className={`facility-signboard ${disabled ? 'facility-signboard--disabled' : ''}`}>
      <div className="facility-signboard__pillar" aria-hidden />
      <div className="facility-signboard__board">
        <div className="facility-signboard__no">{String(facility.no).padStart(2, '0')}</div>
        <div className="facility-signboard__thumb">
          <img
            src={facilityAssetPath(facility.id, 'thumb')}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
        <div className="facility-signboard__name">{facility.name}</div>
        {stamped && (
          <span className="facility-signboard__stamp">
            <Check size={10} strokeWidth={3} />
          </span>
        )}
      </div>
    </div>
  )
}
