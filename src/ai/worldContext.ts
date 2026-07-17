/**
 * 全局世界语境注入：节日 / 驻留 / 主线 / 自定义地点
 * 供 promptBuilder 与酒馆 AI 共用，保证「写入后全体遵从」。
 */

import { buildFestivalWorldbookBlock } from '@/data/festivals'
import { MAIN_STORY, useAzeriaProgressStore } from '@/store/azeriaProgressStore'
import { useFestivalStore } from '@/store/festivalStore'
import { usePassportStore } from '@/store/passportStore'
import { HOME_PRESET_MAP } from '@/data/homes'
import { AZERIA_ENDINGS } from '@/data/azeriaEndings'
import type { Region } from '@/types'

/** 组装写入 system prompt 的全球语境块 */
export function buildGlobalWorldContext(region?: Region): string {
  const parts: string[] = []

  try {
    const festivals = useFestivalStore.getState().activeFestivals()
    const festBlock = buildFestivalWorldbookBlock(festivals)
    if (festBlock) parts.push(festBlock)
  } catch {
    /* store 未就绪时跳过 */
  }

  try {
    const progress = useAzeriaProgressStore.getState()
    const chapter = MAIN_STORY[Math.max(0, (progress.mainChapter ?? 1) - 1)]
    const titles = progress.titles ?? []
    parts.push(
      [
        '## 主线与称号（推进时参考）',
        `当前主线：第 ${progress.mainChapter}/6 章${chapter ? `「${chapter.title}」· 条件：${chapter.condition}` : ''}`,
        titles.length ? `已获称号：${titles.join('、')}` : '尚未获得称号',
        '推进规则：当对话或委托明显满足章节条件时，可在 JSON 中建议 mainAdvance=true；终局勿提前强行结局。',
        `可选结局线（勿剧透全开）：${AZERIA_ENDINGS.slice(0, 3)
          .map((e) => e.name)
          .join(' / ')}…`,
      ].join('\n'),
    )
  } catch {
    /* ignore */
  }

  try {
    const pass = usePassportStore.getState()
    const preset = HOME_PRESET_MAP[pass.homePresetId]
    const residents = (pass.homeIds ?? [])
      .map((id) => pass.bonds[id]?.displayName)
      .filter(Boolean)
    if (preset || residents.length) {
      parts.push(
        [
          '## 酒馆驻留世界书',
          preset
            ? `驻留氛围「${preset.name}」：${preset.description}`
            : '驻留氛围：默认酒馆阁楼',
          residents.length
            ? `当前驻留对象：${residents.join('、')}。群聊/私语时应体现同住日常与亲密距离。`
            : '暂无驻留对象。',
        ].join('\n'),
      )
    }
  } catch {
    /* ignore */
  }

  if (region?.custom) {
    const pin = (region as Region & { mapNote?: string; mapStyle?: string }).mapNote
    const style = (region as Region & { mapStyle?: string }).mapStyle
    parts.push(
      [
        '## 自定义地点（玩家创建，必须严格读取）',
        `地点名：${region.name}`,
        `前提：${region.premise}`,
        `描写：${region.description}`,
        pin ? `地图角标/位置：${pin}` : '',
        style ? `地点样式：${style}` : '',
        '规则：进入后所有叙事、NPC 动作、玩法须服从本地点设定，不可换成官方默认域。',
      ]
        .filter(Boolean)
        .join('\n'),
    )
  } else if (region && 'worldbook' in region && typeof (region as { worldbook?: string }).worldbook === 'string') {
    const wb = (region as { worldbook?: string }).worldbook?.trim()
    if (wb) parts.push(`## 地点世界书\n${wb}`)
  }

  return parts.filter(Boolean).join('\n\n')
}
