import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { useDataStore } from '@/store/dataStore'
import { listAllMemories } from '@/storage/db'
import { filterMemoriesForParticipants } from '@/ai/memoryUtils'
import type { CoreMemory } from '@/types'

const TYPE_LABEL: Record<CoreMemory['type'], string> = {
  milestone: '里程碑',
  daily: '日常',
  conflict: '冲突',
  secret: '秘密',
  preference: '偏好',
  facility: '冒险域',
  npc_bond: '羁绊',
}

export function MemoryPanel() {
  const open = useUIStore((s) => s.memoryPanelOpen)
  const setOpen = useUIStore((s) => s.setMemoryPanelOpen)
  const { activeSession } = useSessionStore()
  const { characters } = useDataStore()
  const [memories, setMemories] = useState<CoreMemory[]>([])
  const [charFilter, setCharFilter] = useState<string>('')

  const participantIds = activeSession?.participantIds ?? []
  const focusId = charFilter || participantIds[0] || ''

  useEffect(() => {
    if (!open) return
    const participantCards = participantIds.map((id) => characters[id]).filter(Boolean)
    listAllMemories().then((all) => {
      const filtered = filterMemoriesForParticipants(all, participantCards)
      if (focusId) {
        const c = characters[focusId]
        const byChar = filtered.filter(
          (m) =>
            m.text.includes(`[${focusId}]`) ||
            (c && m.text.includes(`【${c.name}】`)) ||
            (!m.text.startsWith('[') && !m.text.startsWith('【')),
        )
        setMemories(byChar.sort((a, b) => b.timestamp - a.timestamp))
      } else {
        setMemories(filtered.sort((a, b) => b.timestamp - a.timestamp))
      }
    })
  }, [open, focusId, participantIds, characters])

  return (
    <AnimatePresence>
      {open && (
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
            className="glass relative z-10 flex max-h-[80%] w-full max-w-[440px] flex-col rounded-t-2xl sm:rounded-2xl"
            style={{ border: '1px solid var(--c-border)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--c-border)' }}
            >
              <div className="flex items-center gap-2">
                <BookOpen size={16} style={{ color: 'var(--c-primary)' }} />
                <h2 className="text-base font-medium" style={{ color: 'var(--c-text)' }}>
                  记忆回放
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 hover:bg-[var(--c-primary-soft)]"
                style={{ color: 'var(--c-text-dim)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 角色筛选 */}
            {participantIds.length > 1 && (
              <div className="flex gap-1.5 px-4 py-2">
                {participantIds.map((id) => {
                  const c = characters[id]
                  const active = id === focusId
                  return (
                    <button
                      key={id}
                      onClick={() => setCharFilter(id)}
                      className="rounded-full px-2.5 py-1 text-xs transition-colors"
                      style={{
                        background: active ? 'var(--c-primary-soft)' : 'transparent',
                        color: active ? 'var(--c-primary)' : 'var(--c-text-dim)',
                        border: '1px solid var(--c-border)',
                      }}
                    >
                      {c?.name}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-3">
              {memories.length === 0 ? (
                <p className="mt-6 text-center text-xs" style={{ color: 'var(--c-text-dim)' }}>
                  还没有关于 {characters[focusId]?.name} 的核心记忆
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {memories.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl p-3"
                      style={{ border: '1px solid var(--c-border)' }}
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px]"
                          style={{
                            background: 'var(--c-primary-soft)',
                            color: 'var(--c-primary)',
                          }}
                        >
                          {TYPE_LABEL[m.type]}
                        </span>
                        {m.facilityId && (
                          <span className="text-[10px]" style={{ color: 'var(--c-accent)' }}>
                            @{m.facilityId}
                          </span>
                        )}
                        <span className="text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                          {new Date(m.timestamp).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {m.tags && m.tags.length > 0 && (
                        <p className="mb-1 text-[9px]" style={{ color: 'var(--c-text-dim)' }}>
                          #{m.tags.slice(0, 5).join(' #')}
                        </p>
                      )}
                      <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                        {m.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
