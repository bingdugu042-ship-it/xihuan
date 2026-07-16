import type { AppSettings } from '@/types'
import { apiRequest, readApiError } from '@/utils/apiFetch'

interface BrowserSpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((ev: SpeechRecognitionEvent) => void) | null
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

function getRecognizer(lang = 'zh-CN'): BrowserSpeechRecognition | null {
  const W = window as Window & {
    SpeechRecognition?: new () => BrowserSpeechRecognition
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition
  }
  const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition
  if (!Ctor) return null
  const rec = new Ctor()
  rec.lang = lang
  rec.continuous = true
  rec.interimResults = true
  return rec
}

/** 按住说话：按下开始，松开结束并返回最终文本 */
export class HoldToTalkRecognizer {
  private rec: BrowserSpeechRecognition | null = null
  private finalText = ''
  private onInterim: (t: string) => void
  private resolveStop: ((text: string) => void) | null = null

  constructor(onInterim: (t: string) => void) {
    this.onInterim = onInterim
  }

  start(): boolean {
    this.rec = getRecognizer()
    if (!this.rec) return false
    this.finalText = ''
    this.rec.onresult = (ev: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i]
        if (r.isFinal) this.finalText += r[0].transcript
        else interim += r[0].transcript
      }
      this.onInterim((this.finalText + interim).trim())
    }
    this.rec.onerror = () => {
      /* 忽略 no-speech 等 */
    }
    this.rec.onend = () => {
      if (this.resolveStop) {
        this.resolveStop(this.finalText.trim())
        this.resolveStop = null
      }
    }
    try {
      this.rec.start()
      return true
    } catch {
      return false
    }
  }

  stop(): Promise<string> {
    return new Promise((resolve) => {
      if (!this.rec) {
        resolve('')
        return
      }
      this.resolveStop = resolve
      this.rec.stop()
    })
  }

  abort(): void {
    this.rec?.abort()
    this.resolveStop = null
  }
}

export async function transcribeWhisper(settings: AppSettings, audioBlob: Blob): Promise<string> {
  const { tts, text } = settings.api
  const baseURL = (tts.baseURL || text.baseURL).replace(/\/+$/, '')
  const apiKey = tts.apiKey || text.apiKey
  const model = tts.sttModel || 'whisper-1'
  if (!apiKey.trim()) throw new Error('请配置 STT API Key')

  const fd = new FormData()
  fd.append('file', audioBlob, 'speech.webm')
  fd.append('model', model)
  fd.append('language', 'zh')

  const res = await apiRequest({
    baseURL,
    path: '/audio/transcriptions',
    proxyURL: settings.api.proxyURL,
    init: {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: fd,
    },
  })
  if (!res.ok) {
    throw new Error(await readApiError(res))
  }
  const data = (await res.json()) as { text?: string }
  return (data.text ?? '').trim()
}

export async function testSttConnection(settings: AppSettings): Promise<{ ok: boolean; message: string }> {
  if (getRecognizer()) {
    return { ok: true, message: '浏览器语音识别可用（按住麦克风说话）' }
  }
  const { tts, text } = settings.api
  const baseURL = tts.baseURL || text.baseURL
  const apiKey = tts.apiKey || text.apiKey
  if (!apiKey.trim()) return { ok: false, message: '浏览器不支持 STT，请填写 API Key' }
  const { testApiConnection } = await import('./openaiClient')
  return testApiConnection(baseURL, apiKey, tts.sttModel, settings.api.proxyURL)
}

export function createBrowserRecognizer(lang = 'zh-CN'): BrowserSpeechRecognition | null {
  return getRecognizer(lang)
}
