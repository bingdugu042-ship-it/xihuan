import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DiceRollResult } from '@/utils/dice'
import { DICE_SKILL_LABELS } from '@/utils/dice'
import './dice-roll-overlay.css'

interface DiceRollOverlayProps {
  result: DiceRollResult
  onComplete: () => void
}

export function DiceRollOverlay({ result, onComplete }: DiceRollOverlayProps) {
  const [phase, setPhase] = useState<'roll' | 'land' | 'done'>('roll')

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase('land'), 1600)
    const t2 = window.setTimeout(() => {
      setPhase('done')
      window.setTimeout(() => onComplete(), 900)
    }, 3200)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [onComplete])

  const verdict = result
    ? result.critSuccess
      ? '大成功'
      : result.critFail
        ? '大失败'
        : result.success
          ? '成功'
          : '失败'
    : ''

  return (
    <div className="dro-root">
      <div className="dro-scrim" />
      <div className="dro-glow" />

      <div className="dro-stage">
        <AnimatePresence>
          {phase !== 'done' && (
            <motion.div
              className="dro-dice-wrap"
              initial={{ y: -300, opacity: 0, rotateX: 720, rotateZ: 360 }}
              animate={
                phase === 'roll'
                  ? { y: 0, opacity: 1, rotateX: 0, rotateZ: 0 }
                  : { y: 8, scale: 1.05 }
              }
              transition={{
                type: 'spring',
                stiffness: phase === 'roll' ? 60 : 200,
                damping: phase === 'roll' ? 10 : 20,
                duration: 1.4,
              }}
            >
              <div className="dro-dice">
                <div className="dro-face dro-face--front">{result?.roll ?? '?'}</div>
                <div className="dro-face dro-face--back">20</div>
                <div className="dro-face dro-face--right">12</div>
                <div className="dro-face dro-face--left">8</div>
                <div className="dro-face dro-face--top">4</div>
                <div className="dro-face dro-face--bottom">16</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === 'land' && result && (
            <motion.div
              className="dro-result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <p className="dro-skill">
                {DICE_SKILL_LABELS[result.skill]}检定
              </p>
              <p className="dro-numbers">
                d20={result.roll}
                {result.modifier >= 0 ? ` +${result.modifier}` : ` ${result.modifier}`} → {result.total} / DC {result.dc}
              </p>
              <p className={`dro-verdict ${result.success ? 'dro-verdict--success' : 'dro-verdict--fail'}`}>
                {verdict}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
