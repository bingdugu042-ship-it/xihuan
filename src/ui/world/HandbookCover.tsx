import { Crown, Star, Sparkles } from 'lucide-react'

interface HandbookCoverProps {
  stampCount: number
  total: number
  onOpen: () => void
}

/** 远征手册封面 · 暗金西幻 */
export function HandbookCover({ stampCount, total, onOpen }: HandbookCoverProps) {
  return (
    <button
      type="button"
      className="handbook-cover"
      onClick={onOpen}
      aria-label="翻开远征手册"
      style={{
        background: 'linear-gradient(160deg, #1c121f 0%, #2a1830 45%, #120c16 100%)',
        color: '#f5e6d3',
      }}
    >
      <div className="handbook-cover__texture" aria-hidden />
      <div className="handbook-cover__decor">
        <Crown className="handbook-cover__wave" size={64} strokeWidth={1} />
        <Star className="handbook-cover__star handbook-cover__star--1" size={22} fill="currentColor" />
        <Star className="handbook-cover__star handbook-cover__star--2" size={14} fill="currentColor" />
        <Sparkles className="handbook-cover__sparkle" size={20} />
      </div>

      <span className="handbook-cover__badge">FALLEN GOD</span>
      <p className="handbook-cover__brand">AETHERION</p>
      <h1 className="handbook-cover__title">西幻万人迷</h1>
      <h2 className="handbook-cover__subtitle">远征手册</h2>

      <div className="handbook-cover__stamp">
        <span className="handbook-cover__stamp-icon">✦</span>
        <span>域印 {stampCount}/{total}</span>
      </div>

      <p className="handbook-cover__hint">轻触翻开大陆</p>
    </button>
  )
}
