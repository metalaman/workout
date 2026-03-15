export interface UserProfile {
  $id: string
  userId: string
  displayName: string
  avatarColor: string
  streakCount: number
  lastWorkoutDate: string | null
  weeklyGoal: number
}

export interface PersonalRecord {
  $id: string
  userId: string
  exerciseId: string
  exerciseName: string
  weight: number
  reps: number
  estimated1RM: number
  achievedAt: string
}
