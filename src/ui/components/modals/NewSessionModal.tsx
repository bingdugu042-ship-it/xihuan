import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useDataStore } from '@/store/dataStore'
import { useSessionStore } from '@/store/sessionStore'
import { openFacilityEntry, isAdventureRegion } from '@/utils/facilityEntry'
import { resolveCharacterPortrait, normalizeAssetPath, characterPlaceholder } from '@/utils/image'

export function NewSessionModal() {
  const open = useUIStore((s) => s.newSessionModalOpen)
  const setOpen = useUIStore((s) => s.setNewSessionModalOpen)
  const presetRegionId = useUIStore((s) => s.presetRegionId)
  const setPresetRegionId = useUIStore((s) => s.setPresetRegionId)
  const { regions, characters } = useDataStore()
  const createSession = useSessionStore((s) => s.createSession)

  const regionList = Object.values(regions)
  const [regionId, setRegionId] = useState<string>('')
  const [participantIds, setParticipantIds] = useState<string[]>([])
  const [title, setTitle] = useState('')

  // 打开时若有预设地区，自动选中并预填该地区的默认参与角色
  useEffect(() => {
    if (!open) return
    if (presetRegionId && regions[presetRegionId]) {
      setRegionId(presetRegionId)
      setParticipantIds(regions[presetRegionId].defaultParticipants)
      setPresetRegionId(null)
    }
  }, [open, presetRegionId, regions, setPresetRegionId])

  // 数据异步加载，regionId 可能初始为空或失效，这里派生一个有效默认值
  const effectiveRegionId =
    regionId && regions[regionId] ? regionId : regionList[0]?.id ?? ''
  const region = regions[effectiveRegionId]
  const isGroup = region?.type === 'group'

  const toggleParticipant = (id: string) => {
    setParticipantIds((prev) => {
      if (isGroup) {
        return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      }
      // 私聊单选
      return prev[0] === id ? [] : [id]
    })
  }

  const canCreate = !!region && participantIds.length >= (isGroup ? 2 : 1)

  const handleCreate = async () => {
    if (!region) return
    if (isAdventureRegion(region.id)) {
      setOpen(false)
      setParticipantIds([])
      setTitle('')
      openFacilityEntry(region.id)
      return
    }
    if (!canCreate) return
    const finalParticipants =
      participantIds.length > 0 ? participantIds : region.defaultParticipants
    const firstChar = characters[finalParticipants[0]]
    await createSession({
      regionId: region.id,
      participantIds: finalParticipants,
      type: isGroup ? 'group' : 'private',
      title: title.trim() || (isGroup ? `${region.name}` : `与${firstChar?.name}的对话`),
      withIntro: true,
    })
    setOpen(false)
    setParticipantIds([])
    setTitle('')
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          />
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="glass relative z-10 flex max-h-[88%] w-full max-w-[440px] flex-col rounded-t-2xl sm:rounded-2xl"
            style={{ border: '1px solid var(--c-border)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--c-border)' }}
            >
              <h2 className="text-base font-medium" style={{ color: 'var(--c-text)' }}>
                新建对话
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 hover:bg-[var(--c-primary-soft)]"
                style={{ color: 'var(--c-text-dim)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-3">
              {/* 地区选择 */}
              <label className="text-xs" style={{ color: 'var(--c-text-dim)' }}>
                地区 / 场景
              </label>
              <div className="mt-2 flex flex-col gap-2">
                {regionList.map((r) => {
                  const active = r.id === effectiveRegionId
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setRegionId(r.id)
                        setParticipantIds([])
                      }}
                      className="rounded-xl p-3 text-left transition-colors"
                      style={{
                        border: `1px solid ${active ? 'var(--c-primary)' : 'var(--c-border)'}`,
                        background: active ? 'var(--c-primary-soft)' : 'transparent',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'var(--c-text)' }}>
                          {r.name}
                        </span>
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px]"
                          style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
                        >
                          {r.type === 'group' ? '群聊' : '私聊'}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
                        {r.premise}
                      </p>
                    </button>
                  )
                })}
              </div>

              {/* 角色选择 */}
              <label className="mt-4 block text-xs" style={{ color: 'var(--c-text-dim)' }}>
                {isGroup ? `选择角色（可多选，当前 ${participantIds.length}）` : '选择角色'}
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {Object.values(characters).map((c) => {
                  const active = participantIds.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleParticipant(c.id)}
                      className="flex items-center gap-2 rounded-xl p-2 text-left transition-colors"
                      style={{
                        border: `1px solid ${active ? 'var(--c-primary)' : 'var(--c-border)'}`,
                        background: active ? 'var(--c-primary-soft)' : 'transparent',
                      }}
                    >
                      <img
                        src={resolveCharacterPortrait(c)}
                        alt={c.name}
                        className="h-9 w-9 rounded-lg object-cover"
                        onError={(e) => {
                          const t = e.currentTarget
                          const avatar = normalizeAssetPath(c.avatar)
                          if (!t.dataset.fallback && avatar && t.src !== avatar) {
                            t.dataset.fallback = '1'
                            t.src = avatar
                            return
                          }
                          if (!t.dataset.placeholder) {
                            t.dataset.placeholder = '1'
                            t.src = characterPlaceholder(c.name, c.id)
                          }
                        }}
                      />
                      <span className="min-w-0 flex-1 truncate text-xs" style={{ color: 'var(--c-text)' }}>
                        {c.name}
                      </span>
                      {active && <Check size={14} style={{ color: 'var(--c-primary)' }} />}
                    </button>
                  )
                })}
              </div>

              {/* 标题 */}
              <label className="mt-4 block text-xs" style={{ color: 'var(--c-text-dim)' }}>
                对话标题（可选）
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="留空将自动生成"
                className="mt-2 w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{
                  background: 'var(--c-bg-soft)',
                  color: 'var(--c-text)',
                  border: '1px solid var(--c-border)',
                }}
              />
            </div>

            <div className="p-3" style={{ borderTop: '1px solid var(--c-border)' }}>
              <button
                onClick={handleCreate}
                disabled={!canCreate}
                className="w-full rounded-xl py-2.5 text-sm transition-opacity disabled:opacity-40"
                style={{ background: 'var(--c-primary)', color: '#fff' }}
              >
                开始对话
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
