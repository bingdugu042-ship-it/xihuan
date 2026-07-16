import { useMemo, useState } from 'react'
import { Loader2, Users, X } from 'lucide-react'
import { usePassportStore } from '@/store/passportStore'
import { useDataStore } from '@/store/dataStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'
import { useGeneratedStore } from '@/store/generatedStore'
import { generateRosterBeat } from '@/ai/contentClient'
import { RACE_MAP } from '@/data/races'
import {
  DEMO_ROSTER_MEMBER,
  ROSTER_BEAT_LABELS,
  type RosterBeatAction,
} from '@/data/tavernLife'
import { getCharacterImageCandidates, characterPlaceholder } from '@/utils/image'
import { rosterCardToCharacter } from '@/utils/interactableCharacters'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'

interface RosterCard {
  characterId: string
  displayName: string
  raceId: string
  role: string
  placement: string
  favor?: number
  background?: string
  demo?: boolean
  avatar?: string
}

const ACTIONS: RosterBeatAction[] = ['errand', 'warmbed', 'standby', 'promote']

export function TavernRoster({ onBack }: { onBack: () => void }) {
  const bonds = usePassportStore((s) => s.bonds)
  const partyIds = usePassportStore((s) => s.partyIds)
  const roster = usePassportStore((s) => s.roster)
  const chars = useDataStore((s) => s.getAllCharacters)()
  const settings = useSettingsStore((s) => s.settings)
  const showToast = useUIStore((s) => s.showToast)
  const addRecord = useGeneratedStore((s) => s.addRecord)

  const [detail, setDetail] = useState<RosterCard | null>(null)
  const [beatText, setBeatText] = useState<string | null>(null)
  const [beatTitle, setBeatTitle] = useState('')
  const [busy, setBusy] = useState(false)

  const cards = useMemo(() => {
    const list: RosterCard[] = []
    const seen = new Set<string>()

    for (const id of partyIds) {
      const b = bonds[id]
      if (!b) continue
      seen.add(id)
      const saved = roster.find((r) => r.id === id)
      const card = chars[id] ?? (saved ? rosterCardToCharacter(saved) : null)
      list.push({
        characterId: id,
        displayName: b.displayName,
        raceId: b.raceId,
        role: b.role === 'servant' ? '仆从' : '伴侣',
        placement: b.placement === 'party' ? '出征' : b.placement === 'home' ? '驻留' : '闲置',
        favor: b.favorPeak,
        background: card?.background ?? '',
        avatar: card
          ? getCharacterImageCandidates(card)[0]
          : characterPlaceholder(b.displayName, id),
      })
    }

    for (const b of Object.values(bonds)) {
      if (seen.has(b.characterId)) continue
      if (b.status !== 'conquered' && b.placement === 'none') continue
      seen.add(b.characterId)
      const saved = roster.find((r) => r.id === b.characterId)
      const card = chars[b.characterId] ?? (saved ? rosterCardToCharacter(saved) : null)
      list.push({
        characterId: b.characterId,
        displayName: b.displayName,
        raceId: b.raceId,
        role: b.role === 'servant' ? '仆从' : '伴侣',
        placement: b.placement === 'party' ? '出征' : b.placement === 'home' ? '驻留' : '闲置',
        favor: b.favorPeak,
        background: card?.background ?? '',
        avatar: card
          ? getCharacterImageCandidates(card)[0]
          : characterPlaceholder(b.displayName, b.characterId),
      })
    }

    if (list.length === 0) {
      list.push({
        characterId: DEMO_ROSTER_MEMBER.characterId,
        displayName: DEMO_ROSTER_MEMBER.displayName,
        raceId: DEMO_ROSTER_MEMBER.raceId,
        role: '试炼',
        placement: '测试席',
        favor: DEMO_ROSTER_MEMBER.favor,
        background: DEMO_ROSTER_MEMBER.background,
        demo: true,
        avatar: characterPlaceholder(DEMO_ROSTER_MEMBER.displayName, DEMO_ROSTER_MEMBER.characterId),
      })
    }
    return list
  }, [partyIds, bonds, roster, chars])

  const runBeat = async (card: RosterCard, action: RosterBeatAction) => {
    if (busy) return
    setBusy(true)
    const label = ROSTER_BEAT_LABELS[action]
    showToast(`${label}中…`, card.displayName)
    try {
      const text = await generateRosterBeat(settings, {
        characterName: card.displayName,
        action,
        background: card.background,
      })
      setBeatTitle(`${card.displayName} · ${label}`)
      setBeatText(text)
      await addRecord({
        type: 'roster_beat',
        title: `${card.displayName} · ${label}`,
        content: text,
        meta: { characterId: card.characterId, action },
      })
    } catch (e) {
      showToast('生成失败', e instanceof Error ? e.message : '未知错误')
    } finally {
      setBusy(false)
    }
  }

  return (
    <TomeSubShell title="队伍名册" onBack={onBack}>
      <p className="tome-hint mb-3">
        <Users size={12} className="inline" /> 卡片查看详情；跑腿 / 暖床 / 待命 / 转正会弹出 AI 短剧情。
      </p>

      <div className="roster-grid">
        {cards.map((c) => (
          <button
            key={c.characterId}
            type="button"
            className="roster-card"
            onClick={() => setDetail(c)}
          >
            <img src={c.avatar} alt="" className="roster-card__avatar" />
            <div className="roster-card__body">
              <div className="roster-card__name">{c.displayName}</div>
              <div className="roster-card__meta">
                {RACE_MAP[c.raceId as keyof typeof RACE_MAP]?.name ?? c.raceId} · {c.role}
              </div>
              <div className="roster-card__meta">{c.placement}</div>
            </div>
          </button>
        ))}
      </div>

      {detail && (
        <div className="tavern-modal" role="dialog" aria-modal="true">
          <div className="tavern-modal__panel">
            <button
              type="button"
              className="tavern-modal__close"
              aria-label="关闭"
              onClick={() => setDetail(null)}
            >
              <X size={16} />
            </button>
            <div className="roster-detail">
              <img src={detail.avatar} alt="" className="roster-detail__avatar" />
              <h3>{detail.displayName}</h3>
              <p className="tome-hint">
                {RACE_MAP[detail.raceId as keyof typeof RACE_MAP]?.name ?? detail.raceId} ·{' '}
                {detail.role} · {detail.placement}
                {typeof detail.favor === 'number' ? ` · 好感峰值 ${detail.favor}` : ''}
              </p>
              <p className="roster-detail__bio">{detail.background || '暂无背景。'}</p>
              {detail.demo && (
                <p className="tome-hint">预设测试员：无真实队伍时用于验证指令弹窗。</p>
              )}
              <div className="roster-detail__actions">
                {ACTIONS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className="tome-btn tome-btn--accent"
                    disabled={busy}
                    onClick={() => void runBeat(detail, a)}
                  >
                    {busy ? <Loader2 size={12} className="animate-spin inline" /> : null}{' '}
                    {ROSTER_BEAT_LABELS[a]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {beatText && (
        <div className="tavern-modal" role="dialog" aria-modal="true">
          <div className="tavern-modal__panel">
            <h3 className="tavern-modal__title">{beatTitle}</h3>
            <p className="tavern-modal__body">{beatText}</p>
            <button
              type="button"
              className="tome-btn tome-btn--accent w-full"
              onClick={() => {
                setBeatText(null)
                setBeatTitle('')
              }}
            >
              收起
            </button>
          </div>
        </div>
      )}
    </TomeSubShell>
  )
}
