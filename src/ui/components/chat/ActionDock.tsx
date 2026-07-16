import { useMemo, useState } from 'react'
import { Dices, FlaskConical, MapPin, Swords, UserPlus, X } from 'lucide-react'
import {
  DICE_SKILL_LABELS,
  resolveCheck,
  type DiceSkill,
} from '@/utils/dice'
import { playDiceAnimation } from '@/store/diceUiStore'
import { useAdventureStatsStore } from '@/store/adventureStatsStore'
import { usePassportStore } from '@/store/passportStore'
import { useSessionStore } from '@/store/sessionStore'
import { useShopStore } from '@/store/shopStore'
import { useUIStore } from '@/store/uiStore'
import { useBodyStatsStore } from '@/store/bodyStatsStore'
import { AZERIA_WORLD_REGION_MAP } from '@/data/azeriaWorldRegions'
import { resolveAzeriaRegion } from '@/worldview/azeriaRegionMap'
import { FACILITY_MAP } from '@/data/facilities'

const QUICK_SKILLS: { skill: DiceSkill; dc: number }[] = [
  { skill: 'persuasion', dc: 13 },
  { skill: 'allure', dc: 14 },
  { skill: 'intimidation', dc: 14 },
  { skill: 'combat', dc: 15 },
  { skill: 'finesse', dc: 13 },
]

/** Composer 上方行动坞：投骰 / 用药 / 换点 / 开战 */
export function ActionDock() {
  const activeSession = useSessionStore((s) => s.activeSession)
  const appendSystemMessage = useSessionStore((s) => s.appendSystemMessage)
  const setLastDiceSummary = useSessionStore((s) => s.setLastDiceSummary)
  const actionSheet = useUIStore((s) => s.actionSheet)
  const setActionSheet = useUIStore((s) => s.setActionSheet)
  const openCombat = useUIStore((s) => s.openCombat)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const showToast = useUIStore((s) => s.showToast)
  const cultivation = usePassportStore((s) => s.cultivation)
  const adventureAttrs = useAdventureStatsStore((s) => s.attributes)
  const inventory = useShopStore((s) => s.inventory)
  const getItem = useShopStore((s) => s.getItem)
  const consumeItem = useShopStore((s) => s.consumeItem)
  const applyAiWriteback = useBodyStatsStore((s) => s.applyAiWriteback)
  const [busy, setBusy] = useState(false)

  const azeria = useMemo(
    () => (activeSession ? resolveAzeriaRegion(activeSession.regionId) : null),
    [activeSession],
  )
  const region = azeria ? AZERIA_WORLD_REGION_MAP[azeria.id] : null

  if (!activeSession) return null

  const rollSkill = async (skill: DiceSkill, dc: number) => {
    if (busy) return
    setBusy(true)
    try {
      const result = resolveCheck({ skill, dc }, cultivation, adventureAttrs)
      await playDiceAnimation({ result, title: `${DICE_SKILL_LABELS[skill]} DC${dc}` })
      await setLastDiceSummary(
        `【判定】${DICE_SKILL_LABELS[skill]} d20=${result.roll} 总计${result.total} vs DC${dc} → ${result.success ? '成功' : '失败'}`,
      )
      setActionSheet(null)
    } finally {
      setBusy(false)
    }
  }

  const usePotion = async (itemId: string) => {
    const item = getItem(itemId)
    if (!item) return
    const ok = await consumeItem(itemId, 1)
    if (!ok) {
      showToast('背包不足', item.name)
      return
    }
    let effect = `你使用了「${item.name}」。`
    if (itemId.includes('heal')) {
      await applyAiWriteback({
        deltas: { stamina: 8, physical: 3 },
        labels: { stamina: '药水回暖', mind: '精神一振' },
      })
      effect += ' 体力回升。'
    } else if (itemId.includes('desire')) {
      await applyAiWriteback({
        deltas: { sensitivity: 4, exposure: 2 },
        labels: { lower: '欲火升温', mind: '药剂生效' },
      })
      effect += ' 魅惑氛围加深。'
    } else if (itemId.includes('antidote')) {
      effect += ' 毒素被压下。'
    }
    await appendSystemMessage(effect, 'system')
    showToast('已用药', item.name)
    setActionSheet(null)
  }

  const potions = inventory.filter((e) => {
    const it = getItem(e.itemId)
        return it && (e.itemId.startsWith('pot_') || it.category === 'potion')
  })

  const startFight = () => {
    const dc = Math.min(22, 12 + (region?.danger ?? 2) * 2)
    openCombat({
      enemyName: `${region?.race ?? '未知'}遭遇战`,
      dc,
      regionId: region?.id,
    })
    setActionSheet(null)
  }

  const moveToPoi = async (poiName: string) => {
    await appendSystemMessage(`你挪步前往「${poiName}」。周遭氛围随之变化。`, 'narrator')
    showToast('换点', poiName)
    setActionSheet(null)
  }

  return (
    <div className="action-dock">
      <div className="action-dock__rail">
        <button type="button" className="action-dock__btn" onClick={() => setActionSheet(actionSheet === 'dice' ? null : 'dice')}>
          <Dices size={14} /> 投骰
        </button>
        <button type="button" className="action-dock__btn" onClick={() => setActionSheet(actionSheet === 'potion' ? null : 'potion')}>
          <FlaskConical size={14} /> 用药
        </button>
        <button type="button" className="action-dock__btn" onClick={() => setActionSheet(actionSheet === 'move' ? null : 'move')}>
          <MapPin size={14} /> 换点
        </button>
        <button type="button" className="action-dock__btn" onClick={startFight}>
          <Swords size={14} /> 开战
        </button>
        <button
          type="button"
          className="action-dock__btn"
          onClick={() => {
            setActiveTab('tavern')
            useUIStore.getState().setTavernSubView('party')
          }}
        >
          <UserPlus size={14} /> 邀人
        </button>
      </div>

      {actionSheet && (
        <div className="action-dock__sheet">
          <div className="action-dock__sheet-head">
            <span>
              {actionSheet === 'dice' && '选择检定'}
              {actionSheet === 'potion' && '背包药剂'}
              {actionSheet === 'move' && '本域地点'}
            </span>
            <button type="button" onClick={() => setActionSheet(null)} aria-label="关闭">
              <X size={14} />
            </button>
          </div>

          {actionSheet === 'dice' && (
            <div className="action-dock__grid">
              {QUICK_SKILLS.map((q) => (
                <button
                  key={q.skill}
                  type="button"
                  className="action-dock__option"
                  disabled={busy}
                  onClick={() => void rollSkill(q.skill, q.dc)}
                >
                  {DICE_SKILL_LABELS[q.skill]}
                  <small>DC {q.dc}</small>
                </button>
              ))}
            </div>
          )}

          {actionSheet === 'potion' && (
            <div className="action-dock__list">
              {potions.length === 0 && <p className="action-dock__empty">暂无药剂。去酒馆炼金或商店购买。</p>}
              {potions.map((e) => {
                const it = getItem(e.itemId)
                return (
                  <button
                    key={e.itemId}
                    type="button"
                    className="action-dock__option action-dock__option--row"
                    onClick={() => void usePotion(e.itemId)}
                  >
                    <span>{it?.name ?? e.itemId}</span>
                    <small>×{e.count}</small>
                  </button>
                )
              })}
            </div>
          )}

          {actionSheet === 'move' && (
            <div className="action-dock__list">
              {(region?.pois?.map((p) => p.name) ??
                region?.cities?.map((c) => c.name) ??
                [FACILITY_MAP[activeSession.regionId]?.name ?? '此处']                ).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="action-dock__option action-dock__option--row"
                    onClick={() => void moveToPoi(p)}
                  >
                    {p}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
