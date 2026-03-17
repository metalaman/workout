/**
 * Exercise Types
 *
 * Types for the exercise library — seed data, filters, and categorization.
 *
 * @module types/exercise
 */

/** The 6 primary muscle group categories */
export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core'

/** Equipment types available for exercises */
export type Equipment = 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight' | 'Bands'

/** Exercise difficulty levels */
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

/**
 * An exercise in the library.
 * Stored in the `exercises` Appwrite collection (or from SEED_EXERCISES constant).
 */
export interface Exercise {
  /** Appwrite document ID */
  $id: string
  /** Display name (e.g., "Bench Press") */
  name: string
  /** Primary muscle group */
  muscleGroup: MuscleGroup
  /** Secondary muscles targeted (e.g., ["Triceps", "Front Delts"]) */
  secondaryMuscles: string[]
  /** Equipment needed */
  equipment: Equipment
  /** Difficulty level */
  difficulty: Difficulty
  /** Emoji icon (legacy — replaced by ExerciseIcon SVG component) */
  icon: string
  /** Step-by-step exercise instructions */
  instructions: string
}

/**
 * Filter state for the exercise library screen.
 * Managed by `useFilterStore`.
 */
export interface ExerciseFilters {
  /** Text search query */
  search: string
  /** Selected muscle group filters */
  muscleGroups: MuscleGroup[]
  /** Selected equipment filters */
  equipment: Equipment[]
  /** Selected difficulty filter (null = all) */
  difficulty: Difficulty | null
}
