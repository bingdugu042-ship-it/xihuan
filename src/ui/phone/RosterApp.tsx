import { useEffect } from 'react'
import { Star, Trash2, Megaphone, Flame } from 'lucide-react'
import { usePassportStore } from '@/store/passportStore'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { PhoneAppShell } from './PhoneAppShell'

export function RosterApp() {
  const { roster, loaded, load, brandNpc, removeNpc } = usePassportStore()
  const summonSavedNpc = useSessionStore((s) => s.summonSavedNpc)
  const activeSession = useSessionStore((s) => s.activeSession)
  const showToast = useUIStore((s) => s.showToast)
  const setActiveTab = useUIStore((s) => s.setActiveTab)

  useEffect(() => {
    if (!loaded) void load()
  }, [loaded, load])

  const onSummon = async (id: string) => {
    if (!activeSession) {
      showToast('请先进入一座冒险域')
      return
    }
    const ok = await summonSavedNpc(id)
    if (ok) {
      showToast('男主已应召')
      setActiveTab('chat')
    }
  }

  return (
    <PhoneAppShell title="男主名册">
      <p className="mb-3 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
        互动后可选择保留。堕落≥76% 可烙印；已烙印者可在当前冒险域对话中召唤。
      </p>
      {roster.length === 0 ? (
        <p className="text-center text-xs" style={{ color: 'var(--c-text-dim)' }}>
          还没有保留的男主。深入互动后会弹出「保留」邀请。
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {roster.map((n) => (
            <div key={n.id} className="glass-card p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                  {n.displayName}
                  {n.branded && (
                    <Star size={12} className="ml-1 inline" style={{ color: 'var(--c-accent)', fill: 'var(--c-accent)' }} />
                  )}
                </p>
                <button type="button" onClick={() => void removeNpc(n.id)} className="p-1" style={{ color: 'var(--c-text-dim)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                {n.facilityName} · {n.npcArchetype}
              </p>
              <p className="mt-1 text-[10px]" style={{ color: 'var(--c-primary)' }}>
                堕落 {n.corruption}% {n.branded ? '· 已烙印' : ''}
              </p>
              <div className="mt-2 flex gap-2">
                {!n.branded && n.corruption >= 76 && (
                  <button
                    type="button"
                    onClick={() => {
                      void brandNpc(n.id)
                      showToast('烙印完成', n.displayName)
                    }}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px]"
                    style={{ background: 'rgba(255,92,138,0.2)', color: '#ff5c8a' }}
                  >
                    <Flame size={12} /> 烙印
                  </button>
                )}
                {n.branded && (
                  <button
                    type="button"
                    onClick={() => void onSummon(n.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px]"
                    style={{ background: 'linear-gradient(135deg,#2a9ec4,#1a6f8f)', color: '#fff' }}
                  >
                    <Megaphone size={12} /> 召唤
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PhoneAppShell>
  )
}
