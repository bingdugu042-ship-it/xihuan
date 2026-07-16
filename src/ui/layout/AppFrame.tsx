import { useSettingsStore } from '@/store/settingsStore'
import { SanctumAmbient } from '@/ui/effects/SanctumAmbient'

/** 游戏化外框 + 西幻域界 / 圣殿氛围装饰 */
export function AppFrame({ children }: { children: React.ReactNode }) {
  const lightOn = useSettingsStore((s) => s.settings.ui.lightOn)
  const palette = useSettingsStore((s) => s.settings.ui.colorPalette ?? 'sanctum')
  const showNightVeil = palette === 'classic' && !lightOn

  return (
    <div className="app-frame relative flex h-full w-full flex-col overflow-hidden">
      <div className="park-corner park-corner-tl" aria-hidden />
      <div className="park-corner park-corner-tr" aria-hidden />
      <div className="park-corner park-corner-bl" aria-hidden />
      <div className="park-corner park-corner-br" aria-hidden />
      <div className="app-frame-border" aria-hidden />

      {showNightVeil && <div className="park-night-veil" aria-hidden />}
      {palette === 'sanctum' && <SanctumAmbient />}

      <div className="ambient-glow" aria-hidden />

      <div className="relative z-10 flex h-full min-h-0 flex-col">{children}</div>
    </div>
  )
}
