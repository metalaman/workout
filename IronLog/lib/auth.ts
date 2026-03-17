/**
 * Authentication Service
 *
 * Handles user authentication via Appwrite Account API.
 * Registration also creates a user_profiles document.
 *
 * @module lib/auth
 */
import { account, databases, DATABASE_ID, COLLECTION, ID } from './appwrite'
import type { Models } from 'react-native-appwrite'
import type { UserProfile } from '@/types'

/**
 * Log in with email and password.
 * Creates an Appwrite email/password session.
 */
export async function login(email: string, password: string): Promise<Models.Session> {
  return account.createEmailPasswordSession(email, password)
}

/**
 * Register a new user.
 * 1. Creates Appwrite Auth account
 * 2. Creates an email/password session
 * 3. Creates a user_profiles document with random avatar color
 */
export async function register(email: string, password: string, name: string): Promise<Models.Session> {
  await account.create(ID.unique(), email, password, name)
  const session = await account.createEmailPasswordSession(email, password)

  await databases.createDocument(DATABASE_ID, COLLECTION.USER_PROFILES, ID.unique(), {
    userId: session.userId,
    displayName: name,
    avatarColor: generateAvatarColor(),
    streakCount: 0,
    lastWorkoutDate: null,
    weeklyGoal: 5,
  })

  return session
}

/** Get the currently authenticated user, or null if no session. */
export async function getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
  try {
    return await account.get()
  } catch {
    return null
  }
}

/** Log out by deleting the current session. */
export async function logout(): Promise<void> {
  await account.deleteSession('current')
}

/** Fetch user profile from user_profiles collection by userId. */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { Query } = await import('./appwrite')
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION.USER_PROFILES,
      [Query.equal('userId', userId)]
    )
    return response.documents[0] as unknown as UserProfile ?? null
  } catch {
    return null
  }
}

/** Generate a random avatar color from a preset palette. */
function generateAvatarColor(): string {
  const colors = ['#e8ff47', '#ff6b6b', '#6bc5ff', '#ff9f43', '#a55eea', '#26de81', '#fd9644']
  return colors[Math.floor(Math.random() * colors.length)]
}
