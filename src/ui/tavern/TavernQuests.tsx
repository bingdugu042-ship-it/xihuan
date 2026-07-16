import { useUIStore } from '@/store/uiStore'
import { useAzeriaProgressStore } from '@/store/azeriaProgressStore'
import { GUILD_QUESTS, QUEST_RANK_META } from '@/data/azeriaQuests'
import { FACILITY_MAP } from '@/data/facilities'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'

export function TavernQuests({ onBack }: { onBack: () => void }) {
  const openFacilityPlayPage = useUIStore((s) => s.openFacilityPlayPage)
  const setTavernSubView = useUIStore((s) => s.setTavernSubView)
  const showToast = useUIStore((s) => s.showToast)

  const accept = (questId: string, regionId?: string) => {
    void useAzeriaProgressStore.getState().acceptQuest(questId)
    if (regionId && FACILITY_MAP[regionId]) {
      openFacilityPlayPage(regionId)
      showToast('已接取委托', '进入冒险域准备出发')
      return
    }
    setTavernSubView('departure')
    showToast('请先选择出征队伍', '在「出发冒险」中编组后前往地图')
  }

  return (
    <TomeSubShell title="冒险任务" onBack={onBack}>
      <p className="tome-hint mb-3">
        冒险者公会委托（规则书 Ch1.3）。接取后可在对应区域开启冒险；部分任务需先编组。
      </p>
      <ul className="tome-list">
        {GUILD_QUESTS.map((q) => {
          const meta = QUEST_RANK_META[q.rank]
          return (
            <li key={q.id} className="tome-list-item flex-col !items-stretch gap-2">
              <div className="flex w-full items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="tome-tag tome-tag--active"
                      style={{ color: meta.color, borderColor: `${meta.color}55` }}
                    >
                      {q.rank} · {meta.name}
                    </span>
                    <span className="tome-list-item__name">{q.title}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
                    {q.summary}
                  </p>
                  <p className="mt-1 text-[10px]" style={{ color: 'var(--c-gold)' }}>
                    报酬 {q.reward} · 建议 Lv.{q.minLevel}+
                  </p>
                </div>
              </div>
              <button type="button" className="tome-btn tome-btn--accent self-end" onClick={() => accept(q.id, q.regionId)}>
                接取 / 前往
              </button>
            </li>
          )
        })}
      </ul>
    </TomeSubShell>
  )
}
