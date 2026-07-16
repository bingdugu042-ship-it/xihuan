import {
  MessageSquare,
  Archive,
  Users,
  MapPin,
  Settings as SettingsIcon,
  Plus,
  X,
  Trash2,
  Clock,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { openFacilityEntry, isAdventureRegion } from '@/utils/facilityEntry'
import { useSessionStore } from '@/store/sessionStore'
import { useDataStore } from '@/store/dataStore'
type Tab = 'sessions' | 'archived' | 'characters' | 'regions' | 'settings'

const TABS: { id: Tab; label: string; icon: typeof MessageSquare }[] = [
  { id: 'sessions', label: '对话', icon: MessageSquare },
  { id: 'archived', label: '史诗存档', icon: Archive },
  { id: 'characters', label: '男主', icon: Users },
  { id: 'regions', label: '地区', icon: MapPin },
  { id: 'settings', label: '设置', icon: SettingsIcon },
]

export function Sidebar() {
  const {
    sidebarOpen,
    sidebarTab,
    setSidebarOpen,
    setSidebarTab,
    setNewSessionModalOpen,
    setActiveTab,
    setPresetRegionId,
  } = useUIStore()
  const { sessions, activeSessionId, switchSession, archiveSession, removeSession } =
    useSessionStore()

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 z-30"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="glass-bar sidebar-drawer absolute left-0 top-0 z-40 flex h-full w-[280px] max-w-[85%] flex-col"
            style={{ borderRight: '1px solid var(--c-glass-border)' }}
          >
            <div
              className="flex items-center justify-between px-4"
              style={{ height: 'var(--header-height)', borderBottom: '1px solid var(--c-glass-border)' }}
            >
              <span
                className="sidebar-drawer__title text-sm font-medium"
                style={{ fontFamily: 'var(--font-dialogue)', color: 'var(--c-text)' }}
              >
                菜单
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 hover:bg-[var(--c-primary-soft)]"
                style={{ color: 'var(--c-text-dim)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab 切换 */}
            <div className="flex gap-1 px-2 py-2">
              {TABS.map((t) => {
                const Icon = t.icon
                const active = sidebarTab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (t.id === 'regions') {
                        setSidebarOpen(false)
                        setActiveTab('world')
                        return
                      }
                      if (t.id === 'settings') {
                        setSidebarOpen(false)
                        setActiveTab('settings')
                        return
                      }
                      setSidebarTab(t.id)
                    }}
                    className={`sidebar-drawer__tab flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] transition-colors${
                      active ? ' is-active' : ''
                    }`}
                    style={{
                      color: active ? 'var(--c-primary)' : 'var(--c-text-dim)',
                      background: active ? 'var(--c-primary-soft)' : 'transparent',
                    }}
                  >
                    <Icon size={16} />
                    {t.label}
                  </button>
                )
              })}
            </div>

            {/* 内容区 */}
            <div className="no-scrollbar flex-1 overflow-y-auto px-2 py-2">
              {(sidebarTab === 'sessions' || sidebarTab === 'archived') && (
                <SessionList
                  sessions={sessions.filter((s) =>
                    sidebarTab === 'sessions' ? s.status === 'active' : s.status === 'archived',
                  )}
                  activeId={activeSessionId}
                  onSelect={(id) => {
                    switchSession(id)
                    setSidebarOpen(false)
                  }}
                  onArchive={archiveSession}
                  onDelete={removeSession}
                  showArchive={sidebarTab === 'sessions'}
                />
              )}

              {sidebarTab === 'characters' && (
                <CharacterList
                  onGoWorld={() => {
                    setSidebarOpen(false)
                    setActiveTab('world')
                  }}
                />
              )}

              {sidebarTab === 'regions' && (
                <RegionList
                  onPick={(regionId) => {
                    if (isAdventureRegion(regionId)) {
                      openFacilityEntry(regionId)
                      setSidebarOpen(false)
                      return
                    }
                    setPresetRegionId(regionId)
                    setNewSessionModalOpen(true)
                    setSidebarOpen(false)
                    setActiveTab('chat')
                  }}
                />
              )}

              {sidebarTab === 'settings' && (
                <button
                  onClick={() => {
                    setSidebarOpen(false)
                    setActiveTab('settings')
                  }}
                  className="glass-card w-full py-3 text-sm"
                  style={{ color: 'var(--c-primary)' }}
                >
                  打开设置页 →
                </button>
              )}
            </div>

            {/* 底部新建 */}
            {sidebarTab === 'sessions' && (
              <div className="p-2" style={{ borderTop: '1px solid var(--c-border)' }}>
                <button
                  onClick={() => {
                    setSidebarOpen(false)
                    setActiveTab('world')
                    useUIStore.getState().showToast('从远征手册选择冒险域')
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm"
                  style={{ background: 'var(--c-primary)', color: '#fff' }}
                >
                  <Plus size={16} /> 新建对话
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function SessionList({
  sessions,
  activeId,
  onSelect,
  onArchive,
  onDelete,
  showArchive,
}: {
  sessions: ReturnType<typeof useSessionStore.getState>['sessions']
  activeId: string | null
  onSelect: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  showArchive: boolean
}) {
  const { characters, regions } = useDataStore()
  if (sessions.length === 0) {
    return (
      <p className="sidebar-drawer__empty mt-6 text-center text-xs" style={{ color: 'var(--c-text-dim)' }}>
        {showArchive ? '还没有对话' : '史诗存档里还没有被封存的时间线'}
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-1.5">
      {sessions.map((s) => {
        const region = regions[s.regionId]
        const firstChar = s.participantIds[0] ? characters[s.participantIds[0]] : null
        const isActive = s.id === activeId
        return (
          <div
            key={s.id}
            className="group flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors"
            style={{
              background: isActive ? 'var(--c-primary-soft)' : 'transparent',
              border: '1px solid transparent',
            }}
          >
            <button onClick={() => onSelect(s.id)} className="min-w-0 flex-1 text-left">
              <p className="sidebar-drawer__item-title truncate text-sm" style={{ color: 'var(--c-text)' }}>
                {s.title}
              </p>
              <p className="sidebar-drawer__item-sub truncate text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
                {region?.name} · {firstChar?.name}
                {s.participantIds.length > 1 ? ` +${s.participantIds.length - 1}` : ''}
              </p>
            </button>
            <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
              {showArchive && (
                <button
                  onClick={() => onArchive(s.id)}
                  className="rounded p-1 hover:bg-[var(--c-primary-soft)]"
                  style={{ color: 'var(--c-text-dim)' }}
                  title="封存（史诗存档）"
                >
                  <Clock size={14} />
                </button>
              )}
              <button
                onClick={() => onDelete(s.id)}
                className="rounded p-1 hover:bg-[var(--c-primary-soft)]"
                style={{ color: 'var(--c-text-dim)' }}
                title="删除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CharacterList({ onGoWorld }: { onGoWorld: () => void }) {
  const { getAllCharacters } = useDataStore()
  const list = Object.values(getAllCharacters())
  if (list.length === 0) {
    return (
      <div className="mt-6 text-center">
        <p className="text-xs" style={{ color: 'var(--c-text-dim)' }}>
          还没有结识男主
        </p>
        <button
          type="button"
          onClick={onGoWorld}
          className="mt-3 rounded-lg px-4 py-2 text-xs"
          style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
        >
          去西大陆地图 →
        </button>
      </div>
    )
  }
  return (
    <div className="no-scrollbar flex max-h-[calc(100vh-220px)] flex-col gap-3 overflow-y-auto pb-4">
      {list.map((c) => (
        <div key={c.id} className="glass-card p-3">
          <p className="text-sm font-medium">{c.name}</p>
          <p className="text-[10px]" style={{ color: 'var(--c-text-dim)' }}>{c.title}</p>
        </div>
      ))}
    </div>
  )
}

function RegionList({ onPick }: { onPick: (regionId: string) => void }) {
  const { regions } = useDataStore()
  const list = Object.values(regions)
  if (list.length === 0) {
    return <p className="mt-6 text-center text-xs" style={{ color: 'var(--c-text-dim)' }}>未加载到地区</p>
  }
  return (
    <div className="flex flex-col gap-2">
      {list.map((r) => (
        <button
          key={r.id}
          onClick={() => onPick(r.id)}
          className="glass-card w-full p-3 text-left transition-transform active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <MapPin size={14} style={{ color: 'var(--c-primary)' }} />
            <p className="text-sm" style={{ color: 'var(--c-text)' }}>
              {r.name}
            </p>
            <span
              className="ml-auto rounded px-1.5 py-0.5 text-[10px]"
              style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
            >
              {r.type === 'group' ? '群聊' : '私聊'}
            </span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
            {r.premise}
          </p>
        </button>
      ))}
    </div>
  )
}
