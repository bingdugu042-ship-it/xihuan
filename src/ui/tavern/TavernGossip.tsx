import { useEffect, useState } from 'react'
import { Flame, Loader2, RefreshCw } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'
import { useTavernLifeStore } from '@/store/tavernLifeStore'
import { useGeneratedStore } from '@/store/generatedStore'
import { generateForumBoard } from '@/ai/contentClient'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'
import type { ForumThread } from '@/data/tavernLife'

export function TavernGossip({ onBack }: { onBack: () => void }) {
  const settings = useSettingsStore((s) => s.settings)
  const showToast = useUIStore((s) => s.showToast)
  const loaded = useTavernLifeStore((s) => s.loaded)
  const load = useTavernLifeStore((s) => s.load)
  const threads = useTavernLifeStore((s) => s.forumThreads)
  const hotTitles = useTavernLifeStore((s) => s.hotTitles)
  const setForumBoard = useTavernLifeStore((s) => s.setForumBoard)
  const addRecord = useGeneratedStore((s) => s.addRecord)
  const [busy, setBusy] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!loaded) void load()
  }, [loaded, load])

  useEffect(() => {
    if (loaded && threads.length === 0 && !busy) {
      void refresh(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  const refresh = async (toast = true) => {
    if (busy) return
    setBusy(true)
    if (toast) showToast('杂谈刷新中…', '撰旅奇说')
    try {
      const board = await generateForumBoard(settings)
      setForumBoard(board.threads, board.hotTitles)
      await addRecord({
        type: 'forum',
        title: `酒馆杂谈 · ${new Date().toLocaleString('zh-CN')}`,
        content: board.threads.map((t) => `${t.title}\n${t.body}`).join('\n\n'),
        meta: { count: String(board.threads.length) },
      })
      if (toast) showToast('杂谈已更新', `${board.threads.length} 条帖子`)
    } catch (e) {
      showToast('刷新失败', e instanceof Error ? e.message : '未知错误')
    } finally {
      setBusy(false)
    }
  }

  return (
    <TomeSubShell title="撰旅奇说" onBack={onBack}>
      <div className="tavern-forum">
        <div className="tavern-forum__toolbar">
          <p className="tome-hint mb-0">酒馆杂谈 · AI 生成的流言与求助</p>
          <button
            type="button"
            className="tome-btn"
            disabled={busy}
            onClick={() => void refresh(true)}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            刷新
          </button>
        </div>

        <section className="tavern-forum__hot">
          <div className="tavern-forum__hot-head">
            <Flame size={14} /> 今日热搜
          </div>
          <ul className="tavern-forum__hot-list">
            {(hotTitles.length ? hotTitles : threads.map((t) => t.title)).map((title, i) => (
              <li key={`${title}-${i}`}>
                <span className="tavern-forum__hot-idx">{i + 1}</span>
                <span className="tavern-forum__hot-title">{title}</span>
                {i < 2 && <span className="tavern-forum__badge">热</span>}
              </li>
            ))}
            {hotTitles.length === 0 && threads.length === 0 && (
              <li className="tavern-forum__empty">点刷新生成今日话题</li>
            )}
          </ul>
        </section>

        <div className="tavern-forum__feed">
          {threads.map((t) => (
            <ForumCard
              key={t.id}
              thread={t}
              open={expanded === t.id}
              onToggle={() => setExpanded((id) => (id === t.id ? null : t.id))}
            />
          ))}
        </div>
      </div>
    </TomeSubShell>
  )
}

function ForumCard({
  thread,
  open,
  onToggle,
}: {
  thread: ForumThread
  open: boolean
  onToggle: () => void
}) {
  return (
    <article className="tavern-forum__card">
      <button type="button" className="tavern-forum__card-head" onClick={onToggle}>
        <div className="tavern-forum__avatar" aria-hidden>
          {thread.author.replace('@', '').slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="tavern-forum__author">{thread.author}</p>
          <h3 className="tavern-forum__title">{thread.title}</h3>
        </div>
        {thread.hot && <span className="tavern-forum__badge">热</span>}
      </button>
      {(open || true) && (
        <>
          <p className="tavern-forum__body">{thread.body}</p>
          {thread.replies.length > 0 && (
            <div className="tavern-forum__replies">
              {thread.replies.map((r, i) => (
                <div key={`${r.author}-${i}`} className="tavern-forum__reply">
                  <span className="tavern-forum__reply-author">{r.author}</span>
                  <p>{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </article>
  )
}

/** 兼容旧留言板入口 */
export function TavernForum({ onBack }: { onBack: () => void }) {
  return <TavernGossip onBack={onBack} />
}
