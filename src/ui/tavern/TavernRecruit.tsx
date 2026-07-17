import { useState } from 'react'
import { Sparkles, Wand2 } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { usePassportStore } from '@/store/passportStore'
import { useUIStore } from '@/store/uiStore'
import { useSettingsStore } from '@/store/settingsStore'
import { spawnDynamicNpcForFacility } from '@/ai/npcGenerator'
import { refineNpcWithApi } from '@/ai/npcRefine'
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
  const settings = useSettingsStore((s) => s.settings)

  const [facilityId, setFacilityId] = useState(FACILITIES[0]?.id ?? '')
  const [customName, setCustomName] = useState('')
  const [raceId, setRaceId] = useState<RaceId>(RACES[0]?.id ?? 'elf')
  const [personality, setPersonality] = useState(PERSONALITIES[0])
  const [bodyType, setBodyType] = useState(BODY_TYPES[1])
  const [style, setStyle] = useState(STYLES[0])
  const [freeText, setFreeText] = useState('')
  const [useAiRefine, setUseAiRefine] = useState(true)
  const [loading, setLoading] = useState(false)

  const summonRandom = async () => {
    const region = regions[facilityId]
    if (!region) {
      showToast('区域未加载', facilityId)
      return
    }
    setLoading(true)
    try {
      let spawned = spawnDynamicNpcForFacility(region)
      if (useAiRefine) {
        spawned = await refineNpcWithApi({
          spawned,
          settings: {
            ...settings,
            ui: { ...settings.ui, npcApiRefine: true },
          },
          region,
        })
      }
      const { meta } = spawned
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
          desire: meta.desire,
          greeting: (meta as { greeting?: string }).greeting ?? '',
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
    const region = regions[facilityId]
    setLoading(true)
    try {
      const baseBg = [
        `自定义男主：性格${personality}，体型${bodyType}，气质${style}。`,
        freeText.trim() ? `玩家补充设定：${freeText.trim()}` : '',
        '遵从艾泽利亚 NPC 维度表；服从旅者管理与指令。',
      ]
        .filter(Boolean)
        .join('\n')

      let displayName = customName.trim()
      let appearance = `${style}面容，${bodyType}体态`
      let background = baseBg
      let personalityStr = personality
      let greeting = `「……${displayName}。从今日起听你差遣。」`

      if (useAiRefine && region) {
        const draft = spawnDynamicNpcForFacility(region)
        draft.meta.displayName = displayName
        draft.meta.personality = [personality]
        draft.meta.bodyType = bodyType
        draft.meta.style = style
        draft.meta.background = baseBg
        draft.meta.appearance = appearance
        draft.card.name = displayName
        const refined = await refineNpcWithApi({
          spawned: draft,
          settings: {
            ...settings,
            ui: { ...settings.ui, npcApiRefine: true },
          },
          region,
          identityHint: freeText.trim() || undefined,
        })
        displayName = refined.meta.displayName || displayName
        appearance = refined.meta.appearance || appearance
        background = refined.meta.background || background
        personalityStr = refined.meta.personality?.join('、') || personalityStr
        greeting = (refined.meta as { greeting?: string }).greeting || greeting
      }

      await saveNpc({
        displayName,
        facilityId,
        facilityName: fac?.name ?? facilityId,
        npcArchetype: '自定义男主',
        branded: false,
        corruption: 0,
        snapshot: {
          raceId,
          personality: personalityStr,
          bodyType,
          style,
          appearance,
          background,
          greeting,
          freeText: freeText.trim(),
          aiFormat:
            'JSON字段：displayName,personality,bodyType,style,appearance,background,greeting；服从仆从/伴侣管理系统。',
        },
        raceId,
      })
      showToast('已创建并写入 AI 格式', displayName)
      setCustomName('')
      setFreeText('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <TomeSubShell title="招募召唤" onBack={onBack}>
      <p className="tome-hint mb-3">
        可点选性格/气质，也可在下方自由填写补充设定；开启 AI 润色后会按可读格式写入名册，供对话服从管理。
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
        <label className="mt-2 flex items-center gap-2 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
          <input type="checkbox" checked={useAiRefine} onChange={(e) => setUseAiRefine(e.target.checked)} />
          创建后调用 AI 润色并写入标准字段
        </label>
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
          <select
            className="tome-card w-full text-sm"
            value={raceId}
            onChange={(e) => setRaceId(e.target.value as RaceId)}
            style={{ color: 'var(--c-text)' }}
          >
            {RACES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1.5">
            {PERSONALITIES.map((p) => (
              <button
                key={p}
                type="button"
                className={`tome-btn${personality === p ? ' tome-btn--accent' : ''}`}
                onClick={() => setPersonality(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BODY_TYPES.map((b) => (
              <button
                key={b}
                type="button"
                className={`tome-btn${bodyType === b ? ' tome-btn--accent' : ''}`}
                onClick={() => setBodyType(b)}
              >
                {b}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STYLES.map((s) => (
              <button
                key={s}
                type="button"
                className={`tome-btn${style === s ? ' tome-btn--accent' : ''}`}
                onClick={() => setStyle(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <textarea
            className="tome-card w-full text-sm"
            rows={3}
            placeholder="自由补充：身世、禁忌、对旅者的态度…（将写入 AI）"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            style={{ color: 'var(--c-text)' }}
          />
          <button type="button" className="tome-btn w-full py-2" disabled={loading} onClick={() => void createCustom()}>
            {loading ? '生成中…' : '创建并加入名册'}
          </button>
        </div>
      </section>
    </TomeSubShell>
  )
}
