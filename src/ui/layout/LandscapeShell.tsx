import { LandscapeSidebar } from './LandscapeSidebar'

export function LandscapeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="tome-shell tome-shell--landscape">
      <div className="tome-parchment" aria-hidden />
      <LandscapeSidebar />
      <main className="tome-main">{children}</main>
    </div>
  )
}
