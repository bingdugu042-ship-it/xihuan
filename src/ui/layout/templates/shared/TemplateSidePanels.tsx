import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Flame } from 'lucide-react'
import { stageLabel } from '@/ai/npcGenerator'
import { usePassportStore } from '@/store/passportStore'
import { FACILITIES } from '@/data/facilities'
import { useBodyStatsStore, FEMALE_STAT_LABELS, MALE_STAT_LABELS } from '@/store/bodyStatsStore'
import { NpcStatusBar } from '@/ui/components/chat/NpcStatusBar'
import { NpcBioCard } from '@/ui/components/chat/NpcBioCard'
import type { Session } from '@/types'

export function TemplatePassportPanel({ compact }: { compact?: boolean }) {
  const { stamps, loaded, load, stampCount } = usePassportStore()
  const count = stampCount()
  const total = FACILITIES.length
  const pct = Math.round((count / total) * 100)

  useEffect(() => {
    if (!loaded) void load()
  }, [loaded, load])

  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: 'var(--c-surface)',
        border: '1px solid var(--c-glass-border)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <p className="mb-2 text-[10px] tracking-wider" style={{ color: 'var(--c-accent)' }}>
        图鉴集邮
      </p>
      <div className="mb-2 flex items-center gap-3">
        <div
          className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xs font-medium"
          style={{
            background: `conic-gradient(var(--c-primary) ${pct}%, var(--c-bg-soft) 0)`,
          }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-[10px]"
            style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
          >
            {count}/{total}
          </div>
        </div>
        {!compact && (
          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
            完成体验后在余韵弹窗契约，集邮印章
          </p>
        )}
      </div>
      {!compact && (
        <div className="max-h-32 space-y-1 overflow-y-auto">
          {FACILITIES.slice(0, 8).map((f) => (
            <div key={f.id} className="flex justify-between text-[9px]" style={{ color: 'var(--c-text-dim)' }}>
              <span>{f.name}</span>
              <span style={{ color: stamps[f.id] ? 'var(--c-accent)' : 'var(--c-text-dim)' }}>
                {stamps[f.id] ? `「${f.stampName}」` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function TemplateBodyPanel() {
  const [open, setOpen] = useState(false)
  const { gender, stats, stateLabels, loaded, load } = useBodyStatsStore()

  useEffect(() => {
    if (!loaded) void load()
  }, [loaded, load])

  const labels = gender === 'male' ? MALE_STAT_LABELS : FEMALE_STAT_LABELS
  const topKeys = Object.keys(labels).slice(0, 4)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--c-surface)',
        border: '1px solid var(--c-glass-border)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-[10px]" style={{ color: 'var(--c-accent)' }}>
          身体面板
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="space-y-1.5 border-t px-3 py-2" style={{ borderColor: 'var(--c-border)' }}>
          {topKeys.map((key) => (
            <div key={key}>
              <div className="flex justify-between text-[9px]" style={{ color: 'var(--c-text-dim)' }}>
                <span>{labels[key]}</span>
                <span>{stats[key] ?? 0}%</span>
              </div>
              <div className="mt-0.5 h-1 overflow-hidden rounded-full" style={{ background: 'var(--c-bg-soft)' }}>
                <div className="h-full rounded-full" style={{ width: `${stats[key] ?? 0}%`, background: 'var(--c-primary)' }} />
              </div>
            </div>
          ))}
          <p className="pt-1 text-[9px]" style={{ color: 'var(--c-text-dim)' }}>
            {stateLabels.lower ?? '—'} · {stateLabels.stamina ?? '—'}
          </p>
        </div>
      )}
      {!open && topKeys[0] && (
        <p className="px-3 pb-2 text-[9px]" style={{ color: 'var(--c-text-dim)' }}>
          {labels[topKeys[0]]} {stats[topKeys[0]] ?? 0}%
        </p>
      )}
    </div>
  )
}

export function TemplateNpcCard({ session }: { session: Session | null }) {
  const npc = session?.dynamicNpc
  if (!npc) {
    return (
      <div
        className="rounded-xl p-3 text-[10px]"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-glass-border)', color: 'var(--c-text-dim)' }}
      >
        进入冒险域后，男主状态将显示于此
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: 'var(--c-surface)',
        border: '1px solid var(--c-glass-border)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <Flame size={12} style={{ color: 'var(--c-accent)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--c-text)', fontFamily: 'var(--scheme-title-font, inherit)' }}>
          {npc.displayName}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[9px]"
          style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
        >
          {stageLabel(npc.corruptionStage)}
        </span>
      </div>
      <NpcBioCard npc={npc} />
      <NpcStatusBar
        variant="panel"
        desire={npc.desire}
        innerThought={npc.innerThought}
        bodyState={npc.bodyState}
      />
      <p className="mt-2 text-[9px]" style={{ color: 'var(--c-text-dim)' }}>
        堕落 {npc.corruption}% · 关注 {npc.attention}% · 独占 {npc.possessiveness}%
      </p>
    </div>
  )
}
