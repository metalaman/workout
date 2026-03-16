import { create } from 'zustand'
import type { WorkoutSession, PersonalRecord } from '@/types'
import * as db from '@/lib/database'

interface SessionState {
  recentSessions: WorkoutSession[]
  allSessions: WorkoutSession[]
  personalRecords: PersonalRecord[]
  isLoading: boolean
  lastCompletedSession: WorkoutSession | null
  newPRs: PersonalRecord[]

  loadRecent: (userId: string) => Promise<void>
  loadAll: (userId: string) => Promise<void>
  loadPRs: (userId: string) => Promise<void>
  addSession: (session: WorkoutSession) => void
  setLastCompleted: (session: WorkoutSession | null) => void
  setNewPRs: (prs: PersonalRecord[]) => void
  clearCompletionData: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  recentSessions: [],
  allSessions: [],
  personalRecords: [],
  isLoading: false,
  lastCompletedSession: null,
  newPRs: [],

  loadRecent: async (userId: string) => {
    try {
      const sessions = await db.getRecentSessions(userId, 3)
      set({ recentSessions: sessions })
    } catch {
      // Keep existing data
    }
  },

  loadAll: async (userId: string) => {
    set({ isLoading: true })
    try {
      const sessions = await db.listWorkoutSessions(userId, 100)
      set({ allSessions: sessions, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  loadPRs: async (userId: string) => {
    try {
      const prs = await db.listPersonalRecords(userId)
      set({ personalRecords: prs })
    } catch {
      // Keep existing data
    }
  },

  addSession: (session: WorkoutSession) => {
    set((state) => ({
      recentSessions: [session, ...state.recentSessions].slice(0, 3),
      allSessions: [session, ...state.allSessions],
    }))
  },

  setLastCompleted: (session: WorkoutSession | null) => set({ lastCompletedSession: session }),
  setNewPRs: (prs: PersonalRecord[]) => set({ newPRs: prs }),
  clearCompletionData: () => set({ lastCompletedSession: null, newPRs: [] }),
}))
