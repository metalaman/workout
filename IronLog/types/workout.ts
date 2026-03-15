export interface WorkoutSet {
  $id: string
  sessionId: string
  userId: string
  exerciseId: string
  setNumber: number
  weight: number
  reps: number
  isCompleted: boolean
  rpe?: number
}

export interface WorkoutSession {
  $id: string
  userId: string
  programDayId: string
  programDayName: string
  startedAt: string
  completedAt: string | null
  totalVolume: number
  duration: number
  notes: string
}

export interface ActiveWorkoutSet {
  setNumber: number
  weight: number
  reps: number
  previousWeight: number | null
  previousReps: number | null
  isCompleted: boolean
}

export interface ActiveWorkoutExercise {
  exerciseId: string
  exerciseName: string
  sets: ActiveWorkoutSet[]
  restSeconds: number
}
