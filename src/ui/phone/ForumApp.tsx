import { PhoneAppShell } from './PhoneAppShell'
import { MessageSquare, Sparkles } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

export function ForumApp() {
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const setTavernSubView = useUIStore((s) => s.setTavernSubView)

  const openGossip = () => {
    setTavernSubView('gossip')
    setActiveTab('tavern')
  }

  return (
    <PhoneAppShell title="旅商酒馆板">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(78,205,196,0.12)' }}
        >
          <MessageSquare size={40} style={{ color: '#4ecdc4' }} />
        </div>
        <h2 className="text-lg font-medium" style={{ color: 'var(--c-text)' }}>
          撰旅奇说
        </h2>
        <p className="text-sm" style={{ color: 'var(--c-text-dim)' }}>
          浏览 NPC 们的酒馆杂谈与求助帖
        </p>
        <button type="button" className="tome-btn tome-btn--accent" onClick={openGossip}>
          <Sparkles size={14} /> 打开酒馆杂谈
        </button>
      </div>
    </PhoneAppShell>
  )
}
