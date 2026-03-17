/**
 * User Types
 *
 * Types for user profiles, personal records, body stats,
 * cardio sessions, and progress photos.
 *
 * @module types/user
 */

/**
 * User profile stored in `user_profiles` Appwrite collection.
 * Created during registration. One per user.
 */
export interface UserProfile {
  /** Appwrite document ID */
  $id: string
  /** Appwrite Auth user ID */
  userId: string
  /** Display name shown in app */
  displayName: string
  /** Avatar background color (hex) */
  avatarColor: string
  /** Current workout streak count (consecutive weeks) */
  streakCount: number
  /** ISO timestamp of last completed workout (null if never) */
  lastWorkoutDate: string | null
  /** Weekly workout goal (number of days per week) */
  weeklyGoal: number
}

/**
 * A personal record for a specific exercise.
 * Stored in `personal_records` Appwrite collection.
 * One record per exercise per user — updated when a new PR is set.
 */
export interface PersonalRecord {
  /** Appwrite document ID */
  $id: string
  /** User ID */
  userId: string
  /** Exercise ID */
  exerciseId: string
  /** Exercise name (denormalized for display) */
  exerciseName: string
  /** Weight lifted for this PR */
  weight: number
  /** Reps performed for this PR */
  reps: number
  /**
   * Estimated 1-rep max calculated via Epley formula.
   * This is the primary comparison metric for determining new PRs.
   */
  estimated1RM: number
  /** ISO timestamp when this PR was achieved */
  achievedAt: string
}

// ─── Body Stats ──────────────────────────────────────────────────────────────

/**
 * A body measurement record.
 * Stored in `body_stats` Appwrite collection.
 */
export interface BodyStat {
  /** Appwrite document ID */
  $id: string
  /** User ID */
  userId: string
  /** Body weight (in `unit` units) — null if not recorded */
  bodyWeight: number | null
  /** Body fat percentage — null if not recorded */
  bodyFat: number | null
  /** Chest measurement — null if not recorded */
  chest: number | null
  /** Waist measurement — null if not recorded */
  waist: number | null
  /** Hips measurement — null if not recorded */
  hips: number | null
  /** Arms measurement — null if not recorded */
  arms: number | null
  /** Thighs measurement — null if not recorded */
  thighs: number | null
  /** Unit system: "lbs"/"in" or "kg"/"cm" */
  unit: string
  /** ISO timestamp when measurement was taken */
  recordedAt: string
  /** Optional notes */
  notes: string | null
}

// ─── Cardio Sessions ─────────────────────────────────────────────────────────

/** Available cardio activity types */
export type CardioType = 'Running' | 'Cycling' | 'Swimming' | 'Walking' | 'Rowing' | 'Elliptical' | 'HIIT' | 'Other'

/**
 * A cardio activity log.
 * Stored in `cardio_sessions` Appwrite collection.
 */
export interface CardioSession {
  /** Appwrite document ID */
  $id: string
  /** User ID */
  userId: string
  /** Activity type */
  type: CardioType
  /** Duration in minutes */
  durationMinutes: number
  /** Distance covered — null if not tracked */
  distance: number | null
  /** Distance unit: "mi" or "km" */
  distanceUnit: string
  /** Calories burned — null if not tracked */
  calories: number | null
  /** Average heart rate — null if not tracked */
  avgHeartRate: number | null
  /** ISO timestamp when session started */
  startedAt: string
  /** Optional notes */
  notes: string | null
}

// ─── Progress Photos ─────────────────────────────────────────────────────────

/** Available photo pose angles */
export type PhotoPose = 'Front' | 'Side' | 'Back'

/**
 * A progress photo entry.
 * Stored in `progress_photos` Appwrite collection.
 */
export interface ProgressPhoto {
  /** Appwrite document ID */
  $id: string
  /** User ID */
  userId: string
  /** URL/URI to the photo */
  photoUrl: string
  /** Pose angle for comparison grouping */
  pose: PhotoPose
  /** Body weight at time of photo — null if not recorded */
  bodyWeight: number | null
  /** ISO timestamp when photo was taken */
  takenAt: string
  /** Optional notes */
  notes: string | null
}
