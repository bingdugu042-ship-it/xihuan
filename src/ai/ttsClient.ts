import type { AppSettings } from '@/types'
import { testApiConnection } from './openaiClient'
import { apiRequest, readApiError } from '@/utils/apiFetch'

let currentAudio: HTMLAudioElement | null = null
let speakingMessageId: string | null = null
let speakingToken = 0

export function getSpeakingMessageId(): string | null {
  return speakingMessageId
}

export function stopSpeaking(): void {
  speakingToken += 1
  speakingMessageId = null
  window.speechSynthesis?.cancel()
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
}

function speakBrowser(text: string, voiceId?: string, token?: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('浏览器不支持语音合成'))
      return
    }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    const voices = window.speechSynthesis.getVoices()
    const v = voices.find((x) => x.name.includes(voiceId ?? '') || x.lang.startsWith('zh'))
    if (v) u.voice = v
    u.onend = () => {
      if (token !== undefined && token !== speakingToken) return
      speakingMessageId = null
      resolve()
    }
    u.onerror = () => {
      if (token !== undefined && token !== speakingToken) return
      speakingMessageId = null
      reject(new Error('语音播放失败'))
    }
    window.speechSynthesis.speak(u)
  })
}

async function speakOpenAI(settings: AppSettings, text: string): Promise<void> {
  const { tts, text: textApi } = settings.api
  const baseURL = (tts.baseURL || textApi.baseURL).replace(/\/+$/, '')
  const apiKey = tts.apiKey || textApi.apiKey
  const model = tts.model || 'tts-1'
  const voice = tts.voiceId || 'alloy'

  const res = await apiRequest({
    baseURL,
    path: '/audio/speech',
    proxyURL: settings.api.proxyURL,
    init: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, input: text.slice(0, 4096), voice }),
    },
  })
  if (!res.ok) {
    throw new Error(await readApiError(res))
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  stopSpeaking()
  speakingToken += 1
  const myToken = speakingToken
  currentAudio = new Audio(url)
  currentAudio.loop = false
  await new Promise<void>((resolve, reject) => {
    if (!currentAudio) return resolve()
    currentAudio.onended = () => {
      if (myToken !== speakingToken) return
      URL.revokeObjectURL(url)
      speakingMessageId = null
      currentAudio = null
      resolve()
    }
    currentAudio.onerror = () => {
      if (myToken !== speakingToken) return
      speakingMessageId = null
      reject(new Error('音频播放失败'))
    }
    void currentAudio.play().catch(reject)
  })
}

/** 朗读一次；再次点击同一条则停止，不会循环重复 */
export async function speakText(
  settings: AppSettings,
  text: string,
  messageId?: string,
): Promise<void> {
  const plain = text.replace(/\*[^*]+\*/g, '').trim()
  if (!plain) return

  if (messageId && speakingMessageId === messageId) {
    stopSpeaking()
    return
  }

  stopSpeaking()
  speakingToken += 1
  const token = speakingToken
  if (messageId) speakingMessageId = messageId

  const { tts } = settings.api
  try {
    if (tts.provider === 'browser') {
      await speakBrowser(plain, tts.voiceId, token)
      return
    }
    if (tts.provider === 'openai' || tts.provider === 'custom') {
      const apiKey = (settings.api.tts.apiKey || settings.api.text.apiKey || '').trim()
      if (!apiKey) {
        // 无密钥时自动回退浏览器 TTS，避免“点朗读就报错”
        await speakBrowser(plain, tts.voiceId, token)
        return
      }
      await speakOpenAI(settings, plain)
      return
    }
    await speakBrowser(plain, tts.voiceId, token)
  } catch (e) {
    if (token === speakingToken) speakingMessageId = null
    throw e
  }
}

export async function testTtsConnection(settings: AppSettings): Promise<{ ok: boolean; message: string }> {
  const { tts, text: textApi } = settings.api
  if (tts.provider === 'browser') {
    if (window.speechSynthesis) return { ok: true, message: '浏览器语音合成可用' }
    return { ok: false, message: '浏览器不支持语音合成' }
  }
  const baseURL = tts.baseURL || textApi.baseURL
  const apiKey = tts.apiKey || textApi.apiKey
  if (!apiKey.trim()) return { ok: false, message: '请先填写 API Key' }
  try {
    await speakOpenAI(settings, '连接测试')
    stopSpeaking()
    return { ok: true, message: `TTS 连接成功 · 模型 ${tts.model || 'tts-1'}` }
  } catch (e) {
    const listed = await testApiConnection(baseURL, apiKey, tts.model, settings.api.proxyURL).catch(() => null)
    if (listed?.ok) return { ok: true, message: listed.message }
    return { ok: false, message: e instanceof Error ? e.message : 'TTS 连接失败' }
  }
}
