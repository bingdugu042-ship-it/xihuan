import { useEffect } from 'react'
import { Flame, Sparkles, Megaphone } from 'lucide-react'
import { PhoneAppShell } from './PhoneAppShell'
import { usePassportStore } from '@/store/passportStore'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'

/** 烙印系统 — 管理已保留男主的烙印与召唤（UI，不走指令） */
export function BrandApp() {
  const { roster, loaded, load, brandNpc } = usePassportStore()
  const summonSavedNpc = useSessionStore((s) => s.summonSavedNpc)
  const activeSession = useSessionStore((s) => s.activeSession)
  const showToast = useUIStore((s) => s.showToast)
  const setActiveTab = useUIStore((s) => s.setActiveTab)

  useEffect(() => {
    if (!loaded) void load()
  }, [loaded, load])

  const candidates = roster.filter((n) => n.branded || n.corruption >= 76)
  const branded = roster.filter((n) => n.branded)

  const onSummon = async (id: string) => {
    if (!activeSession) {
      showToast('请先进入一座冒险域', '在对话中再召唤')
      return
    }
    const ok = await summonSavedNpc(id)
    if (ok) {
      showToast('男主已应召')
      setActiveTab('chat')
    }
  }

  return (
    <PhoneAppShell title="烙印系统">
      <p className="mb-3 text-[11px] leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
        堕落达到较高阶段后可烙印。烙印男主可在当前冒险域对话中召唤出席——不必再记指令。
      </p>

      <p className="mb-2 text-xs" style={{ color: 'var(--c-primary)' }}>
        已烙印 ({branded.length})
      </p>
      {branded.length === 0 ? (
        <p className="mb-4 text-center text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
          还没有烙印对象。先在互动中保留男主，再回来烙印。
        </p>
      ) : (
        <div className="mb-4 flex flex-col gap-2">
          {branded.map((n) => (
            <div key={n.id} className="glass-card p-3">
              <p className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                <Flame size={12} className="mr-1 inline" style={{ color: '#ff5c8a' }} />
                {n.displayName}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                {n.facilityName} · {n.npcArchetype}
              </p>
              <button
                type="button"
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[11px]"
                style={{ background: 'linear-gradient(135deg,#2a9ec4,#1a6f8f)', color: '#fff' }}
                onClick={() => void onSummon(n.id)}
              >
                <Megaphone size={12} /> 召唤到当前对话
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="mb-2 text-xs" style={{ color: 'var(--c-text)' }}>
        <Sparkles size={12} className="mr-1 inline" /> 可烙印 ({candidates.filter((n) => !n.branded).length})
      </p>
      {candidates.filter((n) => !n.branded).length === 0 ? (
        <p className="text-center text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
          暂无达到烙印门槛的保留对象（堕落 ≥ 76%）。
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {candidates
            .filter((n) => !n.branded)
            .map((n) => (
              <div key={n.id} className="glass-card p-3">
                <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                  {n.displayName}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                  {n.facilityName} · 堕落 {n.corruption}%
                </p>
                <button
                  type="button"
                  className="mt-2 w-full rounded-lg py-1.5 text-[11px]"
                  style={{ background: 'rgba(255,92,138,0.2)', color: '#ff5c8a' }}
                  onClick={() => {
                    void brandNpc(n.id)
                    showToast('烙印完成', n.displayName)
                  }}
                >
                  烙印
                </button>
              </div>
            ))}
        </div>
      )}
    </PhoneAppShell>
  )
}
