import { Users, Crown, Home } from 'lucide-react'
import { usePassportStore } from '@/store/passportStore'
import { useUIStore } from '@/store/uiStore'
import { RACE_MAP } from '@/data/races'
import { CULTIVATION_LABELS, CULTIVATION_MAX, type CultivationKey } from '@/data/cultivation'
import type { BondPlacement } from '@/types'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'

export function TavernPartyPanel({ onBack }: { onBack: () => void }) {
  const bonds = usePassportStore((s) => s.bonds)
  const partyIds = usePassportStore((s) => s.partyIds)
  const cultivation = usePassportStore((s) => s.cultivation)
  const placeBond = usePassportStore((s) => s.placeBond)
  const showToast = useUIStore((s) => s.showToast)

  const conquered = Object.values(bonds).filter((b) => b.status === 'conquered')
  const party = partyIds.map((id) => bonds[id]).filter(Boolean)
  const partners = conquered.filter((b) => b.role !== 'servant')
  const servants = conquered.filter((b) => b.role === 'servant')

  const move = async (id: string, placement: BondPlacement) => {
    const res = await placeBond(id, placement)
    showToast(
      res.ok
        ? placement === 'party'
          ? '已编入出征'
          : placement === 'home'
            ? '已安置酒馆驻留'
            : '已移出'
        : (res.reason ?? '失败'),
    )
  }

  return (
    <TomeSubShell title="队伍名册" onBack={onBack}>
      <section className="tome-section">
        <div className="tome-section__title">
          <Crown size={14} /> 轻养成
        </div>
        <div className="tome-card">
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(CULTIVATION_LABELS) as CultivationKey[]).map((k) => (
              <div key={k} className="text-xs" style={{ color: 'var(--c-text)' }}>
                <div className="flex justify-between">
                  <span>{CULTIVATION_LABELS[k].name}</span>
                  <span>
                    {cultivation[k]}/{CULTIVATION_MAX}
                  </span>
                </div>
                <div className="tome-progress mt-1.5">
                  <div className="tome-progress__bar" style={{ width: `${(cultivation[k] / CULTIVATION_MAX) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tome-section">
        <div className="tome-section__title">
          <Users size={14} /> 出征编组（{party.length}/4）
        </div>
        {party.length === 0 && <p className="tome-hint">空编组。伴侣与仆从共享 4 人上限。</p>}
        <ul className="tome-list">
          {party.map((b) => (
            <li key={b.characterId} className="tome-list-item">
              <div>
                <div className="tome-list-item__name">{b.displayName}</div>
                <div className="tome-list-item__meta">
                  {b.role === 'servant' ? '仆从' : '伴侣'} · {RACE_MAP[b.raceId as keyof typeof RACE_MAP]?.name ?? b.raceId}
                </div>
              </div>
              <button type="button" className="tome-btn" onClick={() => void move(b.characterId, 'none')}>
                移出
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="tome-section">
        <div className="tome-section__title">伴侣（{partners.length}）</div>
        <ul className="tome-list">
          {partners
            .filter((b) => b.placement !== 'party')
            .map((b) => (
              <li key={b.characterId} className="tome-list-item">
                <div>
                  <div className="tome-list-item__name">{b.displayName}</div>
                  <div className="tome-list-item__meta">
                    {RACE_MAP[b.raceId as keyof typeof RACE_MAP]?.name ?? b.raceId}
                    {b.placement === 'home' ? ' · 驻留中' : ''}
                  </div>
                </div>
                <div className="tome-list-item__actions">
                  <button type="button" className="tome-btn" onClick={() => void move(b.characterId, 'party')}>
                    出征
                  </button>
                  <button type="button" className="tome-btn tome-btn--accent" onClick={() => void move(b.characterId, 'home')}>
                    <Home size={10} className="inline" /> 驻留
                  </button>
                </div>
              </li>
            ))}
        </ul>
      </section>

      {servants.length > 0 && (
        <section className="tome-section">
          <div className="tome-section__title">编入仆从（{servants.length}）</div>
          <ul className="tome-list">
            {servants.map((b) => (
              <li key={b.characterId} className="tome-list-item">
                <div className="tome-list-item__name">{b.displayName}</div>
                <button type="button" className="tome-btn" onClick={() => void move(b.characterId, 'party')}>
                  带上
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </TomeSubShell>
  )
}
