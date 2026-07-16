import { useEffect } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'
import { PortraitShell } from './PortraitShell'
import { LandscapeShell } from './LandscapeShell'

export function TomeLayout({ children }: { children: React.ReactNode }) {
  const layoutMode = useSettingsStore((s) => s.settings.ui.layoutMode)
  const regionHue = useUIStore((s) => s.regionHue)

  useEffect(() => {
    const root = document.documentElement
    if (regionHue) {
      root.style.setProperty('--tome-region-hue', regionHue)
      root.style.setProperty('--tome-region-glow', `${regionHue}2e`)
      root.style.setProperty('--tome-region-mid', `${regionHue}14`)
    } else {
      root.style.setProperty('--tome-region-hue', '#c9a35a')
      root.style.setProperty('--tome-region-glow', 'rgba(201, 163, 90, 0.18)')
      root.style.setProperty('--tome-region-mid', 'rgba(201, 163, 90, 0.08)')
    }
  }, [regionHue])

  if (layoutMode === 'landscape') {
    return <LandscapeShell>{children}</LandscapeShell>
  }
  return <PortraitShell>{children}</PortraitShell>
}
