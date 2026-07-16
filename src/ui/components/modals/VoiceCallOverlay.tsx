import { useRef, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PhoneOff, Mic } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { useDataStore } from '@/store/dataStore'
import { useSettingsStore } from '@/store/settingsStore'
import { resolveCharacterPortrait } from '@/utils/image'
import { HoldToTalkRecognizer } from '@/ai/sttClient'
import { speakText, stopSpeaking } from '@/ai/ttsClient'
import { VoiceWaveform } from '@/ui/components/chat/VoiceWaveform'

type CallPhase = 'idle' | 'user-speaking' | 'listening' | 'character-speaking'

export function VoiceCallOverlay() {
  const open = useUIStore((s) => s.voiceCallOpen)
  const setOpen = useUIStore((s) => s.setVoiceCallOpen)
  const { activeSession, appendUserMessage, aiReplying } = useSessionStore()
  const { characters } = useDataStore()
  const { settings } = useSettingsStore()

  const [phase, setPhase] = useState<CallPhase>('idle')
  const [interim, setInterim] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const lastSpokenId = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const htrRef = useRef<HoldToTalkRecognizer | null>(null)

  const charId = activeSession?.participantIds[0]
  const character = charId ? characters[charId] : null

  const imgSrc = useMemo(() => {
    if (!character) return null
    return resolveCharacterPortrait(character)
  }, [character])

  useEffect(() => {
    if (!open) return
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => window.clearInterval(t)
  }, [open])

  useEffect(() => {
    if (!open) {
      stopSpeaking()
      htrRef.current?.abort()
      setElapsed(0)
      setInterim('')
      setPhase('idle')
      lastSpokenId.current = null
    }
  }, [open])

  useEffect(() => {
    if (!open || !activeSession) return
    if (aiReplying) {
      setPhase('listening')
      return
    }
    const last = activeSession.messages[activeSession.messages.length - 1]
    if (last?.role === 'character' && last.id !== lastSpokenId.current) {
      lastSpokenId.current = last.id
      setPhase('character-speaking')
      void speakText(settings, last.text, last.id).finally(() => setPhase('idle'))
    }
  }, [open, activeSession?.messages, aiReplying, settings])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [activeSession?.messages.length, interim, aiReplying])

  const hangUp = () => {
    stopSpeaking()
    htrRef.current?.abort()
    setOpen(false)
  }

  const onMicDown = async () => {
    if (aiReplying || phase === 'character-speaking') return
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setInterim('请允许麦克风权限')
      return
    }
    htrRef.current = new HoldToTalkRecognizer(setInterim)
    const ok = htrRef.current.start()
    if (ok) setPhase('user-speaking')
    else setInterim('浏览器不支持语音识别')
  }

  const onMicUp = async () => {
    if (phase !== 'user-speaking' || !htrRef.current) return
    setPhase('idle')
    const text = await htrRef.current.stop()
    htrRef.current = null
    setInterim('')
    if (text.trim()) await appendUserMessage(text.trim())
  }

  const fmt = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`
  const dialogMsgs = activeSession?.messages.filter((m) => m.role === 'user' || m.role === 'character') ?? []

  const statusText =
    phase === 'user-speaking'
      ? '正在说话…'
      : phase === 'listening'
        ? '对方聆听中…'
        : phase === 'character-speaking'
          ? '对方正在通话…'
          : '按住麦克风说话'

  return (
    <AnimatePresence>
      {open && activeSession && character && (
        <motion.div className="fixed inset-0 z-[130] flex flex-col overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {imgSrc && (
            <img src={imgSrc} alt={character.name} className="absolute inset-0 h-full w-full object-cover object-top" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75" />

          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center justify-between px-4 pt-4">
              <div>
                <p className="text-lg font-medium text-white">{character.name}</p>
                <p className="text-xs text-white/70">{fmt} · 语音通话</p>
              </div>
              <button type="button" onClick={hangUp} className="rounded-full p-3" style={{ background: 'rgba(220,80,80,0.9)' }}>
                <PhoneOff size={22} color="#fff" />
              </button>
            </div>

            <div ref={scrollRef} className="no-scrollbar flex-1 overflow-y-auto px-4 py-3">
              <div className="flex flex-col gap-2">
                {dialogMsgs.slice(-24).map((m) => {
                  const mine = m.role === 'user'
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${mine ? 'ml-auto' : 'mr-auto'}`}
                      style={{ background: mine ? 'rgba(201,164,92,0.85)' : 'rgba(255,255,255,0.18)', color: '#fff' }}
                    >
                      {!mine && <p className="mb-0.5 text-[10px] opacity-70">{character.name}</p>}
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    </div>
                  )
                })}
                {interim && (
                  <div className="ml-auto max-w-[85%] rounded-2xl px-3 py-2 text-sm" style={{ background: 'rgba(201,164,92,0.5)', color: '#fff' }}>
                    {interim}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 px-4 pb-8 pt-2">
              <VoiceWaveform active={phase === 'user-speaking' || phase === 'character-speaking'} />
              <p className="text-xs text-white/80">{statusText}</p>
              <button
                type="button"
                onPointerDown={() => void onMicDown()}
                onPointerUp={() => void onMicUp()}
                onPointerLeave={() => {
                  if (phase === 'user-speaking') void onMicUp()
                }}
                disabled={aiReplying && phase !== 'user-speaking'}
                className="rounded-full p-5 touch-none select-none"
                style={{
                  background: phase === 'user-speaking' ? 'rgba(220,80,80,0.85)' : 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.45)',
                }}
              >
                <Mic size={28} color="#fff" />
              </button>
              <p className="text-[10px] text-white/50">按住说话，松开发送</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
