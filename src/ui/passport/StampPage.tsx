import { motion } from 'framer-motion'
import { type FacilityDef } from '@/data/facilities'
import type { StampRecord } from '@/types'

interface StampPageProps {
  facilities: FacilityDef[]
  stamps: Record<string, StampRecord>
  hasStamp: (id: string) => boolean
  onStampClick: (f: FacilityDef) => void
  animStampId?: string | null
}

function formatDate(ts?: number) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

export function StampPage({ facilities, stamps, hasStamp, onStampClick, animStampId }: StampPageProps) {
  return (
    <div className="grid h-full grid-cols-4 content-start gap-2">
      {facilities.map((f) => {
        const got = hasStamp(f.id)
        const animating = animStampId === f.id
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onStampClick(f)}
            className="relative flex flex-col items-center justify-center rounded-md p-1.5 text-center press-scale"
            style={{
              background: got ? 'rgba(245,184,92,0.12)' : 'transparent',
              border: got ? '1px dashed rgba(245,184,92,0.65)' : '1px dashed rgba(139,119,89,0.25)',
              minHeight: 72,
            }}
          >
            {/* 墨水/光晕扩散 */}
            {animating && (
              <motion.div
                className="pointer-events-none absolute inset-0 z-10 rounded-md"
                initial={{ scale: 0.4, opacity: 0.8 }}
                animate={{ scale: 2.6, opacity: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                style={{ border: '2px solid var(--c-gold)', borderRadius: 'inherit' }}
              />
            )}

            {/* 印章图标主体 */}
            <motion.div
              className="relative mb-1 flex h-9 w-9 items-center justify-center rounded-full"
              animate={animating ? { x: [0, -3, 3, -3, 3, 0] } : {}}
              transition={{ duration: 0.35 }}
              style={{
                background: got ? 'rgba(245,184,92,0.22)' : 'transparent',
                border: got ? '2px solid var(--c-gold)' : '2px dashed rgba(139,119,89,0.25)',
              }}
            >
              {got ? (
                <span className="text-[10px] font-bold" style={{ color: '#c98a20' }}>
                  {f.stampName.slice(0, 1)}
                </span>
              ) : (
                <span className="text-[10px]" style={{ color: '#c9b280' }}>
                  ?
                </span>
              )}
            </motion.div>

            {/* 首次契约落下动画 */}
            {animating && (
              <motion.div
                className="pointer-events-none absolute z-20 flex h-9 w-9 items-center justify-center rounded-full"
                initial={{ y: -70, opacity: 0, scale: 1.5, rotate: -25 }}
                animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                style={{
                  background: 'var(--c-gold)',
                  color: '#fff',
                  boxShadow: '0 4px 14px rgba(245,184,92,0.55)',
                }}
              >
                <span className="text-sm font-bold">{f.stampName.slice(0, 1)}</span>
              </motion.div>
            )}

            <p className="line-clamp-2 text-[8px] leading-tight" style={{ color: got ? '#3d2a12' : '#a89b7e' }}>
              {f.name}
            </p>
            {got && stamps[f.id] && (
              <p className="mt-0.5 text-[7px]" style={{ color: '#8b7759' }}>
                {formatDate(stamps[f.id].obtainedAt)}
              </p>
            )}
          </button>
        )
      })}
    </div>
  )
}
