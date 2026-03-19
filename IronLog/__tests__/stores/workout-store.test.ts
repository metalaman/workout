import { useWorkoutStore } from '@/stores/workout-store'
import type { ActiveWorkoutExercise } from '@/types'

// Helper to reset store between tests
const resetStore = () => useWorkoutStore.getState().reset()

const mockExercises: ActiveWorkoutExercise[] = [
  {
    exerciseId: 'bench-press',
    exerciseName: 'Bench Press',
    sets: [
      { setNumber: 1, weight: 185, reps: 8, previousWeight: 180, previousReps: 8, isCompleted: false },
      { setNumber: 2, weight: 185, reps: 8, previousWeight: 180, previousReps: 8, isCompleted: false },
      { setNumber: 3, weight: 195, reps: 6, previousWeight: 185, previousReps: 6, isCompleted: false },
    ],
    restSeconds: 90,
  },
  {
    exerciseId: 'incline-db-press',
    exerciseName: 'Incline DB Press',
    sets: [
      { setNumber: 1, weight: 65, reps: 10, previousWeight: 60, previousReps: 10, isCompleted: false },
      { setNumber: 2, weight: 65, reps: 10, previousWeight: 60, previousReps: 10, isCompleted: false },
    ],
    restSeconds: 60,
  },
]

describe('Workout Store', () => {
  beforeEach(() => resetStore())

  describe('startWorkout', () => {
    it('initializes workout state correctly', () => {
      const store = useWorkoutStore.getState()
      store.startWorkout({
        sessionId: 'session-1',
        programDayName: 'Push Day A',
        exercises: mockExercises,
      })

      const state = useWorkoutStore.getState()
      expect(state.isActive).toBe(true)
      expect(state.isPaused).toBe(false)
      expect(state.sessionId).toBe('session-1')
      expect(state.programDayName).toBe('Push Day A')
      expect(state.exercises).toHaveLength(2)
      expect(state.currentExerciseIndex).toBe(0)
      expect(state.startTime).toBeGreaterThan(0)
      expect(state.elapsedSeconds).toBe(0)
    })

    it('sets exercises with correct structure', () => {
      useWorkoutStore.getState().startWorkout({
        sessionId: 'session-1',
        programDayName: 'Push Day A',
        exercises: mockExercises,
      })

      const { exercises } = useWorkoutStore.getState()
      expect(exercises[0].exerciseName).toBe('Bench Press')
      expect(exercises[0].sets).toHaveLength(3)
      expect(exercises[0].sets[0].isCompleted).toBe(false)
      expect(exercises[1].exerciseName).toBe('Incline DB Press')
      expect(exercises[1].sets).toHaveLength(2)
    })
  })

  describe('addSet', () => {
    beforeEach(() => {
      useWorkoutStore.getState().startWorkout({
        sessionId: 'session-1',
        programDayName: 'Push Day A',
        exercises: mockExercises,
      })
    })

    it('adds a set to the specified exercise', () => {
      useWorkoutStore.getState().addSet(0)
      const { exercises } = useWorkoutStore.getState()
      expect(exercises[0].sets).toHaveLength(4) // was 3
    })

    it('copies weight/reps from the last set', () => {
      useWorkoutStore.getState().addSet(0)
      const { exercises } = useWorkoutStore.getState()
      const newSet = exercises[0].sets[3]
      expect(newSet.weight).toBe(195) // last set's weight
      expect(newSet.reps).toBe(6)    // last set's reps
      expect(newSet.isCompleted).toBe(false)
    })

    it('assigns correct set number', () => {
      useWorkoutStore.getState().addSet(0)
      const { exercises } = useWorkoutStore.getState()
      expect(exercises[0].sets[3].setNumber).toBe(4)
    })

    it('does not affect other exercises', () => {
      useWorkoutStore.getState().addSet(0)
      const { exercises } = useWorkoutStore.getState()
      expect(exercises[1].sets).toHaveLength(2) // unchanged
    })
  })

  describe('completeSet', () => {
    beforeEach(() => {
      useWorkoutStore.getState().startWorkout({
        sessionId: 'session-1',
        programDayName: 'Push Day A',
        exercises: mockExercises,
      })
    })

    it('marks a set as completed with weight and reps', () => {
      useWorkoutStore.getState().completeSet(0, 0, 190, 8)
      const { exercises } = useWorkoutStore.getState()
      const set = exercises[0].sets[0]
      expect(set.isCompleted).toBe(true)
      expect(set.weight).toBe(190)
      expect(set.reps).toBe(8)
    })

    it('can update weight/reps to different values', () => {
      useWorkoutStore.getState().completeSet(0, 1, 200, 5)
      const { exercises } = useWorkoutStore.getState()
      expect(exercises[0].sets[1].weight).toBe(200)
      expect(exercises[0].sets[1].reps).toBe(5)
    })

    it('does not affect other sets', () => {
      useWorkoutStore.getState().completeSet(0, 0, 190, 8)
      const { exercises } = useWorkoutStore.getState()
      expect(exercises[0].sets[1].isCompleted).toBe(false)
      expect(exercises[0].sets[2].isCompleted).toBe(false)
    })
  })

  describe('nextExercise', () => {
    beforeEach(() => {
      useWorkoutStore.getState().startWorkout({
        sessionId: 'session-1',
        programDayName: 'Push Day A',
        exercises: mockExercises,
      })
    })

    it('advances to the next exercise', () => {
      useWorkoutStore.getState().nextExercise()
      expect(useWorkoutStore.getState().currentExerciseIndex).toBe(1)
    })

    it('does not go past the last exercise', () => {
      useWorkoutStore.getState().nextExercise()
      useWorkoutStore.getState().nextExercise()
      useWorkoutStore.getState().nextExercise()
      expect(useWorkoutStore.getState().currentExerciseIndex).toBe(1) // max index
    })
  })

  describe('pauseWorkout / resumeWorkout', () => {
    beforeEach(() => {
      useWorkoutStore.getState().startWorkout({
        sessionId: 'session-1',
        programDayName: 'Push Day A',
        exercises: mockExercises,
      })
    })

    it('pauses and captures elapsed time', () => {
      useWorkoutStore.getState().updateElapsed(120)
      useWorkoutStore.getState().pauseWorkout()
      const state = useWorkoutStore.getState()
      expect(state.isPaused).toBe(true)
      expect(state.pausedAtSeconds).toBe(120)
    })

    it('resumes workout', () => {
      useWorkoutStore.getState().pauseWorkout()
      useWorkoutStore.getState().resumeWorkout()
      expect(useWorkoutStore.getState().isPaused).toBe(false)
    })
  })

  describe('rest timer', () => {
    beforeEach(() => {
      useWorkoutStore.getState().startWorkout({
        sessionId: 'session-1',
        programDayName: 'Push Day A',
        exercises: mockExercises,
      })
    })

    it('starts rest timer', () => {
      useWorkoutStore.getState().startRest(90)
      const state = useWorkoutStore.getState()
      expect(state.isResting).toBe(true)
      expect(state.restTimerSeconds).toBe(90)
    })

    it('stops rest timer', () => {
      useWorkoutStore.getState().startRest(90)
      useWorkoutStore.getState().stopRest()
      const state = useWorkoutStore.getState()
      expect(state.isResting).toBe(false)
      expect(state.restTimerSeconds).toBe(0)
    })
  })

  describe('endWorkout', () => {
    beforeEach(() => {
      useWorkoutStore.getState().startWorkout({
        sessionId: 'session-1',
        programDayName: 'Push Day A',
        exercises: mockExercises,
      })
    })

    it('calculates total volume from completed sets only', () => {
      // Complete 2 sets: 190*8 + 195*6 = 1520 + 1170 = 2690
      useWorkoutStore.getState().completeSet(0, 0, 190, 8)
      useWorkoutStore.getState().completeSet(0, 2, 195, 6)
      const result = useWorkoutStore.getState().endWorkout()
      expect(result.totalVolume).toBe(2690)
    })

    it('returns zero volume when no sets completed', () => {
      const result = useWorkoutStore.getState().endWorkout()
      expect(result.totalVolume).toBe(0)
    })

    it('returns duration in seconds', () => {
      // Mock time: startTime was set when startWorkout was called
      const result = useWorkoutStore.getState().endWorkout()
      expect(result.duration).toBeGreaterThanOrEqual(0)
    })

    it('resets all state after ending', () => {
      useWorkoutStore.getState().completeSet(0, 0, 190, 8)
      useWorkoutStore.getState().endWorkout()
      const state = useWorkoutStore.getState()
      expect(state.isActive).toBe(false)
      expect(state.sessionId).toBeNull()
      expect(state.exercises).toHaveLength(0)
      expect(state.startTime).toBeNull()
    })

    it('includes volume from all exercises', () => {
      // Bench: 185*8 = 1480
      useWorkoutStore.getState().completeSet(0, 0, 185, 8)
      // Incline DB: 65*10 = 650
      useWorkoutStore.getState().completeSet(1, 0, 65, 10)
      const result = useWorkoutStore.getState().endWorkout()
      expect(result.totalVolume).toBe(2130) // 1480 + 650
    })

    it('ignores zero-weight sets in volume calc', () => {
      useWorkoutStore.getState().completeSet(0, 0, 0, 8)
      const result = useWorkoutStore.getState().endWorkout()
      expect(result.totalVolume).toBe(0)
    })
  })

  describe('reset', () => {
    it('returns to initial state', () => {
      useWorkoutStore.getState().startWorkout({
        sessionId: 'session-1',
        programDayName: 'Push Day A',
        exercises: mockExercises,
      })
      useWorkoutStore.getState().reset()
      const state = useWorkoutStore.getState()
      expect(state.isActive).toBe(false)
      expect(state.exercises).toHaveLength(0)
      expect(state.sessionId).toBeNull()
    })
  })
})
