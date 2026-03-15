export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core'

export type Equipment = 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight' | 'Bands'

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export interface Exercise {
  $id: string
  name: string
  muscleGroup: MuscleGroup
  secondaryMuscles: string[]
  equipment: Equipment
  difficulty: Difficulty
  icon: string
  instructions: string
}

export interface ExerciseFilters {
  search: string
  muscleGroups: MuscleGroup[]
  equipment: Equipment[]
  difficulty: Difficulty | null
}
