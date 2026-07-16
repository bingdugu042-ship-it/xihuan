import { motion } from 'framer-motion'
import { Map, Sparkles, ScrollText, Wine, BookOpen, Settings } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import type { MainTab } from '@/store/uiStore'

const TABS: { id: MainTab; label: string; icon: typeof Map }[] = [
  { id: 'adventure', label: '冒险', icon: Map },
  { id: 'chat', label: '沉浸', icon: Sparkles },
  { id: 'rulebook', label: '规则书', icon: ScrollText },
  { id: 'tavern', label: '酒馆', icon: Wine },
  { id: 'atlas', label: '图鉴', icon: BookOpen },
  { id: 'settings', label: '设置', icon: Settings },
]

export function TomeNav() {
  const activeTab = useUIStore((s) => s.activeTab)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const setPhoneApp = useUIStore((s) => s.setPhoneApp)

  const go = (tab: MainTab) => {
    setActiveTab(tab)
    if (tab !== 'phone' && tab !== 'home' && tab !== 'party') setPhoneApp('home')
  }

  const resolved =
    activeTab === 'world'
      ? 'adventure'
      : activeTab === 'passport'
        ? 'atlas'
        : activeTab === 'phone' || activeTab === 'party' || activeTab === 'home'
          ? 'tavern'
          : activeTab

  return (
    <nav className="tome-nav">
      <div className="tome-nav__track">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = resolved === t.id
          return (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              className={`tome-nav__item ${active ? 'tome-nav__item--active' : ''}`}
              aria-label={t.label}
            >
              {active && (
                <motion.div
                  layoutId="tome-nav-pill"
                  className="tome-nav__pill"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="tome-nav__icon">
                <Icon size={20} />
              </span>
              <span className="tome-nav__label">{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
