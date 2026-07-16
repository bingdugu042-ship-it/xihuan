import { useState } from 'react'
import { Volume2, Copy, Pencil, Check, X } from 'lucide-react'
import type { ChatMessage } from '@/types'
import { useSettingsStore } from '@/store/settingsStore'
import { useSessionStore } from '@/store/sessionStore'
import { speakText, getSpeakingMessageId } from '@/ai/ttsClient'
import { stripSpeakerLabelPrefixes } from '@/ai/aiParams'

interface MessageActionsProps {
  message: ChatMessage
}

export function MessageActions({ message }: MessageActionsProps) {
  const { settings } = useSettingsStore()
  const updateMessageText = useSessionStore((s) => s.updateMessageText)
  const cleanText = stripSpeakerLabelPrefixes(message.text) || '……'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(cleanText)
  const [copied, setCopied] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  if (message.role !== 'character') return null

  const onTts = async () => {
    if (getSpeakingMessageId() === message.id) {
      const { stopSpeaking } = await import('@/ai/ttsClient')
      stopSpeaking()
      setSpeaking(false)
      return
    }
    setSpeaking(true)
    try {
      await speakText(settings, cleanText, message.id)
    } finally {
      setSpeaking(false)
    }
  }

  const onCopy = async () => {
    await navigator.clipboard.writeText(cleanText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  const saveEdit = async () => {
    const next = stripSpeakerLabelPrefixes(draft.trim()) || draft.trim()
    await updateMessageText(message.id, next)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="mt-1.5 flex flex-col gap-1">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          className="w-full rounded-lg px-2 py-1 text-xs outline-none"
          style={{ background: 'var(--c-bg-soft)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}
        />
        <div className="flex gap-1">
          <button type="button" onClick={() => void saveEdit()} className="rounded px-2 py-0.5 text-[10px]" style={{ background: 'var(--c-primary)', color: '#fff' }}>
            <Check size={10} className="inline" /> 保存
          </button>
          <button type="button" onClick={() => setEditing(false)} className="rounded px-2 py-0.5 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
            <X size={10} className="inline" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-1 flex gap-2">
      <button type="button" onClick={() => void onTts()} className="flex items-center gap-0.5 text-[10px]" style={{ color: speaking ? 'var(--c-accent)' : 'var(--c-primary)' }} title="转语音（只读一遍）">
        <Volume2 size={11} /> {speaking ? '朗读中' : '语音'}
      </button>
      <button type="button" onClick={() => void onCopy()} className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--c-text-dim)' }} title="复制">
        <Copy size={11} /> {copied ? '已复制' : '复制'}
      </button>
      <button type="button" onClick={() => { setDraft(cleanText); setEditing(true) }} className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--c-text-dim)' }} title="编辑">
        <Pencil size={11} /> 编辑
      </button>
    </div>
  )
}
