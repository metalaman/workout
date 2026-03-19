/**
 * Database barrel export — re-exports all domain modules.
 *
 * This is the primary import point for database operations:
 * ```ts
 * import { listPrograms, createWorkoutSession } from '@/lib/db'
 * ```
 *
 * Domain modules:
 * - programs — Program & ProgramDay CRUD
 * - workouts — WorkoutSession & WorkoutSet CRUD
 * - records  — Personal record tracking
 * - social   — Groups, messages, invitations, posts
 * - profile  — User profile & streak
 * - body     — Body stats, cardio, progress photos
 * - nutrition — Nutrition profiles & food logs
 * - exercises — Custom exercise CRUD
 *
 * @module lib/db
 */
export * from './programs'
export * from './workouts'
export * from './records'
export * from './social'
export * from './profile'
export * from './body'
export * from './nutrition'
export * from './exercises'
