/**
 * Program & Program Day database operations.
 *
 * Handles CRUD for workout programs and their day configurations.
 * ⚠️ `program_days.exercises` is stored as a JSON string in Appwrite —
 * serialization/deserialization is handled transparently here.
 *
 * @module lib/db/programs
 */
import { databases, DATABASE_ID, COLLECTION, ID, Query } from '../appwrite'
import type { Program, ProgramDay } from '@/types'

// ─── Programs ────────────────────────────────────────────────────────────────

/** List all programs for a user, newest first. */
export async function listPrograms(userId: string): Promise<Program[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.PROGRAMS, [
    Query.equal('userId', userId),
    Query.orderDesc('$createdAt'),
  ])
  return res.documents as unknown as Program[]
}

/** Get a single program by ID. */
export async function getProgram(programId: string): Promise<Program> {
  const doc = await databases.getDocument(DATABASE_ID, COLLECTION.PROGRAMS, programId)
  return doc as unknown as Program
}

/** Create a new program. */
export async function createProgram(data: Omit<Program, '$id'>): Promise<Program> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.PROGRAMS, ID.unique(), data)
  return doc as unknown as Program
}

/** Update an existing program. */
export async function updateProgram(programId: string, data: Partial<Program>): Promise<Program> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION.PROGRAMS, programId, data)
  return doc as unknown as Program
}

/** Delete a program. Does NOT cascade-delete program_days — caller must handle that. */
export async function deleteProgram(programId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.PROGRAMS, programId)
}

/** List public programs from all users for discover/search. */
export async function listPublicPrograms(searchQuery?: string, limit = 20): Promise<Program[]> {
  const queries = [
    Query.equal('isPublic', true),
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
  ]
  if (searchQuery) {
    queries.push(Query.search('name', searchQuery))
  }
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.PROGRAMS, queries)
  return res.documents as unknown as Program[]
}

/**
 * Clone a public program to the current user's programs.
 * Creates a new program and copies all days with exercises.
 */
export async function cloneProgram(sourceProgramId: string, userId: string, _creatorName: string): Promise<Program> {
  const source = await getProgram(sourceProgramId)
  const newProgram = await createProgram({
    userId,
    name: source.name,
    daysPerWeek: source.daysPerWeek,
    currentWeek: 1,
    totalWeeks: source.totalWeeks,
    color: source.color,
  })
  const sourceDays = await listProgramDays(sourceProgramId)
  for (const day of sourceDays) {
    await createProgramDay({
      programId: newProgram.$id,
      userId,
      name: day.name,
      order: day.order,
      exercises: day.exercises,
    })
  }
  return newProgram
}

// ─── Program Days ────────────────────────────────────────────────────────────

/**
 * List all days for a program, ordered by `order` field.
 * ⚠️ Automatically parses `exercises` from JSON string to ProgramExercise[].
 */
export async function listProgramDays(programId: string): Promise<ProgramDay[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION.PROGRAM_DAYS, [
    Query.equal('programId', programId),
    Query.orderAsc('order'),
  ])
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
 */
export async function createProgramDay(data: Omit<ProgramDay, '$id'>): Promise<ProgramDay> {
  const payload = {
    ...data,
    exercises: typeof data.exercises === 'string' ? data.exercises : JSON.stringify(data.exercises ?? []),
  }
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION.PROGRAM_DAYS, ID.unique(), payload)
  const parsed = doc as unknown as ProgramDay
  if (typeof (parsed as any).exercises === 'string') {
    try { parsed.exercises = JSON.parse((parsed as any).exercises) } catch { parsed.exercises = [] }
  }
  return parsed
}

/**
 * Update a program day (name, exercises, order, etc.).
 * ⚠️ If `exercises` is provided, it's automatically serialized to JSON string.
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

/** Delete a program day. */
export async function deleteProgramDay(dayId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION.PROGRAM_DAYS, dayId)
}
