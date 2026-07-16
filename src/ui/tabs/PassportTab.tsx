import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Stamp, Star, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { FACILITIES, STAMP_UNLOCK_TIERS } from '@/data/facilities'
import { facilityAssetPath } from '@/data/facilityHandbook'
import { usePassportStore } from '@/store/passportStore'
import { useProfileStore } from '@/store/profileStore'
import { useSettingsStore } from '@/store/settingsStore'

function placeholderImg(name: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#e4f3f8'
  ctx.fillRect(0, 0, 64, 64)
  ctx.fillStyle = '#2a9ec4'
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name.slice(0, 1), 32, 32)
  return canvas.toDataURL()
}

function formatDate(ts?: number) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('zh-CN')
}

const STAMPS_PER_PAGE = 9

export function PassportTab() {
  const { stamps, loaded, load, stampCount, hasStamp } = usePassportStore()
  const { profiles } = useProfileStore()
  const { settings } = useSettingsStore()
  const profile = profiles.find((p) => p.id === settings.ui.activeProfileId)
  const count = stampCount()
  const total = FACILITIES.length
  const complete = count >= total
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null)

  useEffect(() => {
    if (!loaded) void load()
  }, [loaded, load])

  const stampPages = Math.ceil(FACILITIES.length / STAMPS_PER_PAGE)
  const selectedStamp = selectedFacilityId ? stamps[selectedFacilityId] : null
  const selectedFacility = selectedFacilityId ? FACILITIES.find((f) => f.id === selectedFacilityId) : null

  if (!open) {
    return (
      <div className="no-scrollbar flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8">
        <motion.div
          className="passport-cover"
          style={{
            background: complete
              ? 'linear-gradient(135deg, #f5b85c 0%, #d4af37 50%, #b8960c 100%)'
              : 'linear-gradient(135deg, #2a9ec4 0%, #1a7a9a 50%, #0e5e78 100%)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setOpen(true)}
        >
          <div className="passport-cover__texture" />
          {complete ? (
            <Star size={48} className="passport-cover__icon" />
          ) : (
            <div className="passport-cover__star-ring">
              <Star size={32} />
            </div>
          )}
          <h2 className="passport-cover__title">集印章本</h2>
          <p className="passport-cover__subtitle">{complete ? 'COMPLETE' : 'STAMP COLLECTION'}</p>
          <div className="passport-cover__count">
            <span>{count}</span>
            <span>/ {total}</span>
          </div>
          <div className="passport-cover__hint">轻触打开</div>
          {complete && <div className="passport-cover__badge">⭐ 集章完成</div>}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="no-scrollbar passport-open flex flex-1 flex-col overflow-y-auto px-4 py-4">
      {/* 顶部：资料 / 回忆 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="passport-memory"
      >
        {selectedFacilityId && selectedFacility ? (
          <div className="passport-memory__content">
            <button
              type="button"
              className="passport-memory__back"
              onClick={() => setSelectedFacilityId(null)}
            >
              ← 返回旅者资料
            </button>
            <div className="passport-memory__header">
              <div className="passport-memory__stamp">
                {hasStamp(selectedFacility.id) ? selectedFacility.stampName : '?'}
              </div>
              <div>
                <h3 className="passport-memory__name">{selectedFacility.name}</h3>
                <p className="passport-memory__date">
                  {selectedStamp ? formatDate(selectedStamp.obtainedAt) : '尚未契约'}
                </p>
              </div>
            </div>
            {selectedStamp?.memoryImage || facilityAssetPath(selectedFacility.id, 'scene') ? (
              <div className="passport-memory__image">
                <img
                  src={selectedStamp?.memoryImage || facilityAssetPath(selectedFacility.id, 'scene')}
                  alt=""
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>
            ) : (
              <div className="passport-memory__image passport-memory__image--empty">暂无留影</div>
            )}
            <p className="passport-memory__text">
              {selectedStamp?.memoryText || selectedFacility.scene || '暂无回忆记录'}
            </p>
          </div>
        ) : (
          <div className="passport-memory__content">
            <div className="passport-memory__header">
              <div className="passport-memory__avatar">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="" />
                ) : (
                  <img src={placeholderImg(profile?.name ?? '旅者')} alt="" />
                )}
              </div>
              <div>
                <h3 className="passport-memory__name">{profile?.name || '旅者'}</h3>
                <p className="passport-memory__date">{formatDate(profile?.createdAt)} 入域</p>
              </div>
            </div>
            <div className="passport-memory__stats">
              <div className="passport-memory__stat">
                <span className="passport-memory__stat-value" style={{ color: complete ? '#c98a20' : 'var(--c-primary)' }}>
                  {count}
                </span>
                <span className="passport-memory__stat-label">已收集</span>
              </div>
              <div className="passport-memory__stat">
                <span className="passport-memory__stat-value">{Math.max(0, total - count)}</span>
                <span className="passport-memory__stat-label">待探索</span>
              </div>
              <div className="passport-memory__stat">
                <span className="passport-memory__stat-value" style={{ color: '#8b5cf6' }}>
                  旅者
                </span>
                <span className="passport-memory__stat-label">身份</span>
              </div>
            </div>
            <p className="passport-memory__text">
              欢迎来到艾尔茜利恩。每完成一个冒险域的完整体验，你都会获得一枚专属契约章。集齐全部 {total} 枚，记录你的旅途。
            </p>
          </div>
        )}
      </motion.div>

      {/* 中部：翻页与印章 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="passport-stamps"
      >
        <div className="passport-stamps__header">
          <span className="passport-stamps__title">
            <Stamp size={14} /> 印章收集
          </span>
          <div className="passport-stamps__pager">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft size={16} />
            </button>
            <span>{page + 1} / {stampPages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(stampPages - 1, p + 1))}
              disabled={page === stampPages - 1}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="passport-stamps__grid"
          >
            {FACILITIES.slice(page * STAMPS_PER_PAGE, (page + 1) * STAMPS_PER_PAGE).map((f) => {
              const got = hasStamp(f.id)
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFacilityId(f.id)}
                  className="passport-stamp-btn"
                  style={{
                    background: got ? 'rgba(245,184,92,0.12)' : 'rgba(255,255,255,0.6)',
                    border: `2px ${got ? 'solid' : 'dashed'} ${got ? 'rgba(245,184,92,0.5)' : 'rgba(139,119,89,0.25)'}`,
                    outline: selectedFacilityId === f.id ? '2px solid var(--c-primary)' : 'none',
                  }}
                >
                  <div
                    className="passport-stamp-btn__circle"
                    style={{
                      background: got ? 'rgba(245,184,92,0.25)' : 'transparent',
                      border: got ? '1.5px solid rgba(245,184,92,0.6)' : '1.5px dashed rgba(139,119,89,0.25)',
                    }}
                  >
                    {got ? (
                      <span style={{ color: '#c98a20' }}>{f.stampName.slice(0, 1)}</span>
                    ) : (
                      <span style={{ color: '#c9b280' }}>?</span>
                    )}
                  </div>
                  <span className="passport-stamp-btn__name">{f.name}</span>
                  {stamps[f.id] && (
                    <span className="passport-stamp-btn__date">{formatDate(stamps[f.id].obtainedAt)}</span>
                  )}
                </button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* 底部：集邮奖励 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="passport-rewards"
      >
        <h3 className="passport-rewards__title">
          <MapPin size={12} /> 集邮奖励
        </h3>
        <div className="passport-rewards__list">
          {STAMP_UNLOCK_TIERS.map((t) => (
            <div
              key={t.count}
              className="passport-reward"
              style={{
                background: count >= t.count ? 'rgba(245,184,92,0.15)' : 'var(--c-bg-soft)',
                border: `1px solid ${count >= t.count ? 'rgba(245,184,92,0.5)' : 'var(--c-border)'}`,
                opacity: count >= t.count ? 1 : 0.6,
              }}
            >
              <p className="passport-reward__count" style={{ color: count >= t.count ? '#c98a20' : 'var(--c-text-dim)' }}>
                {t.count} 枚
              </p>
              <p className="passport-reward__perk">{t.reward}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 返回封面按钮 */}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="passport-close"
      >
        合上印章本
      </button>
    </div>
  )
}
