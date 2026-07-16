import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Loader2, RefreshCw } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
import { useProfileStore } from '@/store/profileStore'
import { usePassportStore } from '@/store/passportStore'
import { useDataStore } from '@/store/dataStore'
import { useUIStore } from '@/store/uiStore'
import { useGeneratedStore } from '@/store/generatedStore'
import { listAllMemories } from '@/storage/db'
import { filterMemoriesForParticipants } from '@/ai/memoryUtils'
import { generateDiaryEntry } from '@/ai/contentClient'
import { hasTextApiConfigured } from '@/ai/textClient'
import { rosterCardToCharacter } from '@/utils/interactableCharacters'
import { DEMO_ROSTER_MEMBER } from '@/data/tavernLife'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'

type DiaryTab = 'all' | 'mine' | 'party'

export function TavernDiary({ onBack }: { onBack: () => void }) {
  const settings = useSettingsStore((s) => s.settings)
  const activeProfileId = settings.ui.activeProfileId
  const profiles = useProfileStore((s) => s.profiles)
  const profile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0]
  const roster = usePassportStore((s) => s.roster)
  const partyIds = usePassportStore((s) => s.partyIds)
  const bonds = usePassportStore((s) => s.bonds)
  const getAllCharacters = useDataStore((s) => s.getAllCharacters)
  const showToast = useUIStore((s) => s.showToast)
  const records = useGeneratedStore((s) => s.records)
  const loadedGen = useGeneratedStore((s) => s.loaded)
  const loadGen = useGeneratedStore((s) => s.load)
  const addRecord = useGeneratedStore((s) => s.addRecord)

  const [tab, setTab] = useState<DiaryTab>('all')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loadedGen) void loadGen()
  }, [loadedGen, loadGen])

  const chars = getAllCharacters()
  const partyMembers = useMemo(() => {
    const ids = partyIds.length
      ? partyIds
      : Object.values(bonds)
          .filter((b) => b.placement === 'party' || b.status === 'conquered')
          .map((b) => b.characterId)
    const fromParty = ids
      .map((id) => {
        const bond = bonds[id]
        const saved = roster.find((r) => r.id === id)
        const card = chars[id] ?? (saved ? rosterCardToCharacter(saved) : null)
        return {
          id,
          name: bond?.displayName ?? saved?.displayName ?? card?.name ?? id,
          background: card?.background ?? '',
        }
      })
      .filter((m) => m.name)
    if (fromParty.length === 0) {
      return [
        {
          id: DEMO_ROSTER_MEMBER.characterId,
          name: DEMO_ROSTER_MEMBER.displayName,
          background: DEMO_ROSTER_MEMBER.background,
        },
      ]
    }
    return fromParty
  }, [partyIds, bonds, roster, chars])

  const diaryRecords = records.filter((r) => r.type === 'diary')
  const filtered = diaryRecords.filter((r) => {
    if (tab === 'mine') return r.meta?.scope === 'player'
    if (tab === 'party') return r.meta?.scope === 'party'
    return true
  })

  const peekSelf = async () => {
    if (busy) return
    setBusy(true)
    const dateStr = new Date().toLocaleDateString('zh-CN')
    const name = profile?.name ?? '旅者'
    showToast('日记撰写中…', '窥探自己')
    try {
      let text: string
      if (!hasTextApiConfigured(settings)) {
        text = `（${dateStr}）\n我在酒馆角落摊开本子。今天的路还热着，名字却已经开始被大陆记住——或误解。`
      } else {
        text = await generateDiaryEntry(
          settings,
          name,
          profile?.persona || '艾泽利亚的旅者',
          dateStr,
          [],
        )
      }
      await addRecord({
        type: 'diary',
        title: `${name} · ${dateStr}`,
        content: text,
        meta: { scope: 'player', date: dateStr },
      })
      showToast('日记已生成', name)
    } catch (e) {
      showToast('生成失败', e instanceof Error ? e.message : '未知错误')
    } finally {
      setBusy(false)
    }
  }

  const peekMember = async (member: { id: string; name: string; background: string }) => {
    if (busy) return
    setBusy(true)
    const dateStr = new Date().toLocaleDateString('zh-CN')
    showToast('窥探日记…', member.name)
    try {
      let text: string
      if (!hasTextApiConfigured(settings)) {
        text = `（${dateStr}）\n${member.name}的字迹潦草：今天又被叫去做事。她看我的眼神，像在量一把刀。`
      } else {
        const all = await listAllMemories()
        const card = chars[member.id]
        const mems = card
          ? filterMemoriesForParticipants(all, [card]).map((m) => m.text)
          : []
        text = await generateDiaryEntry(
          settings,
          member.name,
          member.background || '队伍同伴',
          dateStr,
          mems,
        )
      }
      await addRecord({
        type: 'diary',
        title: `${member.name} · ${dateStr}`,
        content: text,
        meta: { scope: 'party', characterId: member.id, date: dateStr },
      })
      showToast('已窥得日记', member.name)
    } catch (e) {
      showToast('生成失败', e instanceof Error ? e.message : '未知错误')
    } finally {
      setBusy(false)
    }
  }

  return (
    <TomeSubShell title="窥探日记" onBack={onBack}>
      <div className="tavern-diary">
        <div className="tavern-diary__tabs">
          {(
            [
              ['all', '全部'],
              ['mine', '我的'],
              ['party', '队伍'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`tavern-diary__tab${tab === id ? ' is-active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="tavern-diary__hint">
          <BookOpen size={12} /> 日记从角色视角记录经历。可窥探自己或队伍同伴（AI 生成）。
        </p>

        <div className="tavern-diary__actions">
          <button type="button" className="tavern-job__accept" disabled={busy} onClick={() => void peekSelf()}>
            {busy ? <Loader2 size={14} className="animate-spin inline" /> : null} + 新建日记
          </button>
          <div className="tavern-diary__peek-row">
            {partyMembers.slice(0, 4).map((m) => (
              <button
                key={m.id}
                type="button"
                className="tome-btn"
                disabled={busy}
                onClick={() => void peekMember(m)}
              >
                窥探 {m.name}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="tavern-diary__empty">
            <RefreshCw size={28} />
            <p>尚无日记</p>
            <span>写第一篇，或窥探队伍同伴</span>
          </div>
        ) : (
          <ul className="tavern-diary__list">
            {filtered.map((r) => (
              <li key={r.id} className="tavern-diary__item">
                <h4>{r.title}</h4>
                <p>{r.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </TomeSubShell>
  )
}
