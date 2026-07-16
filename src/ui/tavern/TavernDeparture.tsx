import { useState } from 'react'
import { usePassportStore } from '@/store/passportStore'
import { useUIStore } from '@/store/uiStore'
import { RACE_MAP } from '@/data/races'
import { PARTY_SIZE_LIMIT } from '@/data/homes'
import { FACILITIES } from '@/data/facilities'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'

export function TavernDeparture({ onBack }: { onBack: () => void }) {
  const bonds = usePassportStore((s) => s.bonds)
  const partyIds = usePassportStore((s) => s.partyIds)
  const placeBond = usePassportStore((s) => s.placeBond)
  const showToast = useUIStore((s) => s.showToast)
  const openFacilityPlayPage = useUIStore((s) => s.openFacilityPlayPage)
  const [targetRegion, setTargetRegion] = useState(FACILITIES[0]?.id ?? '')

  const conquered = Object.values(bonds).filter((b) => b.status === 'conquered')
  const party = partyIds.map((id) => bonds[id]).filter(Boolean)

  const toggleParty = async (id: string) => {
    const inParty = partyIds.includes(id)
    if (inParty) {
      await placeBond(id, 'none')
      return
    }
    if (partyIds.length >= PARTY_SIZE_LIMIT) {
      showToast('编组已满', `伴侣与仆从共享上限 ${PARTY_SIZE_LIMIT} 人`)
      return
    }
    const res = await placeBond(id, 'party')
    if (!res.ok) showToast('无法编入', res.reason ?? '')
  }

  const depart = () => {
    if (!targetRegion) return
    if (party.length === 0) {
      showToast('建议带至少一名同行者', '规则书：伴侣同行可获魅力判定优势')
    }
    openFacilityPlayPage(targetRegion)
    showToast('出征', `前往 ${FACILITIES.find((f) => f.id === targetRegion)?.name ?? targetRegion}`)
  }

  return (
    <TomeSubShell title="出发冒险" onBack={onBack}>
      <p className="tome-hint mb-3">
        选择同行伴侣/仆从（上限 {PARTY_SIZE_LIMIT}），再选定目标冒险域。好感≥70 的伴侣在旁时魅力判定获优势。
      </p>

      <section className="tome-section">
        <div className="tome-section__title">当前编组（{party.length}/{PARTY_SIZE_LIMIT}）</div>
        {party.length === 0 && <p className="tome-hint">尚未选择同行者，可 solo 出发。</p>}
        <ul className="tome-list">
          {party.map((b) => (
            <li key={b.characterId} className="tome-list-item">
              <div>
                <div className="tome-list-item__name">{b.displayName}</div>
                <div className="tome-list-item__meta">
                  {b.role === 'servant' ? '仆从' : '伴侣'} · {RACE_MAP[b.raceId as keyof typeof RACE_MAP]?.name ?? b.raceId}
                </div>
              </div>
              <button type="button" className="tome-btn" onClick={() => void toggleParty(b.characterId)}>
                移出
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="tome-section">
        <div className="tome-section__title">可编入（已攻略）</div>
        <ul className="tome-list">
          {conquered
            .filter((b) => !partyIds.includes(b.characterId))
            .map((b) => (
              <li key={b.characterId} className="tome-list-item">
                <div>
                  <div className="tome-list-item__name">{b.displayName}</div>
                  <div className="tome-list-item__meta">
                    {RACE_MAP[b.raceId as keyof typeof RACE_MAP]?.name ?? b.raceId}
                  </div>
                </div>
                <button type="button" className="tome-btn tome-btn--accent" onClick={() => void toggleParty(b.characterId)}>
                  编入
                </button>
              </li>
            ))}
        </ul>
      </section>

      <section className="tome-section">
        <div className="tome-section__title">目标冒险域</div>
        <div className="tome-grid-2">
          {FACILITIES.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`tome-card text-left ${targetRegion === f.id ? 'tome-card--glow' : ''}`}
              onClick={() => setTargetRegion(f.id)}
            >
              <div className="text-sm font-medium">{f.name}</div>
              <div className="tome-list-item__meta mt-1">{f.tagline}</div>
            </button>
          ))}
        </div>
      </section>

      <button type="button" className="tome-btn tome-btn--accent mt-2 w-full py-3 text-center" onClick={depart}>
        确认出征
      </button>
    </TomeSubShell>
  )
}
