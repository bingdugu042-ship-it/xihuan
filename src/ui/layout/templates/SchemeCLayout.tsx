import { useState } from 'react'
import { TemplateTopBar } from './shared/TemplateTopBar'
import { TemplateFacilityNav } from './shared/TemplateFacilityNav'
import { TemplateChatCore } from './shared/TemplateChatCore'
import { TemplatePassportPanel, TemplateNpcCard } from './shared/TemplateSidePanels'
import { TemplateCommandBar } from './shared/TemplateCommandBar'
import { useTemplateActions } from './shared/useTemplateActions'
import { useIsMobileLayout } from './shared/useIsMobileLayout'
import { TemplateMobileDock, type TemplateDockTab } from './shared/TemplateMobileDock'
import { TemplateBottomSheet } from './shared/TemplateBottomSheet'
import { TemplateStatusPanels } from './shared/TemplateStatusPanels'
import { usePassportStore } from '@/store/passportStore'
import { FACILITIES } from '@/data/facilities'

/** 方案 C · 温泉旅馆风 — 桌面双栏 / 移动单栏+底栏轮盘 */
export function SchemeCLayout() {
  const mobile = useIsMobileLayout()
  const { enterFacility, runCommand, arrivalBanner, activeFacilityId, activeSession } = useTemplateActions()
  const hasStamp = usePassportStore((s) => s.hasStamp)
  const stampCount = usePassportStore((s) => Object.keys(s.stamps).length)
  const [dockTab, setDockTab] = useState<TemplateDockTab>('chat')
  const [sheet, setSheet] = useState<'status' | 'passport' | null>(null)

  const closeSheets = () => {
    setSheet(null)
    setDockTab('chat')
  }

  const paperBg = {
    background: 'var(--c-bg)',
    backgroundImage:
      'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(60,36,21,0.03) 28px, rgba(60,36,21,0.03) 29px)',
  }

  if (mobile) {
    return (
      <div className="template-layout template-layout--c template-layout--mobile flex h-full min-h-0 flex-col" style={paperBg}>
        <div className="shrink-0 border-b px-3 py-2" style={{ borderColor: 'var(--c-border)' }}>
          <h1
            className="text-center text-sm tracking-[0.35em]"
            style={{ fontFamily: 'var(--scheme-title-font)', color: 'var(--c-text)' }}
          >
            西幻万人迷 · 艾尔茜利恩
          </h1>
        </div>
        <TemplateTopBar arrivalBanner={arrivalBanner} hideTitle />

        <main className="relative flex min-h-0 flex-1 flex-col">
          <TemplateChatCore />
        </main>

        <div className="shrink-0 border-t px-3 py-2" style={{ borderColor: 'var(--c-border)' }}>
          <TemplateCommandBar onCommand={(c) => void runCommand(c)} variant="inline" mobile />
        </div>

        <div className="shrink-0 border-t" style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface)' }}>
          <TemplateFacilityNav
            activeId={activeFacilityId}
            onPick={(f) => void enterFacility(f)}
            variant="carousel"
            mobile
          />
        </div>

        <TemplateMobileDock
          active={dockTab}
          hideFacilities
          onChat={closeSheets}
          onFacilities={() => {}}
          onStatus={() => {
            setDockTab('status')
            setSheet('status')
          }}
          labels={{ status: '汤守' }}
        />

        <TemplateBottomSheet open={sheet === 'status'} title="男主 · 状态" onClose={closeSheets}>
          <TemplateStatusPanels session={activeSession} showStampList />
        </TemplateBottomSheet>
      </div>
    )
  }

  return (
    <div className="template-layout template-layout--c flex h-full min-h-0 flex-col" style={paperBg}>
      <div className="shrink-0 border-b px-4 py-2" style={{ borderColor: 'var(--c-border)' }}>
        <h1
          className="text-center text-base tracking-[0.45em]"
          style={{ fontFamily: 'var(--scheme-title-font)', color: 'var(--c-text)' }}
        >
          星 屿 市 · 艾尔茜利恩
        </h1>
      </div>
      <TemplateTopBar arrivalBanner={arrivalBanner} />

      <div className="flex min-h-0 flex-1">
        <main className="relative flex min-w-0 flex-1 flex-col border-r" style={{ borderColor: 'var(--c-border)' }}>
          <TemplateChatCore />
          <div className="shrink-0 border-t px-4 py-2" style={{ borderColor: 'var(--c-border)' }}>
            <p className="mb-1 text-[9px]" style={{ color: 'var(--c-text-dim)' }}>
              指令
            </p>
            <TemplateCommandBar onCommand={(c) => void runCommand(c)} variant="inline" />
          </div>
        </main>

        <aside className="template-sidebar-right no-scrollbar w-[min(240px,30%)] shrink-0 space-y-4 overflow-y-auto p-4">
          <TemplateNpcCard session={activeSession} />
          <div
            className="rounded-lg p-3"
            style={{
              background: 'var(--c-surface)',
              border: '1px solid var(--c-border)',
              boxShadow: '2px 2px 0 rgba(60,36,21,0.08)',
            }}
          >
            <p className="mb-2 text-[10px]" style={{ color: 'var(--c-primary)' }}>
              图鉴 {stampCount}/{FACILITIES.length}
            </p>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {FACILITIES.map((f) => (
                <div key={f.id} className="flex justify-between text-[9px]" style={{ color: 'var(--c-text-dim)' }}>
                  <span>[{f.name}]</span>
                  <span style={{ color: hasStamp(f.id) ? 'var(--c-primary)' : 'var(--c-text-dim)' }}>
                    {hasStamp(f.id) ? '✔' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <TemplatePassportPanel compact />
        </aside>
      </div>

      <div className="shrink-0 border-t" style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface)' }}>
        <TemplateFacilityNav
          activeId={activeFacilityId}
          onPick={(f) => void enterFacility(f)}
          variant="carousel"
        />
      </div>
    </div>
  )
}
