/**
 * Appwrite Client Configuration
 *
 * Initializes the Appwrite SDK client and exports service instances.
 * All Appwrite interactions in the app flow through these exports.
 *
 * @module lib/appwrite
 *
 * Environment variables required:
 * - EXPO_PUBLIC_APPWRITE_ENDPOINT — e.g., "https://nyc.cloud.appwrite.io/v1"
 * - EXPO_PUBLIC_APPWRITE_PROJECT_ID — e.g., "698d5a490007a7ec0e2e"
 */
import { Client, Account, Databases, Avatars, Storage } from 'react-native-appwrite'

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)

/** Appwrite Account service — handles auth (login, register, sessions) */
export const account = new Account(client)

/** Appwrite Databases service — all CRUD operations go through this */
export const databases = new Databases(client)

/** Appwrite Avatars service — generates placeholder avatars */
export const avatars = new Avatars(client)

/** Appwrite Storage service — file uploads (progress photos) */
export const storage = new Storage(client)

/** Storage bucket ID for progress photos */
export const STORAGE_BUCKET = 'progress_photos'

/**
 * Appwrite Database ID for the IronLog database.
 * All collections live under this database.
 */
export const DATABASE_ID = '698dd75900395a2e605e'

/**
 * Collection ID mapping.
 * These match the collection IDs in the Appwrite console.
 * Use these constants in all database.ts operations — never hardcode IDs.
 */
export const COLLECTION = {
  /** Exercise library (35 seed exercises) */
  EXERCISES: 'exercises',
  /** User-created workout programs */
  PROGRAMS: 'programs',
  /** Days within a program (exercises stored as JSON string) */
  PROGRAM_DAYS: 'program_days',
  /** Completed or in-progress workout sessions */
  WORKOUT_SESSIONS: 'workout_sessions',
  /** Individual sets within a workout session */
  WORKOUT_SETS: 'workout_sets',
  /** Per-exercise personal records (1RM tracking) */
  PERSONAL_RECORDS: 'personal_records',
  /** Global social feed posts */
  SOCIAL_POSTS: 'social_posts',
  /** User profile data (display name, streak, avatar) */
  USER_PROFILES: 'user_profiles',
  /** Social groups */
  GROUPS: 'groups',
  /** Group membership records */
  GROUP_MEMBERS: 'group_members',
  /** Group chat messages + workout shares */
  GROUP_MESSAGES: 'group_messages',
  /** Pending/accepted/declined group invitations */
  GROUP_INVITATIONS: 'group_invitations',
  /** Body measurements (weight, body fat, etc.) */
  BODY_STATS: 'body_stats',
  /** Cardio activity logs */
  CARDIO_SESSIONS: 'cardio_sessions',
  /** Progress photo entries */
  PROGRESS_PHOTOS: 'progress_photos',
} as const

/**
 * Raw Appwrite client instance.
 * Used for Realtime subscriptions in group chat:
 * `client.subscribe(`databases.${DATABASE_ID}.collections.${COLLECTION.GROUP_MESSAGES}.documents`, callback)`
 */
export { client }
export { ID, Query } from 'react-native-appwrite'
