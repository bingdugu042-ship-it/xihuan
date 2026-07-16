import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Handshake, Gem } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { useDataStore } from '@/store/dataStore'

const DIMS: { key: 'favor' | 'trust' | 'dependence'; label: string; icon: typeof Heart }[] = [
  { key: 'favor', label: '好感', icon: Heart },
  { key: 'trust', label: '信任', icon: Handshake },
  { key: 'dependence', label: '依赖', icon: Gem },
]

function levelLabel(v: number): string {
  if (v >= 80) return '挚爱'
  if (v >= 60) return '亲密'
  if (v >= 40) return '熟识'
  if (v >= 20) return '朋友'
  return '陌生'
}

export function RelationshipPanel() {
  const open = useUIStore((s) => s.relationshipPanelOpen)
  const setOpen = useUIStore((s) => s.setRelationshipPanelOpen)
  const { activeSession } = useSessionStore()
  const { characters } = useDataStore()

  return (
    <AnimatePresence>
      {open && activeSession && (
        <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          />
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="glass relative z-10 w-full max-w-[440px] rounded-t-2xl p-4 sm:rounded-2xl"
            style={{ border: '1px solid var(--c-border)' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-medium" style={{ color: 'var(--c-text)' }}>
                关系面板
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 hover:bg-[var(--c-primary-soft)]"
                style={{ color: 'var(--c-text-dim)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {activeSession.participantIds.map((id) => {
                const c = characters[id]
                const rel = activeSession.relationships[id]
                if (!c || !rel) return null
                return (
                  <div
                    key={id}
                    className="rounded-xl p-3"
                    style={{ border: '1px solid var(--c-border)' }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--c-text)' }}>
                        {c.name}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px]"
                        style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
                      >
                        {levelLabel(rel.favor)}
                      </span>
                    </div>
                    {DIMS.map(({ key, label, icon: Icon }) => (
                      <div key={key} className="mb-1.5 flex items-center gap-2">
                        <Icon size={13} style={{ color: 'var(--c-primary)' }} />
                        <span className="w-10 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
                          {label}
                        </span>
                        <div
                          className="h-1.5 flex-1 overflow-hidden rounded-full"
                          style={{ background: 'var(--c-bg-soft)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${rel[key]}%`,
                              background: 'var(--c-primary)',
                            }}
                          />
                        </div>
                        <span
                          className="w-8 text-right text-[11px] tabular-nums"
                          style={{ color: 'var(--c-text)' }}
                        >
                          {rel[key]}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
