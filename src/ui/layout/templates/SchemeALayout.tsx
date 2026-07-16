import { useState } from 'react'
import { TemplateTopBar } from './shared/TemplateTopBar'
import { TemplateFacilityNav } from './shared/TemplateFacilityNav'
import { TemplateChatCore } from './shared/TemplateChatCore'
import { TemplatePassportPanel, TemplateBodyPanel, TemplateNpcCard } from './shared/TemplateSidePanels'
import { TemplateCommandBar } from './shared/TemplateCommandBar'
import { useTemplateActions } from './shared/useTemplateActions'
import { useIsMobileLayout } from './shared/useIsMobileLayout'
import { TemplateMobileDock, type TemplateDockTab } from './shared/TemplateMobileDock'
import { TemplateBottomSheet } from './shared/TemplateBottomSheet'
import { TemplateCommandSheet } from './shared/TemplateCommandSheet'
import { TemplateStatusPanels } from './shared/TemplateStatusPanels'

/** 方案 A · 暗金赌场风 — 桌面三栏 / 移动单栏+Dock */
export function SchemeALayout() {
  const mobile = useIsMobileLayout()
  const { enterFacility, runCommand, arrivalBanner, activeFacilityId, activeSession } = useTemplateActions()
  const [cmdOpen, setCmdOpen] = useState(false)
  const [dockTab, setDockTab] = useState<TemplateDockTab>('chat')
  const [sheet, setSheet] = useState<'facilities' | 'status' | null>(null)

  const closeSheets = () => {
    setSheet(null)
    setDockTab('chat')
  }

  if (mobile) {
    return (
      <div className="template-layout template-layout--a template-layout--mobile flex h-full min-h-0 flex-col" style={{ background: 'var(--c-bg)' }}>
        <TemplateTopBar arrivalBanner={arrivalBanner} onOpenCommands={() => setCmdOpen(true)} />

        <div className="shrink-0 border-b" style={{ borderColor: 'var(--c-glass-border)' }}>
          <p className="px-3 py-1.5 text-[9px] tracking-widest" style={{ color: 'var(--c-accent)' }}>
            西大陆地图
          </p>
          <TemplateFacilityNav
            activeId={activeFacilityId}
            onPick={(f) => void enterFacility(f)}
            variant="horizontal"
            mobile
          />
        </div>

        <main className="relative flex min-h-0 flex-1 flex-col">
          <TemplateChatCore />
        </main>

        <TemplateCommandBar onCommand={(c) => void runCommand(c)} mobile />

        <TemplateMobileDock
          active={dockTab}
          onChat={closeSheets}
          onFacilities={() => {
            setDockTab('facilities')
            setSheet('facilities')
          }}
          onStatus={() => {
            setDockTab('status')
            setSheet('status')
          }}
        />

        <TemplateBottomSheet
          open={sheet === 'facilities'}
          title="选择冒险域"
          onClose={closeSheets}
        >
          <TemplateFacilityNav
            activeId={activeFacilityId}
            onPick={(f) => {
              void enterFacility(f)
              closeSheets()
            }}
            variant="vertical"
            mobile
          />
        </TemplateBottomSheet>

        <TemplateBottomSheet open={sheet === 'status'} title="状态面板" onClose={closeSheets}>
          <TemplateStatusPanels session={activeSession} />
        </TemplateBottomSheet>

        <TemplateCommandSheet
          open={cmdOpen}
          onClose={() => setCmdOpen(false)}
          onPick={(c) => {
            void runCommand(c)
            setCmdOpen(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="template-layout template-layout--a flex h-full min-h-0 flex-col" style={{ background: 'var(--c-bg)' }}>
      <TemplateTopBar arrivalBanner={arrivalBanner} onOpenCommands={() => setCmdOpen(true)} />

      <div className="flex min-h-0 flex-1">
        <aside
          className="template-sidebar-left no-scrollbar w-[min(180px,28%)] shrink-0 overflow-y-auto border-r"
          style={{ borderColor: 'var(--c-glass-border)', background: 'rgba(0,0,0,0.35)' }}
        >
          <p className="px-2 py-2 text-[9px] tracking-widest" style={{ color: 'var(--c-accent)' }}>
            西大陆地图
          </p>
          <TemplateFacilityNav
            activeId={activeFacilityId}
            onPick={(f) => void enterFacility(f)}
            variant="vertical"
          />
        </aside>

        <main className="relative flex min-w-0 flex-1 flex-col">
          <TemplateChatCore />
        </main>

        <aside
          className="template-sidebar-right no-scrollbar w-[min(280px,32%)] shrink-0 space-y-3 overflow-y-auto border-l p-3"
          style={{ borderColor: 'var(--c-glass-border)', background: 'rgba(0,0,0,0.25)' }}
        >
          <TemplatePassportPanel />
          <TemplateBodyPanel />
          <TemplateNpcCard session={activeSession} />
        </aside>
      </div>

      <TemplateCommandBar onCommand={(c) => void runCommand(c)} />

      <TemplateCommandSheet
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onPick={(c) => {
          void runCommand(c)
          setCmdOpen(false)
        }}
      />
    </div>
  )
}
