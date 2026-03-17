/**
 * Program Types
 *
 * Types for workout programs and their day/exercise structure.
 * Programs are user-created training plans (e.g., "Push Pull Legs").
 *
 * @module types/program
 */

/**
 * A single set configuration within a program exercise.
 * This is the *planned* set — not a completed set (see WorkoutSet for that).
 */
export interface ProgramSet {
  /** Target weight in lbs */
  weight: number
  /** Target rep count */
  reps: number
  /** Whether this set is marked as a drop set */
  isDropSet?: boolean
}

/**
 * An exercise configured within a program day.
 *
 * ⚠️ When stored in Appwrite (program_days.exercises), the entire array is
 * JSON-serialized to a string. The database.ts layer handles this automatically.
 */
export interface ProgramExercise {
  /** References an exercise ID (from SEED_EXERCISES or exercises collection) */
  exerciseId: string
  /** Display name (denormalized for convenience) */
  exerciseName: string
  /** Configured sets with target weight/reps */
  sets: ProgramSet[]
  /** Superset group number — exercises with the same group # are supersetted */
  supersetGroup?: number
  /** Rest time between sets in seconds */
  restSeconds?: number
  /** Optional notes for this exercise */
  notes?: string
}

/**
 * A single day within a program (e.g., "Push Day A").
 * Stored in the `program_days` Appwrite collection.
 *
 * ⚠️ The `exercises` field is stored as a JSON string in Appwrite.
 * database.ts handles serialization/deserialization.
 */
export interface ProgramDay {
  /** Appwrite document ID */
  $id: string
  /** Parent program ID */
  programId: string
  /** Owner user ID */
  userId: string
  /** Day name (e.g., "Push Day A", "Leg Day") */
  name: string
  /** Display order (0-indexed) */
  order: number
  /** Exercises for this day */
  exercises: ProgramExercise[]
}

/**
 * A workout program (e.g., "Push Pull Legs", "Upper Lower").
 * Stored in the `programs` Appwrite collection.
 */
export interface Program {
  /** Appwrite document ID (or "local-xxx" for dev mode) */
  $id: string
  /** Owner user ID */
  userId: string
  /** Program name */
  name: string
  /** How many workout days per week (1-7) */
  daysPerWeek: number
  /** Current week in the program cycle */
  currentWeek: number
  /** Total planned weeks (0 = indefinite) */
  totalWeeks: number
  /** UI color for this program (hex, e.g., "#ff6b6b") — used in week view rings */
  color?: string
}
