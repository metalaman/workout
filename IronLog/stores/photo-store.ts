import { create } from 'zustand'
import type { ProgressPhoto } from '@/types'
import * as db from '@/lib/database'

interface PhotoState {
  photos: ProgressPhoto[]
  isLoading: boolean
  loadPhotos: (userId: string) => Promise<void>
  addPhoto: (data: Omit<ProgressPhoto, '$id'>) => Promise<void>
  removePhoto: (id: string) => Promise<void>
}

export const usePhotoStore = create<PhotoState>((set) => ({
  photos: [],
  isLoading: false,

  loadPhotos: async (userId: string) => {
    set({ isLoading: true })
    try {
      const photos = await db.listProgressPhotos(userId)
      set({ photos, isLoading: false })
    } catch (e) {
      console.warn('[PhotoStore] loadPhotos failed:', e)
      set({ isLoading: false })
    }
  },

  addPhoto: async (data) => {
    try {
      const photo = await db.createProgressPhoto(data)
      set((s) => ({ photos: [photo, ...s.photos] }))
    } catch (e) {
      console.warn('[PhotoStore] addPhoto failed:', e)
      const local: ProgressPhoto = { ...data, $id: `local-${Date.now()}` }
      set((s) => ({ photos: [local, ...s.photos] }))
    }
  },

  removePhoto: async (id: string) => {
    try {
      await db.deleteProgressPhoto(id)
    } catch (e) { console.warn('[PhotoStore] removePhoto failed:', e) }
    set((s) => ({ photos: s.photos.filter((p) => p.$id !== id) }))
  },
}))
