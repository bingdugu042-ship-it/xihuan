import { motion } from 'framer-motion'
import { MapPin, Flame, Droplets, Eye, Users, Sparkles } from 'lucide-react'
import { FACILITY_MAP, THEME_ZONES, type FacilityDef } from '@/data/facilities'

interface SceneCardProps {
  regionId?: string | null
}

const VIBE_TAGS: Record<string, { label: string; icon: typeof Flame; color: string }[]> = {
  exhibition: [
    { label: '观赏', icon: Eye, color: '#c9b8a8' },
    { label: '展示', icon: Sparkles, color: '#c9b8a8' },
  ],
  domination: [
    { label: '支配', icon: Flame, color: '#c44d6e' },
    { label: '调教', icon: Users, color: '#c44d6e' },
  ],
  sensory: [
    { label: '感官', icon: Droplets, color: '#3d9ec4' },
    { label: '沉浸', icon: Sparkles, color: '#3d9ec4' },
  ],
  social: [
    { label: '随机', icon: Users, color: '#b06ce8' },
    { label: '互动', icon: Flame, color: '#b06ce8' },
  ],
}

function getVibeForFacility(f: FacilityDef) {
  return VIBE_TAGS[f.zone] ?? VIBE_TAGS.social
}

export function SceneCard({ regionId }: SceneCardProps) {
  const facility = regionId ? FACILITY_MAP[regionId] : null
  const zone = facility ? THEME_ZONES.find((z) => z.id === facility.zone) : null

  if (!facility || !zone) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="game-card relative overflow-hidden p-4"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'var(--c-primary-soft)' }}
          >
            <MapPin size={22} style={{ color: 'var(--c-primary)' }} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
              尚未选择场景
            </h3>
            <p className="text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
              在下方导览选择冒险域，揭开你的篇章
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  const vibes = getVibeForFacility(facility)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="game-card relative overflow-hidden"
      style={{
        borderColor: zone.color,
        boxShadow: `0 4px 24px ${zone.glow}`,
      }}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(ellipse at 80% 0%, ${zone.glow} 0%, transparent 60%)`,
        }}
      />

      <div className="relative p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: zone.color + '22', color: zone.color }}
            >
              #{String(facility.no).padStart(2, '0')}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
              {zone.name}
            </span>
          </div>
          <div className="flex gap-1.5">
            {vibes.map((v) => {
              const Icon = v.icon
              return (
                <span
                  key={v.label}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]"
                  style={{ background: v.color + '1a', color: v.color }}
                >
                  <Icon size={10} />
                  {v.label}
                </span>
              )
            })}
          </div>
        </div>

        <h3
          className="mb-1 text-xl font-medium"
          style={{ fontFamily: 'var(--font-dialogue)', color: 'var(--c-text)' }}
        >
          {facility.name}
        </h3>
        <p className="mb-3 text-[12px]" style={{ color: 'var(--c-text-dim)' }}>
          {facility.tagline}
        </p>

        <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--c-text-muted)' }}>
          <MapPin size={12} />
          <span>NPC 类型：{facility.npcArchetype}</span>
        </div>
      </div>
    </motion.div>
  )
}
