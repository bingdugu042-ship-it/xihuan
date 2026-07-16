import { Menu, Lamp, LampFloor, Eye, MessageCircle, Wifi, WifiOff, Archive, Sparkles } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { useDataStore } from '@/store/dataStore'
import { useSettingsStore } from '@/store/settingsStore'
import { applyAmbiance, type ColorPalette } from '@/theme/ambiance'
import { hasTextApiConfigured } from '@/ai/textClient'

interface HeaderProps {
  currentCharacterId?: string | null
}

export function Header({ currentCharacterId }: HeaderProps) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const setSandOfTimeModalOpen = useUIStore((s) => s.setSandOfTimeModalOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const setSidebarTab = useUIStore((s) => s.setSidebarTab)
  const { activeSession } = useSessionStore()
  const { characters } = useDataStore()
  const { settings, updateUI } = useSettingsStore()
  const mode = settings.ui.characterMode
  const lightOn = settings.ui.lightOn
  const palette = (settings.ui.colorPalette ?? 'sanctum') as ColorPalette
  const apiConfigured = hasTextApiConfigured(settings)
  const apiLinked = apiConfigured && Boolean(settings.ui.apiTextLastStatus?.ok)

  const focused = currentCharacterId ? characters[currentCharacterId] : null

  const setPalette = (next: ColorPalette) => {
    void updateUI({ colorPalette: next })
    applyAmbiance({ colorPalette: next, lightOn })
  }

  const togglePalette = () => {
    setPalette(palette === 'sanctum' ? 'classic' : 'sanctum')
  }

  const toggleLight = () => {
    const next = !lightOn
    void updateUI({ lightOn: next })
    applyAmbiance({ colorPalette: 'classic', lightOn: next })
  }

  const openArchive = () => {
    setSandOfTimeModalOpen(true)
  }

  const openArchivedList = () => {
    setSidebarOpen(true)
    setSidebarTab('archived')
  }

  const isPreview = mode === 'preview'

  return (
    <header
      className={`chat-header relative z-20 flex shrink-0 items-center gap-1.5 px-2.5 ${isPreview ? 'chat-header--preview' : ''}`}
      style={{
        height: 'var(--header-height)',
        background: isPreview
          ? undefined
          : 'linear-gradient(180deg, var(--immerse-chrome-strong), var(--immerse-chrome))',
        backdropFilter: isPreview ? undefined : 'blur(14px)',
        WebkitBackdropFilter: isPreview ? undefined : 'blur(14px)',
        borderBottom: isPreview ? 'none' : '1px solid var(--immerse-chrome-border)',
      }}
    >
      <button
        onClick={toggleSidebar}
        className="press-scale rounded-xl p-2 transition-colors"
        style={{ color: 'var(--immerse-ink)' }}
        aria-label="菜单"
      >
        <Menu size={20} />
      </button>

      {!isPreview && (
        <div className="min-w-0 flex-1">
          {activeSession ? (
            <h1
              className="truncate text-sm font-medium"
              style={{ fontFamily: 'var(--font-dialogue)', color: 'var(--immerse-ink)' }}
            >
              {focused?.name ?? activeSession.dynamicNpc?.displayName ?? activeSession.title}
            </h1>
          ) : (
            <>
              <h1
                className="text-sm font-medium"
                style={{ fontFamily: 'var(--font-dialogue)', color: 'var(--immerse-ink)' }}
              >
                艾泽利亚
              </h1>
              <p className="text-[10px]" style={{ color: 'var(--immerse-ink-dim)' }}>
                选择冒险域，开始你的沉浸体验
              </p>
            </>
          )}
        </div>
      )}

      {isPreview && <div className="flex-1" />}

      {!isPreview && (
        <>
          <button
            type="button"
            onClick={openArchive}
            onContextMenu={(e) => {
              e.preventDefault()
              openArchivedList()
            }}
            className="press-scale flex items-center gap-0.5 rounded-xl px-2 py-1.5"
            title={activeSession ? '史诗存档 · 封存当前对话（右键打开已封存列表）' : '史诗存档 · 查看已封存（右键）'}
            aria-label="史诗存档"
          >
            <Archive size={15} style={{ color: activeSession ? 'var(--c-gold)' : 'var(--c-text-dim)' }} />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="press-scale flex items-center gap-1 rounded-xl px-1.5 py-1.5"
            title={
              apiLinked
                ? `API 已联通 · ${settings.api.text.model || '模型已配置'}`
                : apiConfigured
                  ? 'API 已填密钥，建议在设置里测连'
                  : '未联通 · 点此去设置配置 API'
            }
            aria-label="API 联通状态"
          >
            {apiLinked ? (
              <Wifi size={15} style={{ color: '#3dd68c' }} />
            ) : (
              <WifiOff size={15} style={{ color: apiConfigured ? '#f0c34a' : '#e57373' }} />
            )}
          </button>
        </>
      )}

      {!isPreview && (
        <button
          type="button"
          onClick={togglePalette}
          className="press-scale rounded-xl p-2 transition-colors"
          style={{ color: palette === 'sanctum' ? 'var(--c-gold)' : 'var(--c-primary)' }}
          title={palette === 'sanctum' ? '切换 · 经典夜湾' : '切换 · 圣殿白金'}
          aria-label="切换配色"
        >
          <Sparkles size={18} />
        </button>
      )}

      {!isPreview && palette === 'classic' && (
        <button
          type="button"
          onClick={toggleLight}
          className="press-scale rounded-xl p-2 transition-colors"
          style={{ color: lightOn ? 'var(--c-accent)' : 'var(--c-primary)' }}
          title={lightOn ? '关灯 · 夜港湾' : '开灯 · 浅湾薄雾'}
        >
          {lightOn ? <Lamp size={18} /> : <LampFloor size={18} />}
        </button>
      )}

      <button
        onClick={() => updateUI({ characterMode: mode === 'chat' ? 'preview' : 'chat' })}
        className="press-scale rounded-xl p-2"
        style={{
          color: isPreview ? 'var(--c-accent)' : 'var(--immerse-ink-dim)',
          background: isPreview ? 'var(--c-glass)' : undefined,
        }}
        title={isPreview ? '返回聊天模式' : '预览立绘'}
        aria-label="切换立绘模式"
      >
        {mode === 'chat' ? <Eye size={17} /> : <MessageCircle size={17} />}
      </button>
    </header>
  )
}
