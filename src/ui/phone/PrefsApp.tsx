import { useState, useEffect } from 'react'
import { ShieldAlert, Heart, Ban, StickyNote, Save } from 'lucide-react'
import { PhoneAppShell } from './PhoneAppShell'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'
import { putMemory } from '@/storage/db'
import { SHARED_MEMORY_CHARACTER_ID, type PlayerPreferences } from '@/types'

const EMPTY: PlayerPreferences = { likes: '', dislikes: '', taboos: '', notes: '' }
const PREF_MEMORY_ID = 'mem-player-prefs-sticky'

/** 手机 · 偏好贴纸 — 男主会读取并遵守；禁忌可作为负面提示词 */
export function PrefsApp() {
  const prefs = useSettingsStore((s) => s.settings.ui.playerPreferences ?? EMPTY)
  const updateUI = useSettingsStore((s) => s.updateUI)
  const showToast = useUIStore((s) => s.showToast)
  const [draft, setDraft] = useState<PlayerPreferences>(prefs)

  useEffect(() => {
    setDraft(prefs)
  }, [prefs.likes, prefs.dislikes, prefs.taboos, prefs.notes])

  const save = async () => {
    await updateUI({ playerPreferences: draft })
    const bits = [
      draft.likes.trim() && `喜欢：${draft.likes.trim()}`,
      draft.dislikes.trim() && `避雷：${draft.dislikes.trim()}`,
      draft.taboos.trim() && `禁忌：${draft.taboos.trim()}`,
      draft.notes.trim() && `补充：${draft.notes.trim()}`,
    ].filter(Boolean)
    if (bits.length) {
      await putMemory({
        id: PREF_MEMORY_ID,
        characterId: SHARED_MEMORY_CHARACTER_ID,
        type: 'preference',
        text: bits.join('；'),
        tags: ['偏好贴纸', '喜欢', '避雷', '禁忌'],
        originSessionId: 'prefs-app',
        timestamp: Date.now(),
      })
    }
    showToast('偏好已保存', '已写入记忆池，男主会据此调整')
  }

  return (
    <PhoneAppShell title="偏好贴纸">
      <p className="mb-3 text-[11px] leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
        写下你喜欢什么、避雷什么。男主（员工）会读取并遵循。
        「禁忌」相当于负面提示词——模型遵守，但不会在对话里把清单念给你听。
      </p>

      <Field
        icon={<Heart size={14} />}
        label="喜欢 · 希望发生"
        placeholder="例如：温柔引导、更多感官描写、慢热前戏…"
        value={draft.likes}
        onChange={(likes) => setDraft((d) => ({ ...d, likes }))}
        accent="var(--hb-coral, #e8a0b0)"
      />
      <Field
        icon={<Ban size={14} />}
        label="避雷 · 不想要"
        placeholder="例如：突然粗暴、跳过铺垫、不必要的羞辱…"
        value={draft.dislikes}
        onChange={(dislikes) => setDraft((d) => ({ ...d, dislikes }))}
        accent="var(--hb-ocean, #2a9ec4)"
      />
      <Field
        icon={<ShieldAlert size={14} />}
        label="禁忌 · 负面提示词"
        placeholder="硬性拒绝的内容，男主必须避开…"
        value={draft.taboos}
        onChange={(taboos) => setDraft((d) => ({ ...d, taboos }))}
        accent="#c44d6e"
      />
      <Field
        icon={<StickyNote size={14} />}
        label="补充说明"
        placeholder="称呼偏好、节奏、其他希望对方知道的…"
        value={draft.notes}
        onChange={(notes) => setDraft((d) => ({ ...d, notes }))}
        accent="var(--c-accent)"
      />

      <button
        type="button"
        onClick={() => void save()}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium"
        style={{ background: 'linear-gradient(135deg, #2a9ec4, #1a6f8f)', color: '#fff' }}
      >
        <Save size={16} />
        保存贴纸
      </button>
    </PhoneAppShell>
  )
}

function Field({
  icon,
  label,
  placeholder,
  value,
  onChange,
  accent,
}: {
  icon: React.ReactNode
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  accent: string
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium" style={{ color: accent }}>
        {icon}
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl px-3 py-2.5 text-[13px] outline-none"
        style={{
          background: 'rgba(42, 158, 196, 0.08)',
          border: '1px solid rgba(42, 158, 196, 0.22)',
          color: 'var(--c-text)',
        }}
      />
    </label>
  )
}
