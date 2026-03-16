import { create } from 'zustand'
import type { Program, ProgramDay, ProgramExercise } from '@/types'
import * as db from '@/lib/database'

// Default program for dev mode / fallback
const DEFAULT_DAYS: Omit<ProgramDay, '$id' | 'programId' | 'userId'>[] = [
  {
    name: 'Push A', order: 0,
    exercises: [
      { exerciseId: 'bench-press', exerciseName: 'Bench Press', sets: [{ weight: 185, reps: 8 }, { weight: 185, reps: 8 }, { weight: 195, reps: 6 }, { weight: 195, reps: 6 }] },
      { exerciseId: 'incline-db-press', exerciseName: 'Incline DB Press', sets: [{ weight: 65, reps: 10 }, { weight: 65, reps: 10 }, { weight: 70, reps: 8 }] },
      { exerciseId: 'cable-flyes', exerciseName: 'Cable Flyes', sets: [{ weight: 30, reps: 12 }, { weight: 30, reps: 12 }, { weight: 30, reps: 12 }] },
      { exerciseId: 'overhead-press', exerciseName: 'OHP', sets: [{ weight: 115, reps: 8 }, { weight: 115, reps: 8 }, { weight: 120, reps: 6 }] },
      { exerciseId: 'tricep-pushdown', exerciseName: 'Tricep Pushdown', sets: [{ weight: 50, reps: 12 }, { weight: 55, reps: 10 }, { weight: 55, reps: 10 }] },
    ],
  },
  {
    name: 'Pull A', order: 1,
    exercises: [
      { exerciseId: 'barbell-row', exerciseName: 'Barbell Row', sets: [{ weight: 155, reps: 8 }, { weight: 155, reps: 8 }, { weight: 165, reps: 6 }] },
      { exerciseId: 'lat-pulldown', exerciseName: 'Lat Pulldown', sets: [{ weight: 120, reps: 10 }, { weight: 120, reps: 10 }, { weight: 130, reps: 8 }] },
      { exerciseId: 'seated-cable-row', exerciseName: 'Seated Cable Row', sets: [{ weight: 100, reps: 12 }, { weight: 100, reps: 12 }, { weight: 110, reps: 10 }] },
      { exerciseId: 'face-pulls', exerciseName: 'Face Pulls', sets: [{ weight: 40, reps: 15 }, { weight: 40, reps: 15 }] },
      { exerciseId: 'barbell-curl', exerciseName: 'Barbell Curl', sets: [{ weight: 65, reps: 10 }, { weight: 65, reps: 10 }, { weight: 70, reps: 8 }] },
    ],
  },
  {
    name: 'Legs', order: 2,
    exercises: [
      { exerciseId: 'barbell-squat', exerciseName: 'Barbell Squat', sets: [{ weight: 225, reps: 6 }, { weight: 225, reps: 6 }, { weight: 235, reps: 5 }, { weight: 235, reps: 5 }] },
      { exerciseId: 'romanian-deadlift', exerciseName: 'Romanian Deadlift', sets: [{ weight: 185, reps: 8 }, { weight: 185, reps: 8 }, { weight: 195, reps: 6 }] },
      { exerciseId: 'leg-press', exerciseName: 'Leg Press', sets: [{ weight: 360, reps: 10 }, { weight: 360, reps: 10 }, { weight: 400, reps: 8 }] },
      { exerciseId: 'leg-curl', exerciseName: 'Leg Curl', sets: [{ weight: 90, reps: 12 }, { weight: 90, reps: 12 }, { weight: 100, reps: 10 }] },
      { exerciseId: 'calf-raises', exerciseName: 'Calf Raises', sets: [{ weight: 180, reps: 15 }, { weight: 180, reps: 15 }, { weight: 200, reps: 12 }] },
    ],
  },
  {
    name: 'Push B', order: 3,
    exercises: [
      { exerciseId: 'overhead-press', exerciseName: 'OHP', sets: [{ weight: 120, reps: 8 }, { weight: 120, reps: 8 }, { weight: 125, reps: 6 }] },
      { exerciseId: 'incline-db-press', exerciseName: 'Incline DB Press', sets: [{ weight: 70, reps: 8 }, { weight: 70, reps: 8 }, { weight: 75, reps: 6 }] },
      { exerciseId: 'cable-flyes', exerciseName: 'Cable Flyes', sets: [{ weight: 35, reps: 12 }, { weight: 35, reps: 12 }] },
      { exerciseId: 'lateral-raises', exerciseName: 'Lateral Raises', sets: [{ weight: 20, reps: 15 }, { weight: 20, reps: 15 }, { weight: 25, reps: 12 }] },
      { exerciseId: 'skull-crushers', exerciseName: 'Skull Crushers', sets: [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }, { weight: 65, reps: 8 }] },
    ],
  },
  {
    name: 'Pull B', order: 4,
    exercises: [
      { exerciseId: 'deadlift', exerciseName: 'Deadlift', sets: [{ weight: 275, reps: 5 }, { weight: 275, reps: 5 }, { weight: 295, reps: 3 }] },
      { exerciseId: 'pull-ups', exerciseName: 'Pull-ups', sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 6 }] },
      { exerciseId: 't-bar-row', exerciseName: 'T-Bar Row', sets: [{ weight: 90, reps: 10 }, { weight: 90, reps: 10 }, { weight: 100, reps: 8 }] },
      { exerciseId: 'face-pulls', exerciseName: 'Face Pulls', sets: [{ weight: 45, reps: 15 }, { weight: 45, reps: 15 }] },
      { exerciseId: 'hammer-curls', exerciseName: 'Hammer Curls', sets: [{ weight: 30, reps: 12 }, { weight: 30, reps: 12 }, { weight: 35, reps: 10 }] },
    ],
  },
  {
    name: 'Legs B', order: 5,
    exercises: [
      { exerciseId: 'leg-press', exerciseName: 'Leg Press', sets: [{ weight: 400, reps: 8 }, { weight: 400, reps: 8 }, { weight: 440, reps: 6 }] },
      { exerciseId: 'bulgarian-split-squat', exerciseName: 'Bulgarian Split Squat', sets: [{ weight: 40, reps: 10 }, { weight: 40, reps: 10 }, { weight: 45, reps: 8 }] },
      { exerciseId: 'leg-curl', exerciseName: 'Leg Curl', sets: [{ weight: 100, reps: 10 }, { weight: 100, reps: 10 }, { weight: 110, reps: 8 }] },
      { exerciseId: 'leg-extension', exerciseName: 'Leg Extension', sets: [{ weight: 110, reps: 12 }, { weight: 110, reps: 12 }, { weight: 120, reps: 10 }] },
      { exerciseId: 'calf-raises', exerciseName: 'Calf Raises', sets: [{ weight: 200, reps: 15 }, { weight: 200, reps: 15 }] },
    ],
  },
]

interface ProgramState {
  programs: Program[]
  currentProgram: Program | null
  days: ProgramDay[]
  activeDayIndex: number
  isLoading: boolean
  error: string | null

  loadPrograms: (userId: string) => Promise<void>
  loadDays: (programId: string) => Promise<void>
  setActiveDayIndex: (index: number) => void
  updateDayExercises: (dayIndex: number, exercises: ProgramExercise[]) => void
  addExerciseToDay: (dayIndex: number, exercise: ProgramExercise) => void
  saveDayToBackend: (dayIndex: number) => Promise<void>
  loadDefaultProgram: (userId: string) => void
}

export const useProgramStore = create<ProgramState>((set, get) => ({
  programs: [],
  currentProgram: null,
  days: [],
  activeDayIndex: 0,
  isLoading: false,
  error: null,

  loadPrograms: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const programs = await db.listPrograms(userId)
      if (programs.length > 0) {
        set({ programs, currentProgram: programs[0], isLoading: false })
        await get().loadDays(programs[0].$id)
      } else {
        // No programs yet — use defaults
        get().loadDefaultProgram(userId)
      }
    } catch {
      // Fallback to default program
      get().loadDefaultProgram(userId)
    }
  },

  loadDays: async (programId: string) => {
    try {
      const days = await db.listProgramDays(programId)
      set({ days, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  setActiveDayIndex: (index: number) => set({ activeDayIndex: index }),

  updateDayExercises: (dayIndex: number, exercises: ProgramExercise[]) => {
    set((state) => {
      const days = [...state.days]
      if (days[dayIndex]) {
        days[dayIndex] = { ...days[dayIndex], exercises }
      }
      return { days }
    })
  },

  addExerciseToDay: (dayIndex: number, exercise: ProgramExercise) => {
    set((state) => {
      const days = [...state.days]
      if (days[dayIndex]) {
        days[dayIndex] = {
          ...days[dayIndex],
          exercises: [...days[dayIndex].exercises, exercise],
        }
      }
      return { days }
    })
  },

  saveDayToBackend: async (dayIndex: number) => {
    const { days } = get()
    const day = days[dayIndex]
    if (!day || !day.$id || day.$id.startsWith('local-')) return
    try {
      await db.updateProgramDay(day.$id, { exercises: day.exercises })
    } catch {
      // Silently fail — data is still in local state
    }
  },

  loadDefaultProgram: (userId: string) => {
    const defaultDays: ProgramDay[] = DEFAULT_DAYS.map((d, i) => ({
      ...d,
      $id: `local-day-${i}`,
      programId: 'local-program',
      userId,
    }))
    set({
      programs: [{
        $id: 'local-program',
        userId,
        name: 'Push Pull Legs',
        daysPerWeek: 6,
        currentWeek: 4,
        totalWeeks: 8,
      }],
      currentProgram: {
        $id: 'local-program',
        userId,
        name: 'Push Pull Legs',
        daysPerWeek: 6,
        currentWeek: 4,
        totalWeeks: 8,
      },
      days: defaultDays,
      isLoading: false,
    })
  },
}))
