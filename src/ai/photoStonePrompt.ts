/** 留影石 · 合照提示词（规则书风格壳由 imagePromptStyle 统一套用） */

import { composeAzeriaImagePrompt, flattenPromptForApi } from '@/ai/imagePromptStyle'

export function buildPhotoStonePrompt(params: {
  regionName: string
  characterNames: string[]
  includePlayer?: boolean
  playerName?: string
  playerDesc?: string
  mood?: string
}): string {
  const who = [
    ...(params.includePlayer && params.playerName ? [`female adventurer ${params.playerName}`] : []),
    ...params.characterNames.map((n) => `male companion ${n}`),
  ].join(', ')

  const subject = [
    `group portrait in ${params.regionName}`,
    'adventure guild tavern or regional landmark background',
    who ? `characters: ${who}` : '',
    params.playerDesc ? `female adventurer appearance: ${params.playerDesc.slice(0, 120)}` : '',
    params.mood ? `mood: ${params.mood}` : 'warm camaraderie, adventure aftermath',
    'female-centered composition: companions flanking the adventurer',
  ]
    .filter(Boolean)
    .join(', ')

  return flattenPromptForApi(composeAzeriaImagePrompt(subject, 'photo'))
}
