import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Choice } from '@/types'
import { useSessionStore } from '@/store/sessionStore'
import { useSettingsStore } from '@/store/settingsStore'
import { usePassportStore } from '@/store/passportStore'
import { useAdventureStatsStore } from '@/store/adventureStatsStore'
import { useUIStore } from '@/store/uiStore'
import { playDiceAnimation } from '@/store/diceUiStore'
import {
  DICE_SKILL_LABELS,
  resolveCheck,
  type DiceCheck,
  type DiceRollResult,
} from '@/utils/dice'
import { genId } from '@/storage/db'

interface ChoiceBarProps {
  choices: Choice[]
}

function inferCheck(text: string): DiceCheck | undefined {
  if (/威压|命令|跪下|屈服/.test(text)) return { skill: 'intimidation', dc: 14 }
  if (/战斗|打|剑|爪|撕|开战/.test(text)) return { skill: 'combat', dc: 15 }
  if (/偷偷|锁|陷阱|机巧|骗过|潜行/.test(text)) return { skill: 'finesse', dc: 13 }
  if (/魅|吻|坐怀|贴|咬|身体|欲望|上床/.test(text)) return { skill: 'allure', dc: 14 }
  if (/说服|劝|谈判|契约|承认/.test(text)) return { skill: 'persuasion', dc: 13 }
  return undefined
}

export function ChoiceBar({ choices }: ChoiceBarProps) {
  const appendUserMessage = useSessionStore((s) => s.appendUserMessage)
  const setLastDiceSummary = useSessionStore((s) => s.setLastDiceSummary)
  const isPreview = useSettingsStore((s) => s.settings.ui.characterMode) === 'preview'
  const cultivation = usePassportStore((s) => s.cultivation)
  const adventureAttrs = useAdventureStatsStore((s) => s.attributes)
  const bumpCultivation = usePassportStore((s) => s.bumpCultivation)
  const openCombat = useUIStore((s) => s.openCombat)
  const [busy, setBusy] = useState(false)

  const applyResult = async (choice: Choice, check: DiceCheck, result: DiceRollResult) => {
    await setLastDiceSummary(
      `【判定】${result.skillLabel} d20=${result.roll} 总计${result.total} vs DC${result.dc} → ${result.success ? '成功' : '失败'}`,
    )
    if (result.success) {
      await bumpCultivation({
        allure: check.skill === 'allure' || check.skill === 'persuasion' ? 1 : 0,
        dominion: check.skill === 'intimidation' ? 1 : 0,
        bloodbond: check.skill === 'combat' ? 1 : 0,
      })
    }
    if (check.skill === 'combat' && /战斗|打|开战|角斗/.test(choice.text)) {
      openCombat({ enemyName: choice.text.slice(0, 24), dc: check.dc })
      return
    }
    const suffix = result.success ? '（检定成功）' : '（检定失败）'
    await appendUserMessage(`${choice.text}${suffix}`)
  }

  const handlePick = async (choice: Choice) => {
    if (busy) return
    const check = choice.check ?? inferCheck(choice.text)
    if (!check) {
      void appendUserMessage(choice.text)
      return
    }
    setBusy(true)
    try {
      const result = resolveCheck(check, cultivation, adventureAttrs)
      await playDiceAnimation({ result, title: `${DICE_SKILL_LABELS[check.skill]} DC${check.dc}` })
      await applyResult(choice, check, result)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative z-10 mt-3 flex flex-col gap-2 px-1 pb-2">
      {choices.map((c, i) => {
        const check = c.check ?? inferCheck(c.text)
        return (
          <motion.button
            key={c.id || genId('c')}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            disabled={busy}
            onClick={() => void handlePick(c)}
            className="tome-choice glass rounded-xl px-4 py-2.5 text-left text-sm transition-all"
            style={{
              color: isPreview ? '#fff8ee' : 'var(--c-text)',
              border: check ? '1px solid rgba(201, 163, 90, 0.55)' : '1px solid var(--c-border)',
              background: isPreview ? 'rgba(18, 14, 24, 0.82)' : undefined,
              boxShadow: isPreview ? '0 4px 18px rgba(0, 0, 0, 0.42)' : undefined,
            }}
          >
            <span className="block">{c.text}</span>
            {check && (
              <span className="tome-choice__dice mt-1 block text-[10px]">
                掷骰 · {DICE_SKILL_LABELS[check.skill]} DC {check.dc}
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
