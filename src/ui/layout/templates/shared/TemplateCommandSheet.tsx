import { TemplateBottomSheet } from './TemplateBottomSheet'
import { WESTERN_COMMANDS } from '@/data/commands'

interface Props {
  open: boolean
  onClose: () => void
  onPick: (cmd: string) => void
}

export function TemplateCommandSheet({ open, onClose, onPick }: Props) {
  return (
    <TemplateBottomSheet open={open} title="$ 指令手册" onClose={onClose} heightRatio={0.78}>
      <div className="flex flex-col gap-2">
        {WESTERN_COMMANDS.map((c) => (
          <button
            key={c.cmd}
            type="button"
            onClick={() => onPick(c.insert ?? c.cmd)}
            className="template-touch-row flex flex-col rounded-xl px-4 py-3 text-left active:scale-[0.98]"
            style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)' }}
          >
            <span className="font-mono text-sm" style={{ color: 'var(--c-accent)' }}>
              {c.cmd}
            </span>
            <span className="mt-0.5 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
              {c.desc}
            </span>
          </button>
        ))}
      </div>
    </TemplateBottomSheet>
  )
}
