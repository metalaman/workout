/**
 * Social Store
 *
 * Manages social groups, group chat messages, members, and invitations.
 * Group chat uses Appwrite Realtime for live updates (subscription is in the screen, not here).
 *
 * @module stores/social-store
 */
import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import type { Group, GroupMember, GroupMessage, GroupInvitation } from '@/types/social'
import * as db from '@/lib/database'

const LAST_READ_KEY = 'ironlog_group_last_read'

async function loadLastRead(): Promise<Record<string, string>> {
  try {
    const raw = await SecureStore.getItemAsync(LAST_READ_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

async function saveLastRead(map: Record<string, string>) {
  try {
    await SecureStore.setItemAsync(LAST_READ_KEY, JSON.stringify(map))
  } catch {}
}

interface SocialState {
  groups: Group[]
  activeGroup: Group | null
  messages: GroupMessage[]
  members: GroupMember[]
  invitations: GroupInvitation[]
  isLoading: boolean
  isMessagesLoading: boolean
  /** groupId → ISO timestamp of last read */
  lastReadTimestamps: Record<string, string>
  /** groupId → ISO timestamp of newest message */
  lastMessageTimestamps: Record<string, string>
  /** Whether any group has unread messages */
  hasUnread: boolean

  loadGroups: (userId: string) => Promise<void>
  setActiveGroup: (group: Group | null) => void
  loadMessages: (groupId: string) => Promise<void>
  loadMembers: (groupId: string) => Promise<void>
  createGroup: (name: string, description: string, userId: string, displayName: string, avatarColor: string) => Promise<Group>
  joinGroupByCode: (code: string, userId: string, displayName: string, avatarColor: string) => Promise<Group>
  sendMessage: (groupId: string, text: string, userId: string, userName: string, avatarColor: string, type?: string, mediaUrl?: string | null) => Promise<void>
  shareWorkout: (groupIds: string[], workoutData: string, text: string, userId: string, userName: string, avatarColor: string) => Promise<void>
  leaveGroup: (groupId: string, userId: string) => Promise<void>
  removeMember: (memberId: string, groupId: string) => Promise<void>
  loadInvitations: (userId: string) => Promise<void>
  sendInvitation: (groupId: string, groupName: string, groupColor: string, invitedBy: string, inviterName: string, invitedUserId: string) => Promise<void>
  acceptInvitation: (invitation: GroupInvitation, userId: string, displayName: string, avatarColor: string) => Promise<void>
  declineInvitation: (invitationId: string) => Promise<void>
  /** Mark a group as read (call when user opens chat) */
  markGroupRead: (groupId: string) => void
  /** Refresh unread state for all groups */
  refreshUnread: () => Promise<void>
  /** Called when a new realtime message arrives */
  onNewMessage: (groupId: string, createdAt: string) => void
}

export const useSocialStore = create<SocialState>((set, get) => ({
  groups: [],
  activeGroup: null,
  messages: [],
  members: [],
  invitations: [],
  isLoading: false,
  isMessagesLoading: false,
  lastReadTimestamps: {},
  lastMessageTimestamps: {},
  hasUnread: false,

  loadGroups: async (userId: string) => {
    set({ isLoading: true })
    try {
      const groups = await db.listUserGroups(userId)
      // Load last-read timestamps from local storage
      const lastReadTimestamps = await loadLastRead()
      // Fetch last message timestamp for each group
      const lastMessageTimestamps: Record<string, string> = {}
      await Promise.all(groups.map(async (g) => {
        try {
          const lastMsg = await db.getLastGroupMessage(g.$id)
          if (lastMsg?.$createdAt) lastMessageTimestamps[g.$id] = lastMsg.$createdAt
        } catch {}
      }))
      // Compute unread
      const hasUnread = groups.some(g => {
        const lastMsg = lastMessageTimestamps[g.$id]
        if (!lastMsg) return false
        const lastRead = lastReadTimestamps[g.$id]
        if (!lastRead) return true // never read = unread
        return lastMsg > lastRead
      })
      set({ groups, isLoading: false, lastReadTimestamps, lastMessageTimestamps, hasUnread })
    } catch {
      set({ isLoading: false })
    }
  },

  setActiveGroup: (group: Group | null) => {
    set({ activeGroup: group, messages: [], members: [] })
  },

  loadMessages: async (groupId: string) => {
    set({ isMessagesLoading: true })
    try {
      const messages = await db.listGroupMessages(groupId, 100)
      set({ messages, isMessagesLoading: false })
    } catch {
      set({ isMessagesLoading: false })
    }
  },

  loadMembers: async (groupId: string) => {
    try {
      const members = await db.listGroupMembers(groupId)
      set({ members })
    } catch {
      // silently fail
    }
  },

  createGroup: async (name, description, userId, displayName, avatarColor) => {
    const group = await db.createGroup(name, description, userId, displayName, avatarColor)
    set((state) => ({ groups: [group, ...state.groups] }))
    return group
  },

  joinGroupByCode: async (code, userId, displayName, avatarColor) => {
    const group = await db.joinGroupByCode(code, userId, displayName, avatarColor)
    set((state) => ({ groups: [group, ...state.groups] }))
    return group
  },

  sendMessage: async (groupId, text, userId, userName, avatarColor, type = 'message', mediaUrl = null) => {
    try {
      const msg = await db.sendGroupMessage(groupId, userId, userName, avatarColor, text, type as any, null, mediaUrl)
      set((state) => ({ messages: [msg, ...state.messages] }))
    } catch {
      // silently fail
    }
  },

  shareWorkout: async (groupIds, workoutData, text, userId, userName, avatarColor) => {
    try {
      await db.shareWorkoutToGroups(groupIds, workoutData, text, userId, userName, avatarColor)
    } catch {
      // silently fail
    }
  },

  leaveGroup: async (groupId, userId) => {
    try {
      await db.leaveGroup(groupId, userId)
      set((state) => ({
        groups: state.groups.filter((g) => g.$id !== groupId),
        activeGroup: state.activeGroup?.$id === groupId ? null : state.activeGroup,
      }))
    } catch {
      // silently fail
    }
  },

  removeMember: async (memberId, groupId) => {
    try {
      await db.removeGroupMember(memberId, groupId)
      set((state) => ({
        members: state.members.filter((m) => m.$id !== memberId),
      }))
    } catch {
      // silently fail
    }
  },

  loadInvitations: async (userId: string) => {
    try {
      const invitations = await db.listPendingInvitations(userId)
      set({ invitations: invitations as unknown as GroupInvitation[] })
    } catch {
      set({ invitations: [] })
    }
  },

  sendInvitation: async (groupId, groupName, groupColor, invitedBy, inviterName, invitedUserId) => {
    await db.sendGroupInvitation({ groupId, groupName, groupColor, invitedBy, inviterName, invitedUserId })
  },

  acceptInvitation: async (invitation, userId, displayName, avatarColor) => {
    try {
      const group = await db.joinGroupById(invitation.groupId, userId, displayName, avatarColor)
      await db.respondToInvitation(invitation.$id, 'accepted')
      set((state) => ({
        invitations: state.invitations.filter((i) => i.$id !== invitation.$id),
        groups: [group, ...state.groups],
      }))
    } catch {
      // silently fail
    }
  },

  declineInvitation: async (invitationId: string) => {
    try {
      await db.respondToInvitation(invitationId, 'declined')
      set((state) => ({
        invitations: state.invitations.filter((i) => i.$id !== invitationId),
      }))
    } catch {
      // silently fail
    }
  },

  markGroupRead: (groupId: string) => {
    const now = new Date().toISOString()
    const updated = { ...get().lastReadTimestamps, [groupId]: now }
    set({ lastReadTimestamps: updated })
    // Recompute hasUnread
    const { lastMessageTimestamps, groups } = get()
    const hasUnread = groups.some(g => {
      const lastMsg = lastMessageTimestamps[g.$id]
      if (!lastMsg) return false
      const lastRead = updated[g.$id]
      if (!lastRead) return true
      return lastMsg > lastRead
    })
    set({ hasUnread })
    // Persist to local storage
    saveLastRead(updated)
  },

  refreshUnread: async () => {
    const { groups } = get()
    const lastReadTimestamps = await loadLastRead()
    const lastMessageTimestamps: Record<string, string> = {}
    await Promise.all(groups.map(async (g) => {
      try {
        const lastMsg = await db.getLastGroupMessage(g.$id)
        if (lastMsg?.$createdAt) lastMessageTimestamps[g.$id] = lastMsg.$createdAt
      } catch {}
    }))
    const hasUnread = groups.some(g => {
      const lastMsg = lastMessageTimestamps[g.$id]
      if (!lastMsg) return false
      const lastRead = lastReadTimestamps[g.$id]
      if (!lastRead) return true
      return lastMsg > lastRead
    })
    set({ lastReadTimestamps, lastMessageTimestamps, hasUnread })
  },

  onNewMessage: (groupId: string, createdAt: string) => {
    const updated = { ...get().lastMessageTimestamps, [groupId]: createdAt }
    set({ lastMessageTimestamps: updated })
    // Recompute hasUnread
    const { lastReadTimestamps, groups } = get()
    const hasUnread = groups.some(g => {
      const lastMsg = updated[g.$id]
      if (!lastMsg) return false
      const lastRead = lastReadTimestamps[g.$id]
      if (!lastRead) return true
      return lastMsg > lastRead
    })
    set({ hasUnread })
  },
}))
