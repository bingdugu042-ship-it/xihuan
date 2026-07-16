import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Hourglass, CheckCircle, Archive } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'

export function SandOfTimeModal() {
  const open = useUIStore((s) => s.sandOfTimeModalOpen)
  const setOpen = useUIStore((s) => s.setSandOfTimeModalOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const setSidebarTab = useUIStore((s) => s.setSidebarTab)
  const { activeSession, archiveSession } = useSessionStore()
  const [archived, setArchived] = useState(false)
  const [busy, setBusy] = useState(false)

  const close = () => {
    setOpen(false)
    window.setTimeout(() => setArchived(false), 300)
  }

  const doArchive = async () => {
    if (!activeSession || busy) return
    setBusy(true)
    await archiveSession(activeSession.id, '史诗存档封存')
    setBusy(false)
    setArchived(true)
  }

  const openArchived = () => {
    setOpen(false)
    setSidebarOpen(true)
    setSidebarTab('archived')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[120]"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            className="glass-card fixed left-1/2 top-1/2 z-[121] w-[min(340px,92vw)] -translate-x-1/2 -translate-y-1/2 p-5"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hourglass size={18} style={{ color: 'var(--c-primary)' }} />
                <h3 className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                  史诗存档 · 存读档
                </h3>
              </div>
              <button onClick={close} className="rounded p-1" style={{ color: 'var(--c-text-dim)' }}>
                <X size={18} />
              </button>
            </div>

            {archived ? (
              <div className="py-4 text-center">
                <CheckCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--c-accent)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                  存档成功
                </p>
                <p className="mt-2 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
                  「{activeSession?.title}」已写入史诗存档，记忆已保留。
                </p>
                <button
                  onClick={close}
                  className="mt-4 w-full rounded-xl py-2.5 text-sm"
                  style={{ background: 'var(--c-primary)', color: '#fff' }}
                >
                  完成
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
                  封存当前对话后，将保存至「已封存」列表。内测功能可能导致部分记忆异常，请谨慎操作。
                </p>
                {!activeSession ? (
                  <p className="mt-3 text-center text-xs" style={{ color: 'var(--c-text-dim)' }}>
                    当前没有进行中的对话
                  </p>
                ) : (
                  <button
                    onClick={() => void doArchive()}
                    disabled={busy}
                    className="mt-4 w-full rounded-xl py-2.5 text-sm disabled:opacity-50"
                    style={{ background: 'var(--c-primary)', color: '#fff' }}
                  >
                    {busy ? '封存中…' : `封存「${activeSession.title}」`}
                  </button>
                )}
                <button
                  onClick={openArchived}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm"
                  style={{
                    background: 'rgba(245, 184, 92, 0.16)',
                    color: 'var(--c-gold)',
                    border: '1px solid rgba(245, 184, 92, 0.35)',
                  }}
                >
                  <Archive size={15} />
                  打开已封存 · 读档
                </button>
                <button
                  onClick={close}
                  className="mt-2 w-full rounded-xl py-2 text-xs"
                  style={{ color: 'var(--c-text-dim)' }}
                >
                  取消
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
