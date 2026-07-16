import { AlertCircle, RotateCcw, Settings, X } from 'lucide-react'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { useSettingsStore } from '@/store/settingsStore'
import { hasTextApiConfigured, isTextApiLinked } from '@/ai/textClient'

/** 聊天区 AI 失败 / 待测连提示条 */
export function ChatAiErrorBar() {
  const aiError = useSessionStore((s) => s.aiError)
  const aiReplying = useSessionStore((s) => s.aiReplying)
  const clearAiError = useSessionStore((s) => s.clearAiError)
  const requestAiReply = useSessionStore((s) => s.requestAiReply)
  const cancelAiReply = useSessionStore((s) => s.cancelAiReply)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const settings = useSettingsStore((s) => s.settings)

  const configured = hasTextApiConfigured(settings)
  const linked = isTextApiLinked(settings)
  const pendingLink = configured && !linked

  if (!aiError && !pendingLink && !aiReplying) return null

  return (
    <div
      className="relative z-20 mx-3 mb-1 flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-[11px]"
      style={{
        background: pendingLink ? 'rgba(240, 195, 74, 0.18)' : 'rgba(229, 115, 115, 0.14)',
        border: `1px solid ${pendingLink ? 'rgba(240,195,74,0.45)' : 'rgba(229,115,115,0.35)'}`,
        color: 'var(--c-text)',
      }}
    >
      <AlertCircle size={14} style={{ color: pendingLink ? '#c9922e' : '#e57373', flexShrink: 0 }} />
      <span className="min-w-0 flex-1 leading-relaxed">
        {aiReplying
          ? 'AI 正在生成回复…'
          : pendingLink
            ? '文本 API 已填写但未测连，当前可能走演示回复。请先在设置里测试连接。'
            : aiError}
      </span>
      <div className="flex shrink-0 gap-1.5">
        {aiReplying && (
          <button
            type="button"
            onClick={() => cancelAiReply()}
            className="rounded-lg px-2 py-1"
            style={{ background: 'rgba(0,0,0,0.06)' }}
          >
            取消
          </button>
        )}
        {!aiReplying && aiError && (
          <button
            type="button"
            onClick={() => void requestAiReply()}
            className="flex items-center gap-0.5 rounded-lg px-2 py-1"
            style={{ background: 'rgba(42,158,196,0.15)', color: 'var(--c-primary)' }}
          >
            <RotateCcw size={12} /> 重试
          </button>
        )}
        {(pendingLink || aiError) && (
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-0.5 rounded-lg px-2 py-1"
            style={{ background: 'rgba(42,158,196,0.15)', color: 'var(--c-primary)' }}
          >
            <Settings size={12} /> 设置
          </button>
        )}
        {(aiError || pendingLink) && !aiReplying && (
          <button type="button" onClick={() => clearAiError()} className="rounded-lg p-1" aria-label="关闭">
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
