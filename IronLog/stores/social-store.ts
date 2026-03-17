/**
 * Social Store
 *
 * Manages social groups, group chat messages, members, and invitations.
 * Group chat uses Appwrite Realtime for live updates (subscription is in the screen, not here).
 *
 * @module stores/social-store
 */
import { create } from 'zustand'
import type { Group, GroupMember, GroupMessage, GroupInvitation } from '@/types/social'
import * as db from '@/lib/database'

interface SocialState {
  groups: Group[]
  activeGroup: Group | null
  messages: GroupMessage[]
  members: GroupMember[]
  invitations: GroupInvitation[]
  isLoading: boolean
  isMessagesLoading: boolean

  loadGroups: (userId: string) => Promise<void>
  setActiveGroup: (group: Group | null) => void
  loadMessages: (groupId: string) => Promise<void>
  loadMembers: (groupId: string) => Promise<void>
  createGroup: (name: string, description: string, userId: string, displayName: string, avatarColor: string) => Promise<Group>
  joinGroupByCode: (code: string, userId: string, displayName: string, avatarColor: string) => Promise<Group>
  sendMessage: (groupId: string, text: string, userId: string, userName: string, avatarColor: string) => Promise<void>
  shareWorkout: (groupIds: string[], workoutData: string, text: string, userId: string, userName: string, avatarColor: string) => Promise<void>
  leaveGroup: (groupId: string, userId: string) => Promise<void>
  removeMember: (memberId: string, groupId: string) => Promise<void>
  loadInvitations: (userId: string) => Promise<void>
  sendInvitation: (groupId: string, groupName: string, groupColor: string, invitedBy: string, inviterName: string, invitedUserId: string) => Promise<void>
  acceptInvitation: (invitation: GroupInvitation, userId: string, displayName: string, avatarColor: string) => Promise<void>
  declineInvitation: (invitationId: string) => Promise<void>
}

export const useSocialStore = create<SocialState>((set, get) => ({
  groups: [],
  activeGroup: null,
  messages: [],
  members: [],
  invitations: [],
  isLoading: false,
  isMessagesLoading: false,

  loadGroups: async (userId: string) => {
    set({ isLoading: true })
    try {
      const groups = await db.listUserGroups(userId)
      set({ groups, isLoading: false })
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

  sendMessage: async (groupId, text, userId, userName, avatarColor) => {
    try {
      const msg = await db.sendGroupMessage(groupId, userId, userName, avatarColor, text, 'message', null)
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
}))
