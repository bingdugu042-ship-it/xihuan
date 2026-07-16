import { useState, useRef, type KeyboardEvent } from 'react'
import { Send, Plus, X, Square } from 'lucide-react'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useDataStore } from '@/store/dataStore'
import { useMobileKeyboardInset } from '@/hooks/useMobileKeyboardInset'
import { ComposerPlusMenu } from './ComposerPlusMenu'

export function Composer() {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { bottomInset, keyboardOpen } = useMobileKeyboardInset()
  const { activeSession, appendUserMessage, aiReplying, cancelAiReply } = useSessionStore()
  const {
    composerPlusOpen,
    setComposerPlusOpen,
    setNewSessionModalOpen,
    replyTargetCharacterId,
    setReplyTargetCharacterId,
  } = useUIStore()
  const { settings } = useSettingsStore()
  const { getAllCharacters } = useDataStore()
  const characters = getAllCharacters()
  const mode = settings.ui.characterMode

  // AI 回复中仍可输入；仅无会话 / 预览模式锁定
  const inputLocked = !activeSession || mode === 'preview'
  const mentionChar = replyTargetCharacterId ? characters[replyTargetCharacterId] : null

  const ensureInputVisible = () => {
    const el = inputRef.current
    if (!el) return
    // 等键盘动画后再滚入可视区
    window.setTimeout(() => {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      try {
        window.visualViewport && window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch {
        /* ignore */
      }
    }, 120)
    window.setTimeout(() => {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, 320)
  }

  const send = async () => {
    const t = text.trim()
    if (!t || inputLocked) return
    const mentionId =
      replyTargetCharacterId && activeSession?.participantIds.includes(replyTargetCharacterId)
        ? replyTargetCharacterId
        : undefined
    setText('')
    setReplyTargetCharacterId(null)
    setComposerPlusOpen(false)
    await appendUserMessage(t, { mentionCharacterId: mentionId })
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  const focusInput = () => {
    setComposerPlusOpen(false)
    ensureInputVisible()
  }

  const togglePlus = () => {
    const next = !composerPlusOpen
    if (next) {
      // 打开加号时收起行动坞弹层，避免双层叠压
      useUIStore.getState().setActionSheet(null)
    }
    setComposerPlusOpen(next)
  }

  const onPrimaryClick = () => {
    if (aiReplying && !text.trim()) {
      cancelAiReply()
      return
    }
    void send()
  }

  // 主机高度已按可视区收缩时，勿再叠加 keyboard inset，避免抬两次
  const padBottom = keyboardOpen
    ? undefined
    : bottomInset > 0
      ? bottomInset
      : undefined

  return (
    <div
      className={`composer-bar relative z-20 flex flex-col${keyboardOpen ? ' composer-bar--keyboard' : ''}${composerPlusOpen ? ' composer-bar--plus-open' : ''}`}
      style={{
        opacity: mode === 'preview' ? 0.35 : 1,
        pointerEvents: mode === 'preview' ? 'none' : 'auto',
        paddingBottom: padBottom,
      }}
    >
      {aiReplying && (
        <p
          className="px-4 pt-1.5 text-[10px]"
          style={{ color: 'var(--c-text-dim)' }}
        >
          AI 回复中…仍可继续输入，发送后将排在下一轮
        </p>
      )}

      {mentionChar && (
        <div className="flex items-center gap-1 px-4 pt-2">
          <div
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
            style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
          >
            <span>@{mentionChar.name} 回复</span>
            <button
              type="button"
              onClick={() => setReplyTargetCharacterId(null)}
              className="press-scale rounded-full p-0.5 hover:opacity-70"
              aria-label="取消指定"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* 输入行在上：加号展开时整体上推，对话框仍可见，输入框不被裁切 */}
      <div className="flex items-end gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={togglePlus}
          className="press-scale flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all"
          style={{
            color: composerPlusOpen ? 'var(--immerse-ink)' : 'var(--c-primary)',
            border: '1px solid var(--immerse-chrome-border)',
            background: composerPlusOpen ? 'var(--c-primary-soft)' : 'var(--c-bg-elevated)',
            boxShadow: '0 2px 8px rgba(28, 47, 58, 0.06)',
          }}
          title={composerPlusOpen ? '收起' : '更多功能'}
          aria-label={composerPlusOpen ? '收起功能菜单' : '更多功能'}
          aria-expanded={composerPlusOpen}
        >
          {composerPlusOpen ? <X size={18} /> : <Plus size={18} />}
        </button>

        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            onFocus={focusInput}
            enterKeyHint="send"
            inputMode="text"
            autoComplete="off"
            autoCorrect="on"
            rows={1}
            placeholder={
              inputLocked
                ? activeSession
                  ? '预览模式不可输入'
                  : '先新建一段对话'
                : aiReplying
                  ? '回复生成中，仍可输入…'
                  : '说点什么…'
            }
            disabled={inputLocked}
            className="composer-input max-h-28 min-h-[44px] w-full resize-none rounded-full px-4 py-2.5 text-[15px] outline-none placeholder:opacity-50"
            style={{
              color: 'var(--c-text)',
            }}
          />
        </div>

        <button
          type="button"
          onClick={onPrimaryClick}
          disabled={inputLocked || (!aiReplying && !text.trim())}
          className="press-scale flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all disabled:opacity-40"
          style={{
            background:
              aiReplying && !text.trim()
                ? 'rgba(229, 115, 115, 0.85)'
                : text.trim()
                  ? 'linear-gradient(135deg, var(--c-primary), var(--c-accent))'
                  : 'var(--c-bg-elevated)',
            color: '#fff',
            boxShadow: text.trim() || aiReplying ? '0 0 16px rgba(42, 158, 196, 0.35)' : 'none',
          }}
          aria-label={aiReplying && !text.trim() ? '取消生成' : '发送'}
        >
          {aiReplying && !text.trim() ? <Square size={16} fill="currentColor" /> : <Send size={18} />}
        </button>

        {!activeSession && (
          <button
            type="button"
            onClick={() => setNewSessionModalOpen(true)}
            className="game-btn game-btn--primary shrink-0 px-4 py-2.5 text-sm"
          >
            新对话
          </button>
        )}
      </div>

      <ComposerPlusMenu
        open={composerPlusOpen}
        onClose={() => setComposerPlusOpen(false)}
        onInsertCommand={(cmd) => setText((t) => (t ? `${t} ${cmd}` : cmd))}
      />
    </div>
  )
}
