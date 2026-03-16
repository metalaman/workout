import { create } from 'zustand'
import type { CardioSession } from '@/types'
import * as db from '@/lib/database'

interface CardioState {
  sessions: CardioSession[]
  isLoading: boolean
  loadSessions: (userId: string) => Promise<void>
  addSession: (data: Omit<CardioSession, '$id'>) => Promise<void>
  removeSession: (id: string) => Promise<void>
}

export const useCardioStore = create<CardioState>((set) => ({
  sessions: [],
  isLoading: false,

  loadSessions: async (userId: string) => {
    set({ isLoading: true })
    try {
      const sessions = await db.listCardioSessions(userId)
      set({ sessions, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  addSession: async (data) => {
    try {
      const session = await db.createCardioSession(data)
      set((s) => ({ sessions: [session, ...s.sessions] }))
    } catch {
      const local: CardioSession = { ...data, $id: `local-${Date.now()}` }
      set((s) => ({ sessions: [local, ...s.sessions] }))
    }
  },

  removeSession: async (id: string) => {
    try {
      await db.deleteCardioSession(id)
    } catch {}
    set((s) => ({ sessions: s.sessions.filter((cs) => cs.$id !== id) }))
  },
}))
