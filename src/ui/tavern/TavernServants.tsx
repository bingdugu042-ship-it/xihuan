import { usePassportStore } from '@/store/passportStore'
import { useUIStore } from '@/store/uiStore'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'
import { TavernArenaPlay } from '@/ui/tavern/TavernPlayPanels'
import { TavernGossip } from './TavernGossip'

export function TavernServants({ onBack }: { onBack: () => void }) {
  const roster = usePassportStore((s) => s.roster)
  const bonds = usePassportStore((s) => s.bonds)
  const upsertBond = usePassportStore((s) => s.upsertBond)
  const showToast = useUIStore((s) => s.showToast)

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
    })
    showToast('已登记为仆从', name)
  }

  return (
    <TomeSubShell title="仆从管理" onBack={onBack}>
      <p className="tome-hint mb-3">
        规则书 Ch20：仆从好感上限 80，可命令战斗/跑腿/守夜。好感≥70 且主动表达爱慕可转正为伴侣。
      </p>

      <section className="tome-section">
        <div className="tome-section__title">当前仆从（{servants.length}）</div>
        {servants.length === 0 && <p className="tome-hint">尚无仆从。战斗收服或契约后可登记。</p>}
        <ul className="tome-list">
          {servants.map((b) => (
            <li key={b.characterId} className="tome-list-item flex-col !items-stretch gap-2">
              <div className="tome-list-item__name">{b.displayName}</div>
              <div className="flex flex-wrap gap-2">
                {['守夜', '跑腿', '暖床', '战斗待命'].map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    className="tome-btn"
                    onClick={() => showToast(`仆从指令`, `${b.displayName}：${cmd}`)}
                  >
                    {cmd}
                  </button>
                ))}
                <button
                  type="button"
                  className="tome-btn tome-btn--accent"
                  onClick={() =>
                    void upsertBond({ ...b, role: 'partner' }).then(() => showToast('已转正为伴侣', b.displayName))
                  }
                >
                  转正
                </button>
                <button
                  type="button"
                  className="tome-btn tome-btn--ghost"
                  onClick={() =>
                    void upsertBond({ ...b, role: undefined, status: 'met', placement: 'none' }).then(() =>
                      showToast('已释放', b.displayName),
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
