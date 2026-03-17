import { Client, Account, Databases, Avatars, Storage } from 'react-native-appwrite'

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)

export const account = new Account(client)
export const databases = new Databases(client)
export const avatars = new Avatars(client)
export const storage = new Storage(client)

export const STORAGE_BUCKET = 'progress_photos'

export const DATABASE_ID = '698dd75900395a2e605e'

export const COLLECTION = {
  EXERCISES: 'exercises',
  PROGRAMS: 'programs',
  PROGRAM_DAYS: 'program_days',
  WORKOUT_SESSIONS: 'workout_sessions',
  WORKOUT_SETS: 'workout_sets',
  PERSONAL_RECORDS: 'personal_records',
  SOCIAL_POSTS: 'social_posts',
  USER_PROFILES: 'user_profiles',
  GROUPS: 'groups',
  GROUP_MEMBERS: 'group_members',
  GROUP_MESSAGES: 'group_messages',
  GROUP_INVITATIONS: 'group_invitations',
  BODY_STATS: 'body_stats',
  CARDIO_SESSIONS: 'cardio_sessions',
  PROGRESS_PHOTOS: 'progress_photos',
} as const

export { client }
export { ID, Query } from 'react-native-appwrite'
