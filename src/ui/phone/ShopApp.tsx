import { useRef, useState } from 'react'
import { ShoppingBag, Gift, Plus } from 'lucide-react'
import { useShopStore } from '@/store/shopStore'
import { useProfileStore } from '@/store/profileStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useDataStore } from '@/store/dataStore'
import { useSessionStore } from '@/store/sessionStore'
import { usePassportStore } from '@/store/passportStore'
import { useUIStore } from '@/store/uiStore'
import { coverColorForId } from '@/utils/interactableCharacters'
import { PhoneAppShell } from './PhoneAppShell'

export function ShopApp() {
  const { allItems, inventory, buyItem, giftItem, addCustomItem } = useShopStore()
  const { profiles, spendCoins } = useProfileStore()
  const { settings } = useSettingsStore()
  const { getAllCharacters } = useDataStore()
  const { activeSession, sendGiftExchange } = useSessionStore()
  const { roster } = usePassportStore()
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const profile = profiles.find((p) => p.id === settings.ui.activeProfileId)
  const [giftPickItemId, setGiftPickItemId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [customName, setCustomName] = useState('')
  const [customPrice, setCustomPrice] = useState('50')

  const allChars = getAllCharacters()
  const giftTargets = [
    ...(activeSession?.dynamicNpc
      ? [{ id: activeSession.dynamicNpc.id, name: activeSession.dynamicNpc.displayName }]
      : []),
    ...roster
      .filter((r) => r.id !== activeSession?.dynamicNpc?.id)
      .map((r) => ({ id: r.id, name: r.displayName })),
    ...Object.keys(allChars)
      .filter((id) => !activeSession?.dynamicNpc?.id && !roster.some((r) => r.id === id))
      .map((id) => ({ id, name: allChars[id].name })),
  ]

  const items = allItems()
  const invMap = new Map(inventory.map((e) => [e.itemId, e.count]))

  const handleBuy = async (itemId: string) => {
    if (!profile) return
    const item = items.find((i) => i.id === itemId)
    if (!item) return
    await buyItem(item, profile.id, (n) => spendCoins(profile.id, n))
  }

  const handleGiftToCharacter = async (itemId: string, characterId: string) => {
    const item = items.find((i) => i.id === itemId)
    if (!item || (invMap.get(itemId) ?? 0) <= 0) return
    if (!activeSession) return
    await giftItem(itemId, characterId, item.name)
    await sendGiftExchange(characterId, item.name)
    setGiftPickItemId(null)
    setActiveTab('chat')
  }

  const addCustom = async () => {
    if (!customName.trim()) return
    await addCustomItem({
      name: customName.trim(),
      desc: '自定义礼物',
      price: Number(customPrice) || 50,
    })
    setCustomName('')
  }

  return (
    <PhoneAppShell title="纪念品店">
      <div className="glass-card mb-3 flex items-center justify-between px-3 py-2 text-sm">
        <span style={{ color: 'var(--c-text-dim)' }}>契约币</span>
        <span style={{ color: 'var(--c-accent)' }}>{profile?.coins ?? 0} G</span>
      </div>

      <p className="mb-2 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
        赠送礼物给当前会话中的男主（需先进入沉浸对话）
      </p>

      <div className="mb-3 flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.id} className="glass-card flex flex-col gap-2 p-3">
            <div className="flex gap-3">
              {item.image ? (
                <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
              ) : (
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg p-1 text-center text-[10px] leading-tight"
                  style={{ background: 'var(--c-bg-soft)', color: 'var(--c-text)' }}
                >
                  {item.name}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="line-clamp-2 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                  {item.desc}
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--c-accent)' }}>
                  {item.price} G
                  {invMap.get(item.id) ? ` · 持有 ${invMap.get(item.id)}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  onClick={() => handleBuy(item.id)}
                  className="rounded-lg px-2 py-1 text-[10px]"
                  style={{ background: 'var(--c-primary)', color: '#fff' }}
                >
                  购买
                </button>
                {(invMap.get(item.id) ?? 0) > 0 && (
                  <button
                    onClick={() => setGiftPickItemId(giftPickItemId === item.id ? null : item.id)}
                    className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-[10px]"
                    style={{
                      background:
                        giftPickItemId === item.id ? 'var(--c-primary)' : 'var(--c-primary-soft)',
                      color: giftPickItemId === item.id ? '#fff' : 'var(--c-primary)',
                    }}
                  >
                    <Gift size={10} /> 赠送
                  </button>
                )}
              </div>
            </div>

            {giftPickItemId === item.id && (
              <div
                className="rounded-xl p-2"
                style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)' }}
              >
                {giftTargets.length === 0 ? (
                  <p className="text-center text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                    请先进入冒险域对话
                  </p>
                ) : (
                  <>
                    <p className="mb-2 text-center text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                      点击头像赠送给
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {giftTargets.map(({ id, name }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => void handleGiftToCharacter(item.id, id)}
                          className="flex flex-col items-center gap-1 transition-transform active:scale-95"
                        >
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-full text-sm text-white"
                            style={{ border: '2px solid var(--c-primary)', background: coverColorForId(id) }}
                          >
                            {name.slice(0, 1)}
                          </div>
                          <span className="max-w-[52px] truncate text-[9px]" style={{ color: 'var(--c-text)' }}>
                            {name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="glass-card p-3">
        <p className="mb-2 flex items-center gap-1 text-xs" style={{ color: 'var(--c-text-dim)' }}>
          <Plus size={12} /> 自定义纪念品
        </p>
        <input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="商品名"
          className="mb-2 w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
        />
        <input
          value={customPrice}
          onChange={(e) => setCustomPrice(e.target.value)}
          placeholder="价格"
          className="mb-2 w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
        />
        <button
          onClick={addCustom}
          className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm"
          style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
        >
          <ShoppingBag size={14} /> 上架
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" />
      </div>
    </PhoneAppShell>
  )
}
