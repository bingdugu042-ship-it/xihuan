import { create } from 'zustand'
import type { AlbumImage } from '@/types'
import { deleteAlbumImage, genId, listAlbumImages, putAlbumImage } from '@/storage/db'

interface AlbumStore {
  images: AlbumImage[]
  loaded: boolean
  load: () => Promise<void>
  addImage: (params: Omit<AlbumImage, 'id' | 'createdAt'>) => Promise<AlbumImage>
  removeImage: (id: string) => Promise<void>
}

export const useAlbumStore = create<AlbumStore>((set) => ({
  images: [],
  loaded: false,

  load: async () => {
    const images = await listAlbumImages()
    set({ images, loaded: true })
  },

  addImage: async (params) => {
    const image: AlbumImage = {
      ...params,
      id: genId('alb'),
      createdAt: Date.now(),
    }
    await putAlbumImage(image)
    set((s) => ({ images: [image, ...s.images] }))
    return image
  },

  removeImage: async (id) => {
    await deleteAlbumImage(id)
    set((s) => ({ images: s.images.filter((i) => i.id !== id) }))
  },
}))
