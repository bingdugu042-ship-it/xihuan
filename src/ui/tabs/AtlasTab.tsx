import { BookOpen, Map as MapIcon, Users, Skull, Award, Settings, ScrollText, Building2, Flag, CircleDot } from 'lucide-react'
import { usePassportStore } from '@/store/passportStore'
import { useUIStore } from '@/store/uiStore'
import { useDataStore } from '@/store/dataStore'
import {
  useAzeriaProgressStore,
  CITY_GUIDES,
  MONSTER_ENTRIES,
  DEFAULT_TITLES,
  MAIN_STORY,
} from '@/store/azeriaProgressStore'
import { AZERIA_ENDINGS } from '@/data/azeriaEndings'
import { AZERIA_WORLD_REGIONS, cityNames } from '@/data/azeriaWorldRegions'
import { RACES, RACE_MAP } from '@/data/races'
import { FACILITIES, STAMP_UNLOCK_TIERS } from '@/data/facilities'
import { CONQUEST_DEPENDENCE_THRESHOLD, CONQUEST_FAVOR_THRESHOLD } from '@/data/cultivation'
import type { BondStatus } from '@/types'
import { FeatureCard, FeatureCardGrid, AtlasCoverCard } from '@/ui/shared/FeatureCard'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'
import { getCharacterImageCandidates, characterPlaceholder, normalizeAssetPath } from '@/utils/image'
import { extractSectionByHeading } from '@/worldview/azeriaRulebook'
import { useEffect, useMemo } from 'react'
import { PassportTab } from '@/ui/tabs/PassportTab'

const STATUS_LABEL: Record<BondStatus, string> = {
  unmet: '未遇',
  met: '邂逅',
  courting: '攻略中',
  conquered: '已攻略',
}

const MONSTER_SNIPPET = extractSectionByHeading('二十四、怪物图鉴').slice(0, 800)
const TITLE_SNIPPET = extractSectionByHeading('二十二、称号/声望系统').slice(0, 600)

function AtlasHub() {
  const setAtlasSubView = useUIStore((s) => s.setAtlasSubView)
  const conqueredCount = usePassportStore((s) => s.conqueredCount)
  const stampCount = usePassportStore((s) => s.stampCount)
  const mainChapter = useAzeriaProgressStore((s) => s.mainChapter)
  const titles = useAzeriaProgressStore((s) => s.titles)
  const monstersSeen = useAzeriaProgressStore((s) => s.monstersSeen)

  return (
    <div className="tome-page">
      <header className="tome-page__header flex items-start justify-between gap-3">
        <div>
          <h1 className="tome-page__title">艾泽利亚图鉴</h1>
          <p className="tome-page__subtitle">结局线、八大区域、羁绊与怪物——卡片式浏览，遵从规则书。</p>
        </div>
        <button type="button" className="tome-btn tome-btn--ghost shrink-0" onClick={() => useUIStore.getState().setActiveTab('settings')}>
          <Settings size={12} className="inline" /> 设置
        </button>
      </header>

      <div className="tome-stat-grid">
        <div className="tome-stat">
          <div className="tome-stat__value tome-stat__value--gold">{conqueredCount()}</div>
          <div className="tome-stat__label">已攻略</div>
        </div>
        <div className="tome-stat">
          <div className="tome-stat__value tome-stat__value--accent">
            {stampCount()}/{FACILITIES.length}
          </div>
          <div className="tome-stat__label">域印</div>
        </div>
        <div className="tome-stat">
          <div className="tome-stat__value">{mainChapter}/6</div>
          <div className="tome-stat__label">主线章</div>
        </div>
        <div className="tome-stat">
          <div className="tome-stat__value">
            {titles.length}/{DEFAULT_TITLES.length}
          </div>
          <div className="tome-stat__label">称号</div>
        </div>
      </div>

      <FeatureCardGrid>
        <FeatureCard icon={ScrollText} label="主线进度" sub="女神陨落与法则" color="#c9a35a" onClick={() => setAtlasSubView('story')} />
        <FeatureCard icon={BookOpen} label="结局图鉴" sub="7 条终章分支" color="#c96b8a" onClick={() => setAtlasSubView('endings')} />
        <FeatureCard icon={MapIcon} label="区域图鉴" sub="八大领域与城市" color="#3a9e9a" onClick={() => setAtlasSubView('regions')} />
        <FeatureCard icon={Building2} label="城市导览" sub="各大城地标" color="#7eb8d4" onClick={() => setAtlasSubView('cities')} />
        <FeatureCard icon={Users} label="羁绊名册" sub="伴侣与攻略进度" color="#d4b06a" onClick={() => setAtlasSubView('bonds')} />
        <FeatureCard
          icon={Skull}
          label="怪物收藏"
          sub={`${monstersSeen.length}/${MONSTER_ENTRIES.length} 已见`}
          color="#8a3a4a"
          onClick={() => setAtlasSubView('monsters')}
        />
        <FeatureCard icon={Award} label="称号墙" sub="声望称号收集" color="#7eb8d4" onClick={() => setAtlasSubView('titles')} />
        <FeatureCard icon={Flag} label="阵营" sub="四大阵营选择" color="#a84a4a" onClick={() => setAtlasSubView('faction')} />
        <FeatureCard icon={CircleDot} label="域印集邮" sub="冒险契约盖章" color="#c9a35a" onClick={() => setAtlasSubView('stamps')} />
      </FeatureCardGrid>

      <section className="tome-card tome-card--glow tome-hint mt-2">
        攻略阈值：好感 ≥ {CONQUEST_FAVOR_THRESHOLD} 且依赖 ≥ {CONQUEST_DEPENDENCE_THRESHOLD}。
        里程碑：{STAMP_UNLOCK_TIERS.map((t) => `${t.count}人·${t.title}`).join('；')}。
      </section>
    </div>
  )
}

function AtlasEndings() {
  const setAtlasSubView = useUIStore((s) => s.setAtlasSubView)
  const unlocked = useAzeriaProgressStore((s) => s.unlockedEndings)
  const back = () => setAtlasSubView('hub')
  return (
    <TomeSubShell title="结局图鉴" onBack={back}>
      <p className="tome-hint mb-3">
        终章 72 小时内做出最终选择（规则书 Ch13）。对话触及的结局线会亮起。已解锁 {unlocked.length}/
        {AZERIA_ENDINGS.length}。
      </p>
      <div className="tome-grid-2">
        {AZERIA_ENDINGS.map((e) => {
          const open = unlocked.includes(e.id)
          return (
            <AtlasCoverCard
              key={e.id}
              letter={e.letter}
              title={e.name}
              subtitle={
                open
                  ? e.condition.slice(0, 36) + '…'
                  : '尚未触及 · 终章对话或 AI endingHint 可解锁'
              }
              hue={open ? e.hue : '#3a322c'}
              onClick={() => setAtlasSubView('ending_detail', e.id)}
            />
          )
        })}
      </div>
    </TomeSubShell>
  )
}

function AtlasEndingDetail({ id }: { id: string }) {
  const setAtlasSubView = useUIStore((s) => s.setAtlasSubView)
  const ending = AZERIA_ENDINGS.find((e) => e.id === id)
  if (!ending) return null
  return (
    <TomeSubShell title={`结局 ${ending.letter}`} onBack={() => setAtlasSubView('endings')}>
      <div
        className="atlas-cover-card"
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="atlas-cover-card__art"
          style={{ background: `linear-gradient(145deg, ${ending.hue} 0%, color-mix(in srgb, ${ending.hue} 40%, #0a0604) 100%)` }}
        >
          <span className="atlas-cover-card__letter">{ending.letter}</span>
        </div>
        <div className="atlas-cover-card__info">
          <div className="atlas-cover-card__title">{ending.name}</div>
        </div>
      </div>
      <div className="tome-card mt-3">
        <p className="text-[11px] font-medium" style={{ color: 'var(--c-gold)' }}>
          触发条件
        </p>
        <p className="mt-1 text-sm" style={{ color: 'var(--c-text)' }}>
          {ending.condition}
        </p>
        <p className="mt-3 text-[11px] font-medium" style={{ color: 'var(--c-gold)' }}>
          结局描述
        </p>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
          {ending.description}
        </p>
      </div>
    </TomeSubShell>
  )
}

function AtlasRegions() {
  const setAtlasSubView = useUIStore((s) => s.setAtlasSubView)
  return (
    <TomeSubShell title="区域图鉴" onBack={() => setAtlasSubView('hub')}>
      <div className="tome-grid-2">
        {AZERIA_WORLD_REGIONS.map((r) => (
          <AtlasCoverCard
            key={r.id}
            title={r.name}
            subtitle={`${'★'.repeat(r.danger)}${'☆'.repeat(5 - r.danger)} · ${r.race}`}
            hue="#2a5a6a"
            onClick={() => setAtlasSubView('region_detail', r.id)}
          />
        ))}
      </div>
    </TomeSubShell>
  )
}

function AtlasRegionDetail({ id }: { id: string }) {
  const region = AZERIA_WORLD_REGIONS.find((r) => r.id === id)
  const bonds = usePassportStore((s) => s.bonds)
  const roster = usePassportStore((s) => s.roster)
  const allCharsMap = useDataStore((s) => s.characters)
  const runtimeChars = useDataStore((s) => s.runtimeCharacters)
  const allChars = useMemo(() => ({ ...allCharsMap, ...runtimeChars }), [allCharsMap, runtimeChars])
  const setAtlasSubView = useUIStore((s) => s.setAtlasSubView)
  if (!region) return null

  const facilityIds = region.facilityIds ?? []
  type CharTile = { id: string; name: string; tag?: string }
  const tiles: CharTile[] = []

  // 固定男主优先
  if (region.fixedLeadId && allChars[region.fixedLeadId]) {
    const lead = allChars[region.fixedLeadId]
    tiles.push({ id: lead.id, name: lead.name, tag: '固定男主' })
  }
  for (const c of Object.values(allChars)) {
    if (c.id === region.fixedLeadId) continue
    if (c.homeRegionId === region.id || (c.homeFacilityId && facilityIds.includes(c.homeFacilityId))) {
      tiles.push({ id: c.id, name: c.name, tag: c.fixedLead ? '固定' : undefined })
    }
  }
  for (const r of roster) {
    if (facilityIds.includes(r.facilityId)) tiles.push({ id: r.id, name: r.displayName })
  }
  for (const b of Object.values(bonds)) {
    if (b.status === 'conquered') tiles.push({ id: b.characterId, name: b.displayName })
  }
  const uniqueChars = Array.from(new Map(tiles.map((t) => [t.id, t])).values()).slice(0, 8)
  const sceneSrc = normalizeAssetPath(region.sceneImage) ?? characterPlaceholder(region.name, region.id)

  return (
    <TomeSubShell title={region.name} onBack={() => setAtlasSubView('regions')}>
      <img
        src={sceneSrc}
        alt=""
        className="atlas-region-portrait"
        onError={(e) => {
          ;(e.target as HTMLImageElement).src = characterPlaceholder(region.name, region.id)
        }}
      />
      <div className="tome-card mt-3">
        <p className="text-sm" style={{ color: 'var(--c-text)' }}>
          {region.description}
        </p>
        <p className="mt-2 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
          环境：{region.env} · 统治：{region.race}
        </p>
        <p className="mt-1 text-[11px]" style={{ color: 'var(--c-gold)' }}>
          城市：{cityNames(region).join('、')}
        </p>
      </div>

      <section className="tome-section mt-3">
        <div className="tome-section__title">域内角色（固定男主 + 生成 NPC）</div>
        <div className="atlas-char-grid">
          {uniqueChars.length === 0 && (
            <p className="tome-hint col-span-2">暂无记录。冒险邂逅或招募后显示于此。</p>
          )}
          {uniqueChars.map((t) => {
            const card = allChars[t.id]
            const img = (card && getCharacterImageCandidates(card)[0]) || characterPlaceholder(t.name, t.id)
            return (
              <div key={t.id} className="atlas-char-tile">
                <img
                  src={img}
                  alt=""
                  className="atlas-char-tile__img"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = characterPlaceholder(t.name, t.id)
                  }}
                />
                <span className="atlas-char-tile__name">
                  {t.name}
                  {t.tag ? ` · ${t.tag}` : ''}
                </span>
              </div>
            )
          })}
        </div>
      </section>
    </TomeSubShell>
  )
}

function AtlasBonds() {
  const bonds = usePassportStore((s) => s.bonds)
  const placeBond = usePassportStore((s) => s.placeBond)
  const showToast = useUIStore((s) => s.showToast)
  const setAtlasSubView = useUIStore((s) => s.setAtlasSubView)
  const list = Object.values(bonds).sort((a, b) => (b.conqueredAt ?? 0) - (a.conqueredAt ?? 0))

  return (
    <TomeSubShell title="羁绊名册" onBack={() => setAtlasSubView('hub')}>
      <section className="tome-section">
        <div className="tome-section__title">种族配额</div>
        <div className="tome-grid-2">
          {RACES.map((r) => (
            <div key={r.id} className="tome-card py-2.5 text-[11px]">
              <div className="font-medium text-sm">{r.name}</div>
              <div className="tome-list-item__meta">固定 {r.fixedLeadQuota} · 权重 {r.randomWeight}</div>
            </div>
          ))}
        </div>
      </section>
      <ul className="tome-list">
        {list.map((b) => (
          <li key={b.characterId} className="tome-list-item">
            <div>
              <div className="tome-list-item__name">{b.displayName}</div>
              <div className="tome-list-item__meta">
                {RACE_MAP[b.raceId as keyof typeof RACE_MAP]?.name ?? b.raceId} · {STATUS_LABEL[b.status]}
              </div>
            </div>
            {b.status === 'conquered' && (
              <button type="button" className="tome-btn" onClick={() => void placeBond(b.characterId, 'party').then((r) => showToast(r.ok ? '已入队' : r.reason ?? ''))}>
                入队
              </button>
            )}
          </li>
        ))}
      </ul>
    </TomeSubShell>
  )
}

function AtlasMonsters() {
  const setAtlasSubView = useUIStore((s) => s.setAtlasSubView)
  const monstersSeen = useAzeriaProgressStore((s) => s.monstersSeen)
  const collectMonster = useAzeriaProgressStore((s) => s.collectMonster)
  const load = useAzeriaProgressStore((s) => s.load)
  const showToast = useUIStore((s) => s.showToast)

  useEffect(() => {
    void load()
  }, [load])

  return (
    <TomeSubShell title="怪物收藏" onBack={() => setAtlasSubView('hub')}>
      <p className="tome-hint mb-3">规则书 Ch24。遭遇或委托后可收录；下方可手动登记（调试）。</p>
      <ul className="tome-list mb-3">
        {MONSTER_ENTRIES.map((m) => {
          const seen = monstersSeen.includes(m.id)
          return (
            <li key={m.id} className={`tome-list-item ${seen ? '' : 'opacity-55'}`}>
              <div>
                <div className="tome-list-item__name">{m.name}</div>
                <div className="tome-list-item__meta">
                  {m.rank} · {m.note}
                </div>
              </div>
              {seen ? (
                <span className="tome-tag tome-tag--active">已见</span>
              ) : (
                <button
                  type="button"
                  className="tome-btn"
                  onClick={() => void collectMonster(m.id).then(() => showToast('已收录', m.name))}
                >
                  收录
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <pre className="tome-card whitespace-pre-wrap text-[11px] leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
        {MONSTER_SNIPPET || '规则书怪物表加载中…'}
      </pre>
    </TomeSubShell>
  )
}

function AtlasTitles() {
  const setAtlasSubView = useUIStore((s) => s.setAtlasSubView)
  const titles = useAzeriaProgressStore((s) => s.titles)
  const unlockTitle = useAzeriaProgressStore((s) => s.unlockTitle)
  const reputation = useAzeriaProgressStore((s) => s.reputation)
  const load = useAzeriaProgressStore((s) => s.load)

  useEffect(() => {
    void load()
  }, [load])

  return (
    <TomeSubShell title="称号墙" onBack={() => setAtlasSubView('hub')}>
      <section className="tome-section">
        <div className="tome-section__title">已获称号</div>
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
      </section>
      <section className="tome-section">
        <div className="tome-section__title">区域声望速览</div>
        <ul className="tome-list">
          {AZERIA_WORLD_REGIONS.map((r) => (
            <li key={r.id} className="tome-list-item">
              <div className="tome-list-item__name">{r.name}</div>
              <span style={{ color: (reputation[r.id] ?? 0) >= 0 ? 'var(--c-gold)' : '#e57373' }}>
                {reputation[r.id] ?? 0}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <pre className="tome-card mt-3 whitespace-pre-wrap text-[11px] leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
        {TITLE_SNIPPET || '规则书称号表加载中…'}
      </pre>
    </TomeSubShell>
  )
}

function AtlasStory() {
  const setAtlasSubView = useUIStore((s) => s.setAtlasSubView)
  const mainChapter = useAzeriaProgressStore((s) => s.mainChapter)
  const setMainChapter = useAzeriaProgressStore((s) => s.setMainChapter)
  const load = useAzeriaProgressStore((s) => s.load)

  useEffect(() => {
    void load()
  }, [load])

  return (
    <TomeSubShell title="主线进度" onBack={() => setAtlasSubView('hub')}>
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

function AtlasCities() {
  const setAtlasSubView = useUIStore((s) => s.setAtlasSubView)
  return (
    <TomeSubShell title="城市导览" onBack={() => setAtlasSubView('hub')}>
      <p className="tome-hint mb-3">各大城地标与冒险入口（规则书区域篇）。</p>
      <ul className="tome-list">
        {AZERIA_WORLD_REGIONS.map((r) => {
          const guide = CITY_GUIDES[r.id]
          return (
            <li key={r.id} className="tome-list-item flex-col !items-stretch gap-1">
              <div className="tome-list-item__name">{guide?.city ?? r.cities[0]?.name ?? r.name}</div>
              <div className="tome-list-item__meta">{r.name}</div>
              <p className="text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
                {(guide?.highlights ?? cityNames(r)).join(' · ')}
              </p>
              <button
                type="button"
                className="tome-btn self-end"
                onClick={() => setAtlasSubView('region_detail', r.id)}
              >
                查看区域
              </button>
            </li>
          )
        })}
      </ul>
    </TomeSubShell>
  )
}

function AtlasFaction() {
  const setAtlasSubView = useUIStore((s) => s.setAtlasSubView)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const setTavernSubView = useUIStore((s) => s.setTavernSubView)
  const faction = useAzeriaProgressStore((s) => s.faction)
  const mainChapter = useAzeriaProgressStore((s) => s.mainChapter)

  return (
    <TomeSubShell title="阵营系统" onBack={() => setAtlasSubView('hub')}>
      <p className="tome-hint mb-3">
        规则书 Ch12。当前主线第 {mainChapter} 章 · 阵营：{faction === 'none' ? '未选定' : faction}
      </p>
      <button
        type="button"
        className="tome-btn tome-btn--accent w-full py-2"
        onClick={() => {
          setActiveTab('tavern')
          setTavernSubView('faction')
        }}
      >
        前往酒馆选择阵营
      </button>
    </TomeSubShell>
  )
}

export function AtlasTab() {
  const sub = useUIStore((s) => s.atlasSubView)
  const detailId = useUIStore((s) => s.atlasDetailId)

  switch (sub) {
    case 'endings':
      return <AtlasEndings />
    case 'ending_detail':
      return detailId ? <AtlasEndingDetail id={detailId} /> : <AtlasEndings />
    case 'regions':
      return <AtlasRegions />
    case 'region_detail':
      return detailId ? <AtlasRegionDetail id={detailId} /> : <AtlasRegions />
    case 'bonds':
      return <AtlasBonds />
    case 'monsters':
      return <AtlasMonsters />
    case 'titles':
      return <AtlasTitles />
    case 'story':
      return <AtlasStory />
    case 'cities':
      return <AtlasCities />
    case 'faction':
      return <AtlasFaction />
    case 'stamps':
      return <PassportTab />
    default:
      return <AtlasHub />
  }
}
