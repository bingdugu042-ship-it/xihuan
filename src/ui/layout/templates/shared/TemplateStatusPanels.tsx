import { TemplatePassportPanel, TemplateBodyPanel, TemplateNpcCard } from './TemplateSidePanels'
import type { Session } from '@/types'
import { usePassportStore } from '@/store/passportStore'
import { FACILITIES } from '@/data/facilities'

/** 移动端「状态」抽屉内容 */
export function TemplateStatusPanels({
  session,
  showStampList,
}: {
  session: Session | null
  showStampList?: boolean
}) {
  const hasStamp = usePassportStore((s) => s.hasStamp)
  const stampCount = usePassportStore((s) => Object.keys(s.stamps).length)

  return (
    <div className="flex flex-col gap-3 pb-2">
      <TemplateNpcCard session={session} />
      <TemplateBodyPanel />
      <TemplatePassportPanel />
      {showStampList && (
        <div
          className="rounded-xl p-3"
          style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)' }}
        >
          <p className="mb-2 text-[11px]" style={{ color: 'var(--c-primary)' }}>
            印章一览 {stampCount}/{FACILITIES.length}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {FACILITIES.map((f) => (
              <div
                key={f.id}
                className="rounded-lg px-2 py-1.5 text-[10px]"
                style={{
                  background: 'var(--c-surface)',
                  color: hasStamp(f.id) ? 'var(--c-accent)' : 'var(--c-text-dim)',
                }}
              >
                {hasStamp(f.id) ? '✔ ' : '○ '}
                {f.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
