import { create } from 'zustand'
import type { ShopItem, InventoryEntry, GiftLog } from '../types'
import { getShopData, putShopData, genId } from '../storage/db'

import { TAVERN_GEAR_ITEMS } from '@/data/azeriaShopGear'

export const DEFAULT_SHOP: ShopItem[] = [
  { id: 'wave_charm', name: '水波吊坠', desc: '疯狂水世界贩售部同款，晃一下像浪尖闪光。', price: 80 },
  { id: 'mineral_soda', name: '温泉矿泉汽饮', desc: '温泉乡前台同款味道，加了气泡。', price: 35 },
  { id: 'petal_candy', name: '花瓣硬糖', desc: '空中花园季节限定，舌尖会留下一点甜涩。', price: 45 },
  { id: 'stamp_seal', name: '预备图鉴火漆', desc: '空白印章蜡，契约仪式前可以练手。', price: 120 },
  { id: 'locker_key', name: '银色储物钥匙', desc: '入口服务台钥匙链，铜片上刻着旅者编号。', price: 90 },
  { id: 'night_ticket', name: '深夜模式邀约券', desc: '集邮满 7 枚后才会真正生效的夜场通行证样本。', price: 200, category: 'souvenir' },
  { id: 'pot_desire_mid', name: '中级欲火药剂', desc: '临时提升魅惑相关检定与氛围热度。', price: 90, category: 'potion' },
  { id: 'pot_heal_minor', name: '初级治疗药水', desc: '恢复体力，战斗中可稳住局面。', price: 25, category: 'potion' },
  { id: 'pot_antidote', name: '解毒剂', desc: '解除中毒与轻度异常状态。', price: 40, category: 'potion' },
  ...TAVERN_GEAR_ITEMS,
]

interface ShopStore {
  inventory: InventoryEntry[]
  gifts: GiftLog[]
  customItems: ShopItem[]
  loaded: boolean
  load: () => Promise<void>
  buyItem: (item: ShopItem, profileId: string, spendCoins: (n: number) => Promise<boolean>) => Promise<boolean>
  giftItem: (itemId: string, characterId: string, itemName: string) => Promise<void>
  grantItem: (itemId: string, count?: number) => Promise<void>
  consumeItem: (itemId: string, count?: number) => Promise<boolean>
  addCustomItem: (item: Omit<ShopItem, 'id' | 'custom'>) => Promise<ShopItem>
  getItem: (id: string) => ShopItem | undefined
  allItems: () => ShopItem[]
}

async function persist(state: Pick<ShopStore, 'inventory' | 'gifts' | 'customItems'>) {
  await putShopData({
    inventory: state.inventory,
    gifts: state.gifts,
    customItems: state.customItems,
  })
}

export const useShopStore = create<ShopStore>((set, get) => ({
  inventory: [],
  gifts: [],
  customItems: [],
  loaded: false,

  load: async () => {
    const data = await getShopData()
    set({ ...data, loaded: true })
  },

  allItems: () => [...DEFAULT_SHOP, ...get().customItems],

  getItem: (id) => get().allItems().find((i) => i.id === id),

  buyItem: async (item, _profileId, spendCoins) => {
    const ok = await spendCoins(item.price)
    if (!ok) return false
    const inv = [...get().inventory]
    const ex = inv.find((e) => e.itemId === item.id)
    if (ex) ex.count += 1
    else inv.push({ itemId: item.id, count: 1 })
    set({ inventory: inv })
    await persist(get())
    return true
  },

  giftItem: async (itemId, characterId, itemName) => {
    const inv = [...get().inventory]
    const ex = inv.find((e) => e.itemId === itemId)
    if (ex) {
      ex.count -= 1
    }
    const gifts: GiftLog[] = [
      { id: genId('gift'), characterId, itemId, itemName, at: Date.now() },
      ...get().gifts,
    ]
    set({ inventory: inv.filter((e) => e.count > 0), gifts })
    await persist(get())
  },

  grantItem: async (itemId, count = 1) => {
    const inv = [...get().inventory]
    const ex = inv.find((e) => e.itemId === itemId)
    if (ex) ex.count += count
    else inv.push({ itemId, count })
    set({ inventory: inv })
    await persist(get())
  },

  consumeItem: async (itemId, count = 1) => {
    const inv = [...get().inventory]
    const ex = inv.find((e) => e.itemId === itemId)
    if (!ex || ex.count < count) return false
    ex.count -= count
    set({ inventory: inv.filter((e) => e.count > 0) })
    await persist(get())
    return true
  },

  addCustomItem: async (item) => {
    const custom: ShopItem = { ...item, id: genId('item'), custom: true }
    const customItems = [...get().customItems, custom]
    set({ customItems })
    await persist(get())
    return custom
  },
}))
