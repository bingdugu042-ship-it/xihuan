import { Home, Sparkles } from 'lucide-react'
import { usePassportStore } from '@/store/passportStore'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { HOME_PRESETS, HOME_PRESET_MAP } from '@/data/homes'
import { RACE_MAP } from '@/data/races'
import { CULTIVATION_LABELS } from '@/data/cultivation'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'

/** 原「家园」· 并入酒馆驻留 */
export function TavernResidents({ onBack }: { onBack: () => void }) {
  const homeIds = usePassportStore((s) => s.homeIds)
  const bonds = usePassportStore((s) => s.bonds)
  const homePresetId = usePassportStore((s) => s.homePresetId)
  const setHomePreset = usePassportStore((s) => s.setHomePreset)
  const placeBond = usePassportStore((s) => s.placeBond)
  const bumpCultivation = usePassportStore((s) => s.bumpCultivation)
  const showToast = useUIStore((s) => s.showToast)
  const createSession = useSessionStore((s) => s.createSession)
  const setActiveTab = useUIStore((s) => s.setActiveTab)

  const preset = HOME_PRESET_MAP[homePresetId] ?? HOME_PRESETS[0]
  const residents = homeIds.map((id) => bonds[id]).filter(Boolean)

  const talkWith = async (characterId: string) => {
    try {
      await createSession({
        type: 'private',
        regionId: 'void_throne',
        participantIds: [characterId],
        title: `酒馆驻留 · ${bonds[characterId]?.displayName ?? characterId}`,
        playMode: 'home',
        withIntro: true,
      })
      await bumpCultivation({ intimacy: 1 })
      setActiveTab('chat')
      showToast('已进入私语', preset.name)
    } catch (e) {
      showToast('无法开始对话', String(e).slice(0, 80))
    }
  }

  return (
    <TomeSubShell title="酒馆驻留" onBack={onBack}>
      <p className="tome-hint mb-3">原堕神家园并入酒馆。切换氛围后与驻留对象私语，宠溺维度更易增长。</p>

      <section className="tome-card tome-card--glow">
        <div className="tome-section__title">
          <Home size={14} /> {preset.name}
        </div>
        <p className="mt-1 text-xs" style={{ color: 'var(--c-text-dim)' }}>
          {preset.tagline}
        </p>
        <p className="tome-hint mt-2">{preset.description}</p>
      </section>

      <section className="tome-section">
        <div className="tome-section__title">切换氛围</div>
        <div className="tome-list">
          {HOME_PRESETS.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => void setHomePreset(h.id)}
              className={`tome-list-item text-left ${homePresetId === h.id ? 'tome-card--glow' : ''}`}
              style={{ width: '100%' }}
            >
              <div className="min-w-0 flex-1">
                <div className="tome-list-item__name">{h.name}</div>
                <div className="tome-list-item__meta">{h.tagline}</div>
              </div>
              {homePresetId === h.id && <span className="tome-tag tome-tag--active">生效中</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="tome-section">
        <div className="tome-section__title">
          <Sparkles size={14} /> 驻留对象（{residents.length}）
        </div>
        {residents.length === 0 && <p className="tome-hint">从队伍名册将已攻略对象安置到酒馆驻留。</p>}
        <ul className="tome-list">
          {residents.map((b) => (
            <li key={b.characterId} className="tome-list-item">
              <div>
                <div className="tome-list-item__name">{b.displayName}</div>
                <div className="tome-list-item__meta">
                  {RACE_MAP[b.raceId as keyof typeof RACE_MAP]?.name ?? b.raceId} · 可提升
                  {CULTIVATION_LABELS.intimacy.name}
                </div>
              </div>
              <div className="tome-list-item__actions">
                <button type="button" className="tome-btn" onClick={() => void talkWith(b.characterId)}>
                  私语
                </button>
                <button type="button" className="tome-btn tome-btn--ghost" onClick={() => void placeBond(b.characterId, 'none')}>
                  请离
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </TomeSubShell>
  )
}
