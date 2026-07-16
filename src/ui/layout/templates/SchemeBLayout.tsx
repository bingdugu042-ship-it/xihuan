import { useState } from 'react'
import { TemplateTopBar } from './shared/TemplateTopBar'
import { TemplateFacilityNav } from './shared/TemplateFacilityNav'
import { TemplateChatCore } from './shared/TemplateChatCore'
import { TemplatePassportPanel, TemplateBodyPanel } from './shared/TemplateSidePanels'
import { TemplateCommandBar } from './shared/TemplateCommandBar'
import { useTemplateActions } from './shared/useTemplateActions'
import { useIsMobileLayout } from './shared/useIsMobileLayout'
import { TemplateMobileDock, type TemplateDockTab } from './shared/TemplateMobileDock'
import { TemplateBottomSheet } from './shared/TemplateBottomSheet'
import { TemplateCommandSheet } from './shared/TemplateCommandSheet'
import { TemplateStatusPanels } from './shared/TemplateStatusPanels'

/** 方案 B · 霓虹游域界风 — 移动优化单栏 */
export function SchemeBLayout() {
  const mobile = useIsMobileLayout()
  const { enterFacility, runCommand, arrivalBanner, activeFacilityId, activeSession } = useTemplateActions()
  const [cmdOpen, setCmdOpen] = useState(false)
  const [dockTab, setDockTab] = useState<TemplateDockTab>('chat')
  const [statusOpen, setStatusOpen] = useState(false)

  return (
    <div
      className={`template-layout template-layout--b ${mobile ? 'template-layout--mobile' : ''} relative flex h-full min-h-0 flex-col`}
      style={{ background: 'var(--c-bg)' }}
    >
      <TemplateTopBar arrivalBanner={arrivalBanner} onOpenCommands={() => setCmdOpen(true)} />

      <div className="shrink-0 border-b" style={{ borderColor: 'var(--c-glass-border)' }}>
        <p
          className={`text-center font-medium tracking-[0.2em] ${mobile ? 'py-1.5 text-xs' : 'py-2 text-sm tracking-[0.35em]'}`}
          style={{
            fontFamily: 'var(--scheme-title-font)',
            color: 'var(--c-accent)',
            textShadow: mobile ? '0 0 8px var(--c-accent)' : '0 0 12px var(--c-accent)',
          }}
        >
          {mobile ? '⭐ 艾尔茜利恩 ⭐' : '⭐ 星 屹 游 乐 园 ⭐'}
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

        {!mobile && (
          <div className="pointer-events-none absolute bottom-24 right-3 z-20 flex flex-col gap-2">
            <div className="pointer-events-auto w-[130px] scale-90 origin-bottom-right">
              <TemplateBodyPanel />
            </div>
            <div className="pointer-events-auto w-[110px] scale-90 origin-bottom-right">
              <TemplatePassportPanel compact />
            </div>
          </div>
        )}

        {!mobile && activeSession?.dynamicNpc && (
          <div
            className="absolute left-3 top-3 z-10 max-w-[140px] rounded-lg px-2 py-1 text-[9px]"
            style={{
              background: 'var(--c-surface)',
              border: '1px solid var(--c-accent)',
              boxShadow: '0 0 10px var(--c-accent)',
              color: 'var(--c-text-dim)',
            }}
          >
            NPC · {activeSession.dynamicNpc.displayName}
          </div>
        )}
      </main>

      <div className={`shrink-0 ${mobile ? 'px-2 pb-1' : 'space-y-2 px-3 pb-2'}`}>
        <TemplateCommandBar onCommand={(c) => void runCommand(c)} variant="inline" mobile={mobile} />
      </div>

      {mobile && (
        <>
          {activeSession?.dynamicNpc && dockTab === 'chat' && !statusOpen && (
            <div
              className="mx-3 mb-1 shrink-0 truncate rounded-lg px-3 py-1.5 text-[10px]"
              style={{
                background: 'var(--c-primary-soft)',
                border: '1px solid var(--c-accent)',
                color: 'var(--c-text)',
              }}
            >
              男主 · {activeSession.dynamicNpc.displayName}
            </div>
          )}
          <TemplateMobileDock
            active={dockTab}
            hideFacilities
            onChat={() => {
              setDockTab('chat')
              setStatusOpen(false)
            }}
            onFacilities={() => {}}
            onStatus={() => {
              setDockTab('status')
              setStatusOpen(true)
            }}
            labels={{ status: '面板' }}
          />
          <TemplateBottomSheet open={statusOpen} title="浮动面板" onClose={() => { setStatusOpen(false); setDockTab('chat') }}>
            <TemplateStatusPanels session={activeSession} />
          </TemplateBottomSheet>
        </>
      )}

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
