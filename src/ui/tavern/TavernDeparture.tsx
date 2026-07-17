import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { usePassportStore } from '@/store/passportStore'
import { useUIStore } from '@/store/uiStore'
import { useCustomRegionStore } from '@/store/customRegionStore'
import { useSessionStore } from '@/store/sessionStore'
import { RACE_MAP } from '@/data/races'
import { PARTY_SIZE_LIMIT } from '@/data/homes'
import { FACILITIES } from '@/data/facilities'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'

/** 出发冒险：点选目标域直接跳转设施详情/游玩（与地图一致） */
export function TavernDeparture({ onBack }: { onBack: () => void }) {
  const bonds = usePassportStore((s) => s.bonds)
  const partyIds = usePassportStore((s) => s.partyIds)
  const placeBond = usePassportStore((s) => s.placeBond)
  const showToast = useUIStore((s) => s.showToast)
  const openFacilityPlayPage = useUIStore((s) => s.openFacilityPlayPage)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const setSelectedRegionId = useUIStore((s) => s.setSelectedRegionId)
  const customRegions = useCustomRegionStore((s) => s.regions)
  const createSession = useSessionStore((s) => s.createSession)
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

  const jumpTo = async (regionId: string, name: string) => {
    setTargetRegion(regionId)
    setSelectedRegionId(regionId)
    const custom = customRegions.find((r) => r.id === regionId)
    if (custom) {
      const participants =
        partyIds.length > 0
          ? partyIds
          : custom.defaultParticipants.length
            ? custom.defaultParticipants
            : []
      await createSession({
        type: custom.type,
        regionId: custom.id,
        participantIds: participants,
        title: `自定义地点 · ${custom.name}`,
        playMode: '自由游玩',
        withIntro: true,
      })
      setActiveTab('chat')
      showToast('进入自定义地点', 'AI 已读取地点世界书')
      return
    }
    openFacilityPlayPage(regionId)
    showToast('出征', `前往 ${name}`)
  }

  const depart = () => {
    if (!targetRegion) return
    if (party.length === 0) {
      showToast('建议带至少一名同行者', '规则书：伴侣同行可获魅力判定优势')
    }
    const fac = FACILITIES.find((f) => f.id === targetRegion)
    const custom = customRegions.find((r) => r.id === targetRegion)
    jumpTo(targetRegion, fac?.name ?? custom?.name ?? targetRegion)
  }

  return (
    <TomeSubShell title="出发冒险" onBack={onBack}>
      <p className="tome-hint mb-3">
        选择同行者后，直接点击目标冒险域即可跳转（等同地图详情进入）。自定义地点也会列出。
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
                  {b.role === 'servant' ? '仆从' : '伴侣'} ·{' '}
                  {RACE_MAP[b.raceId as keyof typeof RACE_MAP]?.name ?? b.raceId}
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
                <button
                  type="button"
                  className="tome-btn tome-btn--accent"
                  onClick={() => void toggleParty(b.characterId)}
                >
                  编入
                </button>
              </li>
            ))}
        </ul>
      </section>

      <section className="tome-section">
        <div className="tome-section__title">
          <MapPin size={14} /> 目标冒险域 · 点击直达
        </div>
        <div className="tome-grid-2">
          {FACILITIES.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`tome-card text-left ${targetRegion === f.id ? 'tome-card--glow' : ''}`}
              onClick={() => void jumpTo(f.id, f.name)}
            >
              <div className="text-sm font-medium">{f.name}</div>
              <div className="tome-list-item__meta mt-1">{f.tagline}</div>
              <div className="mt-2 text-[10px]" style={{ color: 'var(--c-gold)' }}>
                点击进入 · 同地图详情
              </div>
            </button>
          ))}
          {customRegions.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`tome-card text-left ${targetRegion === r.id ? 'tome-card--glow' : ''}`}
              onClick={() => void jumpTo(r.id, r.name)}
            >
              <div className="text-sm font-medium">{r.name}</div>
              <div className="tome-list-item__meta mt-1">{r.mapNote || r.premise}</div>
              <div className="mt-2 text-[10px]" style={{ color: 'var(--c-accent)' }}>
                自定义地点
              </div>
            </button>
          ))}
        </div>
      </section>

      <button type="button" className="tome-btn tome-btn--accent mt-2 w-full py-3 text-center" onClick={depart}>
        确认出征当前选中
      </button>
    </TomeSubShell>
  )
}
