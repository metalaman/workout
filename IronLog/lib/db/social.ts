/**
 * Social database operations — groups, messages, invitations, posts.
 *
 * Covers the entire social layer: group CRUD, membership, real-time chat,
 * workout sharing, invitations, and the social feed.
 *
 * @module lib/db/social
 */
import { databases, DATABASE_ID, COLLECTION, ID, Query } from '../appwrite'
import type { Group, GroupMember, GroupMessage, SocialPost } from '@/types'

// ─── Social Posts ────────────────────────────────────────────────────────────

/** List social feed posts, newest first. */
export async function listSocialPosts(limit = 20): Promise<SocialPost[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.SOCIAL_POSTS, [
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as SocialPost[]
}

/** Create a social feed post. */
export async function createSocialPost(data: Omit<SocialPost, '$id' | '$createdAt'>): Promise<SocialPost> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.SOCIAL_POSTS, ID.unique(), data)
  return doc as unknown as SocialPost
}

/** Toggle like on a post. Adds/removes userId from likedBy array. */
export async function toggleLike(postId: string, userId: string): Promise<SocialPost> {
  const doc = await databases.getDocument(DATABASE_ID, COLLECTION.SOCIAL_POSTS, postId)
  const post = doc as unknown as SocialPost
  const likedBy = post.likedBy || []
  const isLiked = likedBy.includes(userId)
  const newLikedBy = isLiked ? likedBy.filter((id) => id !== userId) : [...likedBy, userId]
  const updated = await databases.updateDocument(DATABASE_ID, COLLECTION.SOCIAL_POSTS, postId, {
    likedBy: newLikedBy,
    likes: newLikedBy.length,
  })
  return updated as unknown as SocialPost
}

// ─── Groups ──────────────────────────────────────────────────────────────────

/** Generate a 6-character alphanumeric invite code (excludes ambiguous chars). */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Create a new group. Auto-adds creator as admin member.
 * Generates a unique 6-char invite code.
 */
export async function createGroup(
  name: string,
  description: string,
  userId: string,
  displayName: string,
  avatarColor: string
): Promise<Group> {
  const inviteCode = generateInviteCode()
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.GROUPS, ID.unique(), {
    name,
    description: description || '',
    createdBy: userId,
    avatarColor,
    memberCount: 1,
    inviteCode,
  })
  const group = doc as unknown as Group

  await databases.createDocument(DATABASE_ID, COLLECTION.GROUP_MEMBERS, ID.unique(), {
    groupId: group.$id,
    userId,
    displayName,
    avatarColor,
    role: 'admin',
    joinedAt: new Date().toISOString(),
  })

  return group
}

/** Get a single group by ID. */
export async function getGroup(groupId: string): Promise<Group> {
  const doc = await databases.getDocument(DATABASE_ID, COLLECTION.GROUPS, groupId)
  return doc as unknown as Group
}

/**
 * List all groups a user belongs to.
 * ⚠️ N+1 query pattern: fetches memberships first, then each group individually.
 */
export async function listUserGroups(userId: string): Promise<Group[]> {
  const memberships = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUP_MEMBERS, [
    Query.equal('userId', userId),
    Query.limit(50),
  ])
  const groupIds = memberships.documents.map((d: any) => d.groupId as string)
  if (groupIds.length === 0) return []

  const groups: Group[] = []
  for (const gid of groupIds) {
    try {
      const g = await getGroup(gid)
      groups.push(g)
    } catch {
      // Group may have been deleted
    }
  }
  return groups
}

/** Join a group by invite code. Checks if already a member. Increments memberCount. */
export async function joinGroupByCode(
  code: string,
  userId: string,
  displayName: string,
  avatarColor: string
): Promise<Group> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUPS, [
    Query.equal('inviteCode', code.toUpperCase()),
    Query.limit(1),
  ])
  if (res.documents.length === 0) throw new Error('Invalid invite code')
  const group = res.documents[0] as unknown as Group

  const existing = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUP_MEMBERS, [
    Query.equal('groupId', group.$id),
    Query.equal('userId', userId),
    Query.limit(1),
  ])
  if (existing.documents.length > 0) return group

  await databases.createDocument(DATABASE_ID, COLLECTION.GROUP_MEMBERS, ID.unique(), {
    groupId: group.$id,
    userId,
    displayName,
    avatarColor,
    role: 'member',
    joinedAt: new Date().toISOString(),
  })

  await databases.updateDocument(DATABASE_ID, COLLECTION.GROUPS, group.$id, {
    memberCount: (group.memberCount || 1) + 1,
  })

  return { ...group, memberCount: (group.memberCount || 1) + 1 }
}

/** Join a group directly by ID (used for accepting invitations). */
export async function joinGroupById(
  groupId: string,
  userId: string,
  displayName: string,
  avatarColor: string
): Promise<Group> {
  const doc = await databases.getDocument(DATABASE_ID, COLLECTION.GROUPS, groupId)
  const group = doc as unknown as Group

  const existing = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUP_MEMBERS, [
    Query.equal('groupId', groupId),
    Query.equal('userId', userId),
    Query.limit(1),
  ])
  if (existing.documents.length > 0) return group

  await databases.createDocument(DATABASE_ID, COLLECTION.GROUP_MEMBERS, ID.unique(), {
    groupId,
    userId,
    displayName,
    avatarColor,
    role: 'member',
    joinedAt: new Date().toISOString(),
  })

  await databases.updateDocument(DATABASE_ID, COLLECTION.GROUPS, groupId, {
    memberCount: group.memberCount + 1,
  })

  return { ...group, memberCount: group.memberCount + 1 }
}

/** Leave a group. Removes membership doc and decrements memberCount. */
export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUP_MEMBERS, [
    Query.equal('groupId', groupId),
    Query.equal('userId', userId),
    Query.limit(1),
  ])
  if (res.documents.length > 0) {
    await databases.deleteDocument(DATABASE_ID, COLLECTION.GROUP_MEMBERS, res.documents[0].$id)
    try {
      const group = await getGroup(groupId)
      await databases.updateDocument(DATABASE_ID, COLLECTION.GROUPS, groupId, {
        memberCount: Math.max(0, (group.memberCount || 1) - 1),
      })
    } catch { /* ignore */ }
  }
}

/** List all members of a group. */
export async function listGroupMembers(groupId: string): Promise<GroupMember[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUP_MEMBERS, [
    Query.equal('groupId', groupId),
    Query.limit(100),
  ])
  return res.documents as unknown as GroupMember[]
}

/** Remove a member from a group (admin action). Decrements memberCount. */
export async function removeGroupMember(memberId: string, groupId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.GROUP_MEMBERS, memberId)
  try {
    const group = await getGroup(groupId)
    await databases.updateDocument(DATABASE_ID, COLLECTION.GROUPS, groupId, {
      memberCount: Math.max(0, (group.memberCount || 1) - 1),
    })
  } catch { /* ignore */ }
}

// ─── Group Messages ──────────────────────────────────────────────────────────

/** Send a message to a group chat (text, image, gif, sticker, or workout share). */
export async function sendGroupMessage(
  groupId: string,
  userId: string,
  userName: string,
  avatarColor: string,
  text: string,
  type: 'message' | 'workout_share' | 'image' | 'gif' | 'sticker' = 'message',
  workoutData: string | null = null,
  mediaUrl: string | null = null
): Promise<GroupMessage> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.GROUP_MESSAGES, ID.unique(), {
    groupId, userId, userName, avatarColor,
    text: text || '',
    type,
    workoutData: workoutData || '',
    mediaUrl: mediaUrl || '',
  })
  return doc as unknown as GroupMessage
}

/** List group messages, newest first. */
export async function listGroupMessages(groupId: string, limit = 50): Promise<GroupMessage[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUP_MESSAGES, [
    Query.equal('groupId', groupId),
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as GroupMessage[]
}

/** Share a workout to multiple groups. Sends a workout_share message to each. */
export async function shareWorkoutToGroups(
  groupIds: string[],
  workoutData: string,
  text: string,
  userId: string,
  userName: string,
  avatarColor: string
): Promise<void> {
  for (const groupId of groupIds) {
    await sendGroupMessage(groupId, userId, userName, avatarColor, text, 'workout_share', workoutData)
  }
}

/** Get the most recent message in a group (for preview). */
export async function getLastGroupMessage(groupId: string): Promise<GroupMessage | null> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUP_MESSAGES, [
    Query.equal('groupId', groupId),
    Query.orderDesc('$createdAt'),
    Query.limit(1),
  ])
  return (res.documents[0] as unknown as GroupMessage) ?? null
}

// ─── Group Invitations ───────────────────────────────────────────────────────

/** Send a group invitation to a user. */
export async function sendGroupInvitation(data: {
  groupId: string
  groupName: string
  groupColor: string
  invitedBy: string
  inviterName: string
  invitedUserId: string
}): Promise<any> {
  return databases.createDocument(DATABASE_ID, COLLECTION.GROUP_INVITATIONS, ID.unique(), {
    ...data,
    status: 'pending',
  })
}

/** List pending invitations for a user. */
export async function listPendingInvitations(userId: string): Promise<any[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUP_INVITATIONS, [
    Query.equal('invitedUserId', userId),
    Query.equal('status', 'pending'),
    Query.orderDesc('$createdAt'),
  ])
  return res.documents
}

/** Accept or decline an invitation. */
export async function respondToInvitation(invitationId: string, status: 'accepted' | 'declined'): Promise<void> {
  await databases.updateDocument(DATABASE_ID, COLLECTION.GROUP_INVITATIONS, invitationId, { status })
}

/** Search user profiles by display name (fulltext search). */
export async function searchUsersByName(name: string): Promise<any[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.USER_PROFILES, [
    Query.search('displayName', name),
    Query.limit(10),
  ])
  return res.documents
}
