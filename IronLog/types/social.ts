export interface SocialPost {
  $id: string
  userId: string
  userName: string
  avatarColor: string
  sessionId: string | null
  text: string
  stats: string
  isPR: boolean
  likes: number
  likedBy: string[]
  $createdAt: string
}

export interface Group {
  $id: string
  name: string
  description: string
  createdBy: string
  avatarColor: string
  memberCount: number
  inviteCode: string
  $createdAt?: string
}

export interface GroupMember {
  $id: string
  groupId: string
  userId: string
  displayName: string
  avatarColor: string
  role: 'admin' | 'member'
  joinedAt: string
}

export interface GroupMessage {
  $id: string
  groupId: string
  userId: string
  userName: string
  avatarColor: string
  text: string
  type: 'message' | 'workout_share'
  workoutData: string | null
  $createdAt: string
}

export interface WorkoutShareData {
  programDayName: string
  totalVolume: number
  duration: number
  prCount: number
  prExercises: string[]
}

export interface GroupInvitation {
  $id: string
  groupId: string
  groupName: string
  groupColor: string
  invitedBy: string
  inviterName: string
  invitedUserId: string
  status: 'pending' | 'accepted' | 'declined'
  $createdAt: string
}
