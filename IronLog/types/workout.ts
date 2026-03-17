/**
 * Workout Types
 *
 * Types for workout sessions (completed/in-progress), individual sets,
 * and the active workout state.
 *
 * @module types/workout
 */

/**
 * A persistent set record stored in Appwrite `workout_sets` collection.
 * Created when a set is completed during an active workout.
 */
export interface WorkoutSet {
  /** Appwrite document ID */
  $id: string
  /** Parent workout session ID */
  sessionId: string
  /** User who performed the set */
  userId: string
  /** Exercise this set belongs to */
  exerciseId: string
  /** Set number within the exercise (1-indexed) */
  setNumber: number
  /** Weight lifted (lbs) */
  weight: number
  /** Reps completed */
  reps: number
  /** Whether the set was fully completed */
  isCompleted: boolean
  /** Rate of perceived exertion (1-10 scale, optional) */
  rpe?: number
}

/**
 * A workout session record stored in Appwrite `workout_sessions` collection.
 * Created when a workout starts, updated when it completes.
 */
export interface WorkoutSession {
  /** Appwrite document ID */
  $id: string
  /** User who performed the workout */
  userId: string
  /** Which program day this workout is for */
  programDayId: string
  /** Human-readable day name (e.g., "Push Day A", "Freestyle") */
  programDayName: string
  /** ISO timestamp when workout started */
  startedAt: string
  /** ISO timestamp when workout completed (null if in progress) */
  completedAt: string | null
  /** Total volume (sum of weight × reps for all completed sets) */
  totalVolume: number
  /** Duration in seconds */
  duration: number
  /** User notes */
  notes: string
}

/**
 * A set within an active (in-progress) workout.
 * Lives in the workout store only — not directly in Appwrite.
 * Gets written to `workout_sets` when the workout completes.
 */
export interface ActiveWorkoutSet {
  /** Set number (1-indexed) */
  setNumber: number
  /** Current weight value (editable during workout) */
  weight: number
  /** Current reps value (editable during workout) */
  reps: number
  /** Weight from previous session (shown as "Last:" hint) */
  previousWeight: number | null
  /** Reps from previous session (shown as "Last:" hint) */
  previousReps: number | null
  /** Whether this set has been marked complete */
  isCompleted: boolean
}

/**
 * An exercise within an active (in-progress) workout.
 * Lives in the workout store only.
 *
 * ⚠️ This data is LOST when endWorkout() is called (store resets).
 * Capture it before calling endWorkout() if you need it for the summary.
 */
export interface ActiveWorkoutExercise {
  /** Exercise ID (from library) */
  exerciseId: string
  /** Display name */
  exerciseName: string
  /** Sets being tracked */
  sets: ActiveWorkoutSet[]
  /** Rest time between sets in seconds */
  restSeconds: number
}
