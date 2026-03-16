import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Href } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth-store'
import { useProgramStore } from '@/stores/program-store'
import { useWorkoutStore } from '@/stores/workout-store'
import { createWorkoutSession } from '@/lib/database'
import type { ActiveWorkoutExercise } from '@/types'

export default function ProgramScreen() {
  const { user } = useAuthStore()
  const {
    currentProgram, days, activeDayIndex,
    setActiveDayIndex, updateDayExercises, saveDayToBackend, loadPrograms,
  } = useProgramStore()
  const { startWorkout } = useWorkoutStore()
  const router = useRouter()
  const [editingCell, setEditingCell] = useState<{ ex: number; set: number; field: 'weight' | 'reps' } | null>(null)

  useEffect(() => {
    if (user?.$id) {
      loadPrograms(user.$id)
    }
  }, [user?.$id])

  const currentDay = days[activeDayIndex]

  const handleCellEdit = (exIdx: number, setIdx: number, field: 'weight' | 'reps', value: string) => {
    const num = parseInt(value, 10)
    if (isNaN(num) || !currentDay) return

    const exercises = currentDay.exercises.map((ex, ei) => {
      if (ei !== exIdx) return ex
      const sets = ex.sets.map((s, si) => {
        if (si !== setIdx) return s
        return { ...s, [field]: num }
      })
      return { ...ex, sets }
    })

    updateDayExercises(activeDayIndex, exercises)
    // Debounce save to backend
    saveDayToBackend(activeDayIndex)
  }

  const handleStartWorkout = async () => {
    if (!user?.$id || !currentDay) return

    const activeExercises: ActiveWorkoutExercise[] = currentDay.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      sets: ex.sets.map((s, i) => ({
        setNumber: i + 1,
        weight: s.weight,
        reps: s.reps,
        previousWeight: s.weight,
        previousReps: s.reps,
        isCompleted: false,
      })),
      restSeconds: 90,
    }))

    try {
      const session = await createWorkoutSession({
        userId: user.$id,
        programDayId: currentDay.$id,
        programDayName: currentDay.name,
        startedAt: new Date().toISOString(),
        completedAt: null,
        totalVolume: 0,
        duration: 0,
        notes: '',
      })
      startWorkout({ sessionId: session.$id, programDayName: currentDay.name, exercises: activeExercises })
    } catch {
      startWorkout({ sessionId: `local-${Date.now()}`, programDayName: currentDay.name, exercises: activeExercises })
    }

    router.push('/workout/active' as Href)
  }

  const handleAddExercise = () => {
    // Navigate to library to pick an exercise
    router.push('/(tabs)/library' as Href)
  }

  if (!currentProgram || days.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No program yet</Text>
          <Text style={styles.emptySubtext}>Create your first program to get started</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>MY PROGRAM</Text>
        <Text style={styles.headerTitle}>{currentProgram.name}</Text>
        <Text style={styles.headerSubtitle}>
          {currentProgram.daysPerWeek} days/week · Week {currentProgram.currentWeek} of {currentProgram.totalWeeks}
        </Text>
      </View>

      {/* Day tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayTabs}
      >
        {days.map((day, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => { setActiveDayIndex(i); setEditingCell(null) }}
            style={[styles.dayTab, activeDayIndex === i && styles.dayTabActive]}
          >
            <Text style={[styles.dayTabText, activeDayIndex === i && styles.dayTabTextActive]}>{day.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Exercises */}
      <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
        {currentDay?.exercises.map((ex, exIdx) => (
          <View key={exIdx} style={styles.exerciseBlock}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
              <Text style={styles.editIcon}>✏️</Text>
            </View>
            <View style={styles.setsRow}>
              {ex.sets.map((s, setIdx) => {
                const isEditing = editingCell?.ex === exIdx && editingCell?.set === setIdx

                return (
                  <TouchableOpacity
                    key={setIdx}
                    style={styles.setBox}
                    onPress={() => setEditingCell({ ex: exIdx, set: setIdx, field: 'weight' })}
                  >
                    {isEditing ? (
                      <View style={styles.setEditContainer}>
                        <TextInput
                          style={styles.setEditInput}
                          defaultValue={s.weight.toString()}
                          keyboardType="number-pad"
                          autoFocus
                          selectTextOnFocus
                          onSubmitEditing={(e) => {
                            handleCellEdit(exIdx, setIdx, 'weight', e.nativeEvent.text)
                            setEditingCell({ ex: exIdx, set: setIdx, field: 'reps' })
                          }}
                        />
                        <TextInput
                          style={styles.setEditInputSmall}
                          defaultValue={s.reps.toString()}
                          keyboardType="number-pad"
                          selectTextOnFocus
                          onSubmitEditing={(e) => {
                            handleCellEdit(exIdx, setIdx, 'reps', e.nativeEvent.text)
                            setEditingCell(null)
                          }}
                          onBlur={() => setEditingCell(null)}
                        />
                      </View>
                    ) : (
                      <>
                        <Text style={styles.setWeight}>{s.weight}</Text>
                        <Text style={styles.setReps}>{s.reps} reps</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        ))}

        {/* Add exercise */}
        <TouchableOpacity style={styles.addExercise} onPress={handleAddExercise}>
          <Text style={styles.addExerciseText}>+ Add Exercise</Text>
        </TouchableOpacity>

        {/* Start Workout button */}
        <TouchableOpacity onPress={handleStartWorkout} activeOpacity={0.8} style={styles.startContainer}>
          <LinearGradient colors={['#e8ff47', '#a8e000']} style={styles.startButton}>
            <Text style={styles.startButtonText}>▶ Start {currentDay?.name}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  emptySubtext: {
    color: Colors.dark.textDark,
    fontSize: FontSize.base,
  },
  header: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  headerLabel: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  headerSubtitle: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.md,
    marginTop: 2,
  },
  dayTabs: {
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  dayTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.surfaceLight,
  },
  dayTabActive: {
    backgroundColor: Colors.dark.accent,
  },
  dayTabText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  dayTabTextActive: {
    color: Colors.dark.textOnAccent,
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
  },
  exerciseBlock: {
    marginBottom: Spacing.md + 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  exerciseName: {
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  editIcon: {
    fontSize: FontSize.sm,
    color: Colors.dark.textDark,
  },
  setsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  setBox: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  setWeight: {
    color: Colors.dark.accent,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  setReps: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xs,
  },
  setEditContainer: {
    alignItems: 'center',
    gap: 2,
  },
  setEditInput: {
    color: Colors.dark.accent,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    minWidth: 30,
    padding: 0,
  },
  setEditInputSmall: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    minWidth: 20,
    padding: 0,
  },
  addExercise: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.dark.borderLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md + 2,
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  addExerciseText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.base,
  },
  startContainer: {
    marginBottom: Spacing.xxl,
  },
  startButton: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  startButtonText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
})
