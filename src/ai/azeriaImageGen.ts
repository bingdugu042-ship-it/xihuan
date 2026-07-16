/**
 * 生图入口封装：按优先级提供「大陆地图 → 区域 → 男主立绘」
 * UI / 设置页 / 脚本均可调用；实际请求走 contentClient（已含风格规范）
 */
import type { AppSettings } from '@/types'
import { generateImage } from '@/ai/contentClient'
import {
  getWorldMapPromptApi,
  getRegionImagePromptApi,
  getCharacterImagePromptApi,
} from '@/data/imagePrompts'
import { FIXED_LEAD_IMAGE_SUBJECTS } from '@/data/imagePrompts'

export async function generateWorldMapImage(settings: AppSettings): Promise<string> {
  return generateImage(settings, getWorldMapPromptApi(), {
    source: 'map',
    kind: 'world_map',
    alreadyComposed: true,
    save: true,
  })
}

export async function generateRegionSceneImage(settings: AppSettings, regionId: string): Promise<string> {
  return generateImage(settings, getRegionImagePromptApi(regionId), {
    source: 'region',
    kind: 'region',
    alreadyComposed: true,
    save: true,
  })
}

export async function generateFixedLeadPortrait(
  settings: AppSettings,
  characterId: string,
  appearanceExtra?: string,
): Promise<string> {
  if (!FIXED_LEAD_IMAGE_SUBJECTS[characterId] && !appearanceExtra) {
    throw new Error(`未知固定男主：${characterId}`)
  }
  return generateImage(settings, getCharacterImagePromptApi(characterId, appearanceExtra), {
    source: 'character',
    kind: 'character',
    alreadyComposed: true,
    save: true,
  })
}
