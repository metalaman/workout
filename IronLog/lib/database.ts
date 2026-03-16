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

export async function listPrograms(userId: string): Promise<Program[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.PROGRAMS, [
    Query.equal('userId', userId),
    Query.orderDesc('$createdAt'),
  ])
  return res.documents as unknown as Program[]
}

export async function getProgram(programId: string): Promise<Program> {
  const doc = await databases.getDocument(DATABASE_ID, COLLECTION.PROGRAMS, programId)
  return doc as unknown as Program
}

export async function createProgram(data: Omit<Program, '$id'>): Promise<Program> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.PROGRAMS, ID.unique(), data)
  return doc as unknown as Program
}

export async function updateProgram(programId: string, data: Partial<Program>): Promise<Program> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION.PROGRAMS, programId, data)
  return doc as unknown as Program
}

export async function deleteProgram(programId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.PROGRAMS, programId)
}

// ─── Program Days ────────────────────────────────────────────────────────────

export async function listProgramDays(programId: string): Promise<ProgramDay[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.PROGRAM_DAYS, [
    Query.equal('programId', programId),
    Query.orderAsc('order'),
  ])
  return res.documents as unknown as ProgramDay[]
}

export async function createProgramDay(data: Omit<ProgramDay, '$id'>): Promise<ProgramDay> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.PROGRAM_DAYS, ID.unique(), data)
  return doc as unknown as ProgramDay
}

export async function updateProgramDay(dayId: string, data: Partial<ProgramDay>): Promise<ProgramDay> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION.PROGRAM_DAYS, dayId, data)
  return doc as unknown as ProgramDay
}

export async function deleteProgramDay(dayId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.PROGRAM_DAYS, dayId)
}

// ─── Workout Sessions ────────────────────────────────────────────────────────

export async function createWorkoutSession(data: Omit<WorkoutSession, '$id'>): Promise<WorkoutSession> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.WORKOUT_SESSIONS, ID.unique(), data)
  return doc as unknown as WorkoutSession
}

export async function completeWorkoutSession(
  sessionId: string,
  stats: { completedAt: string; totalVolume: number; duration: number }
): Promise<WorkoutSession> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION.WORKOUT_SESSIONS, sessionId, stats)
  return doc as unknown as WorkoutSession
}

export async function listWorkoutSessions(userId: string, limit = 20): Promise<WorkoutSession[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.WORKOUT_SESSIONS, [
    Query.equal('userId', userId),
    Query.orderDesc('startedAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as WorkoutSession[]
}

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

export async function createWorkoutSet(data: Omit<WorkoutSet, '$id'>): Promise<WorkoutSet> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.WORKOUT_SETS, ID.unique(), data)
  return doc as unknown as WorkoutSet
}

export async function updateWorkoutSet(
  setId: string,
  data: Partial<WorkoutSet>
): Promise<WorkoutSet> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION.WORKOUT_SETS, setId, data)
  return doc as unknown as WorkoutSet
}

export async function listWorkoutSets(sessionId: string): Promise<WorkoutSet[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.WORKOUT_SETS, [
    Query.equal('sessionId', sessionId),
    Query.orderAsc('setNumber'),
  ])
  return res.documents as unknown as WorkoutSet[]
}

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

export async function listPersonalRecords(userId: string): Promise<PersonalRecord[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.PERSONAL_RECORDS, [
    Query.equal('userId', userId),
    Query.orderDesc('estimated1RM'),
  ])
  return res.documents as unknown as PersonalRecord[]
}

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

export async function listSocialPosts(limit = 20): Promise<SocialPost[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.SOCIAL_POSTS, [
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as SocialPost[]
}

export async function createSocialPost(data: Omit<SocialPost, '$id' | '$createdAt'>): Promise<SocialPost> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.SOCIAL_POSTS, ID.unique(), data)
  return doc as unknown as SocialPost
}

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

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.USER_PROFILES, [
    Query.equal('userId', userId),
  ])
  return (res.documents[0] as unknown as UserProfile) ?? null
}

export async function updateUserProfile(
  profileId: string,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION.USER_PROFILES, profileId, data)
  return doc as unknown as UserProfile
}

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

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

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

export async function getGroup(groupId: string): Promise<Group> {
  const doc = await databases.getDocument(DATABASE_ID, COLLECTION.GROUPS, groupId)
  return doc as unknown as Group
}

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

export async function listGroupMembers(groupId: string): Promise<GroupMember[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUP_MEMBERS, [
    Query.equal('groupId', groupId),
    Query.limit(100),
  ])
  return res.documents as unknown as GroupMember[]
}

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

export async function sendGroupMessage(
  groupId: string,
  userId: string,
  userName: string,
  avatarColor: string,
  text: string,
  type: 'message' | 'workout_share' = 'message',
  workoutData: string | null = null
): Promise<GroupMessage> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.GROUP_MESSAGES, ID.unique(), {
    groupId,
    userId,
    userName,
    avatarColor,
    text: text || '',
    type,
    workoutData: workoutData || '',
  })
  return doc as unknown as GroupMessage
}

export async function listGroupMessages(groupId: string, limit = 50): Promise<GroupMessage[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUP_MESSAGES, [
    Query.equal('groupId', groupId),
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as GroupMessage[]
}

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

export async function getLastGroupMessage(groupId: string): Promise<GroupMessage | null> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.GROUP_MESSAGES, [
    Query.equal('groupId', groupId),
    Query.orderDesc('$createdAt'),
    Query.limit(1),
  ])
  return (res.documents[0] as unknown as GroupMessage) ?? null
}

// ─── Body Stats ──────────────────────────────────────────────────────────────

export async function listBodyStats(userId: string, limit = 50): Promise<BodyStat[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.BODY_STATS, [
    Query.equal('userId', userId),
    Query.orderDesc('recordedAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as BodyStat[]
}

export async function createBodyStat(data: Omit<BodyStat, '$id'>): Promise<BodyStat> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.BODY_STATS, ID.unique(), data)
  return doc as unknown as BodyStat
}

export async function deleteBodyStat(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.BODY_STATS, id)
}

// ─── Cardio Sessions ─────────────────────────────────────────────────────────

export async function listCardioSessions(userId: string, limit = 50): Promise<CardioSession[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.CARDIO_SESSIONS, [
    Query.equal('userId', userId),
    Query.orderDesc('startedAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as CardioSession[]
}

export async function createCardioSession(data: Omit<CardioSession, '$id'>): Promise<CardioSession> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.CARDIO_SESSIONS, ID.unique(), data)
  return doc as unknown as CardioSession
}

export async function deleteCardioSession(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.CARDIO_SESSIONS, id)
}

// ─── Progress Photos ─────────────────────────────────────────────────────────

export async function listProgressPhotos(userId: string, limit = 50): Promise<ProgressPhoto[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.PROGRESS_PHOTOS, [
    Query.equal('userId', userId),
    Query.orderDesc('takenAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as ProgressPhoto[]
}

export async function createProgressPhoto(data: Omit<ProgressPhoto, '$id'>): Promise<ProgressPhoto> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.PROGRESS_PHOTOS, ID.unique(), data)
  return doc as unknown as ProgressPhoto
}

export async function deleteProgressPhoto(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.PROGRESS_PHOTOS, id)
}
