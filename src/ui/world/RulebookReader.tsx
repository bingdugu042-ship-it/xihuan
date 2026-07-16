import { useMemo, useState } from 'react'
import { AZERIA_CHAPTERS, getChapterBody } from '@/worldview/azeriaRulebook'

interface RulebookReaderProps {
  variant?: 'embed' | 'page'
}

export function RulebookReader({ variant = 'embed' }: RulebookReaderProps) {
  const [activeId, setActiveId] = useState<string>(AZERIA_CHAPTERS[0]?.id ?? 'ch01')
  const [expanded, setExpanded] = useState(variant === 'page')

  const active = useMemo(
    () => AZERIA_CHAPTERS.find((c) => c.id === activeId) ?? AZERIA_CHAPTERS[0],
    [activeId],
  )
  const body = useMemo(() => getChapterBody(active?.id ?? 'ch01'), [active?.id])

  if (variant === 'page') {
    return (
      <div className="rulebook-reader rulebook-reader--page">
        <nav className="rulebook-reader__toc no-scrollbar" aria-label="章节目录">
          {AZERIA_CHAPTERS.map((ch) => {
            const activeRow = ch.id === active?.id
            return (
              <button
                key={ch.id}
                type="button"
                className={`rulebook-reader__toc-item${activeRow ? ' is-active' : ''}`}
                onClick={() => setActiveId(ch.id)}
              >
                {ch.ordinal} · {ch.title}
              </button>
            )
          })}
        </nav>
        <article className="rulebook-reader__article no-scrollbar">
          <h2 className="rulebook-reader__heading">
            {active?.ordinal} · {active?.title}
          </h2>
          <pre className="rulebook-reader__body">{body || '该章节暂未切片到正文。'}</pre>
        </article>
      </div>
    )
  }

  return (
    <section className="tome-card">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
            艾泽利亚规则书
          </div>
          <div className="text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
            完整 34 章 · 与 AI 规制同源
          </div>
        </div>
        <button
          type="button"
          className="tome-btn tome-btn--ghost"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? '收起' : '展开'}
        </button>
      </div>

      {expanded && (
        <div className="rulebook-reader rulebook-reader--embed mt-3">
          <nav className="rulebook-reader__toc no-scrollbar" aria-label="章节目录">
            {AZERIA_CHAPTERS.map((ch) => {
              const activeRow = ch.id === active?.id
              return (
                <button
                  key={ch.id}
                  type="button"
                  className={`rulebook-reader__toc-item${activeRow ? ' is-active' : ''}`}
                  onClick={() => setActiveId(ch.id)}
                >
                  {ch.ordinal} · {ch.title}
                </button>
              )
            })}
          </nav>
          <article className="rulebook-reader__article no-scrollbar">
            <h2 className="rulebook-reader__heading">
              {active?.ordinal} · {active?.title}
            </h2>
            <pre className="rulebook-reader__body">{body || '该章节暂未切片到正文。'}</pre>
          </article>
        </div>
      )}
    </section>
  )
}
