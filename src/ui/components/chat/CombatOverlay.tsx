import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Swords, X } from 'lucide-react'
import { resolveCheck } from '@/utils/dice'
import { playDiceAnimation } from '@/store/diceUiStore'
import { useAdventureStatsStore } from '@/store/adventureStatsStore'
import { usePassportStore } from '@/store/passportStore'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { useAzeriaProgressStore } from '@/store/azeriaProgressStore'
import { useProfileStore } from '@/store/profileStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useShopStore } from '@/store/shopStore'

/** 最小可玩战斗叠层：先攻 → 行动 → D20 → 战报回写聊天 */
export function CombatOverlay() {
  const open = useUIStore((s) => s.combatOpen)
  const combat = useUIStore((s) => s.combat)
  const closeCombat = useUIStore((s) => s.closeCombat)
  const showToast = useUIStore((s) => s.showToast)
  const appendSystemMessage = useSessionStore((s) => s.appendSystemMessage)
  const setLastDiceSummary = useSessionStore((s) => s.setLastDiceSummary)
  const cultivation = usePassportStore((s) => s.cultivation)
  const adventureAttrs = useAdventureStatsStore((s) => s.attributes)
  const bumpReputation = useAzeriaProgressStore((s) => s.bumpReputation)
  const consumeItem = useShopStore((s) => s.consumeItem)
  const getItem = useShopStore((s) => s.getItem)

  const [log, setLog] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [initiativeDone, setInitiativeDone] = useState(false)
  const [playerFirst, setPlayerFirst] = useState(true)

  if (!open || !combat) return null

  const push = (line: string) => setLog((L) => [...L, line].slice(-8))

  const rollInitiative = async () => {
    if (busy) return
    setBusy(true)
    try {
      const result = resolveCheck({ skill: 'finesse', dc: 10 }, cultivation, adventureAttrs)
      await playDiceAnimation({ result, title: '先攻', commitToChat: false })
      const first = result.success
      setPlayerFirst(first)
      push(first ? '先攻成功——你先出手。' : '先攻落后——敌方先压迫你。')
      setInitiativeDone(true)
    } finally {
      setBusy(false)
    }
  }

  const act = async (kind: 'attack' | 'skill' | 'potion' | 'flee') => {
    if (busy || !initiativeDone) return
    setBusy(true)
    try {
      if (kind === 'flee') {
        const result = resolveCheck({ skill: 'finesse', dc: combat.dc - 2 }, cultivation, adventureAttrs)
        await playDiceAnimation({ result, title: '逃跑', commitToChat: false })
        if (result.success) {
          const line = `【战报】你从「${combat.enemyName}」中脱身。`
          await appendSystemMessage(line, 'narrator')
          showToast('脱离战斗')
          closeCombat()
          setLog([])
          setInitiativeDone(false)
        } else {
          push('逃跑失败，敌方咬住不放。')
        }
        return
      }

      if (kind === 'potion') {
        const ok = await consumeItem('pot_heal_minor', 1)
        if (!ok) {
          showToast('没有治疗药水')
          return
        }
        push(`使用「${getItem('pot_heal_minor')?.name ?? '治疗药水'}」，稳住呼吸。`)
        return
      }

      const skill = kind === 'skill' ? 'allure' : 'combat'
      const result = resolveCheck({ skill, dc: combat.dc }, cultivation, adventureAttrs)
      await playDiceAnimation({
        result,
        title: kind === 'skill' ? '技巧/魅惑' : '攻击',
        commitToChat: false,
      })
      await setLastDiceSummary(
        `【战斗】${result.skillLabel} ${result.total} vs DC${combat.dc} → ${result.success ? '命中' : '落空'}`,
      )

      if (result.success) {
        const line = `【战报】对「${combat.enemyName}」的战斗胜利（DC${combat.dc}）。`
        push(line)
        await appendSystemMessage(line, 'narrator')
        if (combat.regionId) await bumpReputation(combat.regionId, 3)
        if (combat.prize) {
          const settings = useSettingsStore.getState().settings
          const profile = useProfileStore
            .getState()
            .profiles.find((p) => p.id === settings.ui.activeProfileId)
          if (profile) {
            const prize = Math.max(20, combat.dc * 3)
            await useProfileStore.getState().updateProfile(profile.id, {
              coins: (profile.coins ?? 0) + prize,
            })
            showToast('胜利', `+${prize} G`)
          }
        } else {
          showToast('战斗胜利')
        }
        closeCombat()
        setLog([])
        setInitiativeDone(false)
      } else {
        push(`攻击未破防（需 DC${combat.dc}）。可再试或用药/逃跑。`)
        if (!playerFirst) {
          push('敌方反扑——你挨了一记（叙事承伤）。')
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const handleClose = () => {
    closeCombat()
    setLog([])
    setInitiativeDone(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="combat-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="combat-overlay__panel"
          initial={{ scale: 0.92, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        >
          <header className="combat-overlay__head">
            <h3>
              <Swords size={16} /> {combat.enemyName}
            </h3>
            <button type="button" onClick={handleClose} aria-label="关闭">
              <X size={16} />
            </button>
          </header>
          <p className="combat-overlay__dc">战斗 DC {combat.dc}</p>

          {!initiativeDone ? (
            <button
              type="button"
              className="combat-overlay__primary"
              disabled={busy}
              onClick={() => void rollInitiative()}
            >
              掷先攻
            </button>
          ) : (
            <div className="combat-overlay__actions">
              <button type="button" disabled={busy} onClick={() => void act('attack')}>
                攻击
              </button>
              <button type="button" disabled={busy} onClick={() => void act('skill')}>
                技巧
              </button>
              <button type="button" disabled={busy} onClick={() => void act('potion')}>
                用药
              </button>
              <button type="button" disabled={busy} onClick={() => void act('flee')}>
                逃跑
              </button>
            </div>
          )}

          <div className="combat-overlay__log">
            {log.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
