/**
 * Social Types
 *
 * Types for the group-based social system: groups, memberships,
 * messaging, workout sharing, and invitations.
 *
 * @module types/social
 */

/**
 * A social feed post (global feed, less used than groups).
 * Stored in `social_posts` Appwrite collection.
 */
export interface SocialPost {
  /** Appwrite document ID */
  $id: string
  /** Author user ID */
  userId: string
  /** Author display name */
  userName: string
  /** Author avatar color (hex) */
  avatarColor: string
  /** Related workout session ID (if shared from workout) */
  sessionId: string | null
  /** Post text content */
  text: string
  /** Workout stats summary (JSON string or formatted text) */
  stats: string
  /** Whether this post celebrates a new PR */
  isPR: boolean
  /** Total like count */
  likes: number
  /** Array of user IDs who liked this post */
  likedBy: string[]
  /** Appwrite auto-generated creation timestamp */
  $createdAt: string
}

/**
 * A social group that users can join to share workouts and chat.
 * Stored in `groups` Appwrite collection.
 */
export interface Group {
  /** Appwrite document ID */
  $id: string
  /** Group name */
  name: string
  /** Optional group description */
  description: string
  /** User ID of the group creator (automatically made admin) */
  createdBy: string
  /** Color used for the group avatar circle */
  avatarColor: string
  /** Current number of members (denormalized count) */
  memberCount: number
  /** 6-character alphanumeric invite code (e.g., "XK7P3M") */
  inviteCode: string
  /** Creation timestamp */
  $createdAt?: string
}

/**
 * A user's membership in a group.
 * Stored in `group_members` Appwrite collection.
 */
export interface GroupMember {
  /** Appwrite document ID */
  $id: string
  /** Which group this membership is for */
  groupId: string
  /** The member's user ID */
  userId: string
  /** Display name (denormalized from user profile) */
  displayName: string
  /** Avatar color (denormalized) */
  avatarColor: string
  /** Role — 'admin' (creator) or 'member' */
  role: 'admin' | 'member'
  /** ISO timestamp when the user joined */
  joinedAt: string
}

/**
 * A message in a group chat.
 * Stored in `group_messages` Appwrite collection.
 *
 * Real-time delivery via Appwrite Realtime subscription:
 * `client.subscribe(`databases.${DB}.collections.${COLL}.documents`, callback)`
 */
export interface GroupMessage {
  /** Appwrite document ID */
  $id: string
  /** Which group this message belongs to */
  groupId: string
  /** Sender user ID */
  userId: string
  /** Sender display name */
  userName: string
  /** Sender avatar color */
  avatarColor: string
  /** Message text content */
  text: string
  /** Message type */
  type: 'message' | 'workout_share' | 'image' | 'gif' | 'sticker'
  /** JSON string of WorkoutShareData (only when type === 'workout_share') */
  workoutData: string | null
  /** URL for media content — Appwrite file URL for images, Tenor URL for GIFs */
  mediaUrl: string | null
  /** Creation timestamp */
  $createdAt: string
}

/**
 * Data structure for a shared workout (embedded in group message).
 * Serialized to JSON string in GroupMessage.workoutData.
 */
export interface WorkoutShareData {
  /** Name of the program day worked (e.g., "Push Day A") */
  programDayName: string
  /** Total volume (weight × reps summed) */
  totalVolume: number
  /** Duration in seconds */
  duration: number
  /** Number of new PRs set during this workout */
  prCount: number
  /** Names of exercises where PRs were set */
  prExercises: string[]
}

/**
 * A group invitation sent to a specific user.
 * Stored in `group_invitations` Appwrite collection.
 *
 * Flow: admin sends invite → status='pending' → recipient accepts/declines
 */
export interface GroupInvitation {
  /** Appwrite document ID */
  $id: string
  /** Target group ID */
  groupId: string
  /** Group name (denormalized for display without fetching group) */
  groupName: string
  /** Group color (denormalized) */
  groupColor: string
  /** User ID of who sent the invitation */
  invitedBy: string
  /** Display name of who sent the invitation */
  inviterName: string
  /** User ID of the invited person */
  invitedUserId: string
  /** Invitation status */
  status: 'pending' | 'accepted' | 'declined'
  /** Creation timestamp */
  $createdAt: string
}
