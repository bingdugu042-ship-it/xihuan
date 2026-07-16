import { useMemo } from 'react'
import { MapPin } from 'lucide-react'
import { FACILITY_MAP } from '@/data/facilities'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { useDataStore } from '@/store/dataStore'
import { useCurrentLocationLabel } from '@/hooks/useCurrentLocationLabel'

export function TomeHeader() {
  const activeTab = useUIStore((s) => s.activeTab)
  const regionHue = useUIStore((s) => s.regionHue)
  const location = useCurrentLocationLabel()
  const activeSession = useSessionStore((s) => s.activeSession)
  const replyTarget = useUIStore((s) => s.replyTargetCharacterId)
  const staticChars = useDataStore((s) => s.characters)
  const runtimeChars = useDataStore((s) => s.runtimeCharacters)

  const regionName = useMemo(() => {
    if (activeTab === 'adventure' || activeTab === 'world') return '艾泽利亚'
    const labels: Record<string, string> = {
      chat: '沉浸',
      rulebook: '规则书',
      party: '队伍',
      home: '家园',
      atlas: '图鉴',
      settings: '设置',
      tavern: '酒馆',
    }
    return labels[activeTab] ?? '预言之书'
  }, [activeTab])

  /** 聊天页中心显示焦点角色，避免与驾驶舱地点三重重复 */
  const centerLabel = useMemo(() => {
    if (activeTab !== 'chat' || !activeSession) return location
    const chars = { ...staticChars, ...runtimeChars }
    const focusId = replyTarget ?? activeSession.participantIds[0]
    const focus = focusId ? chars[focusId] : null
    const name =
      activeSession.dynamicNpc?.displayName ?? focus?.name ?? null
    if (name) return name
    return FACILITY_MAP[activeSession.regionId]?.name ?? location
  }, [activeTab, activeSession, location, replyTarget, staticChars, runtimeChars])

  return (
    <header className="tome-header">
      <div className="tome-header__left">
        <span className="tome-header__dot" style={{ background: regionHue ?? '#c9a35a' }} />
        <span className="tome-header__region">{regionName}</span>
      </div>
      <div className="tome-header__center">
        <MapPin size={12} />
        <span>{centerLabel}</span>
      </div>
      <div className="tome-header__right">
        <span className="tome-header__mark">AETHERION</span>
      </div>
    </header>
  )
}
