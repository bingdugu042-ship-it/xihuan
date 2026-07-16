import { useRef, useState, useEffect } from 'react'
import { Camera, Coins, Check, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useProfileStore } from '@/store/profileStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'
import { PhoneAppShell } from './PhoneAppShell'

const FIELDS: { key: 'age' | 'gender' | 'assets' | 'livingEnvironment' | 'homeLayout' | 'persona'; label: string; placeholder: string; textarea?: boolean }[] = [
  { key: 'age', label: '年龄', placeholder: '例：22' },
  { key: 'gender', label: '性别', placeholder: '男 / 女 / 其他' },
  { key: 'assets', label: '资产', placeholder: '例：继承的旧宅与少量存款' },
  { key: 'livingEnvironment', label: '居住环境', placeholder: '例：海边公寓 / 独栋小屋' },
  { key: 'homeLayout', label: '家庭布置', placeholder: '例：简约 / 复古 / 科技感' },
  { key: 'persona', label: '人设自述', placeholder: '性格、背景、来此缘由…', textarea: true },
]

export function ProfileApp() {
  const { profiles, updateProfile } = useProfileStore()
  const { settings } = useSettingsStore()
  const showToast = useUIStore((s) => s.showToast)
  const profile = profiles.find((p) => p.id === settings.ui.activeProfileId)

  const fileRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState({
    name: '',
    avatar: '',
    age: '',
    gender: '',
    assets: '',
    livingEnvironment: '',
    homeLayout: '',
    persona: '',
    coins: 0,
  })
  const [coinDraft, setCoinDraft] = useState('500')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setDraft({
        name: profile.name,
        avatar: profile.avatar,
        age: profile.age,
        gender: profile.gender,
        assets: profile.assets,
        livingEnvironment: profile.livingEnvironment,
        homeLayout: profile.homeLayout,
        persona: profile.persona,
        coins: profile.coins,
      })
      setCoinDraft(String(profile.coins))
    }
  }, [profile])

  if (!profile) {
    return (
      <PhoneAppShell title="我的身份">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'var(--c-primary-soft)' }}
          >
            <User size={28} style={{ color: 'var(--c-primary)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--c-text-dim)' }}>
            尚未建立域界身份
          </p>
          <p className="text-[11px]" style={{ color: 'var(--c-text-muted)' }}>
            请在「设置 → 我的模板」中创建玩家模板
          </p>
        </div>
      </PhoneAppShell>
    )
  }

  const set = (key: keyof typeof draft, value: string | number) => {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const onPickAvatar = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set('avatar', reader.result as string)
    reader.readAsDataURL(file)
  }

  const save = async () => {
    if (!draft.name.trim()) {
      showToast('请填写姓名')
      return
    }
    setSaving(true)
    const coins = Math.max(0, Number(coinDraft) || 0)
    await updateProfile(profile.id, {
      name: draft.name.trim(),
      avatar: draft.avatar,
      age: draft.age,
      gender: draft.gender,
      assets: draft.assets,
      livingEnvironment: draft.livingEnvironment,
      homeLayout: draft.homeLayout,
      persona: draft.persona,
      coins,
    })
    setSaving(false)
    showToast('身份已更新', '域界档案已保存')
  }

  return (
    <PhoneAppShell title="我的身份">
      <div className="flex flex-col gap-3 pb-4">
        {/* 头像与姓名 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card flex items-center gap-4 p-4"
        >
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full transition-transform hover:scale-105"
              style={{
                border: '2px dashed var(--c-primary)',
                background: 'rgba(42,158,196,0.08)',
              }}
            >
              {draft.avatar ? (
                <img src={draft.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center" style={{ color: 'var(--c-primary)' }}>
                  <Camera size={20} />
                  <span className="mt-1 text-[9px]">点击上传</span>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/10">
                <Camera size={18} className="opacity-0 text-white transition-opacity group-hover:opacity-100" />
              </div>
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickAvatar(e.target.files?.[0])}
          />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--c-primary)' }}>
                域界代号 / Name
              </label>
            </div>
            <input
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full rounded-xl border-none px-3 py-2 text-base font-medium outline-none focus:ring-2"
              style={{ background: 'var(--c-bg-soft)', color: 'var(--c-text)' }}
              placeholder="你的名字"
            />
          </div>
        </motion.div>

        {/* 基础档案 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-4"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--c-primary)' }}>
            基础档案
          </p>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.slice(0, 4).map((f) => (
              <div key={f.key} className={f.textarea ? 'col-span-2' : ''}>
                <label className="mb-1 block text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                  {f.label}
                </label>
                {f.textarea ? (
                  <textarea
                    value={draft[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    rows={2}
                    className="w-full resize-none rounded-xl border-none px-3 py-2 text-sm outline-none focus:ring-2"
                    style={{ background: 'var(--c-bg-soft)', color: 'var(--c-text)' }}
                  />
                ) : (
                  <input
                    value={draft[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full rounded-xl border-none px-3 py-2 text-sm outline-none focus:ring-2"
                    style={{ background: 'var(--c-bg-soft)', color: 'var(--c-text)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* 人设细节 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--c-primary)' }}>
            人设细节
          </p>
          <div className="flex flex-col gap-3">
            {FIELDS.slice(4).map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                  {f.label}
                </label>
                <textarea
                  value={draft[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={f.key === 'persona' ? 4 : 2}
                  className="w-full resize-none rounded-xl border-none px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ background: 'var(--c-bg-soft)', color: 'var(--c-text)' }}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* 星币余额 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-4"
        >
          <p className="mb-2 flex items-center gap-1 text-xs" style={{ color: 'var(--c-text)' }}>
            <Coins size={14} style={{ color: 'var(--c-gold)' }} /> 星币余额
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              value={coinDraft}
              onChange={(e) => setCoinDraft(e.target.value)}
              className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
            />
            <span className="flex items-center text-sm font-medium" style={{ color: 'var(--c-gold)' }}>G</span>
          </div>
        </motion.div>

        {/* 保存 */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-50 press-scale"
          style={{
            background: 'linear-gradient(135deg, var(--c-primary), var(--c-accent))',
            color: '#fff',
            boxShadow: '0 6px 20px rgba(42,158,196,0.3)',
          }}
        >
          <Check size={18} />
          {saving ? '保存中…' : '保存档案'}
        </motion.button>
      </div>
    </PhoneAppShell>
  )
}
