import { create } from 'zustand'
import type { SocialPost } from '@/types'
import * as db from '@/lib/database'

interface SocialState {
  posts: SocialPost[]
  isLoading: boolean

  loadFeed: () => Promise<void>
  shareWorkout: (post: Omit<SocialPost, '$id' | '$createdAt'>) => Promise<void>
  toggleLike: (postId: string, userId: string) => Promise<void>
}

export const useSocialStore = create<SocialState>((set, get) => ({
  posts: [],
  isLoading: false,

  loadFeed: async () => {
    set({ isLoading: true })
    try {
      const posts = await db.listSocialPosts(20)
      set({ posts, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  shareWorkout: async (post) => {
    try {
      const newPost = await db.createSocialPost(post)
      set((state) => ({ posts: [newPost, ...state.posts] }))
    } catch {
      // Silently fail
    }
  },

  toggleLike: async (postId: string, userId: string) => {
    try {
      const updated = await db.toggleLike(postId, userId)
      set((state) => ({
        posts: state.posts.map((p) => (p.$id === postId ? updated : p)),
      }))
    } catch {
      // Silently fail
    }
  },
}))
