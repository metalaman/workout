import { useProgramStore } from '@/stores/program-store'

// Mock the database module
jest.mock('@/lib/database', () => ({
  listPrograms: jest.fn(),
  listProgramDays: jest.fn(),
  createProgram: jest.fn(),
  createProgramDay: jest.fn(),
  updateProgramDay: jest.fn(),
  deleteProgramDay: jest.fn(),
  deleteProgram: jest.fn(),
}))

const db = require('@/lib/database')

const resetStore = () => {
  useProgramStore.setState({
    programs: [],
    currentProgram: null,
    days: [],
    activeDayIndex: 0,
    isLoading: false,
    error: null,
    builderProgram: null,
    builderDays: [],
    builderActiveDayIndex: 0,
  })
}

describe('Program Store', () => {
  beforeEach(() => {
    resetStore()
    jest.clearAllMocks()
  })

  describe('loadPrograms', () => {
    it('loads programs from Appwrite and sets current', async () => {
      const mockPrograms = [
        { $id: 'p1', userId: 'u1', name: 'PPL', daysPerWeek: 6, currentWeek: 1, totalWeeks: 8 },
        { $id: 'p2', userId: 'u1', name: 'Upper Lower', daysPerWeek: 4, currentWeek: 1, totalWeeks: 12 },
      ]
      db.listPrograms.mockResolvedValue(mockPrograms)
      db.listProgramDays.mockResolvedValue([])

      await useProgramStore.getState().loadPrograms('u1')

      const state = useProgramStore.getState()
      expect(state.programs).toHaveLength(2)
      expect(state.currentProgram?.$id).toBe('p1') // first program
      expect(state.isLoading).toBe(false)
    })

    it('falls back to default program when no programs exist', async () => {
      db.listPrograms.mockResolvedValue([])

      await useProgramStore.getState().loadPrograms('u1')

      const state = useProgramStore.getState()
      expect(state.programs).toHaveLength(1)
      expect(state.currentProgram?.name).toBe('Push Pull Legs')
      expect(state.days.length).toBeGreaterThan(0)
    })

    it('falls back to default on Appwrite error', async () => {
      db.listPrograms.mockRejectedValue(new Error('Network error'))

      await useProgramStore.getState().loadPrograms('u1')

      const state = useProgramStore.getState()
      expect(state.currentProgram?.name).toBe('Push Pull Legs')
    })
  })

  describe('createNewProgram', () => {
    it('creates local program for dev users', async () => {
      await useProgramStore.getState().createNewProgram('My Program', 4, 8, 'dev')

      const state = useProgramStore.getState()
      expect(state.builderProgram?.name).toBe('My Program')
      expect(state.builderProgram?.$id).toMatch(/^local-/)
      expect(state.programs).toHaveLength(1)
      expect(db.createProgram).not.toHaveBeenCalled()
    })

    it('creates program via Appwrite for real users', async () => {
      db.createProgram.mockResolvedValue({
        $id: 'p-new',
        userId: 'user-1',
        name: 'Test',
        daysPerWeek: 5,
        totalWeeks: 12,
        currentWeek: 1,
      })

      await useProgramStore.getState().createNewProgram('Test', 5, 12, 'user-1', '#ff6b6b')

      expect(db.createProgram).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-1',
        name: 'Test',
        daysPerWeek: 5,
        totalWeeks: 12,
      }))
      const state = useProgramStore.getState()
      expect(state.builderProgram?.name).toBe('Test')
      expect(state.currentProgram?.color).toBe('#ff6b6b')
    })

    it('falls back to local on Appwrite failure', async () => {
      db.createProgram.mockRejectedValue(new Error('Appwrite error'))

      await useProgramStore.getState().createNewProgram('Fallback', 3, 6, 'user-1')

      const state = useProgramStore.getState()
      expect(state.builderProgram?.$id).toMatch(/^local-/)
      expect(state.builderProgram?.name).toBe('Fallback')
    })
  })

  describe('addDay', () => {
    it('adds a local day for dev users', async () => {
      await useProgramStore.getState().createNewProgram('Test', 3, 6, 'dev')
      await useProgramStore.getState().addDay('Push Day')

      const state = useProgramStore.getState()
      expect(state.builderDays).toHaveLength(1)
      expect(state.builderDays[0].name).toBe('Push Day')
      expect(state.builderDays[0].exercises).toHaveLength(0)
    })
  })

  describe('builder operations', () => {
    beforeEach(async () => {
      await useProgramStore.getState().createNewProgram('Test', 3, 6, 'dev')
      await useProgramStore.getState().addDay('Push')
      await useProgramStore.getState().addDay('Pull')
    })

    it('addExerciseToBuilderDay adds exercise to correct day', () => {
      useProgramStore.getState().addExerciseToBuilderDay(0, {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        sets: [{ weight: 185, reps: 8 }],
      })

      const { builderDays } = useProgramStore.getState()
      expect(builderDays[0].exercises).toHaveLength(1)
      expect(builderDays[0].exercises[0].exerciseName).toBe('Bench Press')
      expect(builderDays[1].exercises).toHaveLength(0) // untouched
    })

    it('removeExerciseFromDay removes by index', () => {
      useProgramStore.getState().addExerciseToBuilderDay(0, {
        exerciseId: 'bench-press', exerciseName: 'Bench Press',
        sets: [{ weight: 185, reps: 8 }],
      })
      useProgramStore.getState().addExerciseToBuilderDay(0, {
        exerciseId: 'ohp', exerciseName: 'OHP',
        sets: [{ weight: 115, reps: 8 }],
      })

      useProgramStore.getState().removeExerciseFromDay(0, 0)

      const { builderDays } = useProgramStore.getState()
      expect(builderDays[0].exercises).toHaveLength(1)
      expect(builderDays[0].exercises[0].exerciseName).toBe('OHP')
    })

    it('reorderExercise swaps positions', () => {
      useProgramStore.getState().addExerciseToBuilderDay(0, {
        exerciseId: 'bench-press', exerciseName: 'Bench Press',
        sets: [{ weight: 185, reps: 8 }],
      })
      useProgramStore.getState().addExerciseToBuilderDay(0, {
        exerciseId: 'ohp', exerciseName: 'OHP',
        sets: [{ weight: 115, reps: 8 }],
      })

      useProgramStore.getState().reorderExercise(0, 0, 1)

      const { builderDays } = useProgramStore.getState()
      expect(builderDays[0].exercises[0].exerciseName).toBe('OHP')
      expect(builderDays[0].exercises[1].exerciseName).toBe('Bench Press')
    })

    it('toggleSuperset creates a superset group', () => {
      useProgramStore.getState().addExerciseToBuilderDay(0, {
        exerciseId: 'bench-press', exerciseName: 'Bench Press',
        sets: [{ weight: 185, reps: 8 }],
      })
      useProgramStore.getState().addExerciseToBuilderDay(0, {
        exerciseId: 'cable-flyes', exerciseName: 'Cable Flyes',
        sets: [{ weight: 30, reps: 12 }],
      })

      useProgramStore.getState().toggleSuperset(0, 0)

      const { builderDays } = useProgramStore.getState()
      expect(builderDays[0].exercises[0].supersetGroup).toBeDefined()
      expect(builderDays[0].exercises[0].supersetGroup).toBe(
        builderDays[0].exercises[1].supersetGroup
      )
    })

    it('toggleSuperset removes existing superset', () => {
      useProgramStore.getState().addExerciseToBuilderDay(0, {
        exerciseId: 'bench-press', exerciseName: 'Bench Press',
        sets: [{ weight: 185, reps: 8 }],
      })
      useProgramStore.getState().addExerciseToBuilderDay(0, {
        exerciseId: 'cable-flyes', exerciseName: 'Cable Flyes',
        sets: [{ weight: 30, reps: 12 }],
      })

      // Create then remove
      useProgramStore.getState().toggleSuperset(0, 0)
      useProgramStore.getState().toggleSuperset(0, 0)

      const { builderDays } = useProgramStore.getState()
      expect(builderDays[0].exercises[0].supersetGroup).toBeUndefined()
      expect(builderDays[0].exercises[1].supersetGroup).toBeUndefined()
    })

    it('updateDayName updates the day name', () => {
      useProgramStore.getState().updateDayName(0, 'Heavy Push')
      const { builderDays } = useProgramStore.getState()
      expect(builderDays[0].name).toBe('Heavy Push')
    })

    it('clearBuilder resets builder state', () => {
      useProgramStore.getState().clearBuilder()
      const state = useProgramStore.getState()
      expect(state.builderProgram).toBeNull()
      expect(state.builderDays).toHaveLength(0)
    })
  })

  describe('moveExercise', () => {
    it('moves exercise up', () => {
      // Use loadDefaultProgram to populate days directly
      useProgramStore.getState().loadDefaultProgram('dev')
      const { days } = useProgramStore.getState()
      const original0 = days[0].exercises[0].exerciseName
      const original1 = days[0].exercises[1].exerciseName

      useProgramStore.getState().moveExercise(0, 1, 'up')

      const updated = useProgramStore.getState().days
      expect(updated[0].exercises[0].exerciseName).toBe(original1)
      expect(updated[0].exercises[1].exerciseName).toBe(original0)
    })

    it('does not move first exercise up', () => {
      useProgramStore.getState().loadDefaultProgram('dev')
      const original = useProgramStore.getState().days[0].exercises.map(e => e.exerciseName)

      useProgramStore.getState().moveExercise(0, 0, 'up')

      const updated = useProgramStore.getState().days[0].exercises.map(e => e.exerciseName)
      expect(updated).toEqual(original)
    })

    it('does not move last exercise down', () => {
      useProgramStore.getState().loadDefaultProgram('dev')
      const { days } = useProgramStore.getState()
      const lastIdx = days[0].exercises.length - 1
      const original = days[0].exercises.map(e => e.exerciseName)

      useProgramStore.getState().moveExercise(0, lastIdx, 'down')

      const updated = useProgramStore.getState().days[0].exercises.map(e => e.exerciseName)
      expect(updated).toEqual(original)
    })
  })

  describe('deleteProgram', () => {
    it('removes program from state', async () => {
      db.listProgramDays.mockResolvedValue([])
      db.deleteProgramDay.mockResolvedValue(undefined)
      db.deleteProgram.mockResolvedValue(undefined)

      useProgramStore.setState({
        programs: [
          { $id: 'p1', userId: 'u1', name: 'PPL', daysPerWeek: 6, currentWeek: 1, totalWeeks: 8 },
          { $id: 'p2', userId: 'u1', name: 'UL', daysPerWeek: 4, currentWeek: 1, totalWeeks: 12 },
        ],
        currentProgram: { $id: 'p1', userId: 'u1', name: 'PPL', daysPerWeek: 6, currentWeek: 1, totalWeeks: 8 },
      })

      await useProgramStore.getState().deleteProgram('p1')

      const state = useProgramStore.getState()
      expect(state.programs).toHaveLength(1)
      expect(state.programs[0].$id).toBe('p2')
      expect(state.currentProgram?.$id).toBe('p2')
    })
  })
})
