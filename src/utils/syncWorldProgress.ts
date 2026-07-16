/** 聊天回合结束后，把好感/攻略进度同步到护照、图鉴、声望 */

import { useDataStore } from '@/store/dataStore'
import { usePassportStore } from '@/store/passportStore'
import { useAzeriaProgressStore, DEFAULT_TITLES, MAIN_STORY } from '@/store/azeriaProgressStore'
import { useUIStore } from '@/store/uiStore'
import { resolveAzeriaRegion } from '@/worldview/azeriaRegionMap'
import type { Relationship } from '@/types'

export async function syncWorldProgressFromChat(params: {
  characterId: string
  regionId: string
  rel: Relationship
  favorDelta?: number
}): Promise<void> {
  const { characterId, regionId, rel, favorDelta = 0 } = params
  const card = useDataStore.getState().getCharacter(characterId)
  const displayName = card?.name ?? characterId
  const raceId = card?.raceId ?? 'demon'
  const passport = usePassportStore.getState()
  const progress = useAzeriaProgressStore.getState()
  const prev = passport.bonds[characterId]

  // 羁绊状态：见面 → 追求 → 攻略
  let status = prev?.status ?? 'unmet'
  if (status === 'unmet' && rel.favor >= 1) status = 'met'
  if ((status === 'met' || status === 'unmet') && rel.favor >= 40) status = 'courting'
  const favorPeak = Math.max(prev?.favorPeak ?? 0, rel.favor)

  await passport.setBondStatus(characterId, status === 'conquered' ? 'conquered' : status, {
    displayName,
    raceId,
    favorPeak,
  })

  const conquered = await passport.tryConquer({
    characterId,
    displayName,
    raceId,
    favor: rel.favor,
    dependence: rel.dependence,
  })
  if (conquered) {
    useUIStore.getState().showToast('已攻略', `${displayName} 已写入图鉴与酒馆`)
  }

  // 区域声望：正向好感变化时微涨
  const azeria = resolveAzeriaRegion(regionId)
  if (azeria && favorDelta > 0) {
    await progress.bumpReputation(azeria.id, Math.min(3, favorDelta))
  }

  // 称号自动解锁（条件粗匹配）
  const bonds = usePassportStore.getState().bonds
  const conqueredList = Object.values(bonds).filter((b) => b.status === 'conquered')
  const titles = new Set(progress.titles)

  const tryUnlock = async (id: string, ok: boolean, label: string) => {
    if (!ok || titles.has(id)) return
    await progress.unlockTitle(id)
    titles.add(id)
    useUIStore.getState().showToast('称号解锁', label)
  }

  await tryUnlock(
    'dragon_knight',
    conqueredList.some((b) => b.raceId === 'dragon' || /龙/.test(b.displayName)),
    '龙骑士',
  )
  await tryUnlock(
    'heaven_taboo',
    conqueredList.some((b) => b.raceId === 'angel' || /天使/.test(b.displayName)),
    '天界禁忌',
  )
  await tryUnlock(
    'mermaid_darling',
    Object.values(bonds).some(
      (b) => (b.raceId === 'mermaid' || /人鱼/.test(b.displayName)) && (b.favorPeak ?? 0) >= 100,
    ),
    '人鱼宠儿',
  )
  await tryUnlock('law_itself', conqueredList.length >= 8, '法则本身')

  // 主线章节粗推进
  let chapter = progress.mainChapter
  if (chapter < 2 && Object.values(bonds).some((b) => (b.favorPeak ?? 0) >= 100)) chapter = 2
  if (chapter < 3 && conqueredList.length >= 3) chapter = 3
  if (chapter < 4) {
    const races = new Set(conqueredList.map((b) => b.raceId))
    if (races.size >= 2) chapter = 4
  }
  if (chapter > progress.mainChapter) {
    await progress.setMainChapter(chapter)
    const story = MAIN_STORY[chapter - 1]
    useUIStore.getState().showToast('主线推进', story?.title ?? `第 ${chapter} 章`)
  }

  // 确保默认称号目录里至少有已解锁的显示名可读（无副作用）
  void DEFAULT_TITLES
}
