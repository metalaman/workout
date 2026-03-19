import { create } from 'zustand'
import type { BodyStat } from '@/types'
import * as db from '@/lib/database'

interface BodyState {
  stats: BodyStat[]
  isLoading: boolean
  loadStats: (userId: string) => Promise<void>
  addStat: (data: Omit<BodyStat, '$id'>) => Promise<void>
  removeStat: (id: string) => Promise<void>
}

export const useBodyStore = create<BodyState>((set) => ({
  stats: [],
  isLoading: false,

  loadStats: async (userId: string) => {
    set({ isLoading: true })
    try {
      const stats = await db.listBodyStats(userId)
      set({ stats, isLoading: false })
    } catch (e) {
      console.warn('[BodyStore] load failed:', e)
      set({ isLoading: false })
    }
  },

  addStat: async (data) => {
    try {
      const stat = await db.createBodyStat(data)
      set((s) => ({ stats: [stat, ...s.stats] }))
    } catch {
      const local: BodyStat = { ...data, $id: `local-${Date.now()}` }
      set((s) => ({ stats: [local, ...s.stats] }))
    }
  },

  removeStat: async (id: string) => {
    try {
      await db.deleteBodyStat(id)
    } catch (e) { console.warn("[Store] operation failed:", e) }
    set((s) => ({ stats: s.stats.filter((st) => st.$id !== id) }))
  },
}))
