import { useState } from 'react'
import { Map, Sparkles, Scroll } from 'lucide-react'
import { FACILITIES } from '@/data/facilities'
import { useSessionStore } from '@/store/sessionStore'
import { useDataStore } from '@/store/dataStore'
import { usePassportStore } from '@/store/passportStore'
import { ScrollMap } from './ScrollMap'

/** 远征入口 · 卷起的西大陆藏宝图 */
export function ParkHandbook() {
  const stampCount = usePassportStore((s) => s.stampCount)
  const [isOpen, setIsOpen] = useState(false)
  const regions = useDataStore((s) => s.regions)
  const activeSession = useSessionStore((s) => s.activeSession)

  const worldId = activeSession?.regionId ? regions[activeSession.regionId]?.worldId : undefined
  // 规则书逻辑：`aetherion` 与 `azeria` 在遭遇/AI 监管中同属一套艾泽利亚世界。
  const isAzeria = worldId === 'azeria' || worldId === 'aetherion'

  const brand = isAzeria ? 'AZERIA' : 'AETHERION'
  const title = isAzeria ? '艾泽利亚大陆' : '西大陆藏宝图'
  const subtitle = isAzeria ? '点开立绘城邦 · 展开八域冒险' : '展开卷轴，寻觅下一段羁绊'

  if (isOpen) {
    return <ScrollMap />
  }

  return (
    <div className="scroll-cover">
      <button type="button" className="scroll-cover__roll" onClick={() => setIsOpen(true)}>
        <div className="scroll-cover__rod scroll-cover__rod--top" aria-hidden />
        <div className="scroll-cover__sheet">
          <div className="scroll-cover__wax">
            <Sparkles size={14} />
          </div>
          <p className="scroll-cover__brand">{brand}</p>
          <h1 className="scroll-cover__title">
            <Map size={28} className="inline" /> {title}
          </h1>
          <p className="scroll-cover__subtitle">{subtitle}</p>
          <div className="scroll-cover__seal">
            <Scroll size={16} />
            <span>已契约 {stampCount()} / {FACILITIES.length} 处域界</span>
          </div>
          <p className="scroll-cover__hint">轻触展开卷轴</p>
        </div>
        <div className="scroll-cover__rod scroll-cover__rod--bottom" aria-hidden />
      </button>
    </div>
  )
}
