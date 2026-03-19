/**
 * Exercise database operations — custom exercise CRUD.
 *
 * @module lib/db/exercises
 */
import { databases, DATABASE_ID, COLLECTION, ID, Query } from '../appwrite'

/** Create a custom exercise. */
export async function createExercise(data: {
  name: string
  muscleGroup: string
  secondaryMuscles: string[]
  equipment: string
  difficulty: string
  instructions: string
  icon: string
  userId: string
  isCustom: boolean
}) {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.EXERCISES, ID.unique(), data)
  return doc as any
}

/** List custom exercises for a user. */
export async function listCustomExercises(userId: string) {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.EXERCISES, [
    Query.equal('userId', userId),
    Query.equal('isCustom', true),
    Query.limit(100),
  ])
  return res.documents as any[]
}
