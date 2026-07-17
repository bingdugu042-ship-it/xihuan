import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useDataStore } from './store/dataStore'
import { useSettingsStore } from './store/settingsStore'
import { useSessionStore } from './store/sessionStore'
import { useProfileStore } from './store/profileStore'
import { useUIStore } from './store/uiStore'
import { applyTheme } from './theme/themeLoader'
import { applyAmbiance } from './theme/ambiance'
import { injectUserCSS } from './utils/customCSS'
import { getUserCSS } from './storage/db'
import { useMusicStore } from './store/musicStore'
import { useShopStore } from './store/shopStore'
import { useCustomRegionStore } from './store/customRegionStore'
import { usePassportStore } from './store/passportStore'
import { useBodyStatsStore } from './store/bodyStatsStore'
import { useAdventureStatsStore } from './store/adventureStatsStore'
import { useAzeriaProgressStore } from './store/azeriaProgressStore'
import { useTavernLifeStore } from './store/tavernLifeStore'
import { useFestivalStore } from './store/festivalStore'
import { useGeneratedStore } from './store/generatedStore'
import { applyCustomColors } from './utils/customColors'
import { applyLayoutScheme } from './ui/layout/templates/layoutSchemes'
import { Splash } from './ui/flow/Splash'
import { Onboarding } from './ui/flow/Onboarding'
import { Cutscene } from './ui/flow/Cutscene'
import { InviteGate } from './ui/flow/InviteGate'
import { MainShell } from './ui/layout/MainShell'
import { AgeGate } from './ui/components/AgeGate'

function goMainAfterGate() {
  useUIStore.getState().setActiveTab('adventure')
  useUIStore.getState().setFlowStage('main')
}

export default function App() {
  const loadData = useDataStore((s) => s.loadAll)
  const dataLoaded = useDataStore((s) => s.loaded)
  const theme = useDataStore((s) => s.theme)
  const loadSettings = useSettingsStore((s) => s.load)
  const settingsLoaded = useSettingsStore((s) => s.loaded)
  const { settings, updateUI } = useSettingsStore()
  const loadSessions = useSessionStore((s) => s.loadSessions)
  const loadProfiles = useProfileStore((s) => s.load)
  const loadMusic = useMusicStore((s) => s.load)
  const loadShop = useShopStore((s) => s.load)
  const loadCustomRegions = useCustomRegionStore((s) => s.load)
  const loadPassport = usePassportStore((s) => s.load)
  const loadBodyStats = useBodyStatsStore((s) => s.load)
  const loadAdventureStats = useAdventureStatsStore((s) => s.load)
  const loadAzeriaProgress = useAzeriaProgressStore((s) => s.load)
  const loadTavernLife = useTavernLifeStore((s) => s.load)
  const loadFestivals = useFestivalStore((s) => s.load)
  const loadGenerated = useGeneratedStore((s) => s.load)
  const flowStage = useUIStore((s) => s.flowStage)
  const setFlowStage = useUIStore((s) => s.setFlowStage)
  const flowReplayNonce = useUIStore((s) => s.flowReplayNonce)

  useEffect(() => {
    loadData()
    loadSettings()
    loadSessions()
    loadProfiles()
    loadMusic()
    loadShop()
    loadCustomRegions()
    loadPassport()
    loadBodyStats()
    loadAdventureStats()
    void loadAzeriaProgress()
    void loadTavernLife()
    void loadFestivals()
    void loadGenerated()
  }, [loadData, loadSettings, loadSessions, loadProfiles, loadMusic, loadShop, loadCustomRegions, loadPassport, loadBodyStats, loadAdventureStats, loadAzeriaProgress, loadTavernLife, loadFestivals, loadGenerated])

  useEffect(() => {
    if (theme) applyTheme(theme)
    // theme 注入后若已是圣殿模式，立刻重刷深墨字色
    if (settingsLoaded) {
      applyAmbiance({
        colorPalette: settings.ui.colorPalette ?? 'sanctum',
        lightOn: settings.ui.lightOn ?? true,
      })
      applyCustomColors(settings.ui.customColors)
      applyLayoutScheme('classic')
    }
  }, [
    theme,
    settingsLoaded,
    settings.ui.colorPalette,
    settings.ui.lightOn,
    settings.ui.customColors,
  ])

  useEffect(() => {
    getUserCSS().then((css) => {
      if (css) injectUserCSS(css)
    })
  }, [])

  const enterMainIfInvited = () => {
    if (settings.ui.inviteVerified) {
      goMainAfterGate()
    } else {
      setFlowStage('invite')
    }
  }

  const handleSplashDone = async () => {
    if (useUIStore.getState().openingReplay) {
      useUIStore.setState({ openingReplay: false })
      goMainAfterGate()
      return
    }
    if (!settings.ui.onboardingCompleted) {
      setFlowStage('onboarding')
      return
    }
    // 3D 书已是完整开场，跳过旧 cutscene，直入主程
    await updateUI({ cutscenePlayed: true })
    enterMainIfInvited()
  }

  const handleCutsceneDone = async () => {
    if (useUIStore.getState().openingReplay) {
      useUIStore.setState({ openingReplay: false })
      enterMainIfInvited()
      return
    }
    await updateUI({ cutscenePlayed: true })
    enterMainIfInvited()
  }

  if (!dataLoaded || !settingsLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--c-text-dim)' }}>
          加载中…
        </p>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {flowStage === 'splash' && <Splash key={`splash-${flowReplayNonce}`} onEnter={handleSplashDone} />}
        {flowStage === 'onboarding' && <Onboarding key="onboarding" />}
        {flowStage === 'cutscene' && (
          <Cutscene key={`cutscene-${flowReplayNonce}`} onComplete={handleCutsceneDone} />
        )}
        {flowStage === 'invite' && <InviteGate key="invite" onVerified={goMainAfterGate} />}
        {flowStage === 'main' && <MainShell key="main" />}
      </AnimatePresence>

      {!settings.ui.ageConfirmed && <AgeGate />}
    </>
  )
}
