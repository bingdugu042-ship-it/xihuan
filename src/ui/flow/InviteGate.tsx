import { useState } from 'react'
import { motion } from 'framer-motion'
import { KeyRound } from 'lucide-react'
import { verifyInviteCode } from '@/data/inviteCodes'
import { useSettingsStore } from '@/store/settingsStore'
import './onboarding.css'

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
    <div className="ob-root">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="ob-card"
        style={{ padding: 24, maxWidth: 360 }}
      >
        <div className="ob-eyebrow" style={{ marginBottom: 12 }}>
          <KeyRound size={18} />
          命运纹章
        </div>
        <h1 className="ob-title" style={{ marginTop: 0 }}>
          验证入卷资格
        </h1>
        <p className="ob-hint">艾尔茜利恩的冒险之书不向凡人敞开。请输入邀请印记。</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="输入邀请印记"
          className="ob-input"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit()
          }}
        />
        {error && (
          <p className="ob-hint" style={{ color: '#a83a4a', marginTop: 8 }}>
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={busy || !code.trim()}
          onClick={() => void submit()}
          className="ob-btn-next"
          style={{ width: '100%', marginTop: 16 }}
        >
          {busy ? '核验中…' : '开启书卷'}
        </button>
      </motion.div>
    </div>
  )
}
