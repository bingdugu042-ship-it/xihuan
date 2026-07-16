import { useMemo } from 'react'
import { useSettingsStore } from '@/store/settingsStore'

/** 西欧圣殿氛围：光柱 + 金尘（仅 sanctum 配色） */
export function SanctumAmbient() {
  const palette = useSettingsStore((s) => s.settings.ui.colorPalette ?? 'sanctum')
  const dust = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${4 + ((i * 17) % 92)}%`,
        delay: `${(i * 0.55) % 9}s`,
        duration: `${10 + (i % 7)}s`,
        size: 2 + (i % 3),
      })),
    [],
  )

  if (palette !== 'sanctum') return null

  return (
    <div className="sanctum-ambient" aria-hidden>
      <div className="sanctum-ambient__ray sanctum-ambient__ray--1" />
      <div className="sanctum-ambient__ray sanctum-ambient__ray--2" />
      <div className="sanctum-ambient__ray sanctum-ambient__ray--3" />
      {dust.map((d) => (
        <span
          key={d.id}
          className="sanctum-ambient__dust"
          style={{
            left: d.left,
            width: d.size,
            height: d.size,
            animationDelay: d.delay,
            animationDuration: d.duration,
          }}
        />
      ))}
    </div>
  )
}
