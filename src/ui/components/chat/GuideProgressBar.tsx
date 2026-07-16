import { Stamp } from 'lucide-react'
import { buildFacilityGuideTrack, GUIDE_TURNS_PER_STAGE } from '@/data/facilityGuideTracks'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { usePassportStore } from '@/store/passportStore'

/** 硬指引 / 叙事台剧情阶段进度条 */
export function GuideProgressBar() {
  const activeSession = useSessionStore((s) => s.activeSession)
  const immersionMode = useUIStore((s) => s.immersionMode)
  const setStampOffer = useUIStore((s) => s.setStampOfferModalOpen)
  const hasStamp = usePassportStore((s) => s.hasStamp)

  if (!activeSession) return null
  const guided = (activeSession.exploreStyle ?? 'free') === 'guided'
  const showTrack = immersionMode === 'narrative' || guided
  if (!showTrack) return null

  const track = buildFacilityGuideTrack(activeSession.regionId, activeSession.playMode)
  if (track.length < 2) return null

  const idx = Math.max(0, Math.min(activeSession.guideStageIndex ?? 0, track.length - 1))
  const stage = track[idx]
  const turns = activeSession.guideTurnsInStage ?? 0
  const pct = Math.round(((idx + Math.min(1, turns / GUIDE_TURNS_PER_STAGE) * 0.85) / track.length) * 100)
  const nearSeal = idx >= track.length - 2 || Boolean(stage?.isSeal)
  const stamped = hasStamp(activeSession.regionId)

  return (
    <div className="guide-progress cockpit-guide">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-[10px] cockpit-guide__text">
          {guided ? '硬指引' : '剧情轨'} · {idx + 1}/{track.length}「{stage.title}」
          <span className="opacity-70"> · 本阶段 {turns}/{GUIDE_TURNS_PER_STAGE}</span>
        </p>
        {(nearSeal || activeSession.stampPrompted) && !stamped && (
          <button
            type="button"
            onClick={() => setStampOffer(true)}
            className="flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-medium"
            style={{ background: 'var(--c-gold-soft)', color: 'var(--c-gold)' }}
          >
            <Stamp size={10} /> 申请契约
          </button>
        )}
        {stamped && (
          <span className="shrink-0 text-[9px]" style={{ color: 'var(--c-mint)' }}>
            已契约
          </span>
        )}
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full"
        style={{ background: 'rgba(31,122,148,0.15)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(6, Math.min(100, pct))}%`,
            background: 'linear-gradient(90deg, var(--c-primary), var(--c-accent))',
          }}
        />
      </div>
      <p className="mt-1 truncate text-[9px]" style={{ color: 'var(--immerse-ink-dim, var(--c-text-dim))' }}>
        {stage.hint}
      </p>
    </div>
  )
}
