import { useEffect, useState } from 'react'
import { Eye, Camera, Loader2 } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { usePassportStore } from '@/store/passportStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'
import { useGeneratedStore } from '@/store/generatedStore'
import { FACILITIES } from '@/data/facilities'
import { rosterCardToCharacter } from '@/utils/interactableCharacters'
import { listAllMemories } from '@/storage/db'
import { filterMemoriesForParticipants } from '@/ai/memoryUtils'
import { generateMonitorScene, generateImage } from '@/ai/contentClient'
import { hasTextApiConfigured } from '@/ai/textClient'
import { useSessionStore } from '@/store/sessionStore'
import { GeneratedHistoryList, useGeneratedHistory } from './GeneratedHistory'
import { PhoneAppShell } from './PhoneAppShell'

export function MonitorApp() {
  const { getAllCharacters, regions, loaded: dataLoaded } = useDataStore()
  const { roster, loaded: rosterLoaded, load } = usePassportStore()
  const { settings } = useSettingsStore()
  const showToast = useUIStore((s) => s.showToast)
  const addRecord = useGeneratedStore((s) => s.addRecord)
  const appendUserMessage = useSessionStore((s) => s.appendUserMessage)
  const { records, removeRecord } = useGeneratedHistory('monitor')

  const [selected, setSelected] = useState<string[]>([])
  const [locationId, setLocationId] = useState(FACILITIES[0]?.id ?? 'human_exhibition')
  const [scene, setScene] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [sceneBusy, setSceneBusy] = useState(false)
  const [imageBusy, setImageBusy] = useState(false)

  useEffect(() => {
    if (!rosterLoaded) void load()
  }, [rosterLoaded, load])

  const allChars = getAllCharacters()
  const charOptions = [
    ...roster.map((r) => ({ id: r.id, name: r.displayName, card: allChars[r.id] ?? rosterCardToCharacter(r) })),
    ...Object.values(allChars)
      .filter((c) => !roster.some((r) => r.id === c.id))
      .map((c) => ({ id: c.id, name: c.name, card: c })),
  ]

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const runMonitor = () => {
    if (selected.length === 0 || sceneBusy) return
    setSceneBusy(true)
    showToast('监控生成中…', '后台分析场景，完成后会通知你')

    void (async () => {
      try {
        const names = selected.map((id) => charOptions.find((c) => c.id === id)?.name ?? id)
        const loc = regions[locationId]?.name ?? FACILITIES.find((f) => f.id === locationId)?.name ?? locationId
        const all = await listAllMemories()
        const cards = selected
          .map((id) => charOptions.find((c) => c.id === id)?.card)
          .filter((c): c is NonNullable<typeof c> => Boolean(c))
        const mems = filterMemoriesForParticipants(all, cards).map((m) => m.text)

        let text: string
        if (hasTextApiConfigured(settings)) {
          text = await generateMonitorScene(settings, {
            locationName: loc,
            characterNames: names,
            solo: selected.length === 1,
            memories: mems,
          })
        } else {
          text = `监控画面：${names.join('、')} 正在 ${loc} 中活动……`
        }
        setScene(text)
        await addRecord({
          type: 'monitor',
          title: `监控 · ${names.join('、')} @ ${loc}`,
          content: text,
          meta: { location: loc, characters: names.join('、') },
        })
        showToast('监控已经生成', `${names.join('、')} · ${loc}`)
      } catch (e) {
        showToast('监控生成失败', e instanceof Error ? e.message : '未知错误')
      } finally {
        setSceneBusy(false)
      }
    })()
  }

  const genImage = () => {
    if (imageBusy || !scene) return
    setImageBusy(true)
    showToast('正在拍照…', 'AI 生图中')

    void (async () => {
      try {
        const loc = regions[locationId]?.name ?? ''
        const names = selected.map((id) => charOptions.find((c) => c.id === id)?.name).join('、')
        const url = await generateImage(
          settings,
          `Neon amusement park facility, ${loc}, characters: ${names}, ${scene.slice(0, 280)}`,
          { source: 'monitor' },
        )
        setImageUrl(url)
        await addRecord({
          type: 'monitor',
          title: `监控截图 · ${loc}`,
          content: scene.slice(0, 200),
          imageUrl: url,
          meta: { location: loc, characters: names },
        })
        showToast('监控截图已保存', '图片已存入相册与历史')
      } catch (e) {
        showToast('生图失败', e instanceof Error ? e.message : '未知错误')
      } finally {
        setImageBusy(false)
      }
    })()
  }

  const sendToChat = async () => {
    if (!scene) return
    await appendUserMessage(`📡 监控记录 · ${scene.slice(0, 200)}`, { bubbleStyle: 'narrator' })
    if (imageUrl) await appendUserMessage('📷 监控截图', { imageUrl })
  }

  return (
    <PhoneAppShell title="监控">
      {!dataLoaded ? (
        <p className="text-center text-xs" style={{ color: 'var(--c-text-dim)' }}>加载中…</p>
      ) : (
        <>
          <p className="mb-3 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
            选择男主与设施，观看 AI 生成的互动场景
          </p>

          <p className="mb-1 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>男主（可多选）</p>
          {charOptions.length === 0 ? (
            <p className="mb-3 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>暂无男主，请先进入冒险域互动</p>
          ) : (
            <div className="mb-3 flex flex-wrap gap-2">
              {charOptions.map(({ id, name }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  className="rounded-full px-3 py-1 text-[11px]"
                  style={{
                    background: selected.includes(id) ? 'var(--c-primary)' : 'var(--c-bg-soft)',
                    color: selected.includes(id) ? '#fff' : 'var(--c-text)',
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          <p className="mb-1 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>设施</p>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="mb-3 w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
          >
            {FACILITIES.map((f) => (
              <option key={f.id} value={f.id}>{regions[f.id]?.name ?? f.name}</option>
            ))}
          </select>

          <button
            type="button"
            disabled={sceneBusy || selected.length === 0}
            onClick={runMonitor}
            className="mb-2 flex w-full items-center justify-center gap-1 rounded-lg py-2.5 text-sm disabled:opacity-50"
            style={{ background: 'var(--c-primary)', color: '#fff' }}
          >
            {sceneBusy ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
            {sceneBusy ? '生成中…' : '开始监控'}
          </button>

          {scene && (
            <div className="glass-card mb-3 p-3 text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--c-text-dim)' }}>
              {scene}
            </div>
          )}

          {scene && (
            <>
              <button
                type="button"
                disabled={imageBusy}
                onClick={genImage}
                className="mb-2 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm disabled:opacity-50"
                style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
              >
                {imageBusy ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                {imageBusy ? '生图中…' : 'AI 拍照（生图）'}
              </button>
              {imageUrl && <img src={imageUrl} alt="" className="mb-2 w-full rounded-lg" />}
              <button type="button" onClick={() => void sendToChat()} className="mb-2 w-full rounded-lg py-2 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
                发送到当前聊天
              </button>
            </>
          )}

          <GeneratedHistoryList records={records} emptyHint="监控记录会保留在此" onRemove={(id) => void removeRecord(id)} />
        </>
      )}
    </PhoneAppShell>
  )
}
