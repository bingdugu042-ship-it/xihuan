import { ChevronLeft } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

export function PhoneAppShell({
  title,
  children,
  onBack,
}: {
  title: string
  children: React.ReactNode
  onBack?: () => void
}) {
  const setPhoneApp = useUIStore((s) => s.setPhoneApp)

  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ background: 'var(--bg-gradient)' }}>
      <header
        className="glass-bar flex shrink-0 items-center gap-2 px-3"
        style={{ height: 48, borderBottom: '1px solid var(--c-glass-border)' }}
      >
        <button
          onClick={() => (onBack ? onBack() : setPhoneApp('home'))}
          className="press-scale rounded-lg p-2"
          style={{ color: 'var(--c-text)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
          {title}
        </h2>
      </header>
      <div className="no-scrollbar flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  )
}
