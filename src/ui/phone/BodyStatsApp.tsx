import { useEffect } from 'react'
import { useBodyStatsStore, FEMALE_STAT_LABELS, MALE_STAT_LABELS } from '@/store/bodyStatsStore'
import { useAdventureStatsStore } from '@/store/adventureStatsStore'
import { PhoneAppShell } from './PhoneAppShell'
import { Activity, Heart, Brain, Sparkles } from 'lucide-react'
import { ADVENTURE_CLASSES, ATTR_LABELS, modifierFromScore, STAT_SINGLE_MAX, STAT_SINGLE_MIN } from '@/data/adventureAttributes'

function StatBar({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-[11px]">
        <span style={{ color: 'var(--c-text-dim)' }}>{label}</span>
        <span style={{ color: color ?? 'var(--c-primary)' }}>{value}%</span>
      </div>
      <div className="stat-bar h-2.5 rounded-full" style={{ background: 'rgba(42,158,196,0.12)' }}>
        <div
          className="stat-bar__fill"
          style={{
            width: `${value}%`,
            background: color ?? 'linear-gradient(90deg, var(--c-primary), var(--c-mint))',
          }}
        />
      </div>
    </div>
  )
}

function AttrRow({ label, score }: { label: string; score: number }) {
  const mod = modifierFromScore(score)
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`
  const pct = Math.round(((score - STAT_SINGLE_MIN) / (STAT_SINGLE_MAX - STAT_SINGLE_MIN)) * 100)

  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-[11px]">
        <span style={{ color: 'var(--c-text-dim)' }}>{label}</span>
        <span style={{ color: 'var(--c-primary)' }}>
          {score} ({modStr})
        </span>
      </div>
      <div className="stat-bar h-2.5 rounded-full" style={{ background: 'rgba(42,158,196,0.12)' }}>
        <div
          className="stat-bar__fill"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--c-primary), var(--c-mint))',
          }}
        />
      </div>
    </div>
  )
}

export function BodyStatsApp() {
  const { gender, stats, stateLabels, loaded, load, setGender } = useBodyStatsStore()
  const { attributes, classId, loaded: advLoaded, load: advLoad } = useAdventureStatsStore()

  useEffect(() => {
    if (!loaded) void load()
  }, [loaded, load])

  useEffect(() => {
    if (!advLoaded) void advLoad()
  }, [advLoaded, advLoad])

  const labels = gender === 'male' ? MALE_STAT_LABELS : FEMALE_STAT_LABELS

  const physical = stats.stamina ?? stats.physical ?? 70
  const sensitivity = stats.sensitivity ?? 30
  const exposure = stats.exposure ?? 20

  return (
    <PhoneAppShell title="身体档案">
      <p className="mb-4 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
        规则书 Ch5 · 你的身体在域界中的状态与开发度
      </p>

      {/* 性别切换 */}
      <div className="game-card mb-4 flex gap-2 p-2">
        {(['female', 'male', 'other'] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => void setGender(g)}
            className="press-scale flex-1 rounded-xl py-2 text-[12px] font-medium transition-all"
            style={{
              background: gender === g ? 'var(--c-primary)' : 'transparent',
              color: gender === g ? '#fff' : 'var(--c-text-dim)',
            }}
          >
            {g === 'female' ? '女性' : g === 'male' ? '男性' : '其他'}
          </button>
        ))}
      </div>

      {/* 状态概览 */}
      <div className="game-card mb-4 grid grid-cols-3 gap-2 p-3">
        <div className="flex flex-col items-center gap-1">
          <Activity size={18} style={{ color: 'var(--c-primary)' }} />
          <span className="text-[10px]" style={{ color: 'var(--c-text-muted)' }}>下身</span>
          <span className="text-[12px] font-medium" style={{ color: 'var(--c-text)' }}>{stateLabels.lower ?? '正常'}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Heart size={18} style={{ color: 'var(--c-accent)' }} />
          <span className="text-[10px]" style={{ color: 'var(--c-text-muted)' }}>体力</span>
          <span className="text-[12px] font-medium" style={{ color: 'var(--c-text)' }}>{stateLabels.stamina ?? '充沛'}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Brain size={18} style={{ color: 'var(--c-mint)' }} />
          <span className="text-[10px]" style={{ color: 'var(--c-text-muted)' }}>意识</span>
          <span className="text-[12px] font-medium" style={{ color: 'var(--c-text)' }}>{stateLabels.mind ?? '清醒'}</span>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="game-card mb-4 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-[12px] font-medium" style={{ color: 'var(--c-text)' }}>
          <Sparkles size={14} style={{ color: 'var(--c-gold)' }} />
          核心状态
        </h3>
        <StatBar label="体力/持久" value={physical} color="var(--stat-stamina)" />
        <StatBar label="敏感度" value={sensitivity} color="var(--stat-arousal)" />
        <StatBar label="公开暴露耐性" value={exposure} color="var(--stat-mood)" />
      </div>

      {/* 详细开发度 */}
      <div className="game-card p-4">
        <h3 className="mb-3 text-[12px] font-medium" style={{ color: 'var(--c-text)' }}>
          部位开发度
        </h3>
        {Object.entries(labels).map(([key, label]) => (
          <StatBar key={key} label={label} value={stats[key] ?? 0} />
        ))}
      </div>

      {/* D20 冒险者面板（与身体档案并行） */}
      <div className="game-card mt-4 p-4">
        <h3 className="mb-2 text-[12px] font-medium" style={{ color: 'var(--c-text)' }}>
          <Sparkles size={14} style={{ color: 'var(--c-gold)' }} />
          <span style={{ color: 'var(--c-gold)' }} className="ml-2 inline-flex items-center">
            D20 六维 · 艾泽利亚
          </span>
        </h3>
        {classId && (
          <p className="mb-3 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
            职业：{ADVENTURE_CLASSES.find((c) => c.id === classId)?.name ?? classId}（{ADVENTURE_CLASSES.find((c) => c.id === classId)?.skill ?? '—'}）
          </p>
        )}
        {(Object.keys(ATTR_LABELS) as Array<keyof typeof ATTR_LABELS>).map((k) => (
          <AttrRow key={k} label={ATTR_LABELS[k]} score={attributes[k]} />
        ))}
      </div>
    </PhoneAppShell>
  )
}
