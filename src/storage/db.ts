import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Session, CoreMemory, AppSettings, UserProfile, MusicTrack, ShopItem, InventoryEntry, GiftLog, Region, AlbumImage, GeneratedRecord, PassportData, BodyStatsData, AdventureStatsData } from '../types'

interface ShopData {
  inventory: InventoryEntry[]
  gifts: GiftLog[]
  customItems: ShopItem[]
}
interface CompanionDB extends DBSchema {
  sessions: {
    key: string
    value: Session
    indexes: { 'by-status': string; 'by-updated': number }
  }
  memories: {
    key: string
    value: CoreMemory
    indexes: { 'by-character': string }
  }
  settings: {
    key: string
    value: AppSettings
  }
  profiles: {
    key: string
    value: UserProfile
  }
  usercss: {
    key: string
    value: string
  }
  music: {
    key: string
    value: MusicTrack
  }
  shopdata: {
    key: string
    value: ShopData
  }
  customregions: {
    key: string
    value: Region
  }
  album: {
    key: string
    value: AlbumImage
  }
  generated: {
    key: string
    value: GeneratedRecord
    indexes: { 'by-type': string; 'by-created': number }
  }
  passport: {
    key: string
    value: PassportData
  }
  bodystats: {
    key: string
    value: BodyStatsData
  }
  adventurestats: {
    key: string
    value: AdventureStatsData
  }
}

const DB_NAME = 'western-allure'
const DB_VERSION = 9

let dbPromise: Promise<IDBPDatabase<CompanionDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<CompanionDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          const store = db.createObjectStore('sessions', { keyPath: 'id' })
          store.createIndex('by-status', 'status')
          store.createIndex('by-updated', 'updatedAt')
        }
        if (!db.objectStoreNames.contains('memories')) {
          const store = db.createObjectStore('memories', { keyPath: 'id' })
          store.createIndex('by-character', 'characterId')
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings')
        }
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('usercss')) {
          db.createObjectStore('usercss')
        }
        if (!db.objectStoreNames.contains('music')) {
          db.createObjectStore('music', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('shopdata')) {
          db.createObjectStore('shopdata')
        }
        if (!db.objectStoreNames.contains('customregions')) {
          db.createObjectStore('customregions', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('album')) {
          db.createObjectStore('album', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('generated')) {
          const store = db.createObjectStore('generated', { keyPath: 'id' })
          store.createIndex('by-type', 'type')
          store.createIndex('by-created', 'createdAt')
        }
        if (!db.objectStoreNames.contains('passport')) {
          db.createObjectStore('passport')
        }
        if (!db.objectStoreNames.contains('bodystats')) {
          db.createObjectStore('bodystats')
        }
        if (!db.objectStoreNames.contains('adventurestats')) {
          db.createObjectStore('adventurestats')
        }
      },
    })
  }
  return dbPromise
}

/* ---------------- 会话 ---------------- */

export async function putSession(session: Session): Promise<void> {
  const db = await getDB()
  await db.put('sessions', session)
}

export async function getSession(id: string): Promise<Session | undefined> {
  const db = await getDB()
  return db.get('sessions', id)
}

export async function listSessions(status?: Session['status']): Promise<Session[]> {
  const db = await getDB()
  const all = await db.getAll('sessions')
  const filtered = status ? all.filter((s) => s.status === status) : all
  return filtered.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('sessions', id)
}

/* ---------------- 核心记忆 ---------------- */

export async function putMemory(memory: CoreMemory): Promise<void> {
  const db = await getDB()
  await db.put('memories', memory)
}

export async function listMemoriesByCharacter(characterId: string): Promise<CoreMemory[]> {
  const db = await getDB()
  const idx = db.transaction('memories').store.index('by-character')
  const all = await idx.getAll(characterId)
  return all.sort((a, b) => b.timestamp - a.timestamp)
}

export async function listAllMemories(): Promise<CoreMemory[]> {
  const db = await getDB()
  return db.getAll('memories')
}

export async function deleteMemory(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('memories', id)
}

export async function updateMemory(id: string, text: string): Promise<void> {
  const db = await getDB()
  const mem = await db.get('memories', id)
  if (!mem) return
  await db.put('memories', { ...mem, text, timestamp: Date.now() })
}

/* ---------------- 设置 ---------------- */

export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB()
  return db.get('settings', 'app')
}

export async function putSettings(settings: AppSettings): Promise<void> {
  const db = await getDB()
  await db.put('settings', settings, 'app')
}

/* ---------------- 用户模板 ---------------- */

export async function putProfile(profile: UserProfile): Promise<void> {
  const db = await getDB()
  await db.put('profiles', profile)
}

export async function listProfiles(): Promise<UserProfile[]> {
  const db = await getDB()
  const all = await db.getAll('profiles')
  return all.sort((a, b) => a.createdAt - b.createdAt)
}

export async function deleteProfile(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('profiles', id)
}

/* ---------------- 自定义 CSS ---------------- */

export async function getUserCSS(): Promise<string | undefined> {
  const db = await getDB()
  return db.get('usercss', 'app')
}

export async function putUserCSS(css: string): Promise<void> {
  const db = await getDB()
  await db.put('usercss', css, 'app')
}

export async function clearUserCSS(): Promise<void> {
  const db = await getDB()
  await db.delete('usercss', 'app')
}

/* ---------------- 音乐 ---------------- */

export async function putMusicTrack(track: MusicTrack): Promise<void> {
  const db = await getDB()
  await db.put('music', track)
}

export async function listMusicTracks(): Promise<MusicTrack[]> {
  const db = await getDB()
  const all = await db.getAll('music')
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteMusicTrack(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('music', id)
}

/* ---------------- 商城 ---------------- */

const EMPTY_SHOP: ShopData = { inventory: [], gifts: [], customItems: [] }

export async function getShopData(): Promise<ShopData> {
  const db = await getDB()
  return (await db.get('shopdata', 'app')) ?? EMPTY_SHOP
}

export async function putShopData(data: ShopData): Promise<void> {
  const db = await getDB()
  await db.put('shopdata', data, 'app')
}

/* ---------------- 自定义地区（世界树） ---------------- */

export async function putCustomRegion(region: Region): Promise<void> {
  const db = await getDB()
  await db.put('customregions', region)
}

export async function listCustomRegions(): Promise<Region[]> {
  const db = await getDB()
  return db.getAll('customregions')
}

export async function deleteCustomRegion(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('customregions', id)
}

/* ---------------- 相册 ---------------- */

export async function putAlbumImage(image: AlbumImage): Promise<void> {
  const db = await getDB()
  await db.put('album', image)
}

export async function listAlbumImages(): Promise<AlbumImage[]> {
  const db = await getDB()
  const all = await db.getAll('album')
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteAlbumImage(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('album', id)
}

/* ---------------- AI 生成记录 ---------------- */

export async function putGeneratedRecord(record: GeneratedRecord): Promise<void> {
  const db = await getDB()
  await db.put('generated', record)
}

export async function listGeneratedRecords(type?: GeneratedRecord['type']): Promise<GeneratedRecord[]> {
  const db = await getDB()
  const all = await db.getAll('generated')
  const filtered = type ? all.filter((r) => r.type === type) : all
  return filtered.sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteGeneratedRecord(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('generated', id)
}

/* ---------------- 工具 ---------------- */

export function genId(prefix = ''): string {
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 8)
  return prefix ? `${prefix}_${t}${r}` : `${t}${r}`
}

/* ---------------- 西幻图鉴 ---------------- */

const EMPTY_PASSPORT: PassportData = { stamps: {}, roster: [] }

export async function getPassportData(): Promise<PassportData> {
  const db = await getDB()
  return (await db.get('passport', 'app')) ?? EMPTY_PASSPORT
}

export async function putPassportData(data: PassportData): Promise<void> {
  const db = await getDB()
  await db.put('passport', data, 'app')
}

/* ---------------- 身体面板 ---------------- */

export async function getBodyStats(): Promise<BodyStatsData | undefined> {
  const db = await getDB()
  return db.get('bodystats', 'app')
}

export async function putBodyStats(data: BodyStatsData): Promise<void> {
  const db = await getDB()
  await db.put('bodystats', data, 'app')
}

export async function getAdventureStats(): Promise<AdventureStatsData | undefined> {
  const db = await getDB()
  return db.get('adventurestats', 'app')
}

export async function putAdventureStats(data: AdventureStatsData): Promise<void> {
  const db = await getDB()
  await db.put('adventurestats', data, 'app')
}
