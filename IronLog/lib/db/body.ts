/**
 * Body Stats, Cardio, and Progress Photo database operations.
 *
 * @module lib/db/body
 */
import { databases, DATABASE_ID, COLLECTION, ID, Query } from '../appwrite'
import type { BodyStat, CardioSession, ProgressPhoto } from '@/types'

// ─── Body Stats ──────────────────────────────────────────────────────────────

/** List body stat records for a user, newest first. */
export async function listBodyStats(userId: string, limit = 50): Promise<BodyStat[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.BODY_STATS, [
    Query.equal('userId', userId),
    Query.orderDesc('recordedAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as BodyStat[]
}

/** Create a body stat measurement. */
export async function createBodyStat(data: Omit<BodyStat, '$id'>): Promise<BodyStat> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.BODY_STATS, ID.unique(), data)
  return doc as unknown as BodyStat
}

/** Delete a body stat record. */
export async function deleteBodyStat(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.BODY_STATS, id)
}

// ─── Cardio Sessions ─────────────────────────────────────────────────────────

/** List cardio sessions for a user, newest first. */
export async function listCardioSessions(userId: string, limit = 50): Promise<CardioSession[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.CARDIO_SESSIONS, [
    Query.equal('userId', userId),
    Query.orderDesc('startedAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as CardioSession[]
}

/** Create a cardio session. */
export async function createCardioSession(data: Omit<CardioSession, '$id'>): Promise<CardioSession> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.CARDIO_SESSIONS, ID.unique(), data)
  return doc as unknown as CardioSession
}

/** Delete a cardio session. */
export async function deleteCardioSession(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.CARDIO_SESSIONS, id)
}

// ─── Progress Photos ─────────────────────────────────────────────────────────

/** List progress photos for a user, newest first. */
export async function listProgressPhotos(userId: string, limit = 50): Promise<ProgressPhoto[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.PROGRESS_PHOTOS, [
    Query.equal('userId', userId),
    Query.orderDesc('takenAt'),
    Query.limit(limit),
  ])
  return res.documents as unknown as ProgressPhoto[]
}

/** Create a progress photo entry. */
export async function createProgressPhoto(data: Omit<ProgressPhoto, '$id'>): Promise<ProgressPhoto> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.PROGRESS_PHOTOS, ID.unique(), data)
  return doc as unknown as ProgressPhoto
}

/** Delete a progress photo entry. */
export async function deleteProgressPhoto(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.PROGRESS_PHOTOS, id)
}
