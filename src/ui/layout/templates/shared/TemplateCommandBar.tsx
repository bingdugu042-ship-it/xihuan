import { WESTERN_COMMANDS } from '@/data/commands'

interface Props {
  onCommand: (cmd: string) => void
  highlight?: boolean
  variant?: 'bar' | 'inline'
  mobile?: boolean
}

export function TemplateCommandBar({ onCommand, highlight, variant = 'bar', mobile }: Props) {
  const quick = WESTERN_COMMANDS.slice(0, 5)
  const btnClass = mobile
    ? 'template-cmd-btn shrink-0 snap-start min-h-[40px] rounded-full px-3.5 py-2 font-mono text-xs active:scale-95'
    : 'shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] transition-transform active:scale-95'

  if (variant === 'inline') {
    return (
      <div className={`template-cmd-scroll flex gap-2 ${mobile ? 'no-scrollbar snap-x snap-mandatory overflow-x-auto pb-1' : 'flex-wrap gap-1.5'}`}>
        {quick.map((c) => (
          <button
            key={c.cmd}
            type="button"
            onClick={() => onCommand(c.insert ?? c.cmd)}
            className={mobile ? btnClass : 'rounded-md px-2 py-1 font-mono text-[10px]'}
            style={{
              background: 'var(--c-surface)',
              border: '1px solid var(--c-glass-border)',
              color: 'var(--c-accent)',
            }}
          >
            {c.cmd.replace(' {设施名}', '').replace(' {名称}', '')}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      className={`template-cmd-scroll flex shrink-0 items-center gap-2 overflow-x-auto ${mobile ? 'snap-x snap-mandatory px-2 py-2' : 'gap-1 px-3 py-2'}`}
      style={{
        borderTop: '1px solid var(--c-glass-border)',
        background: highlight ? 'var(--c-primary-soft)' : 'var(--c-surface)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span className="mr-1 shrink-0 text-[9px]" style={{ color: 'var(--c-text-dim)' }}>
        快捷指令
      </span>
      {quick.map((c) => (
        <button
          key={c.cmd}
          type="button"
          onClick={() => onCommand(c.insert ?? c.cmd)}
          className={btnClass}
          style={{
            background: 'var(--c-bg-soft)',
            border: '1px solid var(--c-glass-border)',
            color: 'var(--c-accent)',
          }}
        >
          {c.cmd.split(' ')[0]}
        </button>
      ))}
    </div>
  )
}
