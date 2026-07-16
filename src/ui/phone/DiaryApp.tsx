import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { usePassportStore } from '@/store/passportStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'
import { useGeneratedStore } from '@/store/generatedStore'
import { listAllMemories } from '@/storage/db'
import { filterMemoriesForParticipants } from '@/ai/memoryUtils'
import { generateDiaryEntry } from '@/ai/contentClient'
import { hasTextApiConfigured } from '@/ai/textClient'
import { coverColorForId, rosterCardToCharacter } from '@/utils/interactableCharacters'
import { GeneratedHistoryList, useGeneratedHistory } from './GeneratedHistory'
import { PhoneAppShell } from './PhoneAppShell'

export function DiaryApp() {
  const { getAllCharacters } = useDataStore()
  const { roster, loaded, load } = usePassportStore()
  const { settings } = useSettingsStore()
  const showToast = useUIStore((s) => s.showToast)
  const addRecord = useGeneratedStore((s) => s.addRecord)
  const { records, removeRecord } = useGeneratedHistory('diary')

  const [charId, setCharId] = useState<string | null>(null)
  const [month, setMonth] = useState(new Date())
  const [day, setDay] = useState(new Date().getDate())
  const [busy, setBusy] = useState(false)
  const [flip, setFlip] = useState(false)

  useEffect(() => {
    if (!loaded) void load()
  }, [loaded, load])

  const allChars = getAllCharacters()
  const entries = roster.length > 0
    ? roster.map((r) => ({ id: r.id, name: r.displayName, card: allChars[r.id] ?? rosterCardToCharacter(r) }))
    : Object.values(allChars).map((c) => ({ id: c.id, name: c.name, card: c }))

  const pickChar = (id: string) => {
    setFlip(true)
    window.setTimeout(() => {
      setCharId(id)
      setFlip(false)
    }, 350)
  }

  const generate = () => {
    const c = charId ? (allChars[charId] ?? entries.find((e) => e.id === charId)?.card) : null
    if (!c || busy) return
    setBusy(true)
    const dateStr = `${month.getFullYear()}年${month.getMonth() + 1}月${day}日`
    showToast('日记撰写中…', `${c.name} 正在写日记`)

    void (async () => {
      try {
        let text: string
        if (!hasTextApiConfigured(settings)) {
          text = `（${dateStr}）\n今天又是普通的一天……${c.name} 在日记里写了点什么。`
        } else {
          const all = await listAllMemories()
          const mems = filterMemoriesForParticipants(all, [c]).map((m) => m.text)
          text = await generateDiaryEntry(settings, c.name, c.background, dateStr, mems)
        }
        await addRecord({
          type: 'diary',
          title: `${c.name} · ${dateStr}`,
          content: text,
          meta: { characterId: charId!, date: dateStr },
        })
        showToast('日记已生成', `${c.name} · ${dateStr}`)
      } catch (e) {
        showToast('日记生成失败', e instanceof Error ? e.message : '未知错误')
      } finally {
        setBusy(false)
      }
    })()
  }

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()

  if (!charId) {
    return (
      <PhoneAppShell title="日记">
        {entries.length === 0 ? (
          <p className="text-center text-xs" style={{ color: 'var(--c-text-dim)' }}>
            还没有男主。互动并保留后可查看日记。
          </p>
        ) : (
          <>
            <p className="mb-4 text-center text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
              选择男主 · 翻开专属日历本
            </p>
            <div className="grid grid-cols-2 gap-3">
              {entries.map(({ id, name }) => (
                <motion.button
                  key={id}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => pickChar(id)}
                  className="relative h-36 overflow-hidden rounded-xl p-4 text-left shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${coverColorForId(id)}, #0d0812)` }}
                >
                  <BookOpen size={20} className="mb-2 text-white/80" />
                  <p className="text-sm font-medium text-white">{name}</p>
                  <p className="text-[10px] text-white/60">日记本</p>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </PhoneAppShell>
    )
  }

  const c = allChars[charId] ?? entries.find((e) => e.id === charId)?.card
  if (!c) {
    return (
      <PhoneAppShell title="日记" onBack={() => setCharId(null)}>
        <p className="text-center text-xs" style={{ color: 'var(--c-text-dim)' }}>男主数据加载中…</p>
      </PhoneAppShell>
    )
  }

  const charRecords = records.filter((r) => r.meta?.characterId === charId)

  return (
    <PhoneAppShell title={`${c.name} · 日记`} onBack={() => setCharId(null)}>
      <motion.div animate={{ rotateY: flip ? 90 : 0 }} className="glass-card mb-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm">
            {month.getFullYear()}年{month.getMonth() + 1}月
          </span>
          <button type="button" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="mb-3 grid grid-cols-7 gap-1 text-center text-[10px]">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d)}
              className="rounded py-1"
              style={{
                background: d === day ? 'var(--c-primary)' : 'transparent',
                color: d === day ? '#fff' : 'var(--c-text-dim)',
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={generate}
          className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm disabled:opacity-50"
          style={{ background: 'var(--c-primary)', color: '#fff' }}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
          {busy ? '撰写中…' : `生成 ${day} 日日记`}
        </button>
      </motion.div>
      <GeneratedHistoryList records={charRecords} emptyHint="日记会保留在此" onRemove={(id) => void removeRecord(id)} />
    </PhoneAppShell>
  )
}
