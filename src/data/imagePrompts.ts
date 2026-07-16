/**
 * 立绘 / 地图 / 区域生图提示词库（规则书 Ch1.2 / Ch4）
 * 优先级：大陆地图 → 八大区域 → 七固定男主
 */

import { composeAzeriaImagePrompt, flattenPromptForApi, type ComposedImagePrompt } from '@/ai/imagePromptStyle'

/** 大陆全貌地图（最高优先级） */
export const WORLD_MAP_SUBJECT = [
  'Azeria continent fantasy world map',
  'central human kingdoms plains in the middle',
  'eastern moonlit elven forest',
  'western volcanic demonkin wasteland',
  'northern eternal winter dragon mountains',
  'southern merfolk island seas',
  'underground abyss rift glowing red',
  'sky floating islands of angels above',
  'beastfolk border grasslands at the edge',
  'hand-drawn cartography style',
  'warm parchment and ink',
].join(', ')

export function getWorldMapPrompt(): ComposedImagePrompt {
  return composeAzeriaImagePrompt(WORLD_MAP_SUBJECT, 'world_map')
}

/** 八大区域场景提示词 */
export const REGION_IMAGE_SUBJECTS: Record<string, string> = {
  central: [
    'Central Human Kingdoms of Azeria',
    'rolling farmland and stone cities',
    'rivers and trade roads',
    'adventurers guild banners',
    'warm daylight, prosperous plains',
  ].join(', '),
  east: [
    'Eastern Elven Forest of Azeria',
    'ancient giant trees and moonlight lakes',
    'silver leaf canopy',
    'elven wooden bridges',
    'misty cool greens and silver light',
  ].join(', '),
  west: [
    'Western Demonkin Wasteland of Azeria',
    'blackstone fortress and volcano glow',
    'scorched desert and ember ash',
    'crimson sky over lava cracks',
  ].join(', '),
  north: [
    'Northern Eternal Winter of Azeria',
    'dragon bone ruins in snow mountains',
    'frozen lakes and aurora',
    'cold blue-white light',
  ].join(', '),
  south: [
    'Southern Merfolk Seas of Azeria',
    'coral reefs and tropical islands',
    'turquoise water and merchant ships',
    'underwater light shafts',
  ].join(', '),
  under: [
    'Abyss Rift underground of Azeria',
    'lava rivers and demonic architecture',
    'molten glow in darkness',
    'ominous grandeur',
  ].join(', '),
  sky: [
    'Celestial Floating Islands of Azeria',
    'cloud cities and holy light dome',
    'white marble and gold filigree',
    'angelic architecture above clouds',
  ].join(', '),
  border: [
    'Beastfolk Wilderness border of Azeria',
    'grassland canyons and tribal tents',
    'totems and hunting trails',
    'golden hour prairie',
  ].join(', '),
}

export function getRegionImagePrompt(regionId: string): ComposedImagePrompt {
  const subject = REGION_IMAGE_SUBJECTS[regionId] ?? `fantasy region ${regionId} of Azeria`
  return composeAzeriaImagePrompt(subject, 'region')
}

/** 七固定男主立绘 subject（不含风格壳；由 compose 套用） */
export const FIXED_LEAD_IMAGE_SUBJECTS: Record<string, string> = {
  human_rowan: [
    'handsome young human male adventurer swordsman',
    'short messy chestnut hair, warm brown eyes',
    'travel-worn leather armor and cloak',
    'honest earnest expression',
    'standing in plains city street',
  ].join(', '),
  elf_caer: [
    'handsome male high elf ranger',
    'silver-white long hair half-tied, pointed ears',
    'emerald cloak, slender elegant bone structure',
    'cool reserved gaze, extremely refined beauty',
    'moonlit forest behind him',
  ].join(', '),
  demon_vex: [
    'handsome male demonkin warlord officer',
    'symmetrical dark horns, thin scale shimmer under skin',
    'black-gold military robes',
    'stern loyal expression, higher body heat flush',
    'volcanic wasteland fortress background',
  ].join(', '),
  dragon_rhaeg: [
    'handsome male dragonkin guardian',
    'broad shoulders, bronze skin with subtle scales',
    'golden slit pupils, short dark hair',
    'protective awkward warmth in eyes',
    'snowy dragonbone peak background',
  ].join(', '),
  mermaid_nyx: [
    'handsome male merfolk noble',
    'tide-glow pale blue skin, damp silky dark teal hair',
    'shore-walking form with legs, faint scale traces',
    'elegant proud soft expression',
    'coral harbor and sea behind him',
  ].join(', '),
  angel_seraph: [
    'handsome male angel knight',
    'six light wings partially folded',
    'platinum short armor, golden eyes',
    'abstinent cold face with faint blush',
    'floating celestial island background',
  ].join(', '),
  succubus_milo: [
    'handsome male incubus clerk',
    'small horns carefully hidden, thin tail coiled neat',
    'tidy formal abyss office uniform',
    'serious shy anti-seduction vibe',
    'underground abyssal city background',
  ].join(', '),
}

export function getCharacterImagePrompt(characterId: string, appearanceExtra?: string): ComposedImagePrompt {
  const base = FIXED_LEAD_IMAGE_SUBJECTS[characterId] ?? `handsome fantasy male character ${characterId}`
  const subject = appearanceExtra ? `${base}, ${appearanceExtra}` : base
  return composeAzeriaImagePrompt(subject, 'character')
}

/** 直接给 API 用的扁平字符串 */
export function getWorldMapPromptApi(): string {
  return flattenPromptForApi(getWorldMapPrompt())
}

export function getRegionImagePromptApi(regionId: string): string {
  return flattenPromptForApi(getRegionImagePrompt(regionId))
}

export function getCharacterImagePromptApi(characterId: string, appearanceExtra?: string): string {
  return flattenPromptForApi(getCharacterImagePrompt(characterId, appearanceExtra))
}
