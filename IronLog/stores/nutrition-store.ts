import { create } from 'zustand'
import type { NutritionProfile, FoodLogEntry, FoodItem, MealType } from '@/types'
import * as db from '@/lib/database'
import { getDateString, getWeekDates, computeDailySummary } from '@/lib/nutrition-utils'

interface NutritionState {
  /** User's nutrition profile (null if onboarding not completed) */
  profile: NutritionProfile | null
  /** Food log entries for the currently selected date */
  todayLogs: FoodLogEntry[]
  /** Food log entries keyed by date string for the current week */
  weekLogs: Record<string, FoodLogEntry[]>
  /** Recently logged foods for quick re-logging */
  recents: FoodItem[]
  /** Favorited foods */
  favorites: FoodItem[]
  /** Currently selected date (YYYY-MM-DD) */
  selectedDate: string
  /** Loading state */
  isLoading: boolean
  /** Whether loadProfile has completed at least once */
  profileLoaded: boolean

  // ─── Actions ──────────────────────────────────────────────────────────────
  /** Load profile from Appwrite */
  loadProfile: (userId: string) => Promise<void>
  /** Save onboarding profile */
  saveProfile: (data: Omit<NutritionProfile, '$id'>) => Promise<void>
  /** Update existing profile */
  updateProfile: (data: Partial<NutritionProfile>) => Promise<void>
  /** Load food logs for a specific date */
  loadDayLogs: (userId: string, date?: string, silent?: boolean) => Promise<void>
  /** Load food logs for the current week */
  loadWeekLogs: (userId: string, weekOffset?: number) => Promise<void>
  /** Log a food entry */
  logFood: (data: Omit<FoodLogEntry, '$id'>) => Promise<void>
  /** Remove a food log entry */
  removeLog: (logId: string) => Promise<void>
  /** Set the selected date and load its logs */
  setSelectedDate: (userId: string, date: string) => Promise<void>
  /** Add a food to recents */
  addRecent: (food: FoodItem) => void
  /** Toggle a food as favorite */
  toggleFavorite: (food: FoodItem) => void
  /** Reset profile (re-run onboarding) */
  resetProfile: () => Promise<void>
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  profile: null,
  todayLogs: [],
  weekLogs: {},
  recents: [],
  favorites: [],
  selectedDate: getDateString(),
  isLoading: false,
  profileLoaded: false,

  loadProfile: async (userId: string) => {
    set({ isLoading: true })
    try {
      const profile = await db.getNutritionProfile(userId)
      set({ profile, isLoading: false, profileLoaded: true })
    } catch {
      set({ isLoading: false, profileLoaded: true })
    }
  },

  saveProfile: async (data) => {
    try {
      const profile = await db.createNutritionProfile(data)
      set({ profile })
    } catch {
      // Local fallback
      const local: NutritionProfile = { ...data, $id: `local-${Date.now()}` }
      set({ profile: local })
    }
  },

  updateProfile: async (data) => {
    const { profile } = get()
    if (!profile) return
    try {
      const updated = await db.updateNutritionProfile(profile.$id, data)
      set({ profile: updated })
    } catch {
      // Optimistic local update
      set({ profile: { ...profile, ...data } })
    }
  },

  loadDayLogs: async (userId: string, date?: string, silent = false) => {
    const targetDate = date ?? get().selectedDate
    if (!silent) set({ isLoading: true })
    try {
      const logs = await db.listFoodLogs(userId, targetDate)
      set({
        todayLogs: logs,
        isLoading: false,
        weekLogs: { ...get().weekLogs, [targetDate]: logs },
      })
    } catch {
      set({ isLoading: false })
    }
  },

  loadWeekLogs: async (userId: string, weekOffset = 0) => {
    try {
      const dates = getWeekDates(weekOffset)
      const logs = await db.listFoodLogsForDates(userId, dates)
      // Group by date
      const grouped: Record<string, FoodLogEntry[]> = {}
      for (const date of dates) {
        grouped[date] = logs.filter((l) => l.date === date)
      }
      set({ weekLogs: { ...get().weekLogs, ...grouped } })
    } catch {
      // silent
    }
  },

  logFood: async (data) => {
    try {
      const entry = await db.createFoodLog(data)
      const { todayLogs, weekLogs, selectedDate } = get()
      if (data.date === selectedDate) {
        set({ todayLogs: [...todayLogs, entry] })
      }
      set({
        weekLogs: {
          ...weekLogs,
          [data.date]: [...(weekLogs[data.date] ?? []), entry],
        },
      })
    } catch {
      // Local fallback
      const local: FoodLogEntry = { ...data, $id: `local-${Date.now()}` }
      const { todayLogs, weekLogs, selectedDate } = get()
      if (data.date === selectedDate) {
        set({ todayLogs: [...todayLogs, local] })
      }
      set({
        weekLogs: {
          ...weekLogs,
          [data.date]: [...(weekLogs[data.date] ?? []), local],
        },
      })
    }
  },

  removeLog: async (logId: string) => {
    const { todayLogs, weekLogs } = get()
    try {
      await db.deleteFoodLog(logId)
    } catch {
      // continue with optimistic removal
    }
    const updatedToday = todayLogs.filter((l) => l.$id !== logId)
    const updatedWeek = { ...weekLogs }
    for (const date of Object.keys(updatedWeek)) {
      updatedWeek[date] = updatedWeek[date].filter((l) => l.$id !== logId)
    }
    set({ todayLogs: updatedToday, weekLogs: updatedWeek })
  },

  setSelectedDate: async (userId: string, date: string) => {
    const { weekLogs } = get()
    if (weekLogs[date]) {
      set({ selectedDate: date, todayLogs: weekLogs[date] })
    } else {
      set({ selectedDate: date })
      await get().loadDayLogs(userId, date, true)
    }
  },

  addRecent: (food: FoodItem) => {
    const { recents } = get()
    const filtered = recents.filter((f) => f.id !== food.id)
    set({ recents: [food, ...filtered].slice(0, 20) })
  },

  toggleFavorite: (food: FoodItem) => {
    const { favorites } = get()
    const exists = favorites.some((f) => f.id === food.id)
    if (exists) {
      set({ favorites: favorites.filter((f) => f.id !== food.id) })
    } else {
      set({ favorites: [...favorites, food] })
    }
  },

  resetProfile: async () => {
    const { profile } = get()
    if (profile && !profile.$id.startsWith('local-')) {
      try {
        await db.deleteNutritionProfile(profile.$id)
      } catch {
        // silent
      }
    }
    set({ profile: null })
  },
}))
