/**
 * Workout Session & Set database operations.
 *
 * Handles creating/completing sessions, logging individual sets,
 * and querying exercise history for progressive overload hints.
 *
 * @module lib/db/workouts
 */
import { databases, DATABASE_ID, COLLECTION, ID, Query } from '../appwrite'
import type { WorkoutSession, WorkoutSet } from '@/types'

// ─── Workout Sessions ────────────────────────────────────────────────────────

/** Create a workout session. Called when a workout starts. */
export async function createWorkoutSession(data: Omit<WorkoutSession, '$id'>): Promise<WorkoutSession> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.WORKOUT_SESSIONS, ID.unique(), data)
  return doc as unknown as WorkoutSession
}

/** Mark a workout session as completed with final stats. */
export async function completeWorkoutSession(
  sessionId: string,
  stats: { completedAt: string; totalVolume: number; duration: number }
): Promise<WorkoutSession> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION.WORKOUT_SESSIONS, sessionId, stats)
  return doc as unknown as WorkoutSession
}

/** List workout sessions for a user, newest first. */
export async function listWorkoutSessions(userId: string, limit = 20): Promise<WorkoutSession[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.WORKOUT_SESSIONS, [
    Query.equal('userId', userId),
    Query.orderDesc('startedAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as WorkoutSession[]
}

/** Get recent completed sessions (excludes in-progress ones). */
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

/** Create a completed set record within a workout session. */
export async function createWorkoutSet(data: Omit<WorkoutSet, '$id'>): Promise<WorkoutSet> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.WORKOUT_SETS, ID.unique(), data)
  return doc as unknown as WorkoutSet
}

/** Update a workout set. */
export async function updateWorkoutSet(setId: string, data: Partial<WorkoutSet>): Promise<WorkoutSet> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION.WORKOUT_SETS, setId, data)
  return doc as unknown as WorkoutSet
}

/** List all sets for a workout session, ordered by set number. */
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
 */
export async function getExerciseHistory(userId: string, exerciseId: string, limit = 50): Promise<WorkoutSet[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.WORKOUT_SETS, [
    Query.equal('userId', userId),
    Query.equal('exerciseId', exerciseId),
    Query.equal('isCompleted', true),
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as WorkoutSet[]
}
