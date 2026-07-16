import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, Info, Coins, Stamp, Sparkles } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

function detectIcon(title: string) {
  const t = title.toLowerCase()
  if (t.includes('金币') || t.includes('g') || t.includes('转账')) return Coins
  if (t.includes('印章') || t.includes('契约') || t.includes('集邮')) return Stamp
  if (t.includes('保留') || t.includes('获得') || t.includes('解锁')) return Sparkles
  return CheckCircle
}

export function ToastHost() {
  const toast = useUIStore((s) => s.toast)

  const Icon = toast ? detectIcon(toast.title) : CheckCircle
  const isReward = toast ? /金币|印章|获得|解锁|保留/.test(toast.title) : false

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          className="fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-[300] w-[min(340px,90vw)] -translate-x-1/2"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
        >
          <div
            className="flex items-start gap-3 overflow-hidden px-4 py-3 shadow-lg"
            style={{
              background: isReward
                ? 'linear-gradient(135deg, rgba(255,209,102,0.15), rgba(176,108,232,0.12))'
                : 'var(--c-glass)',
              border: `1px solid ${isReward ? 'rgba(255,209,102,0.35)' : 'var(--c-glass-border)'}`,
              borderRadius: 'var(--radius-lg)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              boxShadow: isReward ? '0 8px 32px rgba(255,209,102,0.18)' : 'var(--shadow-float)',
            }}
          >
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="mt-0.5 shrink-0"
            >
              <Icon size={22} style={{ color: isReward ? 'var(--c-gold)' : 'var(--c-accent)' }} />
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                {toast.title}
              </p>
              {toast.message && (
                <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
                  {toast.message}
                </p>
              )}
            </div>
            <Info size={14} className="shrink-0 opacity-40" style={{ color: 'var(--c-text-dim)' }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
