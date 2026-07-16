import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Stamp, X } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { usePassportStore } from '@/store/passportStore'
import { FACILITY_MAP } from '@/data/facilities'

export function StampOfferModal() {
  const open = useUIStore((s) => s.stampOfferModalOpen)
  const setOpen = useUIStore((s) => s.setStampOfferModalOpen)
  const activeSession = useSessionStore((s) => s.activeSession)
  const appendSystemMessage = useSessionStore((s) => s.appendSystemMessage)
  const addStamp = usePassportStore((s) => s.addStamp)
  const hasStamp = usePassportStore((s) => s.hasStamp)
  const [busy, setBusy] = useState(false)

  if (!activeSession) return null
  const f = FACILITY_MAP[activeSession.regionId]
  if (!f) return null
  const already = hasStamp(f.id)

  const close = () => setOpen(false)

  const confirm = async () => {
    setBusy(true)
    try {
      if (!already) {
        await addStamp(f.id, {
          memoryText: activeSession.playMode,
        })
        await appendSystemMessage(
          [
            `✦ 图鉴已盖「${f.stampName}」章 — ${f.name}`,
            `旁白：契约不是终点——你依旧可以留在「${f.name}」继续体验。`,
          ].join('\n'),
          'narrator',
        )
        useUIStore.getState().showToast('契约成功', `${f.name} · 可继续游玩`)
      } else {
        await appendSystemMessage(
          `旁白：图鉴上已有「${f.stampName}」章。契约不是终点——你仍可继续在「${f.name}」畅玩。`,
          'narrator',
        )
        useUIStore.getState().showToast('已盖过章', '可继续游玩本冒险域')
      }
    } finally {
      setBusy(false)
      setOpen(false)
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
            onClick={close}
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
                  {already ? '本域已盖过章' : '申请契约？'}
                </p>
                <p className="mt-1 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                  {already
                    ? '本冒险域已有章。契约不是终点，仍可继续游玩。'
                    : '完成冒险域剧情阶段或余韵后即可契约。契约后仍可继续游玩。'}
                </p>
              </div>
              <button type="button" onClick={close} className="shrink-0 p-1" style={{ color: 'var(--c-text-dim)' }}>
                <X size={16} />
              </button>
            </div>

            <div className="glass-card mb-4 flex items-center gap-3 p-3">
              <Stamp size={20} style={{ color: 'var(--c-accent)' }} />
              <div>
                <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                  {f.stampName} · {f.name}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={close}
                className="flex-1 rounded-xl py-2.5 text-xs"
                style={{ background: 'var(--c-bg-soft)', color: 'var(--c-text-dim)' }}
              >
                稍后再说
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirm()}
                className="flex-1 rounded-xl py-2.5 text-xs font-medium"
                style={{ background: 'linear-gradient(135deg,#2a9ec4,#1a6f8f)', color: '#fff' }}
              >
                {already ? '知道了' : '契约'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
