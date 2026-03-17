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
  // Builder state
  builderProgram: Partial<Program> | null
  builderDays: ProgramDay[]
  builderActiveDayIndex: number

  loadPrograms: (userId: string) => Promise<void>
  loadDays: (programId: string) => Promise<void>
  setActiveDayIndex: (index: number) => void
  updateDayExercises: (dayIndex: number, exercises: ProgramExercise[]) => void
  addExerciseToDay: (dayIndex: number, exercise: ProgramExercise) => void
  saveDayToBackend: (dayIndex: number) => Promise<void>
  loadDefaultProgram: (userId: string) => void
  // Builder actions
  createNewProgram: (name: string, daysPerWeek: number, totalWeeks: number, userId: string, color?: string) => Promise<void>
  addDay: (name: string) => Promise<void>
  removeDay: (dayIndex: number) => Promise<void>
  addExerciseToBuilderDay: (dayIndex: number, exercise: ProgramExercise) => void
  removeExerciseFromDay: (dayIndex: number, exerciseIndex: number) => void
  reorderExercise: (dayIndex: number, fromIndex: number, toIndex: number) => void
  toggleSuperset: (dayIndex: number, exerciseIndex: number) => void
  toggleDropSet: (dayIndex: number, exerciseIndex: number) => void
  updateExerciseInDay: (dayIndex: number, exerciseIndex: number, updates: Partial<ProgramExercise>) => void
  saveBuilderDay: (dayIndex: number) => Promise<void>
  updateDayName: (dayIndex: number, name: string) => void
  deleteProgram: (programId: string) => Promise<void>
  setBuilderActiveDayIndex: (index: number) => void
  setCurrentProgram: (program: Program) => void
  clearBuilder: () => void
  moveExercise: (dayIndex: number, fromIndex: number, direction: 'up' | 'down') => void
  swapExercise: (dayIndex: number, exerciseIndex: number, newExerciseId: string, newExerciseName: string) => void
}

export const useProgramStore = create<ProgramState>((set, get) => ({
  programs: [],
  currentProgram: null,
  days: [],
  activeDayIndex: 0,
  isLoading: false,
  error: null,
  builderProgram: null,
  builderDays: [],
  builderActiveDayIndex: 0,

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
  setBuilderActiveDayIndex: (index: number) => set({ builderActiveDayIndex: index }),

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
    } catch (e) {
      console.warn('saveDayToBackend failed:', e)
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

  createNewProgram: async (name: string, daysPerWeek: number, totalWeeks: number, userId: string, color?: string) => {
    // Skip Appwrite entirely for dev/local users
    const isLocal = userId === 'dev' || userId.startsWith('local')
    if (isLocal) {
      const localProgram: Program = {
        $id: `local-${Date.now()}`,
        userId,
        name,
        daysPerWeek,
        totalWeeks,
        currentWeek: 1,
        color,
      }
      set({
        builderProgram: localProgram,
        builderDays: [],
        builderActiveDayIndex: 0,
        programs: [localProgram, ...get().programs],
        currentProgram: localProgram,
      })
      return
    }
    try {
      const program = await db.createProgram({
        userId,
        name,
        daysPerWeek,
        totalWeeks,
        currentWeek: 1,
        color,
      })
      const programWithColor = { ...program, color }
      set({
        builderProgram: programWithColor,
        builderDays: [],
        builderActiveDayIndex: 0,
      })
      set((state) => ({
        programs: [programWithColor, ...state.programs],
        currentProgram: programWithColor,
      }))
    } catch (e) {
      console.warn('createNewProgram Appwrite failed:', e)
      const localProgram: Program = {
        $id: `local-${Date.now()}`,
        userId,
        name,
        daysPerWeek,
        totalWeeks,
        currentWeek: 1,
        color,
      }
      set({
        builderProgram: localProgram,
        builderDays: [],
        builderActiveDayIndex: 0,
        programs: [localProgram, ...get().programs],
        currentProgram: localProgram,
      })
    }
  },

  addDay: async (name: string) => {
    const { builderProgram, builderDays, currentProgram } = get()
    const program = builderProgram || currentProgram
    if (!program?.$id) return

    const order = builderDays.length
    const userId = program.userId ?? ''
    const isLocal = userId === 'dev' || userId.startsWith('local') || program.$id.startsWith('local')

    if (isLocal) {
      const localDay: ProgramDay = {
        $id: `local-day-${Date.now()}`,
        programId: program.$id!,
        userId,
        name,
        order,
        exercises: [],
      }
      set((state) => ({
        builderDays: [...state.builderDays, localDay],
        days: [...state.days, localDay],
      }))
      return
    }
    try {
      const day = await db.createProgramDay({
        programId: program.$id!,
        userId,
        name,
        order,
        exercises: [],
      })
      set((state) => ({
        builderDays: [...state.builderDays, day],
        days: [...state.days, day],
      }))
    } catch {
      const localDay: ProgramDay = {
        $id: `local-day-${Date.now()}`,
        programId: program.$id!,
        userId,
        name,
        order,
        exercises: [],
      }
      set((state) => ({
        builderDays: [...state.builderDays, localDay],
        days: [...state.days, localDay],
      }))
    }
  },

  removeDay: async (dayIndex: number) => {
    const { builderDays, days } = get()
    const day = builderDays[dayIndex] || days[dayIndex]
    if (day && !day.$id.startsWith('local-')) {
      try {
        await db.deleteProgramDay(day.$id)
      } catch {
        // ignore
      }
    }
    set((state) => ({
      builderDays: state.builderDays.filter((_, i) => i !== dayIndex),
      days: state.days.filter((d) => d.$id !== day?.$id),
      builderActiveDayIndex: Math.max(0, state.builderActiveDayIndex - 1),
    }))
  },

  addExerciseToBuilderDay: (dayIndex: number, exercise: ProgramExercise) => {
    set((state) => {
      const builderDays = [...state.builderDays]
      if (builderDays[dayIndex]) {
        builderDays[dayIndex] = {
          ...builderDays[dayIndex],
          exercises: [...builderDays[dayIndex].exercises, exercise],
        }
      }
      // Also update main days if this day exists there
      const days = [...state.days]
      const mainIdx = days.findIndex((d) => d.$id === builderDays[dayIndex]?.$id)
      if (mainIdx >= 0) {
        days[mainIdx] = { ...builderDays[dayIndex] }
      }
      return { builderDays, days }
    })
  },

  removeExerciseFromDay: (dayIndex: number, exerciseIndex: number) => {
    set((state) => {
      const builderDays = [...state.builderDays]
      if (builderDays[dayIndex]) {
        const exercises = builderDays[dayIndex].exercises.filter((_, i) => i !== exerciseIndex)
        builderDays[dayIndex] = { ...builderDays[dayIndex], exercises }
      }
      const days = [...state.days]
      const mainIdx = days.findIndex((d) => d.$id === builderDays[dayIndex]?.$id)
      if (mainIdx >= 0) {
        days[mainIdx] = { ...builderDays[dayIndex] }
      }
      return { builderDays, days }
    })
  },

  reorderExercise: (dayIndex: number, fromIndex: number, toIndex: number) => {
    set((state) => {
      const builderDays = [...state.builderDays]
      if (!builderDays[dayIndex]) return state
      const exercises = [...builderDays[dayIndex].exercises]
      const [moved] = exercises.splice(fromIndex, 1)
      exercises.splice(toIndex, 0, moved)
      builderDays[dayIndex] = { ...builderDays[dayIndex], exercises }
      const days = [...state.days]
      const mainIdx = days.findIndex((d) => d.$id === builderDays[dayIndex]?.$id)
      if (mainIdx >= 0) {
        days[mainIdx] = { ...builderDays[dayIndex] }
      }
      return { builderDays, days }
    })
  },

  toggleSuperset: (dayIndex: number, exerciseIndex: number) => {
    set((state) => {
      const builderDays = [...state.builderDays]
      if (!builderDays[dayIndex]) return state
      const exercises = [...builderDays[dayIndex].exercises]
      const ex = { ...exercises[exerciseIndex] }
      const nextEx = exercises[exerciseIndex + 1]

      if (ex.supersetGroup != null) {
        // Remove superset — clear group from this and any linked exercises
        const groupNum = ex.supersetGroup
        exercises.forEach((e, i) => {
          if (e.supersetGroup === groupNum) {
            exercises[i] = { ...e, supersetGroup: undefined }
          }
        })
      } else if (nextEx) {
        // Create superset with next exercise
        const maxGroup = Math.max(0, ...exercises.map((e) => e.supersetGroup ?? 0))
        const newGroup = maxGroup + 1
        exercises[exerciseIndex] = { ...ex, supersetGroup: newGroup }
        exercises[exerciseIndex + 1] = { ...nextEx, supersetGroup: newGroup }
      }

      builderDays[dayIndex] = { ...builderDays[dayIndex], exercises }
      const days = [...state.days]
      const mainIdx = days.findIndex((d) => d.$id === builderDays[dayIndex]?.$id)
      if (mainIdx >= 0) {
        days[mainIdx] = { ...builderDays[dayIndex] }
      }
      return { builderDays, days }
    })
  },

  toggleDropSet: (dayIndex: number, exerciseIndex: number) => {
    set((state) => {
      const builderDays = [...state.builderDays]
      if (!builderDays[dayIndex]) return state
      const exercises = [...builderDays[dayIndex].exercises]
      const ex = { ...exercises[exerciseIndex] }
      const hasDropSets = ex.sets.some((s) => s.isDropSet)
      ex.sets = ex.sets.map((s) => ({ ...s, isDropSet: !hasDropSets }))
      exercises[exerciseIndex] = ex
      builderDays[dayIndex] = { ...builderDays[dayIndex], exercises }
      const days = [...state.days]
      const mainIdx = days.findIndex((d) => d.$id === builderDays[dayIndex]?.$id)
      if (mainIdx >= 0) {
        days[mainIdx] = { ...builderDays[dayIndex] }
      }
      return { builderDays, days }
    })
  },

  updateExerciseInDay: (dayIndex: number, exerciseIndex: number, updates: Partial<ProgramExercise>) => {
    set((state) => {
      const builderDays = [...state.builderDays]
      if (!builderDays[dayIndex]) return state
      const exercises = [...builderDays[dayIndex].exercises]
      exercises[exerciseIndex] = { ...exercises[exerciseIndex], ...updates }
      builderDays[dayIndex] = { ...builderDays[dayIndex], exercises }
      const days = [...state.days]
      const mainIdx = days.findIndex((d) => d.$id === builderDays[dayIndex]?.$id)
      if (mainIdx >= 0) {
        days[mainIdx] = { ...builderDays[dayIndex] }
      }
      return { builderDays, days }
    })
  },

  updateDayName: (dayIndex, name) =>
    set((state) => {
      const builderDays = [...state.builderDays]
      const days = [...state.days]
      if (builderDays[dayIndex]) {
        builderDays[dayIndex] = { ...builderDays[dayIndex], name }
      }
      // Also update in days array
      const dayId = builderDays[dayIndex]?.$id
      if (dayId) {
        const idx = days.findIndex((d) => d.$id === dayId)
        if (idx >= 0) days[idx] = { ...days[idx], name }
      }
      return { builderDays, days }
    }),

  saveBuilderDay: async (dayIndex: number) => {
    const { builderDays } = get()
    const day = builderDays[dayIndex]
    if (!day || day.$id.startsWith('local-')) return
    try {
      await db.updateProgramDay(day.$id, { name: day.name, exercises: day.exercises })
    } catch {
      // Silently fail
    }
  },

  deleteProgram: async (programId: string) => {
    // Delete all days first
    try {
      const days = await db.listProgramDays(programId)
      for (const day of days) {
        await db.deleteProgramDay(day.$id)
      }
      await db.deleteProgram(programId)
    } catch {
      // ignore errors
    }
    set((state) => {
      const programs = state.programs.filter((p) => p.$id !== programId)
      return {
        programs,
        currentProgram: programs[0] || null,
        days: state.days.filter((d) => d.programId !== programId),
        builderProgram: null,
        builderDays: [],
      }
    })
  },

  setCurrentProgram: (program: Program) => {
    set({ currentProgram: program, activeDayIndex: 0 })
    get().loadDays(program.$id)
  },

  clearBuilder: () => {
    set({ builderProgram: null, builderDays: [], builderActiveDayIndex: 0 })
  },

  moveExercise: (dayIndex: number, fromIndex: number, direction: 'up' | 'down') => {
    set((state) => {
      const days = [...state.days]
      if (!days[dayIndex]) return state
      const exercises = [...days[dayIndex].exercises]
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
      if (toIndex < 0 || toIndex >= exercises.length) return state
      const temp = exercises[fromIndex]
      exercises[fromIndex] = exercises[toIndex]
      exercises[toIndex] = temp
      days[dayIndex] = { ...days[dayIndex], exercises }
      // Also update builderDays if present
      const builderDays = [...state.builderDays]
      const bIdx = builderDays.findIndex((d) => d.$id === days[dayIndex].$id)
      if (bIdx >= 0) {
        builderDays[bIdx] = { ...days[dayIndex] }
      }
      return { days, builderDays }
    })
    // Auto-save
    get().saveDayToBackend(dayIndex)
  },

  swapExercise: (dayIndex: number, exerciseIndex: number, newExerciseId: string, newExerciseName: string) => {
    set((state) => {
      const days = [...state.days]
      if (!days[dayIndex]) return state
      const exercises = [...days[dayIndex].exercises]
      if (!exercises[exerciseIndex]) return state
      exercises[exerciseIndex] = {
        ...exercises[exerciseIndex],
        exerciseId: newExerciseId,
        exerciseName: newExerciseName,
      }
      days[dayIndex] = { ...days[dayIndex], exercises }
      const builderDays = [...state.builderDays]
      const bIdx = builderDays.findIndex((d) => d.$id === days[dayIndex].$id)
      if (bIdx >= 0) {
        builderDays[bIdx] = { ...days[dayIndex] }
      }
      return { days, builderDays }
    })
    get().saveDayToBackend(dayIndex)
  },
}))

