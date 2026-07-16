import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { LayoutTemplateId } from '@/types'
import { useUIStore } from '@/store/uiStore'
import { SchemeALayout } from './SchemeALayout'
import { SchemeBLayout } from './SchemeBLayout'
import { SchemeCLayout } from './SchemeCLayout'
import { SettingsTab } from '@/ui/tabs/SettingsTab'
import { PhoneTab } from '@/ui/tabs/PhoneTab'
import { PassportTab } from '@/ui/tabs/PassportTab'

interface Props {
  scheme: LayoutTemplateId
}

export function TemplateShell({ scheme }: Props) {
  const activeTab = useUIStore((s) => s.activeTab)
  const setActiveTab = useUIStore((s) => s.setActiveTab)

  const layout =
    scheme === 'scheme_a' ? <SchemeALayout /> : scheme === 'scheme_b' ? <SchemeBLayout /> : <SchemeCLayout />

  const overlay =
    activeTab === 'settings' ? (
      <OverlayPanel title="设置" onClose={() => setActiveTab('chat')}>
        <SettingsTab />
      </OverlayPanel>
    ) : activeTab === 'phone' ? (
      <OverlayPanel title="手机" onClose={() => setActiveTab('chat')}>
        <PhoneTab />
      </OverlayPanel>
    ) : activeTab === 'passport' ? (
      <OverlayPanel title="图鉴" onClose={() => setActiveTab('chat')}>
        <PassportTab />
      </OverlayPanel>
    ) : null

  return (
    <main className="app-main relative flex h-full min-h-0 flex-col overflow-hidden">
      {layout}
      <AnimatePresence>{overlay}</AnimatePresence>
    </main>
  )
}

function OverlayPanel({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: 'var(--c-bg)' }}
    >
      <div
        className="flex shrink-0 items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--c-glass-border)' }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
          {title}
        </span>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5" style={{ color: 'var(--c-text-dim)' }}>
          <X size={18} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </motion.div>
  )
}
