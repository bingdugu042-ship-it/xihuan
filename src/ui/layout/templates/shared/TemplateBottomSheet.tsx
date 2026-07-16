import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  /** 占屏高度比例，移动端默认 0.72 */
  heightRatio?: number
}

export function TemplateBottomSheet({ open, title, onClose, children, heightRatio = 0.72 }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="关闭"
            className="template-sheet-backdrop fixed inset-0 z-[90]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="template-sheet fixed inset-x-0 bottom-0 z-[91] flex flex-col rounded-t-2xl"
            style={{
              background: 'var(--c-surface)',
              borderTop: '1px solid var(--c-glass-border)',
              maxHeight: `${heightRatio * 100}vh`,
              paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) onClose()
            }}
          >
            <div className="flex shrink-0 flex-col px-4 pt-2 pb-1">
              <div className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full" style={{ background: 'var(--c-border)' }} />
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-medium"
                  style={{ color: 'var(--c-text)', fontFamily: 'var(--scheme-title-font, inherit)' }}
                >
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="template-touch-btn rounded-full p-2"
                  style={{ color: 'var(--c-text-dim)' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
