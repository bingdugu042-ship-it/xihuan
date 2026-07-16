import { FEMALE_STAT_LABELS, MALE_STAT_LABELS, useBodyStatsStore } from '@/store/bodyStatsStore'
import { useAdventureStatsStore } from '@/store/adventureStatsStore'
import { useSessionStore } from '@/store/sessionStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'
import { useShopStore } from '@/store/shopStore'
import { useDataStore } from '@/store/dataStore'
import { useAzeriaProgressStore } from '@/store/azeriaProgressStore'
import { resolveCheck, type DiceSkill } from '@/utils/dice'
import { usePassportStore } from '@/store/passportStore'
import { putSession } from '@/storage/db'
import { formatAdventureStatsPanel } from '@/data/adventureAttributes'
import {
  formatTravelEncounterMessage,
  rollTravelEncounter,
  rollTravelEncounterForFacility,
} from '@/utils/travelEncounter'
import { formatTravelWeatherMessage, rollTravelWeather } from '@/utils/travelWeather'
import { AZERIA_REGIONS } from '@/worldview/azeriaRegionMap'
import {
  formatMapPanel,
  formatPartyPanel,
  formatRegionPanel,
  resolveMoveTarget,
} from './azeriaCommandViews'

export interface CommandResult {
  handled: boolean
  skipAi?: boolean
}

function formatFullPanel(): string {
  const adv = useAdventureStatsStore.getState()
  const parts = [formatAdventureStatsPanel(adv.attributes, adv.classId), '', formatBodyPanel()]
  return parts.join('\n')
}

function formatBodyPanel(): string {
  const { gender, stats, stateLabels } = useBodyStatsStore.getState()
  const labels = gender === 'male' ? MALE_STAT_LABELS : FEMALE_STAT_LABELS
  const lines = [
    '┌─────────────────────────────────────────┐',
    '│       身体状态面板 · 艾泽利亚冒险者          │',
    '├─────────────────────────────────────────┤',
  ]
  for (const [key, label] of Object.entries(labels)) {
    const v = stats[key] ?? 0
    const filled = Math.round(v / 10)
    const bar = '█'.repeat(filled) + '░'.repeat(10 - filled)
    lines.push(`│  ${label.padEnd(8, ' ')} ${bar} ${String(v).padStart(3, ' ')}%   │`)
  }
  lines.push('├─────────────────────────────────────────┤')
  lines.push(`│  状态：${stateLabels.lower ?? '—'} · ${stateLabels.stamina ?? '—'} · ${stateLabels.mind ?? '—'}`)
  lines.push('└─────────────────────────────────────────┘')
  return lines.join('\n')
}

export async function handleSlashCommand(raw: string): Promise<CommandResult> {
  const text = raw.trim()
  if (!text.startsWith('$')) return { handled: false }

  const sessionStore = useSessionStore.getState()
  const { appendSystemMessage, activeSession } = sessionStore

  const parts = text.slice(1).trim().split(/\s+/)
  const cmd = (parts[0] ?? '').toLowerCase()

  if (cmd === '面板') {
    await appendSystemMessage(formatFullPanel(), 'system')
    return { handled: true, skipAi: true }
  }

  if (cmd === '地图') {
    await appendSystemMessage(formatMapPanel(activeSession?.regionId), 'system')
    return { handled: true, skipAi: true }
  }

  if (cmd === '区域') {
    await appendSystemMessage(formatRegionPanel(activeSession?.regionId), 'system')
    return { handled: true, skipAi: true }
  }

  if (cmd === '移动') {
    const target = parts.slice(1).join(' ')
    const hit = resolveMoveTarget(target)
    if (!hit) {
      await appendSystemMessage('未识别区域。例：$移动 精灵之森 / $移动 深渊裂谷', 'warning')
      return { handled: true, skipAi: true }
    }

    const weather = rollTravelWeather()
    const weatherFormatted = formatTravelWeatherMessage(weather)
    await appendSystemMessage(weatherFormatted, 'system')

    const encounter =
      hit.azeriaRegionId
        ? rollTravelEncounter(hit.azeriaRegionId, AZERIA_REGIONS[hit.azeriaRegionId].name)
        : rollTravelEncounterForFacility(hit.facilityId)

    if (encounter) {
      const formatted = formatTravelEncounterMessage(encounter)
      const { playDiceAnimation } = await import('@/store/diceUiStore')
      await playDiceAnimation({
        result: {
          skill: 'finesse',
          skillLabel: '旅行遭遇',
          roll: encounter.roll,
          modifier: 0,
          cultivationModifier: 0,
          adventureModifier: 0,
          total: encounter.roll,
          dc: 10,
          success: !encounter.critFail,
          critSuccess: encounter.critSuccess,
          critFail: encounter.critFail,
        },
        title: `旅行遭遇 · ${encounter.regionName}`,
        commitToChat: false,
      })
      useUIStore.getState().setPendingTravelEncounter({
        facilityId: hit.facilityId,
        roll: encounter.roll,
        formatted,
      })
      await appendSystemMessage(formatted, 'dice')
      if (activeSession) {
        const next = {
          ...activeSession,
          travelWeatherRoll: weather.roll,
          lastTravelWeather: weatherFormatted,
          travelEncounterRoll: encounter.roll,
          lastTravelEncounter: formatted,
          updatedAt: Date.now(),
        }
        await putSession(next)
        useSessionStore.setState((s) => ({
          activeSession: next,
          sessions: s.sessions.map((x) => (x.id === next.id ? next : x)),
        }))
      } else {
        useUIStore.getState().showToast('旅行遭遇', formatted.split('\n')[0] ?? '已掷骰')
      }
    } else if (activeSession) {
      const next = {
        ...activeSession,
        travelWeatherRoll: weather.roll,
        lastTravelWeather: weatherFormatted,
        updatedAt: Date.now(),
      }
      await putSession(next)
      useSessionStore.setState((s) => ({
        activeSession: next,
        sessions: s.sessions.map((x) => (x.id === next.id ? next : x)),
      }))
    }

    useUIStore.getState().setActiveTab('adventure')
    useUIStore.getState().openFacilityPlayPage(hit.facilityId)
    await appendSystemMessage(
      `前往 ${hit.regionName}（入口：${hit.facilityName}）。请在冒险页确认身份后进入。`,
      'system',
    )
    return { handled: true, skipAi: true }
  }

  if (cmd === '队伍') {
    await appendSystemMessage(formatPartyPanel(), 'system')
    return { handled: true, skipAi: true }
  }

  if (cmd === '记录') {
    if (!activeSession) {
      await appendSystemMessage('当前无进行中的会话，无法保存。', 'warning')
      return { handled: true, skipAi: true }
    }
    await putSession({ ...activeSession, updatedAt: Date.now() })
    await appendSystemMessage(`进度已保存 · ${activeSession.title}`, 'system')
    return { handled: true, skipAi: true }
  }

  if (cmd === '休息') {
    await appendSystemMessage(
      [
        '【休息规则 · 摘要】',
        '短休（1h）：投生命骰恢复 HP，可恢复已消耗骰子（上限等级一半）。',
        '长休（8h）：HP/魔力全恢复，力竭-1，需安全地点或帐篷。',
        '危险地点长休：DC15 感知，失败则夜袭。',
      ].join('\n'),
      'system',
    )
    return { handled: true, skipAi: true }
  }

  if (cmd === '跳过') {
    await appendSystemMessage(
      '已请求跳过当前场景节点。下一条回复请快速收束本段并进入下一节拍（保留后果与状态）。',
      'system',
    )
    return { handled: true, skipAi: false }
  }

  if (cmd === '骰子') {
    const v = (parts[1] ?? '状态').toLowerCase()
    const current = useSettingsStore.getState().settings.ui.azeriaDiceMode ?? 'mixed'
    if (v === '状态') {
      await appendSystemMessage(`当前 $骰子 模式：${current}`, 'system')
      return { handled: true, skipAi: true }
    }
    const next = v === '开' || v === 'on' ? 'on' : v === '关' || v === 'off' ? 'off' : 'mixed'
    await useSettingsStore.getState().updateUI({ azeriaDiceMode: next })
    await appendSystemMessage(`已设置 $骰子 模式：${next}`, 'system')
    return { handled: true, skipAi: true }
  }

  if (cmd === '天气') {
    const current = activeSession?.lastTravelWeather
    if (current) {
      await appendSystemMessage(`当前旅行天气：\n${current}`, 'system')
      return { handled: true, skipAi: true }
    }
    const rolled = formatTravelWeatherMessage(rollTravelWeather())
    await appendSystemMessage(`未在旅行中，展示一次参考天气：\n${rolled}`, 'system')
    return { handled: true, skipAi: true }
  }

  if (cmd === '粗口') {
    const v = (parts[1] ?? '关').toLowerCase()
    const map: Record<string, 'off' | 'light' | 'medium' | 'hard'> = {
      关: 'off',
      轻度: 'light',
      中度: 'medium',
      重度: 'hard',
      off: 'off',
      light: 'light',
      medium: 'medium',
      hard: 'hard',
    }
    const next = map[v] ?? 'off'
    await useSettingsStore.getState().updateUI({ azeriaDirtyTalkLevel: next })
    await appendSystemMessage(`已设置 $粗口：${next}`, 'system')
    return { handled: true, skipAi: true }
  }

  if (cmd === '公开') {
    const v = (parts[1] ?? '状态').toLowerCase()
    if (v === '状态') {
      const curr = useSettingsStore.getState().settings.ui.azeriaPublicMode ? 'on' : 'off'
      await appendSystemMessage(`当前 $公开：${curr}`, 'system')
      return { handled: true, skipAi: true }
    }
    const next = v === '开' || v === 'on'
    await useSettingsStore.getState().updateUI({ azeriaPublicMode: next })
    await appendSystemMessage(`已设置 $公开：${next ? 'on' : 'off'}`, 'system')
    return { handled: true, skipAi: true }
  }

  if (cmd === '怀孕') {
    const v = (parts[1] ?? '状态').toLowerCase()
    if (v === '状态') {
      const curr = useSettingsStore.getState().settings.ui.azeriaPregnancyEnabled ? 'on' : 'off'
      await appendSystemMessage(`当前 $怀孕：${curr}`, 'system')
      return { handled: true, skipAi: true }
    }
    const next = v === '开' || v === 'on'
    await useSettingsStore.getState().updateUI({ azeriaPregnancyEnabled: next })
    await appendSystemMessage(`已设置 $怀孕：${next ? 'on' : 'off'}`, 'system')
    return { handled: true, skipAi: true }
  }

  if (cmd === '投骰') {
    const skillRaw = (parts[1] ?? '').toLowerCase()
    const dcRaw = (parts[2] ?? '15').replace(/^dc/i, '')
    const skillMap: Record<string, DiceSkill> = {
      说服: 'persuasion',
      威压: 'intimidation',
      魅惑: 'allure',
      战斗: 'combat',
      机巧: 'finesse',
      persuasion: 'persuasion',
      intimidation: 'intimidation',
      allure: 'allure',
      combat: 'combat',
      finesse: 'finesse',
    }
    const skill = skillMap[skillRaw] ?? 'allure'
    const dc = Number.parseInt(dcRaw, 10)
    const finalDc = Number.isFinite(dc) ? Math.min(30, Math.max(5, dc)) : 15
    const result = resolveCheck(
      { skill, dc: finalDc },
      usePassportStore.getState().cultivation,
      useAdventureStatsStore.getState().attributes,
    )
    const { playDiceAnimation } = await import('@/store/diceUiStore')
    await playDiceAnimation({
      result,
      title: `判定 · ${result.skillLabel}`,
      commitToChat: true,
    })
    return { handled: true, skipAi: true }
  }

  if (cmd === '挑战') {
    const v = (parts[1] ?? '状态').toLowerCase()
    const map: Record<string, 'off' | 'all_dice' | 'abstinence' | 'all_races'> = {
      关: 'off',
      关闭: 'off',
      off: 'off',
      全骰: 'all_dice',
      alldice: 'all_dice',
      all_dice: 'all_dice',
      禁欲: 'abstinence',
      abstinence: 'abstinence',
      全种族: 'all_races',
      allraces: 'all_races',
      all_races: 'all_races',
    }
    if (v === '状态') {
      const curr = useSettingsStore.getState().settings.ui.azeriaChallengeMode ?? 'off'
      await appendSystemMessage(`当前 $挑战：${curr}`, 'system')
      return { handled: true, skipAi: true }
    }
    const next = map[v] ?? 'off'
    await useSettingsStore.getState().updateUI({ azeriaChallengeMode: next })
    if (next !== 'off') {
      await useAzeriaProgressStore.getState().pushChallengeLog(
        `${new Date().toLocaleString('zh-CN')} 开启挑战：${next}`,
      )
    }
    await appendSystemMessage(`已设置 $挑战：${next}`, 'system')
    return { handled: true, skipAi: true }
  }

  if (cmd === '背包') {
    const inv = useShopStore.getState().inventory
    if (inv.length === 0) {
      await appendSystemMessage('背包为空。可在酒馆商店购买或炼金制作。', 'system')
    } else {
      const lines = inv.map((e) => {
        const item = useShopStore.getState().getItem(e.itemId)
        return `· ${item?.name ?? e.itemId} ×${e.count}`
      })
      await appendSystemMessage(['【背包】', ...lines].join('\n'), 'system')
    }
    return { handled: true, skipAi: true }
  }

  if (cmd === '经营') {
    useUIStore.getState().setActiveTab('tavern')
    useUIStore.getState().setTavernSubView('industry')
    await appendSystemMessage('已打开酒馆 · 产业经营。', 'system')
    return { handled: true, skipAi: true }
  }

  if (cmd === '赠礼') {
    useUIStore.getState().setActiveTab('tavern')
    useUIStore.getState().setTavernSubView('gifts')
    await appendSystemMessage('已打开酒馆 · 赠礼面板。', 'system')
    return { handled: true, skipAi: true }
  }

  if (cmd === '日历' || cmd === '档案') {
    useUIStore.getState().setActiveTab('tavern')
    useUIStore.getState().setTavernSubView('calendar')
    const logs = useAzeriaProgressStore.getState().challengeLog
    if (cmd === '档案' && logs.length) {
      await appendSystemMessage(['【挑战档案】', ...logs.slice(0, 10)].join('\n'), 'system')
    } else {
      await appendSystemMessage('已打开日历与档案。', 'system')
    }
    return { handled: true, skipAi: true }
  }

  if (cmd === '仆从') {
    const sub = (parts[1] ?? '列表').toLowerCase()
    const bonds = Object.values(usePassportStore.getState().bonds).filter((b) => b.role === 'servant')
    if (sub === '列表' || !parts[1]) {
      if (!bonds.length) await appendSystemMessage('当前无仆从。可在酒馆 · 仆从管理登记。', 'system')
      else await appendSystemMessage(['【仆从列表】', ...bonds.map((b) => `· ${b.displayName}`)].join('\n'), 'system')
      return { handled: true, skipAi: true }
    }
    useUIStore.getState().setActiveTab('tavern')
    useUIStore.getState().setTavernSubView('servants')
    await appendSystemMessage(`仆从指令请在酒馆面板操作，或对 ${parts[1]} 在叙事中下令。`, 'system')
    return { handled: true, skipAi: true }
  }

  if (cmd === 'npc' || cmd === '外貌') {
    const name = parts.slice(1).join(' ').trim()
    if (!name) {
      await appendSystemMessage(`用法：$${cmd} {角色名}`, 'warning')
      return { handled: true, skipAi: true }
    }
    const chars = Object.values(useDataStore.getState().getAllCharacters())
    const hit = chars.find((c) => c.name.includes(name) || c.id.includes(name))
    const bond = Object.values(usePassportStore.getState().bonds).find((b) => b.displayName.includes(name))
    if (!hit && !bond) {
      await appendSystemMessage(`未找到「${name}」。`, 'warning')
      return { handled: true, skipAi: true }
    }
    if (cmd === 'npc') {
      const c = hit
      const lines = [
        `【NPC 模板 · ${c?.name ?? bond?.displayName}】`,
        `种族：${c?.raceId ?? bond?.raceId ?? '—'}`,
        `简介：${c?.background ?? c?.appearance ?? '动态生成角色，详见对话。'}`,
      ]
      await appendSystemMessage(lines.join('\n'), 'system')
    } else {
      await appendSystemMessage(
        `【外貌 · ${hit?.name ?? bond?.displayName}】\n${hit?.appearance ?? hit?.clothing ?? hit?.background ?? '请在对话中请求详细外貌描写。'}`,
        'system',
      )
    }
    return { handled: true, skipAi: true }
  }

  if (cmd === '互动' || cmd === 'h' || cmd === 'H') {
    const name = parts.slice(1).join(' ').trim()
    if (!name) {
      await appendSystemMessage(`用法：$${parts[0]} {角色名}`, 'warning')
      return { handled: true, skipAi: true }
    }
    await appendSystemMessage(
      cmd.toLowerCase() === 'h'
        ? `【亲密请求】对象：${name}。好感需≥70；对方可拒绝（投骰）。下一条叙事请推进或拒绝。`
        : `【日常互动】对象：${name}。请生成一段非战斗日常互动。`,
      'narrator',
    )
    return { handled: true, skipAi: false }
  }

  if (cmd === '命令') {
    const content = parts.slice(1).join(' ').trim() || '（未写明内容）'
    await appendSystemMessage(
      `【命令】${content}\n需服从度足够；对方按服从阶段执行或抗拒。`,
      'narrator',
    )
    return { handled: true, skipAi: false }
  }

  if (cmd === '重置') {
    await appendSystemMessage(
      '已请求重置当前场景。下一条回复请清空本段冲突并回到场景入口（保留长期状态）。',
      'warning',
    )
    return { handled: true, skipAi: false }
  }

  await appendSystemMessage(
    '未知指令。输入 $地图 / $背包 / $经营 / $赠礼 / $仆从 / $投骰 / $挑战 等，或打开「规则书」Tab。',
    'warning',
  )
  return { handled: true, skipAi: true }
}

export { formatBodyPanel }
