/**
 * Nutrition database operations — profiles and food logs.
 *
 * @module lib/db/nutrition
 */
import { databases, DATABASE_ID, COLLECTION, ID, Query } from '../appwrite'
import type { NutritionProfile, FoodLogEntry } from '@/types'

// ─── Nutrition Profiles ──────────────────────────────────────────────────────

/** Get a user's nutrition profile (onboarding data + calculated targets). */
export async function getNutritionProfile(userId: string): Promise<NutritionProfile | null> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.NUTRITION_PROFILES, [
    Query.equal('userId', userId),
    Query.limit(1),
  ])
  return (res.documents[0] as unknown as NutritionProfile) ?? null
}

/** Create a nutrition profile after onboarding. */
export async function createNutritionProfile(data: Omit<NutritionProfile, '$id'>): Promise<NutritionProfile> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.NUTRITION_PROFILES, ID.unique(), data)
  return doc as unknown as NutritionProfile
}

/** Update an existing nutrition profile. */
export async function updateNutritionProfile(profileId: string, data: Partial<NutritionProfile>): Promise<NutritionProfile> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION.NUTRITION_PROFILES, profileId, data)
  return doc as unknown as NutritionProfile
}

/** Delete a nutrition profile. */
export async function deleteNutritionProfile(profileId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.NUTRITION_PROFILES, profileId)
}

// ─── Food Logs ───────────────────────────────────────────────────────────────

/** List food log entries for a user on a specific date. */
export async function listFoodLogs(userId: string, date: string): Promise<FoodLogEntry[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.FOOD_LOGS, [
    Query.equal('userId', userId),
    Query.equal('date', date),
    Query.orderAsc('loggedAt'),
  ])
  return res.documents as unknown as FoodLogEntry[]
}

/** List food log entries for a user across a date range. */
export async function listFoodLogsForDates(userId: string, dates: string[]): Promise<FoodLogEntry[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.FOOD_LOGS, [
    Query.equal('userId', userId),
    Query.equal('date', dates),
    Query.orderAsc('loggedAt'),
    Query.limit(500),
  ])
  return res.documents as unknown as FoodLogEntry[]
}

/** Create a food log entry. */
export async function createFoodLog(data: Omit<FoodLogEntry, '$id'>): Promise<FoodLogEntry> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.FOOD_LOGS, ID.unique(), data)
  return doc as unknown as FoodLogEntry
}

/** Update a food log entry (e.g., change servings). */
export async function updateFoodLog(logId: string, data: Partial<FoodLogEntry>): Promise<FoodLogEntry> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION.FOOD_LOGS, logId, data)
  return doc as unknown as FoodLogEntry
}

/** Delete a food log entry. */
export async function deleteFoodLog(logId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.FOOD_LOGS, logId)
}
