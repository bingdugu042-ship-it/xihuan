import type { AppSettings } from '@/types'
import { useAlbumStore } from '@/store/albumStore'
import { apiRequest, readApiError } from '@/utils/apiFetch'
import { composeAzeriaImagePrompt, flattenPromptForApi } from '@/ai/imagePromptStyle'
import type { ImagePromptKind } from '@/ai/imagePromptStyle'

function shouldRetryStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}

export interface GenerateImageMeta {
  source?: 'chat' | 'monitor' | 'album' | 'photo' | 'map' | 'region' | 'character'
  save?: boolean
  /** 生图类型：自动套用规则书风格壳 */
  kind?: ImagePromptKind
  /** 若为 true，则不再二次套壳（调用方已 compose） */
  alreadyComposed?: boolean
}

/** OpenAI 兼容生图，并自动存入相册；默认套用艾泽利亚风格规范 */
export async function generateImage(
  settings: AppSettings,
  prompt: string,
  meta?: GenerateImageMeta,
): Promise<string> {
  const { image, text } = settings.api
  const baseURL = (image.baseURL || text.baseURL).replace(/\/+$/, '')
  const apiKey = image.apiKey || text.apiKey
  const model = image.model || 'dall-e-3'
  if (!apiKey.trim()) throw new Error('请配置生图 API Key')

  const kind = meta?.kind ?? (meta?.source === 'photo' ? 'photo' : 'generic')
  const finalPrompt = meta?.alreadyComposed
    ? prompt.slice(0, 900)
    : flattenPromptForApi(composeAzeriaImagePrompt(prompt, kind))

  let data: { data?: { b64_json?: string; url?: string }[] } | null = null
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await apiRequest({
      baseURL,
      path: '/images/generations',
      proxyURL: settings.api.proxyURL,
      init: {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: finalPrompt,
          n: 1,
          size: '1024x1024',
          response_format: 'b64_json',
        }),
      },
    })
    if (res.ok) {
      data = (await res.json()) as { data?: { b64_json?: string; url?: string }[] }
      break
    }
    const msg = await readApiError(res)
    if (attempt === 0 && shouldRetryStatus(res.status)) {
      await sleep(450)
      continue
    }
    throw new Error(msg)
  }
  if (!data) throw new Error('生图服务返回为空')
  const item = data.data?.[0]
  let url = ''
  if (item?.b64_json) url = `data:image/png;base64,${item.b64_json}`
  else if (item?.url) url = item.url
  else throw new Error('生图未返回图片')

  if (meta?.save !== false) {
    const addImage = useAlbumStore.getState().addImage
    await addImage({
      url,
      prompt: finalPrompt.slice(0, 200),
      source: meta?.source === 'map' || meta?.source === 'region' || meta?.source === 'character'
        ? 'album'
        : (meta?.source ?? 'album'),
    })
  }

  return url
}

/** 根据最近对话生成拍照提示词（已含规则书风格壳） */
export function buildPhotoPromptFromChat(params: {
  characterName?: string
  regionName?: string
  recentLines: string[]
}): string {
  const ctx = params.recentLines.slice(-4).join(' ').slice(0, 280)
  const subject = [
    params.characterName ? `character: ${params.characterName}` : '',
    params.regionName ? `scene: ${params.regionName}` : '',
    ctx ? `mood from dialogue: ${ctx}` : '',
  ]
    .filter(Boolean)
    .join(', ')
  return flattenPromptForApi(composeAzeriaImagePrompt(subject || 'adventure portrait', 'photo'))
}

/** 生成角色日记 */
export async function generateDiaryEntry(
  settings: AppSettings,
  characterName: string,
  characterBackground: string,
  dateStr: string,
  memories: string[],
): Promise<string> {
  const { text: api } = settings.api
  const { chatCompletion } = await import('./openaiClient')
  return chatCompletion({
    baseURL: api.baseURL,
    apiKey: api.apiKey,
    model: api.model,
    temperature: 0.85,
    maxTokens: 1200,
    proxyURL: settings.api.proxyURL,
    messages: [
      {
        role: 'system',
        content: `你是${characterName}，用第一人称写一篇私密日记，日期 ${dateStr}。要求 350-550 字，分 2-3 段，含当日心情、细节描写、对主控/玩家的真实想法。文风符合角色性格。`,
      },
      {
        role: 'user',
        content: `角色背景：${characterBackground.slice(0, 400)}\n相关记忆：\n${memories.slice(0, 8).join('\n') || '无'}`,
      },
    ],
  })
}

/** 生成监控场景文案 */
export async function generateMonitorScene(
  settings: AppSettings,
  params: {
    locationName: string
    characterNames: string[]
    solo: boolean
    memories: string[]
  },
): Promise<string> {
  const { text: api } = settings.api
  const { chatCompletion } = await import('./openaiClient')
  const who = params.characterNames.join('、')
  return chatCompletion({
    baseURL: api.baseURL,
    apiKey: api.apiKey,
    model: api.model,
    temperature: 0.9,
    maxTokens: 1000,
    proxyURL: settings.api.proxyURL,
    messages: [
      {
        role: 'system',
        content:
          '你是艾泽利亚大陆的旁白，用第三人称描写男主在冒险域中的活动、对话片段与环境细节。要求 400-650 字，分段落，沉浸式，可含少量对话引号。遵从女本位法则：焦点在旅者感受与对方的动摇。',
      },
      {
        role: 'user',
        content: `地点：${params.locationName}\n角色：${who}\n${params.solo ? '单人场景' : '多人互动'}\n记忆参考：\n${params.memories.slice(0, 6).join('\n') || '无'}`,
      },
    ],
  })
}

/** 生成角色对主控的看法 */
export async function generateCharacterOpinion(
  settings: AppSettings,
  character: { name: string; background: string; speakingStyle: string },
  profileName: string,
  rel: { favor: number; trust: number },
  memories: string[],
): Promise<string> {
  const { text: api } = settings.api
  const { chatCompletion } = await import('./openaiClient')
  return chatCompletion({
    baseURL: api.baseURL,
    apiKey: api.apiKey,
    model: api.model,
    temperature: 0.78,
    maxTokens: 900,
    proxyURL: settings.api.proxyURL,
    messages: [
      {
        role: 'system',
        content: `你是${character.name}。用第一人称写一段对「${profileName}」的真实、细腻看法，300-500 字，分 2-3 段。语气符合：${character.speakingStyle}。可写好感、疑虑、期待、回忆片段。不要跳出角色，不要提及 AI。`,
      },
      {
        role: 'user',
        content: `好感${rel.favor} 信任${rel.trust}\n背景：${character.background.slice(0, 400)}\n记忆：\n${memories.slice(0, 10).join('\n') || '暂无共同回忆'}`,
      },
    ],
  })
}

export {
  generateForumBoard,
  generateCommissionBoard,
  resolveCommissionRun,
  generateRosterBeat,
} from './tavernLifeAi'
export type { ForumBoardResult, CommissionResolveResult } from './tavernLifeAi'
