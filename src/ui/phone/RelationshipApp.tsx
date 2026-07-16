import { useEffect, useState } from 'react'
import { ChevronRight, Sparkles, Loader2, Star } from 'lucide-react'
import { usePassportStore } from '@/store/passportStore'
import { useDataStore } from '@/store/dataStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useProfileStore } from '@/store/profileStore'
import { useUIStore } from '@/store/uiStore'
import { useGeneratedStore } from '@/store/generatedStore'
import { coverColorForId, rosterCardToCharacter } from '@/utils/interactableCharacters'
import { listAllMemories } from '@/storage/db'
import { filterMemoriesForParticipants } from '@/ai/memoryUtils'
import { generateCharacterOpinion } from '@/ai/contentClient'
import { hasTextApiConfigured } from '@/ai/textClient'
import { GeneratedHistoryList, useGeneratedHistory } from './GeneratedHistory'
import { PhoneAppShell } from './PhoneAppShell'

export function RelationshipApp() {
  const { roster, loaded, load } = usePassportStore()
  const { getAllCharacters } = useDataStore()
  const { settings } = useSettingsStore()
  const { profiles } = useProfileStore()
  const showToast = useUIStore((s) => s.showToast)
  const addRecord = useGeneratedStore((s) => s.addRecord)
  const profile = profiles.find((p) => p.id === settings.ui.activeProfileId)
  const { records, removeRecord } = useGeneratedHistory('opinion')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  useEffect(() => {
    if (!loaded) void load()
  }, [loaded, load])

  const allChars = getAllCharacters()
  const entries = roster.length > 0
    ? roster.map((r) => ({ id: r.id, card: allChars[r.id] ?? rosterCardToCharacter(r), saved: r }))
    : Object.values(allChars).map((c) => ({ id: c.id, card: c, saved: null }))

  const latestOpinion = (charId: string) =>
    records.find((r) => r.meta?.characterId === charId)?.content

  const generateOpinion = (charId: string) => {
    const c = allChars[charId] ?? entries.find((e) => e.id === charId)?.card
    if (!c || generatingId) return
    setGeneratingId(charId)
    showToast('正在生成看法…', `${c.name} 的想法正在酝酿`)

    void (async () => {
      try {
        let text: string
        const saved = roster.find((r) => r.id === charId)
        if (!hasTextApiConfigured(settings)) {
          text = saved
            ? `（演示）${c.name} 堕落 ${saved.corruption}%${saved.branded ? '，已烙印' : ''}……还在观察 ${profile?.name ?? '你'}。`
            : `（演示）${c.name} 觉得 ${profile?.name ?? '你'} 很有意思……`
        } else {
          const all = await listAllMemories()
          const mems = filterMemoriesForParticipants(all, [c]).map((m) => m.text)
          text = await generateCharacterOpinion(
            settings,
            { name: c.name, background: c.background, speakingStyle: c.speakingStyle },
            profile?.name ?? '你',
            { favor: saved?.corruption ?? 20, trust: 0 },
            mems,
          )
        }
        await addRecord({
          type: 'opinion',
          title: `${c.name} 对 ${profile?.name ?? '你'} 的看法`,
          content: text,
          meta: { characterId: charId, characterName: c.name },
        })
        showToast('看法已生成完成', `${c.name} 的心声已更新`)
      } catch (e) {
        showToast('生成失败', e instanceof Error ? e.message : '未知错误')
      } finally {
        setGeneratingId(null)
      }
    })()
  }

  if (selectedId) {
    const entry = entries.find((e) => e.id === selectedId)
    const c = entry?.card
    if (!c) {
      return (
        <PhoneAppShell title="看法" onBack={() => setSelectedId(null)}>
          <p className="text-center text-xs" style={{ color: 'var(--c-text-dim)' }}>男主不存在</p>
        </PhoneAppShell>
      )
    }
    const isGenerating = generatingId === selectedId
    const charRecords = records.filter((r) => r.meta?.characterId === selectedId)
    const current = charRecords[0]?.content
    const color = coverColorForId(c.id)

    return (
      <PhoneAppShell title={c.name} onBack={() => setSelectedId(null)}>
        <div className="glass-card mb-3 p-3 text-center">
          <p className="text-sm">{c.title}</p>
          {entry.saved && (
            <p className="mt-2 text-[10px]" style={{ color: 'var(--c-primary)' }}>
              堕落 {entry.saved.corruption}%
              {entry.saved.branded && (
                <Star size={10} className="ml-1 inline" style={{ fill: 'var(--c-accent)', color: 'var(--c-accent)' }} />
              )}
            </p>
          )}
        </div>
        <div className="glass-card p-3">
          <p className="mb-2 flex items-center gap-1 text-xs" style={{ color: color }}>
            <Sparkles size={14} /> 对旅者的看法
          </p>
          <p className="mb-3 min-h-[80px] text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--c-text-dim)' }}>
            {isGenerating ? '正在悄悄写下对你的想法…' : current ?? '还没有记录。点击下方，让 TA 说说心里话。'}
          </p>
          <button
            type="button"
            disabled={!!generatingId}
            onClick={() => generateOpinion(selectedId)}
            className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm disabled:opacity-50"
            style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {isGenerating ? '生成中…' : '听听 TA 怎么说'}
          </button>
        </div>
        <GeneratedHistoryList records={charRecords} emptyHint="生成后会保留在此" onRemove={(id) => void removeRecord(id)} />
      </PhoneAppShell>
    )
  }

  return (
    <PhoneAppShell title="看法">
      <p className="mb-3 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
        已保留的男主 · 点击查看 TA 对你的看法
      </p>
      {entries.length === 0 ? (
        <p className="text-center text-xs" style={{ color: 'var(--c-text-dim)' }}>
          还没有男主。翻开书卷冒险域互动后可保留。
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map(({ id, card, saved }) => {
            const preview = latestOpinion(id)
            const color = coverColorForId(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedId(id)}
                className="glass-card flex items-center gap-3 p-3 text-left"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
                  style={{ background: color }}
                >
                  {card.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{card.name}</p>
                  <p className="truncate text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                    {preview ? preview.slice(0, 36) + '…' : card.title}
                  </p>
                </div>
                {saved?.branded && <Star size={12} style={{ color: 'var(--c-accent)', fill: 'var(--c-accent)' }} />}
                <ChevronRight size={16} style={{ color: 'var(--c-text-dim)' }} />
              </button>
            )
          })}
        </div>
      )}
    </PhoneAppShell>
  )
}
