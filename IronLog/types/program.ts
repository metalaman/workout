export interface ProgramSet {
  weight: number
  reps: number
}

export interface ProgramExercise {
  exerciseId: string
  exerciseName: string
  sets: ProgramSet[]
}

export interface ProgramDay {
  $id: string
  programId: string
  userId: string
  name: string
  order: number
  exercises: ProgramExercise[]
}

export interface Program {
  $id: string
  userId: string
  name: string
  daysPerWeek: number
  currentWeek: number
  totalWeeks: number
}
