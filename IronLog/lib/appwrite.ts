import { Client, Account, Databases, Avatars } from 'react-native-appwrite'

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)

export const account = new Account(client)
export const databases = new Databases(client)
export const avatars = new Avatars(client)

export const DATABASE_ID = 'ironlog'

export const COLLECTION = {
  EXERCISES: 'exercises',
  PROGRAMS: 'programs',
  PROGRAM_DAYS: 'program_days',
  WORKOUT_SESSIONS: 'workout_sessions',
  WORKOUT_SETS: 'workout_sets',
  PERSONAL_RECORDS: 'personal_records',
  SOCIAL_POSTS: 'social_posts',
  USER_PROFILES: 'user_profiles',
} as const

export { client }
export { ID, Query } from 'react-native-appwrite'
