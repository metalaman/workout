/**
 * Personal Record database operations.
 *
 * Tracks per-exercise 1RM personal records using the Epley formula.
 * Automatically creates or updates records when a new PR is detected.
 *
 * @module lib/db/records
 */
import { databases, DATABASE_ID, COLLECTION, ID, Query } from '../appwrite'
import { calculate1RM } from '../utils'
import type { PersonalRecord } from '@/types'

/** List all personal records for a user, sorted by estimated 1RM descending. */
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
 *
 * @returns { isNewPR, record } — whether a new PR was set and the current record
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
