/**
 * User Profile database operations.
 *
 * Handles user profile CRUD and workout streak tracking.
 *
 * @module lib/db/profile
 */
import { databases, DATABASE_ID, COLLECTION, Query } from '../appwrite'
import type { UserProfile } from '@/types'

/** Get a user profile by userId (queries by userId field, not doc ID). */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.USER_PROFILES, [
    Query.equal('userId', userId),
  ])
  return (res.documents[0] as unknown as UserProfile) ?? null
}

/** Update a user profile by document ID. */
export async function updateUserProfile(profileId: string, data: Partial<UserProfile>): Promise<UserProfile> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION.USER_PROFILES, profileId, data)
  return doc as unknown as UserProfile
}

/**
 * Update workout streak after completing a workout.
 * Increments streak if within 7 days of last workout, resets to 1 if > 7 days.
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
    streakCount = 1
  } else if (daysSinceLast >= 1) {
    streakCount += 1
  }

  return updateUserProfile(profileId, {
    streakCount,
    lastWorkoutDate: now.toISOString(),
  })
}
