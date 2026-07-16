import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Banknote, ShieldCheck } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { useProfileStore } from '@/store/profileStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useDataStore } from '@/store/dataStore'

export function TransferModal() {
  const open = useUIStore((s) => s.transferModalOpen)
  const setOpen = useUIStore((s) => s.setTransferModalOpen)
  const sendTransfer = useSessionStore((s) => s.sendTransfer)
  const { activeSession } = useSessionStore()
  const { profiles } = useProfileStore()
  const { settings } = useSettingsStore()
  const { characters } = useDataStore()

  const [amount, setAmount] = useState('100')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const profile = profiles.find((p) => p.id === settings.ui.activeProfileId)
  const charId = activeSession?.participantIds[0]
  const character = charId ? characters[charId] : null

  const confirm = async () => {
    const n = Number(amount)
    if (!n || n <= 0) {
      setErr('请输入有效金额')
      return
    }
    if (!profile || profile.coins < n) {
      setErr('金币不足')
      return
    }
    setBusy(true)
    setErr('')
    const ok = await sendTransfer(n, note)
    setBusy(false)
    if (ok) {
      setAmount('100')
      setNote('')
      setOpen(false)
    } else {
      setErr('转账失败')
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
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="fixed left-1/2 top-1/2 z-[121] w-[min(340px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl"
            style={{ background: 'linear-gradient(165deg, #1a1520 0%, #2a2235 100%)', border: '1px solid var(--c-border)' }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2">
                <Banknote size={18} style={{ color: 'var(--c-accent)' }} />
                <span className="text-sm font-medium text-white">转账</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/50">
                <X size={18} />
              </button>
            </div>

            <div className="px-4 py-4">
              <div className="mb-4 text-center">
                <p className="text-xs text-white/50">收款方</p>
                <p className="text-lg text-white">{character?.name ?? '—'}</p>
              </div>

              <div className="mb-3 rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.25)' }}>
                <label className="mb-1 block text-[10px] text-white/50">转账金额 (G)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent text-3xl font-light text-white outline-none"
                  min={1}
                />
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-[10px] text-white/50">备注（可选）</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="给对方留言…"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'rgba(0,0,0,0.25)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              <p className="mb-3 text-center text-[11px]" style={{ color: 'var(--c-accent)' }}>
                可用余额：{profile?.coins ?? 0} G
              </p>

              {err && <p className="mb-2 text-center text-[11px] text-red-400">{err}</p>}

              <button
                type="button"
                disabled={busy}
                onClick={() => void confirm()}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:opacity-50"
                style={{ background: 'var(--c-primary)', color: '#fff' }}
              >
                <ShieldCheck size={16} />
                {busy ? '处理中…' : '确认转账'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
