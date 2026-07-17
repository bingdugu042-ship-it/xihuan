import { TomeNav } from './TomeNav'
import { TomeHeader } from './TomeHeader'
import { useUIStore } from '@/store/uiStore'
import { useIsMobileLayout } from '@/ui/layout/templates/shared/useIsMobileLayout'

export function PortraitShell({ children }: { children: React.ReactNode }) {
  const activeTab = useUIStore((s) => s.activeTab)
  const mobile = useIsMobileLayout()
  /** 沉浸页已有 Chat Header，移动端隐藏卷轴顶栏，避免双层顶栏挤占与错位 */
  const hideTomeHeader = mobile && activeTab === 'chat'

  return (
    <div
      className={`tome-shell tome-shell--portrait${hideTomeHeader ? ' tome-shell--chat-immerse' : ''}`}
    >
      <div className="tome-parchment" aria-hidden />
      {!hideTomeHeader && <TomeHeader />}
      <main className="tome-main">{children}</main>
      <TomeNav />
    </div>
  )
}
