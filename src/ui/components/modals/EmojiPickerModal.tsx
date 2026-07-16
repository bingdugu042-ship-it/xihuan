import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useSessionStore } from '@/store/sessionStore'
import { EMOJI_CATEGORIES } from '@/utils/emojiLibrary'

export function EmojiPickerModal() {
  const open = useUIStore((s) => s.emojiPickerOpen)
  const setOpen = useUIStore((s) => s.setEmojiPickerOpen)
  const { settings, updateUI } = useSettingsStore()
  const appendUserMessage = useSessionStore((s) => s.appendUserMessage)
  const enabled = settings.ui.characterEmojiEnabled ?? true

  const pick = (emoji: string) => {
    void appendUserMessage(emoji)
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[120]"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[121] mx-auto max-w-[520px] rounded-t-2xl"
            style={{ background: 'var(--c-bg-soft)', borderTop: '1px solid var(--c-border)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--c-border)' }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                表情
              </span>
              <button onClick={() => setOpen(false)} style={{ color: 'var(--c-text-dim)' }}>
                <X size={18} />
              </button>
            </div>

            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ background: 'var(--c-primary-soft)' }}
            >
              <span className="text-[11px]" style={{ color: 'var(--c-text)' }}>
                对方也发表情
              </span>
              <button
                type="button"
                onClick={() => void updateUI({ characterEmojiEnabled: !enabled })}
                className="relative h-6 w-11 rounded-full transition-colors"
                style={{ background: enabled ? 'var(--c-primary)' : 'var(--c-border)' }}
              >
                <span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
                  style={{ left: enabled ? 22 : 2 }}
                />
              </button>
            </div>

            <div className="no-scrollbar max-h-[45vh] overflow-y-auto px-3 py-3">
              {EMOJI_CATEGORIES.map((cat) => (
                <div key={cat.id} className="mb-3">
                  <p className="mb-1.5 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                    {cat.label}
                  </p>
                  <div className="grid grid-cols-8 gap-1">
                    {cat.items.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => pick(e)}
                        className="flex h-9 items-center justify-center rounded-lg text-lg active:scale-90"
                        style={{ background: 'var(--c-bg)' }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="h-2" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
