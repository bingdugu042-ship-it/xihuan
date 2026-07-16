import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, Settings, Smartphone, Stamp, Terminal } from 'lucide-react'
import { usePassportStore } from '@/store/passportStore'
import { useUIStore } from '@/store/uiStore'
import { useSettingsStore } from '@/store/settingsStore'
import { FACILITIES } from '@/data/facilities'
import { useIsMobileLayout } from './useIsMobileLayout'

interface Props {
  arrivalBanner?: string | null
  onOpenCommands?: () => void
  /** 方案 C 等自定义标题 */
  title?: string
  hideTitle?: boolean
}

export function TemplateTopBar({ arrivalBanner, onOpenCommands, title, hideTitle }: Props) {
  const stampCount = usePassportStore((s) => Object.keys(s.stamps).length)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const updateUI = useSettingsStore((s) => s.updateUI)
  const mobile = useIsMobileLayout()

  return (
    <>
      <header
        className={`template-topbar relative z-30 flex shrink-0 items-center justify-between gap-1 border-b ${mobile ? 'px-2 py-1.5' : 'px-3 py-2'}`}
        style={{
          borderColor: 'var(--c-glass-border)',
          background: 'var(--c-surface)',
          backdropFilter: 'blur(10px)',
          minHeight: mobile ? 44 : undefined,
        }}
      >
        {!hideTitle && (
          <div className="min-w-0 flex-1">
            <p
              className={`truncate font-medium tracking-wide ${mobile ? 'text-xs' : 'text-sm'}`}
              style={{ fontFamily: 'var(--scheme-title-font, var(--font-dialogue))', color: 'var(--c-text)' }}
            >
              {title ?? (mobile ? '艾尔茜利恩' : '▲ 艾尔茜利恩')}
            </p>
          </div>
        )}
        {hideTitle && <div className="flex-1" />}
        <div className={`flex shrink-0 items-center ${mobile ? 'gap-0.5' : 'gap-1'}`}>
          <TopBtn
            icon={Stamp}
            label={mobile ? undefined : `${stampCount}/${FACILITIES.length}`}
            ariaLabel={`图鉴 ${stampCount}/${FACILITIES.length}`}
            onClick={() => setActiveTab('passport')}
            mobile={mobile}
          />
          <TopBtn
            icon={Terminal}
            label={mobile ? undefined : '$指令'}
            ariaLabel="指令手册"
            onClick={onOpenCommands}
            mobile={mobile}
          />
          <TopBtn
            icon={Smartphone}
            label={mobile ? undefined : '手机'}
            ariaLabel="手机"
            onClick={() => setActiveTab('phone')}
            mobile={mobile}
          />
          <TopBtn
            icon={Settings}
            label={mobile ? undefined : '设置'}
            ariaLabel="设置"
            onClick={() => setActiveTab('settings')}
            mobile={mobile}
          />
          <TopBtn
            icon={LayoutGrid}
            label={mobile ? undefined : '经典'}
            ariaLabel="切换经典布局"
            onClick={() => void updateUI({ layoutTemplate: 'classic' })}
            accent
            mobile={mobile}
          />
        </div>
      </header>
      <AnimatePresence>
        {arrivalBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative z-20 px-3 py-2 text-center text-[11px]"
            style={{
              background: 'var(--c-primary-soft)',
              color: 'var(--c-primary)',
              borderBottom: '1px solid var(--c-glass-border)',
            }}
          >
            {arrivalBanner}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function TopBtn({
  icon: Icon,
  label,
  ariaLabel,
  onClick,
  accent,
  mobile,
}: {
  icon: typeof Stamp
  label?: string
  ariaLabel: string
  onClick?: () => void
  accent?: boolean
  mobile?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`template-topbar-btn flex items-center justify-center rounded-lg ${mobile ? 'h-9 w-9' : 'gap-0.5 px-2 py-1 text-[9px]'}`}
      style={{
        background: accent ? 'var(--scheme-danger, var(--c-primary))' : 'var(--c-bg-soft)',
        color: accent ? '#fff' : 'var(--c-text-dim)',
        border: '1px solid var(--c-glass-border)',
      }}
    >
      <Icon size={mobile ? 16 : 11} />
      {label && <span>{label}</span>}
    </button>
  )
}
