import { FacilitySignBoard } from './FacilitySignBoard'
import { FacilityPlayPage } from '@/ui/facility/FacilityPlayPage'
import type { FacilityDef } from '@/data/facilities'

interface FacilityFlipCardProps {
  facility: FacilityDef
  stamped: boolean
  disabled: boolean
  isFlipped: boolean
  onFlip: () => void
  onClose: () => void
}

/** 设施立牌 3D 翻转卡片 · 正面立牌 / 背面身份选择 */
export function FacilityFlipCard({
  facility,
  stamped,
  disabled,
  isFlipped,
  onFlip,
  onClose,
}: FacilityFlipCardProps) {
  const handleClick = () => {
    if (disabled) return
    if (!isFlipped) onFlip()
  }

  return (
    <div
      className={`facility-flip-card ${isFlipped ? 'facility-flip-card--flipped' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${facility.name} 项目立牌`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className="facility-flip-card__inner">
        <div className="facility-flip-card__face facility-flip-card__face--front">
          <FacilitySignBoard facility={facility} stamped={stamped} disabled={disabled} />
        </div>
        <div
          className="facility-flip-card__face facility-flip-card__face--back"
          onClick={(e) => e.stopPropagation()}
        >
          <FacilityPlayPage facility={facility} onClose={onClose} />
        </div>
      </div>
    </div>
  )
}
