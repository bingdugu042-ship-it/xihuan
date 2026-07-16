import { PhoneAppShell } from './PhoneAppShell'
import { TreePine } from 'lucide-react'

export function HomebaseApp() {
  return (
    <PhoneAppShell title="家园系统">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: 'rgba(34,197,94,0.12)' }}>
          <TreePine size={40} style={{ color: '#22c55e' }} />
        </div>
        <h2 className="text-lg font-medium" style={{ color: 'var(--c-text)' }}>家园系统</h2>
        <p className="text-sm" style={{ color: 'var(--c-text-dim)' }}>世界树 · 你的专属办公室与栖息地</p>
        <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>即将开放</p>
      </div>
    </PhoneAppShell>
  )
}
