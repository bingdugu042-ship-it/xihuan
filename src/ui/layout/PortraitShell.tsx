import { TomeNav } from './TomeNav'
import { TomeHeader } from './TomeHeader'

export function PortraitShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="tome-shell tome-shell--portrait">
      <div className="tome-parchment" aria-hidden />
      <TomeHeader />
      <main className="tome-main">{children}</main>
      <TomeNav />
    </div>
  )
}
