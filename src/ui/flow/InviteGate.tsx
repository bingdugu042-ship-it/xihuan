import { useState } from 'react'
import { motion } from 'framer-motion'
import { KeyRound } from 'lucide-react'
import { verifyInviteCode } from '@/data/inviteCodes'
import { useSettingsStore } from '@/store/settingsStore'

interface Props {
  onVerified: () => void
}

/** 邀请码验证 · 通过后进入主页 */
export function InviteGate({ onVerified }: Props) {
  const updateUI = useSettingsStore((s) => s.updateUI)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError(null)
    const role = verifyInviteCode(code)
    if (!role) {
      setError('邀请印记无效或已失效')
      return
    }
    setBusy(true)
    await updateUI({
      inviteVerified: true,
      inviteRole: role,
      inviteCodeUsed: code.trim().toUpperCase(),
    })
    setBusy(false)
    onVerified()
  }

  return (
    <div
      className="flex h-full min-h-[100dvh] w-full items-center justify-center px-6"
      style={{
        background: 'radial-gradient(ellipse at 50% 20%, #3a2418 0%, #120c16 55%, #070508 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[360px] rounded-2xl p-6 shadow-2xl"
        style={{
          background: 'linear-gradient(165deg, rgba(45,28,22,0.96), rgba(18,10,14,0.98))',
          border: '1px solid rgba(212,181,106,0.35)',
        }}
      >
        <div className="mb-4 flex items-center gap-2" style={{ color: '#d4b56a' }}>
          <KeyRound size={18} />
          <span className="text-sm tracking-[0.25em]">命运纹章</span>
        </div>
        <h1
          className="text-xl tracking-widest"
          style={{ fontFamily: 'var(--font-dialogue)', color: '#f5e6d3' }}
        >
          验证入卷资格
        </h1>
        <p className="mt-2 text-xs leading-relaxed" style={{ color: '#a89888' }}>
          艾尔茜利恩的冒险之书不向凡人敞开。请输入邀请印记。
        </p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="输入邀请印记"
          className="mt-5 w-full rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{
            background: 'rgba(0,0,0,0.35)',
            color: '#f5e6d3',
            border: '1px solid rgba(212,181,106,0.28)',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit()
          }}
        />
        {error && (
          <p className="mt-2 text-xs" style={{ color: '#c45c7a' }}>
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={busy || !code.trim()}
          onClick={() => void submit()}
          className="mt-4 w-full rounded-xl py-2.5 text-sm tracking-widest disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#d4b56a,#a67c3a)', color: '#1a0f12' }}
        >
          {busy ? '核验中…' : '开启书卷'}
        </button>
      </motion.div>
    </div>
  )
}
