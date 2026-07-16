import { useEffect } from 'react'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'
import { AZERIA_WORLD_REGIONS } from '@/data/azeriaWorldRegions'
import {
  useAzeriaProgressStore,
  obedienceStage,
  DEFAULT_TITLES,
  MAIN_STORY,
} from '@/store/azeriaProgressStore'
import { usePassportStore } from '@/store/passportStore'
import { useProfileStore } from '@/store/profileStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'

export function TavernReputation({ onBack }: { onBack: () => void }) {
  const reputation = useAzeriaProgressStore((s) => s.reputation)
  const bumpReputation = useAzeriaProgressStore((s) => s.bumpReputation)
  const load = useAzeriaProgressStore((s) => s.load)

  useEffect(() => {
    void load()
  }, [load])

  return (
    <TomeSubShell title="区域声望" onBack={onBack}>
      <p className="tome-hint mb-3">规则书 Ch22：八大区域各自 -100 ~ +100。高声望解锁折扣与通行，低声望触发敌意。</p>
      <ul className="tome-list">
        {AZERIA_WORLD_REGIONS.map((r) => {
          const v = reputation[r.id] ?? 0
          const pct = ((v + 100) / 200) * 100
          return (
            <li key={r.id} className="tome-list-item flex-col !items-stretch gap-2">
              <div className="flex justify-between">
                <span className="tome-list-item__name">{r.name}</span>
                <span style={{ color: v >= 0 ? 'var(--c-gold)' : '#e57373' }}>{v}</span>
              </div>
              <div className="tome-progress">
                <div className="tome-progress__bar" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex gap-2 self-end">
                <button type="button" className="tome-btn" onClick={() => void bumpReputation(r.id, -5)}>
                  -5
                </button>
                <button type="button" className="tome-btn tome-btn--accent" onClick={() => void bumpReputation(r.id, 5)}>
                  +5
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </TomeSubShell>
  )
}

export function TavernObedience({ onBack }: { onBack: () => void }) {
  const bonds = usePassportStore((s) => s.bonds)
  const obedience = useAzeriaProgressStore((s) => s.obedience)
  const bumpObedience = useAzeriaProgressStore((s) => s.bumpObedience)
  const load = useAzeriaProgressStore((s) => s.load)
  const conquered = Object.values(bonds).filter((b) => b.status === 'conquered')

  useEffect(() => {
    void load()
  }, [load])

  return (
    <TomeSubShell title="服从度" onBack={onBack}>
      <p className="tome-hint mb-3">
        规则书 Ch14：抵抗者→动摇者→追随者→臣服者→所有物。同行/H/保护可提升。
      </p>
      {conquered.length === 0 && <p className="tome-hint">尚无已攻略对象。</p>}
      <ul className="tome-list">
        {conquered.map((b) => {
          const v = obedience[b.characterId] ?? 0
          const st = obedienceStage(v)
          return (
            <li key={b.characterId} className="tome-list-item flex-col !items-stretch gap-2">
              <div className="flex justify-between">
                <div>
                  <div className="tome-list-item__name">{b.displayName}</div>
                  <div className="tome-list-item__meta">
                    阶段{st.stage} · {st.name}
                  </div>
                </div>
                <span style={{ color: 'var(--c-accent)' }}>{v}%</span>
              </div>
              <div className="tome-progress">
                <div className="tome-progress__bar" style={{ width: `${v}%` }} />
              </div>
              <button
                type="button"
                className="tome-btn tome-btn--accent self-end"
                onClick={() => void bumpObedience(b.characterId, 5)}
              >
                +5 服从（同行/保护）
              </button>
            </li>
          )
        })}
      </ul>
    </TomeSubShell>
  )
}

export function TavernIndustry({ onBack }: { onBack: () => void }) {
  const industries = useAzeriaProgressStore((s) => s.industries)
  const addIndustry = useAzeriaProgressStore((s) => s.addIndustry)
  const collectDailyIncome = useAzeriaProgressStore((s) => s.collectDailyIncome)
  const load = useAzeriaProgressStore((s) => s.load)
  const showToast = useUIStore((s) => s.showToast)
  const { profiles, updateProfile } = useProfileStore()
  const settings = useSettingsStore((s) => s.settings)
  const profile = profiles.find((p) => p.id === settings.ui.activeProfileId)

  useEffect(() => {
    void load()
  }, [load])

  const presets = [
    { id: 'ind_tavern', name: '边境酒馆', type: 'tavern' as const, incomePerDay: 25 },
    { id: 'ind_inn', name: '旅店', type: 'inn' as const, incomePerDay: 40 },
    { id: 'ind_shop', name: '杂货商铺', type: 'shop' as const, incomePerDay: 35 },
    { id: 'ind_forge', name: '锻造工坊', type: 'workshop' as const, incomePerDay: 50 },
  ]

  const collect = async () => {
    const n = await collectDailyIncome()
    if (!profile || n <= 0) {
      showToast('无产业收入')
      return
    }
    await updateProfile(profile.id, { coins: (profile.coins ?? 0) + n })
    showToast('收取日结', `+${n} 金币`)
  }

  return (
    <TomeSubShell title="产业经营" onBack={onBack}>
      <p className="tome-hint mb-3">规则书 Ch5.3：置办酒馆/旅店/商铺/工坊，可委托伴侣打理。</p>
      <button type="button" className="tome-btn tome-btn--accent mb-3 w-full py-2" onClick={() => void collect()}>
        收取日结收入
      </button>
      <section className="tome-section">
        <div className="tome-section__title">已有产业（{industries.length}）</div>
        <ul className="tome-list">
          {industries.map((i) => (
            <li key={i.id} className="tome-list-item">
              <div>
                <div className="tome-list-item__name">{i.name}</div>
                <div className="tome-list-item__meta">
                  日入 {i.incomePerDay} G{i.managerName ? ` · 代管 ${i.managerName}` : ''}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="tome-section">
        <div className="tome-section__title">开办</div>
        <ul className="tome-list">
          {presets.map((p) => (
            <li key={p.id} className="tome-list-item">
              <div>
                <div className="tome-list-item__name">{p.name}</div>
                <div className="tome-list-item__meta">日入约 {p.incomePerDay} G</div>
              </div>
              <button type="button" className="tome-btn" onClick={() => void addIndustry(p).then(() => showToast('已开办', p.name))}>
                开办
              </button>
            </li>
          ))}
        </ul>
      </section>
    </TomeSubShell>
  )
}

export function TavernArenaPlay({ onBack }: { onBack: () => void }) {
  const openCombat = useUIStore((s) => s.openCombat)
  const setActiveTab = useUIStore((s) => s.setActiveTab)

  const arenas = [
    { name: '帝国大竞技场', regionId: 'central', dc: 14 },
    { name: '魔族血斗场', regionId: 'west', dc: 18 },
    { name: '深渊角斗坑', regionId: 'under', dc: 20 },
    { name: '龙族试炼场', regionId: 'north', dc: 22 },
  ]

  return (
    <TomeSubShell title="竞技场开战" onBack={onBack}>
      <p className="tome-hint mb-3">规则书 Ch21：开战将进入沉浸战斗叠层（与聊天共用）。</p>
      <ul className="tome-list">
        {arenas.map((a) => (
          <li key={a.name} className="tome-list-item">
            <div>
              <div className="tome-list-item__name">{a.name}</div>
              <div className="tome-list-item__meta">战斗 DC {a.dc}</div>
            </div>
            <button
              type="button"
              className="tome-btn tome-btn--accent"
              onClick={() => {
                openCombat({
                  enemyName: a.name,
                  dc: a.dc,
                  regionId: a.regionId,
                  prize: true,
                })
                setActiveTab('chat')
              }}
            >
              开战
            </button>
          </li>
        ))}
      </ul>
    </TomeSubShell>
  )
}

/** 称号墙（也用于图鉴） */
export function TitlesPanel({ onBack }: { onBack: () => void }) {
  const titles = useAzeriaProgressStore((s) => s.titles)
  const unlockTitle = useAzeriaProgressStore((s) => s.unlockTitle)
  const load = useAzeriaProgressStore((s) => s.load)
  useEffect(() => {
    void load()
  }, [load])

  return (
    <TomeSubShell title="称号墙" onBack={onBack}>
      <ul className="tome-list">
        {DEFAULT_TITLES.map((t) => {
          const on = titles.includes(t.id)
          return (
            <li key={t.id} className={`tome-list-item ${on ? '' : 'opacity-55'}`}>
              <div>
                <div className="tome-list-item__name">{t.name}</div>
                <div className="tome-list-item__meta">{t.condition}</div>
              </div>
              {on ? (
                <span className="tome-tag tome-tag--active">已获</span>
              ) : (
                <button type="button" className="tome-btn" onClick={() => void unlockTitle(t.id)}>
                  解锁(测)
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </TomeSubShell>
  )
}

export function StoryPanel({ onBack }: { onBack: () => void }) {
  const mainChapter = useAzeriaProgressStore((s) => s.mainChapter)
  const setMainChapter = useAzeriaProgressStore((s) => s.setMainChapter)
  const load = useAzeriaProgressStore((s) => s.load)
  useEffect(() => {
    void load()
  }, [load])

  return (
    <TomeSubShell title="主线进度" onBack={onBack}>
      <p className="tome-hint mb-3">规则书 Ch11：女神陨落与法则崩坏。</p>
      <ul className="tome-list">
        {MAIN_STORY.map((ch, i) => {
          const n = i + 1
          const status = n < mainChapter ? 'done' : n === mainChapter ? 'active' : 'locked'
          return (
            <li key={ch.id} className={`tome-list-item ${status === 'locked' ? 'opacity-45' : ''}`}>
              <div>
                <div className="tome-list-item__name">{ch.title}</div>
                <div className="tome-list-item__meta">{ch.condition}</div>
              </div>
              <span className="tome-tag tome-tag--active">
                {status === 'done' ? '完成' : status === 'active' ? '进行中' : '未解锁'}
              </span>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        className="tome-btn mt-3 w-full"
        onClick={() => void setMainChapter(Math.min(6, mainChapter + 1))}
      >
        推进一章（调试）
      </button>
    </TomeSubShell>
  )
}
