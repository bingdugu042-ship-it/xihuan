import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, UserPlus, X } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { stageLabel } from '@/ai/npcGenerator'

export function SaveNpcModal() {
  const open = useUIStore((s) => s.saveNpcModalOpen)
  const setOpen = useUIStore((s) => s.setSaveNpcModalOpen)
  const activeSession = useSessionStore((s) => s.activeSession)
  const dismissSaveNpcPrompt = useSessionStore((s) => s.dismissSaveNpcPrompt)
  const [busy, setBusy] = useState(false)

  const npc = activeSession?.dynamicNpc
  if (!npc) return null

  const dismiss = async (retain: boolean) => {
    setBusy(true)
    try {
      await dismissSaveNpcPrompt(retain)
    } finally {
      setBusy(false)
      if (!retain) setOpen(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[120]"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => void dismiss(false)}
          />
          <motion.div
            className="fixed left-1/2 top-1/2 z-[121] w-[min(92vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-4"
            style={{
              background: 'var(--c-surface)',
              border: '1px solid var(--c-glass-border)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
            }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                  保留这位男主？
                </p>
                <p className="mt-1 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                  保留后可从手机「男主名册」查看；堕落达 76% 可烙印并 $召唤。
                </p>
              </div>
              <button
                type="button"
                onClick={() => void dismiss(false)}
                className="shrink-0 p-1"
                style={{ color: 'var(--c-text-dim)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="glass-card mb-4 p-3">
              <p className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                {npc.displayName}
                <Star size={12} className="ml-1 inline opacity-40" />
              </p>
              <p className="mt-1 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                {npc.facilityName} · {npc.npcArchetype}
              </p>
              <p className="mt-2 text-[10px]" style={{ color: 'var(--c-primary)' }}>
                {stageLabel(npc.corruptionStage)} · 堕落 {npc.corruption}%
              </p>
              <p className="mt-2 text-[10px] leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
                {npc.desire}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void dismiss(false)}
                className="flex-1 rounded-xl py-2.5 text-xs"
                style={{ background: 'var(--c-glass)', color: 'var(--c-text-dim)' }}
              >
                暂不保留
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void dismiss(true)}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-medium"
                style={{ background: 'var(--c-primary)', color: '#fff' }}
              >
                <UserPlus size={14} />
                保留男主
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
