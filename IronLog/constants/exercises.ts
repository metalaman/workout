import type { Exercise } from '@/types'

export const SEED_EXERCISES: Omit<Exercise, '$id'>[] = [
  // Chest
  { name: 'Bench Press', muscleGroup: 'Chest', secondaryMuscles: ['Triceps', 'Front Delts'], equipment: 'Barbell', difficulty: 'Intermediate', icon: '🏋️', instructions: 'Lie on bench, grip barbell shoulder-width, lower to chest, press up.' },
  { name: 'Incline DB Press', muscleGroup: 'Chest', secondaryMuscles: ['Triceps', 'Front Delts'], equipment: 'Dumbbell', difficulty: 'Intermediate', icon: '💪', instructions: 'Set bench to 30-45 degrees, press dumbbells from chest level.' },
  { name: 'Cable Flyes', muscleGroup: 'Chest', secondaryMuscles: ['Front Delts'], equipment: 'Cable', difficulty: 'Beginner', icon: '🔄', instructions: 'Set cables at chest height, bring handles together in arc motion.' },
  { name: 'Dumbbell Flyes', muscleGroup: 'Chest', secondaryMuscles: ['Front Delts'], equipment: 'Dumbbell', difficulty: 'Beginner', icon: '🦋', instructions: 'Lie flat, lower dumbbells in wide arc, squeeze chest to bring back.' },
  { name: 'Chest Dips', muscleGroup: 'Chest', secondaryMuscles: ['Triceps', 'Front Delts'], equipment: 'Bodyweight', difficulty: 'Intermediate', icon: '⬇️', instructions: 'Lean forward on dip bars, lower body until stretch in chest, push up.' },
  { name: 'Machine Chest Press', muscleGroup: 'Chest', secondaryMuscles: ['Triceps'], equipment: 'Machine', difficulty: 'Beginner', icon: '🔧', instructions: 'Sit in machine, push handles forward, control back.' },

  // Back
  { name: 'Barbell Row', muscleGroup: 'Back', secondaryMuscles: ['Biceps', 'Rear Delts'], equipment: 'Barbell', difficulty: 'Intermediate', icon: '🚣', instructions: 'Hinge at hips, pull barbell to lower chest, squeeze back.' },
  { name: 'Pull-ups', muscleGroup: 'Back', secondaryMuscles: ['Biceps'], equipment: 'Bodyweight', difficulty: 'Advanced', icon: '⬆️', instructions: 'Hang from bar, pull chin above bar, lower with control.' },
  { name: 'Lat Pulldown', muscleGroup: 'Back', secondaryMuscles: ['Biceps'], equipment: 'Cable', difficulty: 'Beginner', icon: '⏬', instructions: 'Pull bar to upper chest, squeeze lats, return slowly.' },
  { name: 'Seated Cable Row', muscleGroup: 'Back', secondaryMuscles: ['Biceps', 'Rear Delts'], equipment: 'Cable', difficulty: 'Beginner', icon: '🔙', instructions: 'Sit upright, pull handle to torso, squeeze shoulder blades.' },
  { name: 'Deadlift', muscleGroup: 'Back', secondaryMuscles: ['Hamstrings', 'Glutes', 'Core'], equipment: 'Barbell', difficulty: 'Advanced', icon: '🏗️', instructions: 'Hinge at hips, grip bar, stand up driving through heels.' },
  { name: 'T-Bar Row', muscleGroup: 'Back', secondaryMuscles: ['Biceps', 'Rear Delts'], equipment: 'Barbell', difficulty: 'Intermediate', icon: '🔱', instructions: 'Straddle bar, pull to chest with neutral grip, squeeze back.' },

  // Legs
  { name: 'Barbell Squat', muscleGroup: 'Legs', secondaryMuscles: ['Glutes', 'Core'], equipment: 'Barbell', difficulty: 'Intermediate', icon: '🦵', instructions: 'Bar on upper back, squat to parallel or below, drive up.' },
  { name: 'Romanian Deadlift', muscleGroup: 'Legs', secondaryMuscles: ['Lower Back', 'Glutes'], equipment: 'Barbell', difficulty: 'Intermediate', icon: '🔽', instructions: 'Slight knee bend, hinge at hips lowering bar along legs.' },
  { name: 'Leg Press', muscleGroup: 'Legs', secondaryMuscles: ['Glutes'], equipment: 'Machine', difficulty: 'Beginner', icon: '🦿', instructions: 'Feet shoulder-width on platform, press up, lower with control.' },
  { name: 'Leg Curl', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', difficulty: 'Beginner', icon: '🔄', instructions: 'Lie prone, curl weight toward glutes, lower slowly.' },
  { name: 'Leg Extension', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', difficulty: 'Beginner', icon: '🔼', instructions: 'Sit in machine, extend legs fully, lower with control.' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'Legs', secondaryMuscles: ['Glutes', 'Core'], equipment: 'Dumbbell', difficulty: 'Intermediate', icon: '🏔️', instructions: 'Rear foot on bench, lunge down on front leg, push up.' },
  { name: 'Calf Raises', muscleGroup: 'Legs', secondaryMuscles: [], equipment: 'Machine', difficulty: 'Beginner', icon: '🦶', instructions: 'Stand on edge, lower heels below platform, push up on toes.' },

  // Shoulders
  { name: 'Overhead Press', muscleGroup: 'Shoulders', secondaryMuscles: ['Triceps', 'Upper Chest'], equipment: 'Barbell', difficulty: 'Intermediate', icon: '⬆️', instructions: 'Press barbell from shoulders to overhead, lower with control.' },
  { name: 'Lateral Raises', muscleGroup: 'Shoulders', secondaryMuscles: [], equipment: 'Dumbbell', difficulty: 'Beginner', icon: '↔️', instructions: 'Raise dumbbells to sides until parallel to floor.' },
  { name: 'Face Pulls', muscleGroup: 'Shoulders', secondaryMuscles: ['Rear Delts', 'Traps'], equipment: 'Cable', difficulty: 'Beginner', icon: '🎯', instructions: 'Pull rope to face level, externally rotate shoulders.' },
  { name: 'Arnold Press', muscleGroup: 'Shoulders', secondaryMuscles: ['Triceps'], equipment: 'Dumbbell', difficulty: 'Intermediate', icon: '🔄', instructions: 'Start palms facing you, rotate and press overhead.' },
  { name: 'Rear Delt Flyes', muscleGroup: 'Shoulders', secondaryMuscles: [], equipment: 'Dumbbell', difficulty: 'Beginner', icon: '🦅', instructions: 'Bent over, raise dumbbells to sides squeezing rear delts.' },

  // Arms
  { name: 'Barbell Curl', muscleGroup: 'Arms', secondaryMuscles: ['Forearms'], equipment: 'Barbell', difficulty: 'Beginner', icon: '💪', instructions: 'Curl barbell from thighs to shoulders, lower with control.' },
  { name: 'Tricep Pushdown', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Cable', difficulty: 'Beginner', icon: '⬇️', instructions: 'Push cable bar down until arms are straight, return slowly.' },
  { name: 'Hammer Curls', muscleGroup: 'Arms', secondaryMuscles: ['Forearms'], equipment: 'Dumbbell', difficulty: 'Beginner', icon: '🔨', instructions: 'Curl dumbbells with neutral grip, squeeze at top.' },
  { name: 'Skull Crushers', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Barbell', difficulty: 'Intermediate', icon: '💀', instructions: 'Lie flat, lower barbell to forehead, extend arms.' },
  { name: 'Preacher Curls', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Dumbbell', difficulty: 'Beginner', icon: '📖', instructions: 'Arms on preacher bench, curl weight up, lower slowly.' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'Arms', secondaryMuscles: [], equipment: 'Dumbbell', difficulty: 'Beginner', icon: '🔝', instructions: 'Hold dumbbell overhead, lower behind head, extend up.' },

  // Core
  { name: 'Plank', muscleGroup: 'Core', secondaryMuscles: ['Shoulders'], equipment: 'Bodyweight', difficulty: 'Beginner', icon: '🧱', instructions: 'Hold push-up position on forearms, keep body straight.' },
  { name: 'Cable Crunch', muscleGroup: 'Core', secondaryMuscles: [], equipment: 'Cable', difficulty: 'Beginner', icon: '🔄', instructions: 'Kneel at cable, crunch down bringing elbows to knees.' },
  { name: 'Hanging Leg Raises', muscleGroup: 'Core', secondaryMuscles: ['Hip Flexors'], equipment: 'Bodyweight', difficulty: 'Advanced', icon: '🦵', instructions: 'Hang from bar, raise legs to parallel, lower with control.' },
  { name: 'Ab Wheel Rollout', muscleGroup: 'Core', secondaryMuscles: ['Shoulders'], equipment: 'Bodyweight', difficulty: 'Intermediate', icon: '🛞', instructions: 'Kneel, roll wheel out extending body, pull back in.' },
  { name: 'Russian Twists', muscleGroup: 'Core', secondaryMuscles: ['Obliques'], equipment: 'Bodyweight', difficulty: 'Beginner', icon: '🔄', instructions: 'Sit with feet off ground, rotate torso side to side.' },
]
