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

// Body stats types
export interface BodyStat {
  $id: string
  userId: string
  bodyWeight: number | null
  bodyFat: number | null
  chest: number | null
  waist: number | null
  hips: number | null
  arms: number | null
  thighs: number | null
  unit: string
  recordedAt: string
  notes: string | null
}

// Cardio session types
export type CardioType = 'Running' | 'Cycling' | 'Swimming' | 'Walking' | 'Rowing' | 'Elliptical' | 'HIIT' | 'Other'

export interface CardioSession {
  $id: string
  userId: string
  type: CardioType
  durationMinutes: number
  distance: number | null
  distanceUnit: string
  calories: number | null
  avgHeartRate: number | null
  startedAt: string
  notes: string | null
}

// Progress photo types
export type PhotoPose = 'Front' | 'Side' | 'Back'

export interface ProgressPhoto {
  $id: string
  userId: string
  photoUrl: string
  pose: PhotoPose
  bodyWeight: number | null
  takenAt: string
  notes: string | null
}
