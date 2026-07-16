import { useState } from 'react'
import { Sparkles, Wand2 } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { usePassportStore } from '@/store/passportStore'
import { useUIStore } from '@/store/uiStore'
import { spawnDynamicNpcForFacility } from '@/ai/npcGenerator'
import { FACILITIES } from '@/data/facilities'
import { RACES, type RaceId } from '@/data/races'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'

const PERSONALITIES = ['温柔', '冷漠', '热情', '傲娇', '腹黑', '天然', '狂野', '内敛']
const BODY_TYPES = ['纤细', '匀称', '肌肉型', '高挑', '野性']
const STYLES = ['清秀', '艳丽', '冷酷', '妖异', '知性']

export function TavernRecruit({ onBack }: { onBack: () => void }) {
  const regions = useDataStore((s) => s.regions)
  const saveNpc = usePassportStore((s) => s.saveNpc)
  const showToast = useUIStore((s) => s.showToast)

  const [facilityId, setFacilityId] = useState(FACILITIES[0]?.id ?? '')
  const [customName, setCustomName] = useState('')
  const [raceId, setRaceId] = useState<RaceId>(RACES[0]?.id ?? 'elf')
  const [personality, setPersonality] = useState(PERSONALITIES[0])
  const [bodyType, setBodyType] = useState(BODY_TYPES[1])
  const [style, setStyle] = useState(STYLES[0])
  const [loading, setLoading] = useState(false)

  const summonRandom = async () => {
    const region = regions[facilityId]
    if (!region) {
      showToast('区域未加载', facilityId)
      return
    }
    setLoading(true)
    try {
      const { meta } = spawnDynamicNpcForFacility(region)
      await saveNpc({
        displayName: meta.displayName,
        facilityId: meta.facilityId,
        facilityName: meta.facilityName,
        npcArchetype: meta.npcArchetype,
        branded: false,
        corruption: meta.corruption,
        snapshot: {
          gender: meta.gender,
          appearance: meta.appearance,
          background: meta.background,
          personality: meta.personality.join('、'),
        },
        raceId,
      })
      showToast('召唤成功', `${meta.displayName} 已加入名册`)
    } finally {
      setLoading(false)
    }
  }

  const createCustom = async () => {
    if (!customName.trim()) {
      showToast('请填写名字')
      return
    }
    const fac = FACILITIES.find((f) => f.id === facilityId)
    setLoading(true)
    try {
      await saveNpc({
        displayName: customName.trim(),
        facilityId,
        facilityName: fac?.name ?? facilityId,
        npcArchetype: '自定义男主',
        branded: false,
        corruption: 0,
        snapshot: {
          raceId,
          personality,
          bodyType,
          style,
          background: `自定义男主：${personality}气质，${bodyType}体型，${style}风格。遵从艾泽利亚 NPC 维度表（规则书 Ch7.2）。`,
        },
        raceId,
      })
      showToast('已创建', customName.trim())
      setCustomName('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <TomeSubShell title="招募召唤" onBack={onBack}>
      <p className="tome-hint mb-3">
        随机召唤遵循 NPC 动态生成维度（规则书 Ch7）；自定义可设定种族、气质与体型，后续可在冒险中润色。
      </p>

      <section className="tome-section">
        <div className="tome-section__title">关联区域</div>
        <select
          className="tome-card w-full text-sm"
          style={{ color: 'var(--c-text)' }}
          value={facilityId}
          onChange={(e) => setFacilityId(e.target.value)}
        >
          {FACILITIES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </section>

      <section className="tome-card tome-card--glow">
        <div className="tome-section__title mb-2">
          <Sparkles size={14} /> 随机召唤
        </div>
        <p className="tome-hint mb-3">在选定区域掷出一名随机男主，写入名册。</p>
        <button
          type="button"
          className="tome-btn tome-btn--accent w-full py-2"
          disabled={loading}
          onClick={() => void summonRandom()}
        >
          {loading ? '召唤中…' : '随机召唤 NPC'}
        </button>
      </section>

      <section className="tome-card mt-3">
        <div className="tome-section__title mb-2">
          <Wand2 size={14} /> 自定义 NPC
        </div>
        <div className="flex flex-col gap-2">
          <input
            className="tome-card w-full text-sm"
            placeholder="名字"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            style={{ color: 'var(--c-text)' }}
          />
          <select className="tome-card w-full text-sm" value={raceId} onChange={(e) => setRaceId(e.target.value as RaceId)} style={{ color: 'var(--c-text)' }}>
            {RACES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <select className="tome-card w-full text-sm" value={personality} onChange={(e) => setPersonality(e.target.value)} style={{ color: 'var(--c-text)' }}>
            {PERSONALITIES.map((p) => (
              <option key={p} value={p}>
                性格 · {p}
              </option>
            ))}
          </select>
          <select className="tome-card w-full text-sm" value={bodyType} onChange={(e) => setBodyType(e.target.value)} style={{ color: 'var(--c-text)' }}>
            {BODY_TYPES.map((b) => (
              <option key={b} value={b}>
                体型 · {b}
              </option>
            ))}
          </select>
          <select className="tome-card w-full text-sm" value={style} onChange={(e) => setStyle(e.target.value)} style={{ color: 'var(--c-text)' }}>
            {STYLES.map((s) => (
              <option key={s} value={s}>
                气质 · {s}
              </option>
            ))}
          </select>
          <button type="button" className="tome-btn w-full py-2" disabled={loading} onClick={() => void createCustom()}>
            创建并加入名册
          </button>
        </div>
      </section>
    </TomeSubShell>
  )
}
