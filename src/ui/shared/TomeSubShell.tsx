import { ChevronLeft } from 'lucide-react'

export function TomeSubShell({
  title,
  children,
  onBack,
}: {
  title: string
  children: React.ReactNode
  onBack: () => void
}) {
  return (
    <div className="tome-page">
      <header className="tome-sub-shell__header">
        <button type="button" className="tome-sub-shell__back press-scale" onClick={onBack} aria-label="返回">
          <ChevronLeft size={20} />
        </button>
        <h2 className="tome-sub-shell__title">{title}</h2>
      </header>
      {children}
    </div>
  )
}
