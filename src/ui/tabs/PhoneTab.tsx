import { useRef } from 'react'
import {
  MapPinned,
  Activity,
  Stamp,
  Heart,
  Music,
  ShoppingBag,
  ImagePlus,
  BookOpen,
  Settings,
  ChevronRight,
  Eye,
  MessagesSquare,
  Flame,
  TreePine,
  UserPlus,
  Lock,
  StickyNote,
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import type { PhoneApp } from '@/store/uiStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useProfileStore } from '@/store/profileStore'
import { usePassportStore } from '@/store/passportStore'
import { MusicApp } from '@/ui/phone/MusicApp'
import { RelationshipApp } from '@/ui/phone/RelationshipApp'
import { ShopApp } from '@/ui/phone/ShopApp'
import { ProfileApp } from '@/ui/phone/ProfileApp'
import { MemoryApp } from '@/ui/phone/MemoryApp'
import { DiaryApp } from '@/ui/phone/DiaryApp'
import { MonitorApp } from '@/ui/phone/MonitorApp'
import { AlbumApp } from '@/ui/phone/AlbumApp'
import { RosterApp } from '@/ui/phone/RosterApp'
import { BodyStatsApp } from '@/ui/phone/BodyStatsApp'
import { ForumApp } from '@/ui/phone/ForumApp'
import { BrandApp } from '@/ui/phone/BrandApp'
import { HomebaseApp } from '@/ui/phone/HomebaseApp'
import { RecruitApp } from '@/ui/phone/RecruitApp'
import { PrefsApp } from '@/ui/phone/PrefsApp'
import { PassportTab } from '@/ui/tabs/PassportTab'

type AppId = PhoneApp | 'passport_page'

interface AppDef {
  id: AppId
  icon: typeof MapPinned
  label: string
  sub: string
  color: string
  bg: string
  tab?: 'passport' | 'phone'
  phoneApp?: PhoneApp
  featured?: boolean
  /** 未来 App 解锁门槛：0 表示无需解锁 */
  requiredStamps?: number
}

const CORE_APPS: AppDef[] = [
  {
    id: 'roster',
    icon: MapPinned,
    label: '冒险导航',
    sub: '地图/域界',
    color: '#2a9ec4',
    bg: 'rgba(42, 158, 196, 0.12)',
    tab: 'phone',
    phoneApp: 'roster',
  },
  {
    id: 'body',
    icon: Activity,
    label: '身体档案',
    sub: '敏感度/状态',
    color: '#ff7e8a',
    bg: 'rgba(255, 126, 138, 0.18)',
    tab: 'phone',
    phoneApp: 'body',
    featured: true,
  },
  {
    id: 'passport_page',
    icon: Stamp,
    label: '旅者图鉴',
    sub: '契约/成就',
    color: '#f5b85c',
    bg: 'rgba(245, 184, 92, 0.12)',
    tab: 'passport',
  },
  {
    id: 'relationship',
    icon: Heart,
    label: '男主',
    sub: '关系/名册',
    color: '#e06c88',
    bg: 'rgba(224, 108, 136, 0.12)',
    tab: 'phone',
    phoneApp: 'relationship',
  },
  {
    id: 'prefs',
    icon: StickyNote,
    label: '偏好贴纸',
    sub: '喜欢/避雷',
    color: '#2a9ec4',
    bg: 'rgba(42, 158, 196, 0.14)',
    tab: 'phone',
    phoneApp: 'prefs',
  },
]

const MORE_APPS: AppDef[] = [
  { id: 'memory', icon: BookOpen, label: '远征日记', sub: '记忆', color: '#8b7fd4', bg: 'rgba(139, 127, 212, 0.12)', tab: 'phone', phoneApp: 'memory' },
  { id: 'brand', icon: Flame, label: '烙印系统', sub: '绑定/召唤', color: '#ff5c8a', bg: 'rgba(255, 92, 138, 0.12)', tab: 'phone', phoneApp: 'brand' },
  { id: 'album', icon: ImagePlus, label: '相册', sub: '回忆', color: '#4ecdc4', bg: 'rgba(78, 205, 196, 0.12)', tab: 'phone', phoneApp: 'album' },
  { id: 'shop', icon: ShoppingBag, label: '契约商会', sub: '礼物/道具', color: '#f5b85c', bg: 'rgba(245, 184, 92, 0.12)', tab: 'phone', phoneApp: 'shop' },
  { id: 'music', icon: Music, label: '氛围音乐', sub: 'BGM', color: '#7bc47b', bg: 'rgba(123, 196, 123, 0.12)', tab: 'phone', phoneApp: 'music' },
  { id: 'profile', icon: Settings, label: '身份设置', sub: '我的', color: '#9b7fd4', bg: 'rgba(155, 127, 212, 0.12)', tab: 'phone', phoneApp: 'profile' },
]

const FUTURE_APPS: AppDef[] = [
  { id: 'monitor', icon: Eye, label: '监控系统', sub: 'NPC互动', color: '#7b68ee', bg: 'rgba(123, 104, 238, 0.12)', tab: 'phone', phoneApp: 'monitor', requiredStamps: 3 },
  { id: 'forum', icon: MessagesSquare, label: '旅商酒馆板', sub: '帖子/讨论', color: '#4ecdc4', bg: 'rgba(78, 205, 196, 0.12)', tab: 'phone', phoneApp: 'forum', requiredStamps: 5 },
  { id: 'homebase', icon: TreePine, label: '家园', sub: '世界树', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', tab: 'phone', phoneApp: 'homebase', requiredStamps: 7 },
  { id: 'recruit', icon: UserPlus, label: '招聘系统', sub: '自定义 NPC', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', tab: 'phone', phoneApp: 'recruit', requiredStamps: 8 },
]


export function PhoneTab() {
  const phoneApp = useUIStore((s) => s.phoneApp)
  const setPhoneApp = useUIStore((s) => s.setPhoneApp)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const { settings, updateUI } = useSettingsStore()
  const { profiles } = useProfileStore()
  const activeProfile = profiles.find((p) => p.id === settings.ui.activeProfileId)
  const stampCount = usePassportStore((s) => s.stampCount)
  const bgRef = useRef<HTMLInputElement>(null)

  if (phoneApp === 'passport') {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PassportTab />
      </div>
    )
  }

  if (phoneApp !== 'home') {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {phoneApp === 'music' && <MusicApp />}
        {phoneApp === 'relationship' && <RelationshipApp />}
        {phoneApp === 'shop' && <ShopApp />}
        {phoneApp === 'profile' && <ProfileApp />}
        {phoneApp === 'memory' && <MemoryApp />}
        {phoneApp === 'diary' && <DiaryApp />}
        {phoneApp === 'monitor' && <MonitorApp />}
        {phoneApp === 'album' && <AlbumApp />}
        {phoneApp === 'roster' && <RosterApp />}
        {phoneApp === 'body' && <BodyStatsApp />}
        {phoneApp === 'forum' && <ForumApp />}
        {phoneApp === 'brand' && <BrandApp />}
        {phoneApp === 'homebase' && <HomebaseApp />}
        {phoneApp === 'recruit' && <RecruitApp />}
        {phoneApp === 'prefs' && <PrefsApp />}
      </div>
    )
  }

  const onBgUpload = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateUI({ phoneBackground: reader.result as string })
    reader.readAsDataURL(file)
  }

  const openApp = (a: AppDef) => {
    if (a.tab === 'passport') {
      setActiveTab('passport')
      return
    }
    setPhoneApp(a.id as PhoneApp)
  }

  const AppGrid = ({ apps }: { apps: AppDef[] }) => {
    const stampCount = usePassportStore((s) => s.stampCount)
    return (
      <div className="grid grid-cols-4 gap-3">
        {apps.map((a) => {
          const Icon = a.icon
          const req = a.requiredStamps ?? 0
          const locked = req > 0 && stampCount() < req
          return (
            <button
              key={a.id}
              onClick={() => openApp(a)}
              className="press-scale flex flex-col items-center gap-2"
            >
              <div
                className={`relative flex h-[54px] w-[54px] items-center justify-center rounded-2xl transition-transform ${a.featured ? 'ring-2 ring-offset-2' : ''}`}
                style={{
                  background: a.bg,
                  ...(a.featured
                    ? { boxShadow: `0 0 0 2px ${a.color}55`, ringColor: a.color }
                    : {}),
                }}
              >
                <Icon size={24} style={{ color: a.color, opacity: locked ? 0.6 : 1 }} />
                {locked && (
                  <div
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full"
                    style={{ background: 'var(--c-text-dim)' }}
                  >
                    <Lock size={10} color="#fff" />
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-[10px] font-medium" style={{ color: 'var(--c-text)' }}>
                  {a.label}
                </p>
                <p className="text-[9px]" style={{ color: 'var(--c-text-muted)' }}>
                  {locked ? `需${req}枚印章` : a.sub}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className="phone-desktop relative flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6"
      style={{
        backgroundImage: settings.ui.phoneBackground
          ? `linear-gradient(180deg, rgba(240,248,251,0.75) 0%, rgba(240,248,251,0.92) 100%), url(${settings.ui.phoneBackground})`
          : 'linear-gradient(180deg, #f0f8fb 0%, #e8f6fc 100%)',
      }}
    >
      {/* 状态栏 */}
      <div className="mb-6 flex items-center justify-between text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
        <span>{new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="flex items-center gap-1 font-medium" style={{ color: 'var(--c-primary)' }}>
          <MapPinned size={12} /> 旅商终端
        </span>
        <button
          onClick={() => bgRef.current?.click()}
          className="flex items-center gap-1 rounded-full px-2 py-0.5 glass-card"
          style={{ fontSize: 10 }}
        >
          <ImagePlus size={12} /> 壁纸
        </button>
        <input ref={bgRef} type="file" accept="image/*" className="hidden" onChange={(e) => onBgUpload(e.target.files?.[0])} />
      </div>

      {/* 用户卡片 */}
      <button
        onClick={() => setPhoneApp('profile')}
        className="game-card press-scale mb-6 flex w-full items-center gap-3 p-3 text-left"
      >
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
          style={{ border: '2px solid var(--c-primary)' }}
        >
          {activeProfile?.avatar ? (
            <img src={activeProfile.avatar} className="h-full w-full object-cover" alt="" />
          ) : (
            <span className="text-xl font-medium" style={{ color: 'var(--c-primary)' }}>
              {activeProfile?.name?.slice(0, 1) ?? '游'}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" style={{ color: 'var(--c-text)' }}>
            {activeProfile?.name ?? '旅者登记'}
          </p>
          <p className="truncate text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
            {activeProfile ? '点击查看 / 编辑身份' : '设置你的旅者身份'}
          </p>
        </div>
        <ChevronRight size={18} style={{ color: 'var(--c-text-muted)' }} />
      </button>

      {/* 快速数据面板 */}
      <div className="mb-6 grid grid-cols-3 gap-2">
        <div className="game-card flex flex-col items-center p-2.5">
          <span className="text-[10px]" style={{ color: 'var(--c-text-muted)' }}>已契约</span>
          <span className="text-lg font-medium" style={{ color: 'var(--c-gold)' }}>{stampCount()}</span>
        </div>
        <div className="game-card flex flex-col items-center p-2.5">
          <span className="text-[10px]" style={{ color: 'var(--c-text-muted)' }}>星币</span>
          <span className="text-lg font-medium" style={{ color: 'var(--c-primary)' }}>{activeProfile?.coins ?? '—'}</span>
        </div>
        <div className="game-card flex flex-col items-center p-2.5">
          <span className="text-[10px]" style={{ color: 'var(--c-text-muted)' }}>男主</span>
          <span className="text-lg font-medium" style={{ color: 'var(--c-accent)' }}>—</span>
        </div>
      </div>

      {/* 核心应用 */}
      <div className="mb-5">
        <p className="mb-3 text-[11px] font-medium" style={{ color: 'var(--c-text)' }}>
          核心服务
        </p>
        <AppGrid apps={CORE_APPS} />
      </div>

      {/* 更多应用 */}
      <div className="mb-5">
        <p className="mb-3 text-[11px] font-medium" style={{ color: 'var(--c-text)' }}>
          更多功能
        </p>
        <AppGrid apps={MORE_APPS} />
      </div>

      {/* 未来 App 框架 */}
      <div>
        <p className="mb-3 text-[11px] font-medium" style={{ color: 'var(--c-text)' }}>
          未来服务
        </p>
        <AppGrid apps={FUTURE_APPS} />
      </div>
    </div>
  )
}
