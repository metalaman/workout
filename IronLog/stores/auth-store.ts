/**
 * Auth Store
 *
 * Manages authentication state and user profile.
 * Provides login, register, logout, and a dev-mode skipAuth.
 *
 * @module stores/auth-store
 */
import { create } from 'zustand'
import type { Models } from 'react-native-appwrite'
import type { UserProfile } from '@/types'
import * as authService from '@/lib/auth'

/**
 * Auth state shape.
 * - `user` — Appwrite User object (null when logged out)
 * - `profile` — UserProfile from user_profiles collection
 * - `isLoading` — True during initialization
 * - `isAuthenticated` — Controls AuthGate navigation
 */
interface AuthState {
  user: Models.User<Models.Preferences> | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean

  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  skipAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const user = await authService.getCurrentUser()
      if (user) {
        const profile = await authService.getUserProfile(user.$id)
        set({ user, profile, isAuthenticated: true, isLoading: false })
      } else {
        set({ user: null, profile: null, isAuthenticated: false, isLoading: false })
      }
    } catch {
      set({ user: null, profile: null, isAuthenticated: false, isLoading: false })
    }
  },

  login: async (email: string, password: string) => {
    await authService.login(email, password)
    const user = await authService.getCurrentUser()
    if (user) {
      const profile = await authService.getUserProfile(user.$id)
      set({ user, profile, isAuthenticated: true })
    }
  },

  register: async (email: string, password: string, name: string) => {
    await authService.register(email, password, name)
    const user = await authService.getCurrentUser()
    if (user) {
      const profile = await authService.getUserProfile(user.$id)
      set({ user, profile, isAuthenticated: true })
    }
  },

  logout: async () => {
    await authService.logout()
    set({ user: null, profile: null, isAuthenticated: false })
  },

  skipAuth: () => {
    set({
      user: { $id: 'dev', name: 'Alex', email: 'alex@dev.local' } as Models.User<Models.Preferences>,
      profile: {
        $id: 'dev-profile',
        userId: 'dev',
        displayName: 'Alex',
        avatarColor: '#e8ff47',
        streakCount: 4,
        lastWorkoutDate: new Date().toISOString(),
        weeklyGoal: 5,
      },
      isAuthenticated: true,
      isLoading: false,
    })
  },
}))
