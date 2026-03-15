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
