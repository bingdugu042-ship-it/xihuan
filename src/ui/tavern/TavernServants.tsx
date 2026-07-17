import { useState } from 'react'
import { usePassportStore } from '@/store/passportStore'
import { useUIStore } from '@/store/uiStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useAzeriaProgressStore } from '@/store/azeriaProgressStore'
import { generateRosterBeat } from '@/ai/contentClient'
import { ROSTER_BEAT_LABELS, type RosterBeatAction } from '@/data/tavernLife'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'
import { TavernArenaPlay } from '@/ui/tavern/TavernPlayPanels'
import { TavernGossip } from './TavernGossip'

const CMD_MAP: { label: string; action: RosterBeatAction; favor: number; unlock: string }[] = [
  { label: '跑腿', action: 'errand', favor: 3, unlock: '解锁「跑腿回报」闲聊' },
  { label: '守夜', action: 'standby', favor: 2, unlock: '解锁夜间陪伴语料' },
  { label: '暖床', action: 'warmbed', favor: 5, unlock: '解锁亲密距离描写' },
  { label: '战斗待命', action: 'standby', favor: 4, unlock: '解锁并肩作战加成提示' },
]

export function TavernServants({ onBack }: { onBack: () => void }) {
  const roster = usePassportStore((s) => s.roster)
  const bonds = usePassportStore((s) => s.bonds)
  const upsertBond = usePassportStore((s) => s.upsertBond)
  const showToast = useUIStore((s) => s.showToast)
  const settings = useSettingsStore((s) => s.settings)
  const bumpObedience = useAzeriaProgressStore((s) => s.bumpObedience)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [lastBeat, setLastBeat] = useState<string | null>(null)

  const servants = Object.values(bonds).filter((b) => b.role === 'servant')
  const promotable = roster.filter((r) => !servants.some((s) => s.characterId === r.id))

  const markServant = async (id: string, name: string) => {
    await upsertBond({
      characterId: id,
      displayName: name,
      raceId: roster.find((r) => r.id === id)?.raceId ?? 'human',
      status: 'conquered',
      placement: 'none',
      role: 'servant',
      favorPeak: 10,
    })
    showToast('已登记为仆从', name)
  }

  const runCommand = async (
    characterId: string,
    displayName: string,
    cmd: (typeof CMD_MAP)[number],
  ) => {
    if (busyId) return
    setBusyId(characterId)
    try {
      const bond = bonds[characterId]
      const nextFavor = Math.min(80, (bond?.favorPeak ?? 0) + cmd.favor)
      const text = await generateRosterBeat(settings, {
        characterName: displayName,
        action: cmd.action,
        background: roster.find((r) => r.id === characterId)?.snapshot?.background,
      })
      await upsertBond({
        ...(bond ?? {
          characterId,
          displayName,
          raceId: 'human',
          status: 'conquered',
          placement: 'none',
          role: 'servant',
        }),
        role: 'servant',
        favorPeak: nextFavor,
        memoryText: text.slice(0, 280),
      })
      await bumpObedience(characterId, 2)
      setLastBeat(`${displayName} · ${ROSTER_BEAT_LABELS[cmd.action]}\n好感 ${nextFavor}/80 · ${cmd.unlock}\n\n${text}`)
      showToast(`好感 +${cmd.favor}`, `${cmd.unlock}`)
    } catch (e) {
      showToast('指令失败', e instanceof Error ? e.message : '未知错误')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <TomeSubShell title="仆从管理" onBack={onBack}>
      <p className="tome-hint mb-3">
        每条指令都会触发 AI 短剧情，并动态增加普通好感（上限 80）。不同指令解锁不同互动层。
      </p>

      <section className="tome-section">
        <div className="tome-section__title">当前仆从（{servants.length}）</div>
        {servants.length === 0 && <p className="tome-hint">尚无仆从。战斗收服或契约后可登记。</p>}
        <ul className="tome-list">
          {servants.map((b) => (
            <li key={b.characterId} className="tome-list-item flex-col !items-stretch gap-2">
              <div>
                <div className="tome-list-item__name">{b.displayName}</div>
                <div className="tome-list-item__meta">好感 {b.favorPeak ?? 0}/80</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {CMD_MAP.map((cmd) => (
                  <button
                    key={cmd.label}
                    type="button"
                    className="tome-btn"
                    disabled={busyId === b.characterId}
                    onClick={() => void runCommand(b.characterId, b.displayName, cmd)}
                  >
                    {busyId === b.characterId ? '…' : cmd.label}
                  </button>
                ))}
                <button
                  type="button"
                  className="tome-btn tome-btn--accent"
                  onClick={() =>
                    void upsertBond({ ...b, role: 'partner' }).then(() =>
                      showToast('已转正为伴侣', b.displayName),
                    )
                  }
                >
                  转正
                </button>
                <button
                  type="button"
                  className="tome-btn tome-btn--ghost"
                  onClick={() =>
                    void upsertBond({ ...b, role: undefined, status: 'met', placement: 'none' }).then(
                      () => showToast('已释放', b.displayName),
                    )
                  }
                >
                  释放
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {lastBeat && (
        <section className="tome-card mt-3">
          <div className="tome-section__title">指令回响</div>
          <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed" style={{ color: 'var(--c-text)' }}>
            {lastBeat}
          </p>
        </section>
      )}

      <section className="tome-section">
        <div className="tome-section__title">从名册登记仆从</div>
        <ul className="tome-list">
          {promotable.slice(0, 8).map((r) => (
            <li key={r.id} className="tome-list-item">
              <div className="tome-list-item__name">{r.displayName}</div>
              <button type="button" className="tome-btn" onClick={() => void markServant(r.id, r.displayName)}>
                登记仆从
              </button>
            </li>
          ))}
        </ul>
      </section>
    </TomeSubShell>
  )
}

export function TavernArena({ onBack }: { onBack: () => void }) {
  return <TavernArenaPlay onBack={onBack} />
}

export function TavernForum({ onBack }: { onBack: () => void }) {
  return <TavernGossip onBack={onBack} />
}
