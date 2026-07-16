import { useState } from 'react'
import { useShopStore } from '@/store/shopStore'
import { useProfileStore } from '@/store/profileStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'
import { SHOP_CATEGORY_LABEL } from '@/data/azeriaShopGear'
import type { ShopItem } from '@/types'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'

const CATEGORIES = ['equipment', 'potion', 'magic', 'scroll', 'souvenir'] as const

export function TavernShopPanel({ onBack }: { onBack: () => void }) {
  const { allItems, inventory, buyItem } = useShopStore()
  const { profiles, spendCoins } = useProfileStore()
  const { settings } = useSettingsStore()
  const showToast = useUIStore((s) => s.showToast)
  const [cat, setCat] = useState<(typeof CATEGORIES)[number] | 'all'>('all')

  const profile = profiles.find((p) => p.id === settings.ui.activeProfileId)
  const items = allItems().filter((i) => cat === 'all' || i.category === cat)
  const invMap = new Map(inventory.map((e) => [e.itemId, e.count]))

  const handleBuy = async (item: ShopItem) => {
    if (!profile) return
    const ok = await buyItem(item, profile.id, (n) => spendCoins(profile.id, n))
    showToast(ok ? '购买成功' : '金币不足', item.name)
  }

  return (
    <TomeSubShell title="酒馆商店" onBack={onBack}>
      <div className="tome-card mb-3 flex justify-between text-sm">
        <span style={{ color: 'var(--c-text-dim)' }}>持有金币</span>
        <span style={{ color: 'var(--c-gold)' }}>{profile?.coins ?? 0} G</span>
      </div>
      <p className="tome-hint mb-3">装备、魔道具与药剂（规则书 Ch2）。仆从与伴侣可共用部分道具。</p>

      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" className={`tome-tag ${cat === 'all' ? 'tome-tag--active' : ''}`} onClick={() => setCat('all')}>
          全部
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={`tome-tag ${cat === c ? 'tome-tag--active' : ''}`}
            onClick={() => setCat(c)}
          >
            {SHOP_CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <ul className="tome-list">
        {items.map((item) => (
          <li key={item.id} className="tome-list-item flex-col !items-stretch gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="tome-list-item__name">{item.name}</span>
                {item.category && (
                  <span className="tome-tag">{SHOP_CATEGORY_LABEL[item.category]}</span>
                )}
                {(invMap.get(item.id) ?? 0) > 0 && (
                  <span className="tome-tag tome-tag--active">×{invMap.get(item.id)}</span>
                )}
              </div>
              <p className="mt-1 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
                {item.desc}
              </p>
              {item.effect && (
                <p className="mt-0.5 text-[10px]" style={{ color: 'var(--c-mint)' }}>
                  效果：{item.effect}
                </p>
              )}
            </div>
            <button type="button" className="tome-btn tome-btn--accent self-end" onClick={() => void handleBuy(item)}>
              {item.price} G · 购买
            </button>
          </li>
        ))}
      </ul>
    </TomeSubShell>
  )
}
