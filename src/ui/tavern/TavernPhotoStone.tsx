import { useState } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import { useProfileStore } from '@/store/profileStore'
import { usePassportStore } from '@/store/passportStore'
import { useDataStore } from '@/store/dataStore'
import { useUIStore } from '@/store/uiStore'
import { generateImage } from '@/ai/contentClient'
import { buildPhotoStonePrompt } from '@/ai/photoStonePrompt'
import { hasTextApiConfigured } from '@/ai/textClient'
import { FACILITIES } from '@/data/facilities'
import { getCharacterImageCandidates, characterPlaceholder } from '@/utils/image'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'

export function TavernPhotoStone({ onBack }: { onBack: () => void }) {
  const settings = useSettingsStore((s) => s.settings)
  const activeProfile = useProfileStore((s) =>
    s.profiles.find((p) => p.id === useSettingsStore.getState().settings.ui.activeProfileId),
  )
  const bonds = usePassportStore((s) => s.bonds)
  const roster = usePassportStore((s) => s.roster)
  const getAllCharacters = useDataStore((s) => s.getAllCharacters)
  const showToast = useUIStore((s) => s.showToast)

  const [regionId, setRegionId] = useState(FACILITIES[0]?.id ?? '')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [includeSelf, setIncludeSelf] = useState(true)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const regionName = FACILITIES.find((f) => f.id === regionId)?.name ?? regionId
  const allChars = getAllCharacters()

  const candidates = [
    ...Object.values(bonds)
      .filter((b) => b.status === 'conquered')
      .map((b) => ({ id: b.characterId, name: b.displayName })),
    ...roster.map((r) => ({ id: r.id, name: r.displayName })),
    ...Object.values(allChars).map((c) => ({ id: c.id, name: c.name })),
  ].filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i)

  const toggleChar = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 3)))
  }

  const capture = async () => {
    const names = selectedIds.map((id) => candidates.find((c) => c.id === id)?.name ?? id)
    if (!includeSelf && names.length === 0) {
      showToast('请至少选择一名角色或包含自己')
      return
    }
    const apiOk = hasTextApiConfigured(settings) || settings.api.image.apiKey.trim()
    if (!apiOk) {
      showToast('请配置生图 API', '设置 → 图像模型')
      return
    }
    setLoading(true)
    try {
      const prompt = buildPhotoStonePrompt({
        regionName,
        characterNames: names,
        includePlayer: includeSelf,
        playerName: activeProfile?.name,
        playerDesc: activeProfile?.persona,
        mood: 'adventure group portrait, golden hour',
      })
      const url = await generateImage(settings, prompt, {
        source: 'photo',
        save: true,
        alreadyComposed: true,
        kind: 'photo',
      })
      setResultUrl(url)
      showToast('留影完成', '已存入相册')
    } catch (e) {
      showToast('生图失败', e instanceof Error ? e.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <TomeSubShell title="留影石" onBack={onBack}>
      <p className="tome-hint mb-3">
        选择角色与冒险域，生成西幻风格合照。提示词遵循规则书叙事风格，成品自动存入相册。
      </p>

      <section className="tome-section">
        <div className="tome-section__title">拍摄地点</div>
        <select
          className="tome-card w-full text-sm"
          value={regionId}
          onChange={(e) => setRegionId(e.target.value)}
          style={{ color: 'var(--c-text)' }}
        >
          {FACILITIES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </section>

      <label className="tome-card flex items-center gap-2 text-sm" style={{ color: 'var(--c-text)' }}>
        <input type="checkbox" checked={includeSelf} onChange={(e) => setIncludeSelf(e.target.checked)} />
        包含旅者（{activeProfile?.name ?? '我'}）
      </label>

      <section className="tome-section">
        <div className="tome-section__title">同行角色（最多3）</div>
        <div className="atlas-char-grid">
          {candidates.slice(0, 12).map((c) => {
            const card = allChars[c.id]
            const img =
              (card && getCharacterImageCandidates(card)[0]) ||
              characterPlaceholder(c.name, c.id)
            const on = selectedIds.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                className={`atlas-char-tile press-scale ${on ? 'tome-card--glow' : ''}`}
                onClick={() => toggleChar(c.id)}
              >
                <img src={img} alt="" className="atlas-char-tile__img" />
                <span className="atlas-char-tile__name">{c.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      <button type="button" className="tome-btn tome-btn--accent w-full py-3" disabled={loading} onClick={() => void capture()}>
        {loading ? '留影中…' : '拍摄合照'}
      </button>

      {resultUrl && (
        <div className="tome-card mt-3 p-2">
          <img src={resultUrl} alt="留影" className="w-full rounded-lg" />
        </div>
      )}
    </TomeSubShell>
  )
}
