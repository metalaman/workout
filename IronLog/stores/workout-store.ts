import { create } from 'zustand'
import type { ActiveWorkoutExercise } from '@/types'

interface WorkoutState {
  isActive: boolean
  isPaused: boolean
  sessionId: string | null
  programDayName: string
  exercises: ActiveWorkoutExercise[]
  currentExerciseIndex: number
  startTime: number | null
  elapsedSeconds: number
  pausedAtSeconds: number
  restTimerSeconds: number
  isResting: boolean

  startWorkout: (params: {
    sessionId: string
    programDayName: string
    exercises: ActiveWorkoutExercise[]
  }) => void
  addSet: (exerciseIndex: number) => void
  completeSet: (exerciseIndex: number, setIndex: number, weight: number, reps: number) => void
  nextExercise: () => void
  updateElapsed: (seconds: number) => void
  startRest: (seconds: number) => void
  stopRest: () => void
  pauseWorkout: () => void
  resumeWorkout: () => void
  endWorkout: () => { totalVolume: number; duration: number }
  reset: () => void
}

const initialState = {
  isActive: false,
  isPaused: false,
  sessionId: null as string | null,
  programDayName: '',
  exercises: [] as ActiveWorkoutExercise[],
  currentExerciseIndex: 0,
  startTime: null as number | null,
  elapsedSeconds: 0,
  pausedAtSeconds: 0,
  restTimerSeconds: 0,
  isResting: false,
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  ...initialState,

  startWorkout: ({ sessionId, programDayName, exercises }) =>
    set({
      isActive: true,
      sessionId,
      programDayName,
      exercises,
      currentExerciseIndex: 0,
      startTime: Date.now(),
      elapsedSeconds: 0,
    }),

  addSet: (exerciseIndex) =>
    set((state) => {
      const exercises = [...state.exercises]
      const exercise = { ...exercises[exerciseIndex] }
      const sets = [...exercise.sets]
      const lastSet = sets[sets.length - 1]
      sets.push({
        setNumber: sets.length + 1,
        weight: lastSet?.weight ?? 0,
        reps: lastSet?.reps ?? 10,
        previousWeight: lastSet?.previousWeight ?? null,
        previousReps: lastSet?.previousReps ?? null,
        isCompleted: false,
      })
      exercise.sets = sets
      exercises[exerciseIndex] = exercise
      return { exercises }
    }),

  completeSet: (exerciseIndex, setIndex, weight, reps) =>
    set((state) => {
      const exercises = [...state.exercises]
      const exercise = { ...exercises[exerciseIndex] }
      const sets = [...exercise.sets]
      sets[setIndex] = { ...sets[setIndex], weight, reps, isCompleted: true }
      exercise.sets = sets
      exercises[exerciseIndex] = exercise
      return { exercises }
    }),

  nextExercise: () =>
    set((state) => ({
      currentExerciseIndex: Math.min(
        state.currentExerciseIndex + 1,
        state.exercises.length - 1
      ),
    })),

  updateElapsed: (seconds) => set({ elapsedSeconds: seconds }),

  startRest: (seconds) => set({ isResting: true, restTimerSeconds: seconds }),

  stopRest: () => set({ isResting: false, restTimerSeconds: 0 }),

  pauseWorkout: () => set((state) => ({
    isPaused: true,
    pausedAtSeconds: state.elapsedSeconds,
  })),

  resumeWorkout: () => set({ isPaused: false }),

  endWorkout: () => {
    const state = get()
    let totalVolume = 0
    for (const exercise of state.exercises) {
      for (const s of exercise.sets) {
        if (s.isCompleted) {
          totalVolume += s.weight * s.reps
        }
      }
    }
    const duration = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0
    set(initialState)
    return { totalVolume, duration }
  },

  reset: () => set(initialState),
}))
