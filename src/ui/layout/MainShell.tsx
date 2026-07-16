import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { TomeLayout } from './TomeLayout'
import { ViewportScaler } from './ViewportScaler'
import { AppFrame } from './AppFrame'
import { ChatTab } from '@/ui/tabs/ChatTab'
import { WorldTab } from '@/ui/tabs/WorldTab'
import { TavernTab } from '@/ui/tabs/TavernTab'
import { AtlasTab } from '@/ui/tabs/AtlasTab'
import { SettingsTab } from '@/ui/tabs/SettingsTab'
import { FloatingCD } from '@/ui/phone/FloatingCD'
import { WorldTreeModal } from '@/ui/components/modals/WorldTreeModal'
import { ToastHost } from '@/ui/components/ToastHost'
import { MobileKeyboardBodySync } from './MobileKeyboardBodySync'
import { RulebookTab } from '@/ui/tabs/RulebookTab'
import { FacilityPlayPage } from '@/ui/facility/FacilityPlayPage'
import { DiceOverlay } from '@/ui/effects/DiceOverlay'

const TAB_ORDER: Record<string, number> = {
  adventure: 0,
  world: 0,
  chat: 1,
  rulebook: 2,
  party: 3,
  tavern: 3,
  home: 3,
  phone: 3,
  atlas: 5,
  passport: 5,
  settings: 6,
}

export function MainShell() {
  const activeTab = useUIStore((s) => s.activeTab)
  const direction = (TAB_ORDER[activeTab] ?? 0) > 0 ? 1 : -1

  const tab =
    activeTab === 'world'
      ? 'adventure'
      : activeTab === 'passport'
        ? 'atlas'
        : activeTab === 'phone' || activeTab === 'party' || activeTab === 'home'
          ? 'tavern'
          : activeTab

  return (
    <>
      <MobileKeyboardBodySync />
      <ViewportScaler>
        <div className="app-shell">
          <AppFrame>
            <TomeLayout>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -16 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 flex flex-col"
                >
                  {tab === 'adventure' && <WorldTab />}
                  {tab === 'chat' && <ChatTab />}
                  {tab === 'rulebook' && <RulebookTab />}
                  {tab === 'tavern' && <TavernTab />}
                  {tab === 'atlas' && <AtlasTab />}
                  {tab === 'settings' && <SettingsTab />}
                </motion.div>
              </AnimatePresence>
            </TomeLayout>
          </AppFrame>
        </div>
      </ViewportScaler>
      <FloatingCD />
      <WorldTreeModal />
      <FacilityPlayPage />
      <DiceOverlay />
      <ToastHost />
    </>
  )
}
