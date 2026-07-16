import { ScrollText } from 'lucide-react'
import { RulebookReader } from '@/ui/world/RulebookReader'

/** 艾泽利亚规则书 · 全屏高对比只读页 */
export function RulebookTab() {
  return (
    <div className="rulebook-page tome-page no-scrollbar">
      <header className="rulebook-page__header">
        <h1 className="rulebook-page__title">
          <ScrollText size={18} /> 冒险规则书
        </h1>
        <p className="rulebook-page__subtitle">女本位 · D20 判定 · 全章只读</p>
      </header>
      <div className="rulebook-page__content">
        <RulebookReader variant="page" />
      </div>
    </div>
  )
}
