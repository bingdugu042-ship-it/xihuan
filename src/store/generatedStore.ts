import { create } from 'zustand'
import type { GeneratedRecord } from '@/types'
import {
  deleteGeneratedRecord,
  genId,
  listGeneratedRecords,
  putGeneratedRecord,
} from '@/storage/db'

interface GeneratedStore {
  records: GeneratedRecord[]
  loaded: boolean
  load: () => Promise<void>
  addRecord: (params: Omit<GeneratedRecord, 'id' | 'createdAt'>) => Promise<GeneratedRecord>
  removeRecord: (id: string) => Promise<void>
}

export const useGeneratedStore = create<GeneratedStore>((set) => ({
  records: [],
  loaded: false,

  load: async () => {
    try {
      const records = await listGeneratedRecords()
      set({ records, loaded: true })
    } catch (err) {
      console.error('[generatedStore] load failed', err)
      set({ records: [], loaded: true })
    }
  },

  addRecord: async (params) => {
    const record: GeneratedRecord = {
      ...params,
      id: genId('gen'),
      createdAt: Date.now(),
    }
    await putGeneratedRecord(record)
    set((s) => ({ records: [record, ...s.records] }))
    return record
  },

  removeRecord: async (id) => {
    await deleteGeneratedRecord(id)
    set((s) => ({ records: s.records.filter((r) => r.id !== id) }))
  },
}))
