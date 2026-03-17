/**
 * Database Operations
 *
 * All Appwrite CRUD operations for every collection. This is the single data access layer —
 * stores call these functions, never Appwrite directly.
 *
 * Key patterns:
 * - All functions return typed objects via `as unknown as T` casting from Appwrite Documents
 * - `program_days.exercises` is stored as a JSON string — serialized/deserialized here automatically
 * - Functions are grouped by domain: Programs, Sessions, Sets, PRs, Social, Groups, Body Stats, etc.
 *
 * @module lib/database
 */
import { databases, DATABASE_ID, COLLECTION, ID, Query } from './appwrite'
import { calculate1RM } from './utils'
import type {
  Program, ProgramDay, ProgramExercise,
  WorkoutSession, WorkoutSet,
  PersonalRecord, UserProfile, SocialPost,
  Group, GroupMember, GroupMessage,
  BodyStat, CardioSession, ProgressPhoto,
} from '@/types'

// ─── Programs ────────────────────────────────────────────────────────────────

/**
 * List all programs for a user, newest first.
 * @param userId - Appwrite Auth user ID
 * @returns Array of Program documents
 * @collection programs
 */
export async function listPrograms(userId: string): Promise<Program[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.PROGRAMS, [
    Query.equal('userId', userId),
    Query.orderDesc('$createdAt'),
  ])
  return res.documents as unknown as Program[]
}

/**
 * Get a single program by ID.
 * @param programId - Appwrite document ID
 * @collection programs
 */
export async function getProgram(programId: string): Promise<Program> {
  const doc = await databases.getDocument(DATABASE_ID, COLLECTION.PROGRAMS, programId)
  return doc as unknown as Program
}

/**
 * Create a new program.
 * @param data - Program fields (without $id — auto-generated)
 * @collection programs
 */
export async function createProgram(data: Omit<Program, '$id'>): Promise<Program> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.PROGRAMS, ID.unique(), data)
  return doc as unknown as Program
}

/**
 * Update an existing program.
 * @param programId - Document ID
 * @param data - Partial fields to update
 * @collection programs
 */
export async function updateProgram(programId: string, data: Partial<Program>): Promise<Program> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION.PROGRAMS, programId, data)
  return doc as unknown as Program
}

/**
 * Delete a program. Does NOT cascade-delete program_days — caller must handle that.
 * @param programId - Document ID
 * @collection programs
 */
export async function deleteProgram(programId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.PROGRAMS, programId)
}

// ─── Program Days ────────────────────────────────────────────────────────────

/**
 * List all days for a program, ordered by `order` field.
 * ⚠️ Automatically parses `exercises` from JSON string to ProgramExercise[].
 * @param programId - Parent program ID
 * @collection program_days
 */
export async function listProgramDays(programId: string): Promise<ProgramDay[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.PROGRAM_DAYS, [
    Query.equal('programId', programId),
    Query.orderAsc('order'),
  ])
  // Parse exercises from JSON string
  return (res.documents as unknown as ProgramDay[]).map((day) => ({
    ...day,
    exercises: typeof (day as any).exercises === 'string'
      ? (() => { try { return JSON.parse((day as any).exercises) } catch { return [] } })()
      : day.exercises ?? [],
  }))
}

/**
 * Create a new program day.
 * ⚠️ Automatically serializes `exercises` array to JSON string for Appwrite storage.
 * @param data - Day fields (exercises can be array — will be stringified)
 * @collection program_days
 */
export async function createProgramDay(data: Omit<ProgramDay, '$id'>): Promise<ProgramDay> {
  // Serialize exercises array to JSON string for Appwrite storage
  const payload = {
    ...data,
    exercises: typeof data.exercises === 'string' ? data.exercises : JSON.stringify(data.exercises ?? []),
  }
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.PROGRAM_DAYS, ID.unique(), payload)
  // Parse exercises back to array
  const parsed = doc as unknown as ProgramDay
  if (typeof (parsed as any).exercises === 'string') {
    try { parsed.exercises = JSON.parse((parsed as any).exercises) } catch { parsed.exercises = [] }
  }
  return parsed
}

/**
 * Update a program day (name, exercises, order, etc.).
 * ⚠️ If `exercises` is provided, it's automatically serialized to JSON string.
 * @param dayId - Document ID
 * @param data - Partial fields to update
 * @collection program_days
 */
export async function updateProgramDay(dayId: string, data: Partial<ProgramDay>): Promise<ProgramDay> {
  const payload = { ...data }
  if (payload.exercises !== undefined) {
    (payload as any).exercises = typeof payload.exercises === 'string' ? payload.exercises : JSON.stringify(payload.exercises ?? [])
  }
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION.PROGRAM_DAYS, dayId, payload)
  const parsed = doc as unknown as ProgramDay
  if (typeof (parsed as any).exercises === 'string') {
    try { parsed.exercises = JSON.parse((parsed as any).exercises) } catch { parsed.exercises = [] }
  }
  return parsed
}

/** Delete a program day. @collection program_days */
export async function deleteProgramDay(dayId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.PROGRAM_DAYS, dayId)
}

// ─── Workout Sessions ────────────────────────────────────────────────────────

/**
 * Create a workout session. Called when a workout starts.
 * @param data - Session fields (completedAt should be null initially)
 * @collection workout_sessions
 */
export async function createWorkoutSession(data: Omit<WorkoutSession, '$id'>): Promise<WorkoutSession> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.WORKOUT_SESSIONS, ID.unique(), data)
  return doc as unknown as WorkoutSession
}

/**
 * Mark a workout session as completed with final stats.
 * @param sessionId - Session document ID
 * @param stats - Completion data: timestamp, volume, duration
 * @collection workout_sessions
 */
export async function completeWorkoutSession(
  sessionId: string,
  stats: { completedAt: string; totalVolume: number; duration: number }
): Promise<WorkoutSession> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION.WORKOUT_SESSIONS, sessionId, stats)
  return doc as unknown as WorkoutSession
}

/**
 * List workout sessions for a user, newest first.
 * @param userId - User ID
 * @param limit - Max results (default 20)
 * @collection workout_sessions
 */
export async function listWorkoutSessions(userId: string, limit = 20): Promise<WorkoutSession[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.WORKOUT_SESSIONS, [
    Query.equal('userId', userId),
    Query.orderDesc('startedAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as WorkoutSession[]
}

/**
 * Get recent completed sessions (excludes in-progress ones).
 * @param userId - User ID
 * @param limit - Max results (default 3)
 * @collection workout_sessions
 */
export async function getRecentSessions(userId: string, limit = 3): Promise<WorkoutSession[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.WORKOUT_SESSIONS, [
    Query.equal('userId', userId),
    Query.isNotNull('completedAt'),
    Query.orderDesc('completedAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as WorkoutSession[]
}

// ─── Workout Sets ────────────────────────────────────────────────────────────

/**
 * Create a completed set record within a workout session.
 * @param data - Set data (sessionId, exerciseId, weight, reps, etc.)
 * @collection workout_sets
 */
export async function createWorkoutSet(data: Omit<WorkoutSet, '$id'>): Promise<WorkoutSet> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.WORKOUT_SETS, ID.unique(), data)
  return doc as unknown as WorkoutSet
}

/** Update a workout set. @collection workout_sets */
export async function updateWorkoutSet(
  setId: string,
  data: Partial<WorkoutSet>
): Promise<WorkoutSet> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION.WORKOUT_SETS, setId, data)
  return doc as unknown as WorkoutSet
}

/**
 * List all sets for a workout session, ordered by set number.
 * @param sessionId - Parent session ID
 * @collection workout_sets
 */
export async function listWorkoutSets(sessionId: string): Promise<WorkoutSet[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.WORKOUT_SETS, [
    Query.equal('sessionId', sessionId),
    Query.orderAsc('setNumber'),
  ])
  return res.documents as unknown as WorkoutSet[]
}

/**
 * Get exercise history — all completed sets for a specific exercise, newest first.
 * Used for "Last:" hints in the active workout screen.
 * @param userId - User ID
 * @param exerciseId - Exercise ID
 * @param limit - Max results (default 50)
 * @collection workout_sets
 */
export async function getExerciseHistory(
  userId: string,
  exerciseId: string,
  limit = 50
): Promise<WorkoutSet[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.WORKOUT_SETS, [
    Query.equal('userId', userId),
    Query.equal('exerciseId', exerciseId),
    Query.equal('isCompleted', true),
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as WorkoutSet[]
}

// ─── Personal Records ────────────────────────────────────────────────────────

/**
 * List all personal records for a user, sorted by estimated 1RM descending.
 * @param userId - User ID
 * @collection personal_records
 */
export async function listPersonalRecords(userId: string): Promise<PersonalRecord[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.PERSONAL_RECORDS, [
    Query.equal('userId', userId),
    Query.orderDesc('estimated1RM'),
  ])
  return res.documents as unknown as PersonalRecord[]
}

/**
 * Check if a set constitutes a new personal record, and update/create as needed.
 * Uses Epley formula: est1RM = weight × (1 + reps/30).
 * Compares against existing PR for this user+exercise.
 *
 * @param userId - User ID
 * @param exerciseId - Exercise ID
 * @param exerciseName - Exercise name (denormalized into PR record)
 * @param weight - Weight lifted
 * @param reps - Reps performed
 * @returns { isNewPR: boolean, record: PersonalRecord | null }
 * @collection personal_records
 */
export async function checkAndUpdatePR(
  userId: string,
  exerciseId: string,
  exerciseName: string,
  weight: number,
  reps: number
): Promise<{ isNewPR: boolean; record: PersonalRecord | null }> {
  const est1RM = calculate1RM(weight, reps)

  const existing = await databases.listDocuments(DATABASE_ID, COLLECTION.PERSONAL_RECORDS, [
    Query.equal('userId', userId),
    Query.equal('exerciseId', exerciseId),
  ])

  if (existing.documents.length > 0) {
    const current = existing.documents[0] as unknown as PersonalRecord
    if (est1RM > current.estimated1RM) {
      const doc = await databases.updateDocument(
        DATABASE_ID, COLLECTION.PERSONAL_RECORDS, current.$id,
        { weight, reps, estimated1RM: est1RM, achievedAt: new Date().toISOString() }
      )
      return { isNewPR: true, record: doc as unknown as PersonalRecord }
    }
    return { isNewPR: false, record: current }
  }

  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.PERSONAL_RECORDS, ID.unique(), {
    userId, exerciseId, exerciseName, weight, reps, estimated1RM: est1RM,
    achievedAt: new Date().toISOString(),
  })
  return { isNewPR: true, record: doc as unknown as PersonalRecord }
}

// ─── Social Posts ────────────────────────────────────────────────────────────

/** List social feed posts, newest first. @collection social_posts */
export async function listSocialPosts(limit = 20): Promise<SocialPost[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.SOCIAL_POSTS, [
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as SocialPost[]
}

/** Create a social feed post. @collection social_posts */
export async function createSocialPost(data: Omit<SocialPost, '$id' | '$createdAt'>): Promise<SocialPost> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.SOCIAL_POSTS, ID.unique(), data)
  return doc as unknown as SocialPost
}

/** Toggle like on a post. Adds/removes userId from likedBy array. @collection social_posts */
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

// ─── User Profiles ───────────────────────────────────────────────────────────

/** Get a user profile by userId (queries by userId field, not doc ID). @collection user_profiles */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.USER_PROFILES, [
    Query.equal('userId', userId),
  ])
  return (res.documents[0] as unknown as UserProfile) ?? null
}

/** Update a user profile by document ID. @collection user_profiles */
export async function updateUserProfile(
  profileId: string,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION.USER_PROFILES, profileId, data)
  return doc as unknown as UserProfile
}

/**
 * Update workout streak after completing a workout.
 * Increments streak if within 7 days of last workout, resets to 1 if > 7 days.
 * @collection user_profiles
 */
export async function updateStreak(userId: string, profileId: string): Promise<UserProfile> {
  const profile = await getUserProfile(userId)
  if (!profile) throw new Error('Profile not found')

  const now = new Date()
  const lastWorkout = profile.lastWorkoutDate ? new Date(profile.lastWorkoutDate) : null
  const daysSinceLast = lastWorkout
    ? Math.floor((now.getTime() - lastWorkout.getTime()) / 86400000)
    : Infinity

  let streakCount = profile.streakCount
  if (daysSinceLast > 7) {
    streakCount = 1 // reset streak
  } else if (daysSinceLast >= 1) {
    streakCount += 1
  }

  return updateUserProfile(profileId, {
    streakCount,
    lastWorkoutDate: now.toISOString(),
  })
}

// ─── Groups ──────────────────────────────────────────────────────────────────

/** Generate a 6-character alphanumeric invite code (excludes ambiguous chars like O, 0, I, 1). */
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
 * @collection groups, group_members
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

  // Auto-add creator as admin
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

/** Get a single group by ID. @collection groups */
export async function getGroup(groupId: string): Promise<Group> {
  const doc = await databases.getDocument(DATABASE_ID, COLLECTION.GROUPS, groupId)
  return doc as unknown as Group
}

/**
 * List all groups a user belongs to.
 * ⚠️ N+1 query pattern: fetches memberships first, then each group individually.
 * @collection group_members, groups
 */
export async function listUserGroups(userId: string): Promise<Group[]> {
  // First find all group memberships
  const memberships = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUP_MEMBERS, [
    Query.equal('userId', userId),
    Query.limit(50),
  ])
  const groupIds = memberships.documents.map((d: any) => d.groupId as string)
  if (groupIds.length === 0) return []

  // Fetch each group
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

/**
 * Join a group by invite code. Checks if already a member. Increments memberCount.
 * @param code - 6-char invite code (case-insensitive)
 * @throws Error if code is invalid
 * @collection groups, group_members
 */
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

  // Check if already a member
  const existing = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUP_MEMBERS, [
    Query.equal('groupId', group.$id),
    Query.equal('userId', userId),
    Query.limit(1),
  ])
  if (existing.documents.length > 0) return group // already joined

  await databases.createDocument(DATABASE_ID, COLLECTION.GROUP_MEMBERS, ID.unique(), {
    groupId: group.$id,
    userId,
    displayName,
    avatarColor,
    role: 'member',
    joinedAt: new Date().toISOString(),
  })

  // Increment member count
  await databases.updateDocument(DATABASE_ID, COLLECTION.GROUPS, group.$id, {
    memberCount: (group.memberCount || 1) + 1,
  })

  return { ...group, memberCount: (group.memberCount || 1) + 1 }
}

/**
 * Leave a group. Removes membership doc and decrements memberCount.
 * @collection group_members, groups
 */
export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUP_MEMBERS, [
    Query.equal('groupId', groupId),
    Query.equal('userId', userId),
    Query.limit(1),
  ])
  if (res.documents.length > 0) {
    await databases.deleteDocument(DATABASE_ID, COLLECTION.GROUP_MEMBERS, res.documents[0].$id)
    // Decrement member count
    try {
      const group = await getGroup(groupId)
      await databases.updateDocument(DATABASE_ID, COLLECTION.GROUPS, groupId, {
        memberCount: Math.max(0, (group.memberCount || 1) - 1),
      })
    } catch {
      // ignore
    }
  }
}

/** List all members of a group. @collection group_members */
export async function listGroupMembers(groupId: string): Promise<GroupMember[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUP_MEMBERS, [
    Query.equal('groupId', groupId),
    Query.limit(100),
  ])
  return res.documents as unknown as GroupMember[]
}

/** Remove a member from a group (admin action). Decrements memberCount. @collection group_members, groups */
export async function removeGroupMember(memberId: string, groupId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.GROUP_MEMBERS, memberId)
  try {
    const group = await getGroup(groupId)
    await databases.updateDocument(DATABASE_ID, COLLECTION.GROUPS, groupId, {
      memberCount: Math.max(0, (group.memberCount || 1) - 1),
    })
  } catch {
    // ignore
  }
}

// ─── Group Messages ──────────────────────────────────────────────────────────

/**
 * Send a message to a group chat.
 * @param type - 'message' for text, 'workout_share' for shared workout
 * @param workoutData - JSON string of WorkoutShareData (only for workout_share type)
 * @collection group_messages
 */
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
    groupId,
    userId,
    userName,
    avatarColor,
    text: text || '',
    type,
    workoutData: workoutData || '',
    mediaUrl: mediaUrl || '',
  })
  return doc as unknown as GroupMessage
}

/** List group messages, newest first. @collection group_messages */
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

/** Get the most recent message in a group (for preview). @collection group_messages */
export async function getLastGroupMessage(groupId: string): Promise<GroupMessage | null> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUP_MESSAGES, [
    Query.equal('groupId', groupId),
    Query.orderDesc('$createdAt'),
    Query.limit(1),
  ])
  return (res.documents[0] as unknown as GroupMessage) ?? null
}

// ─── Body Stats ──────────────────────────────────────────────────────────────

/** List body stat records for a user, newest first. @collection body_stats */
export async function listBodyStats(userId: string, limit = 50): Promise<BodyStat[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.BODY_STATS, [
    Query.equal('userId', userId),
    Query.orderDesc('recordedAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as BodyStat[]
}

/** Create a body stat measurement. @collection body_stats */
export async function createBodyStat(data: Omit<BodyStat, '$id'>): Promise<BodyStat> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.BODY_STATS, ID.unique(), data)
  return doc as unknown as BodyStat
}

/** Delete a body stat record. @collection body_stats */
export async function deleteBodyStat(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.BODY_STATS, id)
}

// ─── Cardio Sessions ─────────────────────────────────────────────────────────

/** List cardio sessions for a user, newest first. @collection cardio_sessions */
export async function listCardioSessions(userId: string, limit = 50): Promise<CardioSession[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.CARDIO_SESSIONS, [
    Query.equal('userId', userId),
    Query.orderDesc('startedAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as CardioSession[]
}

/** Create a cardio session. @collection cardio_sessions */
export async function createCardioSession(data: Omit<CardioSession, '$id'>): Promise<CardioSession> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.CARDIO_SESSIONS, ID.unique(), data)
  return doc as unknown as CardioSession
}

/** Delete a cardio session. @collection cardio_sessions */
export async function deleteCardioSession(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.CARDIO_SESSIONS, id)
}

// ─── Progress Photos ─────────────────────────────────────────────────────────

/** List progress photos for a user, newest first. @collection progress_photos */
export async function listProgressPhotos(userId: string, limit = 50): Promise<ProgressPhoto[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.PROGRESS_PHOTOS, [
    Query.equal('userId', userId),
    Query.orderDesc('takenAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as ProgressPhoto[]
}

/** Create a progress photo entry. @collection progress_photos */
export async function createProgressPhoto(data: Omit<ProgressPhoto, '$id'>): Promise<ProgressPhoto> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.PROGRESS_PHOTOS, ID.unique(), data)
  return doc as unknown as ProgressPhoto
}

/** Delete a progress photo entry. @collection progress_photos */
export async function deleteProgressPhoto(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.PROGRESS_PHOTOS, id)
}

// ─── Group Invitations ───────────────────────────────────────────────────────

/**
 * Send a group invitation to a user.
 * @param data - Invitation data (groupId, groupName, groupColor, invitedBy, inviterName, invitedUserId)
 * @collection group_invitations
 */
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

/** List pending invitations for a user. @collection group_invitations */
export async function listPendingInvitations(userId: string): Promise<any[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUP_INVITATIONS, [
    Query.equal('invitedUserId', userId),
    Query.equal('status', 'pending'),
    Query.orderDesc('$createdAt'),
  ])
  return res.documents
}

/** Accept or decline an invitation. @collection group_invitations */
export async function respondToInvitation(invitationId: string, status: 'accepted' | 'declined'): Promise<void> {
  await databases.updateDocument(DATABASE_ID, COLLECTION.GROUP_INVITATIONS, invitationId, { status })
}

/**
 * Search user profiles by display name (fulltext search).
 * Requires a fulltext index on displayName in Appwrite.
 * @collection user_profiles
 */
export async function searchUsersByName(name: string): Promise<any[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.USER_PROFILES, [
    Query.search('displayName', name),
    Query.limit(10),
  ])
  return res.documents
}

/**
 * Join a group directly by group ID (used for accepting invitations).
 * Similar to joinGroupByCode but skips invite code lookup.
 * @collection groups, group_members
 */
export async function joinGroupById(
  groupId: string,
  userId: string,
  displayName: string,
  avatarColor: string
): Promise<Group> {
  const doc = await databases.getDocument(DATABASE_ID, COLLECTION.GROUPS, groupId)
  const group = doc as unknown as Group

  // Check if already a member
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

  // Increment member count
  await databases.updateDocument(DATABASE_ID, COLLECTION.GROUPS, groupId, {
    memberCount: group.memberCount + 1,
  })

  return { ...group, memberCount: group.memberCount + 1 }
}
