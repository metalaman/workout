/**
 * Database Operations — Barrel re-export.
 *
 * All functions have been modularized into `lib/db/` domain modules.
 * This file re-exports everything for backward compatibility.
 *
 * Prefer importing from `@/lib/db` or specific domain modules directly:
 * ```ts
 * import { listPrograms } from '@/lib/db/programs'
 * import { createWorkoutSession } from '@/lib/db/workouts'
 * ```
 *
 * @module lib/database
 * @deprecated Import from '@/lib/db' instead.
 */
export * from './db'
