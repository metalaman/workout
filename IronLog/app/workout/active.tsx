import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Href } from 'expo-router'
import { useWorkoutStore } from '@/stores/workout-store'
import { useSessionStore } from '@/stores/session-store'
import { useAuthStore } from '@/stores/auth-store'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { formatDuration } from '@/lib/utils'
import * as db from '@/lib/database'
import type { PersonalRecord } from '@/types'

export default function ActiveWorkoutScreen() {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const {
    programDayName, exercises, currentExerciseIndex, elapsedSeconds,
    isResting, restTimerSeconds, sessionId,
    completeSet, nextExercise, updateElapsed, startRest, stopRest, endWorkout, isActive,
  } = useWorkoutStore()
  const { setLastCompleted, setNewPRs, addSession, loadRecent } = useSessionStore()

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [editingSet, setEditingSet] = useState<number | null>(null)
  const [editWeight, setEditWeight] = useState('')
  const [editReps, setEditReps] = useState('')

  // Main timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      updateElapsed(useWorkoutStore.getState().elapsedSeconds + 1)
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Rest timer
  useEffect(() => {
    if (isResting && restTimerSeconds > 0) {
      restRef.current = setInterval(() => {
        const current = useWorkoutStore.getState().restTimerSeconds
        if (current <= 1) {
          stopRest()
          if (restRef.current) clearInterval(restRef.current)
        } else {
          useWorkoutStore.setState({ restTimerSeconds: current - 1 })
        }
      }, 1000)
      return () => { if (restRef.current) clearInterval(restRef.current) }
    }
  }, [isResting])

  if (!isActive || exercises.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active workout</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const currentExercise = exercises[currentExerciseIndex]
  const completedExercises = exercises.slice(0, currentExerciseIndex)
  const upNextExercises = exercises.slice(currentExerciseIndex + 1)

  const handleCompleteSet = async (setIndex: number) => {
    const set = currentExercise.sets[setIndex]
    const weight = editingSet === setIndex && editWeight ? parseFloat(editWeight) : set.weight || set.previousWeight || 0
    const reps = editingSet === setIndex && editReps ? parseInt(editReps, 10) : set.reps || set.previousReps || 0

    completeSet(currentExerciseIndex, setIndex, weight, reps)
    setEditingSet(null)

    // Save set to backend
    if (user?.$id && sessionId) {
      try {
        await db.createWorkoutSet({
          sessionId,
          userId: user.$id,
          exerciseId: currentExercise.exerciseId,
          setNumber: set.setNumber,
          weight,
          reps,
          isCompleted: true,
        })
      } catch {
        // Continue even if backend fails
      }
    }

    // Auto-start rest if not last set
    if (setIndex < currentExercise.sets.length - 1) {
      startRest(currentExercise.restSeconds)
    }

    // Auto-advance if all sets complete
    const allDone = currentExercise.sets.every((s, i) => i === setIndex || s.isCompleted)
    if (allDone && currentExerciseIndex < exercises.length - 1) {
      setTimeout(() => nextExercise(), 500)
    }
  }

  const handleEndWorkout = () => {
    Alert.alert('End Workout?', 'Your progress will be saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: async () => {
          const { totalVolume, duration } = endWorkout()

          // Save to backend
          const completedSession = {
            $id: sessionId ?? `local-${Date.now()}`,
            userId: user?.$id ?? 'dev',
            programDayId: '',
            programDayName,
            startedAt: new Date(Date.now() - duration * 1000).toISOString(),
            completedAt: new Date().toISOString(),
            totalVolume,
            duration,
            notes: '',
          }

          if (user?.$id && sessionId && !sessionId.startsWith('local-')) {
            try {
              await db.completeWorkoutSession(sessionId, {
                completedAt: new Date().toISOString(),
                totalVolume,
                duration,
              })

              // Check for PRs
              const newPRs: PersonalRecord[] = []
              for (const ex of exercises) {
                for (const s of ex.sets) {
                  if (s.isCompleted && s.weight > 0) {
                    try {
                      const result = await db.checkAndUpdatePR(
                        user.$id, ex.exerciseId, ex.exerciseName, s.weight, s.reps
                      )
                      if (result.isNewPR && result.record) {
                        // Avoid duplicates
                        if (!newPRs.find((p) => p.exerciseId === ex.exerciseId)) {
                          newPRs.push(result.record)
                        }
                      }
                    } catch {
                      // Continue
                    }
                  }
                }
              }

              // Update streak
              if (profile?.$id) {
                try {
                  await db.updateStreak(user.$id, profile.$id)
                } catch {
                  // Continue
                }
              }

              setNewPRs(newPRs)
            } catch {
              // Continue to summary even if backend fails
            }
          }

          setLastCompleted(completedSession)
          addSession(completedSession)

          // Refresh recent sessions
          if (user?.$id) {
            loadRecent(user.$id)
          }

          router.replace('/workout/summary' as Href)
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleEndWorkout}>
          <Text style={styles.endButton}>← End</Text>
        </TouchableOpacity>
        <Text style={styles.workoutName}>{programDayName}</Text>
        <Text style={styles.timer}>{formatDuration(elapsedSeconds)}</Text>
      </View>

      {/* Rest timer overlay */}
      {isResting && (
        <View style={styles.restOverlay}>
          <Text style={styles.restLabel}>REST</Text>
          <Text style={styles.restTime}>{formatDuration(restTimerSeconds)}</Text>
          <TouchableOpacity onPress={stopRest}>
            <Text style={styles.skipRest}>Skip →</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Current exercise */}
        <View style={styles.currentExercise}>
          <View style={styles.exerciseHeader}>
            <View>
              <Text style={styles.exerciseCounter}>
                EXERCISE {currentExerciseIndex + 1}/{exercises.length}
              </Text>
              <Text style={styles.exerciseName}>{currentExercise.exerciseName}</Text>
            </View>
            <Text style={styles.restInfo}>Rest: {currentExercise.restSeconds}s</Text>
          </View>

          {/* Sets table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: 30 }]}>SET</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>PREV</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>LBS</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>REPS</Text>
            <Text style={[styles.tableHeaderCell, { width: 30 }]}>✓</Text>
          </View>

          {/* Sets rows */}
          {currentExercise.sets.map((set, i) => (
            <View key={i} style={styles.setRow}>
              <Text style={[styles.setCell, { width: 30, fontWeight: FontWeight.bold }]}>
                {set.setNumber}
              </Text>
              <Text style={[styles.setCell, { flex: 1, color: Colors.dark.textDark }]}>
                {set.previousWeight && set.previousReps ? `${set.previousWeight}×${set.previousReps}` : '-'}
              </Text>
              <View style={{ flex: 1 }}>
                {editingSet === i || !set.isCompleted ? (
                  <TextInput
                    style={[styles.setInput, set.isCompleted && styles.setInputCompleted]}
                    value={editingSet === i ? editWeight : (set.weight ? set.weight.toString() : '')}
                    placeholder={set.previousWeight?.toString() ?? '-'}
                    placeholderTextColor={Colors.dark.textMuted}
                    keyboardType="number-pad"
                    onFocus={() => {
                      setEditingSet(i)
                      setEditWeight(set.weight ? set.weight.toString() : '')
                      setEditReps(set.reps ? set.reps.toString() : '')
                    }}
                    onChangeText={setEditWeight}
                  />
                ) : (
                  <Text style={[styles.setCell, styles.setCellCompleted]}>{set.weight}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                {editingSet === i || !set.isCompleted ? (
                  <TextInput
                    style={[styles.setInput, set.isCompleted && styles.setInputCompleted]}
                    value={editingSet === i ? editReps : (set.reps ? set.reps.toString() : '')}
                    placeholder={set.previousReps?.toString() ?? '-'}
                    placeholderTextColor={Colors.dark.textMuted}
                    keyboardType="number-pad"
                    onChangeText={setEditReps}
                  />
                ) : (
                  <Text style={[styles.setCell, styles.setCellCompleted]}>{set.reps}</Text>
                )}
              </View>
              <TouchableOpacity
                style={{ width: 30, alignItems: 'center' }}
                onPress={() => !set.isCompleted && handleCompleteSet(i)}
              >
                <View style={[styles.checkBox, set.isCompleted && styles.checkBoxDone]}>
                  {set.isCompleted && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Completed exercises */}
        {completedExercises.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>COMPLETED</Text>
            {completedExercises.map((ex, i) => (
              <View key={i} style={styles.completedCard}>
                <View>
                  <Text style={styles.completedName}>{ex.exerciseName}</Text>
                  <Text style={styles.completedInfo}>
                    {ex.sets.length} sets · {ex.sets[0]?.weight}-{ex.sets[ex.sets.length - 1]?.weight} lbs
                  </Text>
                </View>
                <Text style={styles.completedCheck}>✓</Text>
              </View>
            ))}
          </View>
        )}

        {/* Up next */}
        {upNextExercises.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>UP NEXT</Text>
            {upNextExercises.map((ex, i) => (
              <View key={i} style={styles.upNextRow}>
                <Text style={styles.upNextName}>{ex.exerciseName}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
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
    gap: Spacing.xl,
  },
  emptyText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xxl,
  },
  backLink: {
    color: Colors.dark.accent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  endButton: {
    color: Colors.dark.accent,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  workoutName: {
    color: Colors.dark.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  timer: {
    color: Colors.dark.accent,
    fontSize: 22,
    fontWeight: FontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  restOverlay: {
    backgroundColor: Colors.dark.accentSurface,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
    marginHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.xxl,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  restLabel: {
    color: Colors.dark.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 2,
  },
  restTime: {
    color: Colors.dark.accent,
    fontSize: 36,
    fontWeight: FontWeight.extrabold,
    fontVariant: ['tabular-nums'],
  },
  skipRest: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.base,
    marginTop: Spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  currentExercise: {
    marginHorizontal: Spacing.xxl,
    backgroundColor: Colors.dark.accentSurface,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md + 2,
  },
  exerciseCounter: {
    color: Colors.dark.accent,
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
  },
  exerciseName: {
    color: Colors.dark.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  restInfo: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tableHeaderCell: {
    fontSize: 9,
    color: Colors.dark.textMuted,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  setCell: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
    textAlign: 'center',
  },
  setCellCompleted: {
    color: Colors.dark.accent,
    fontWeight: FontWeight.semibold,
  },
  setInput: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.sm - 2,
    paddingVertical: 5,
    color: Colors.dark.textMuted,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  setInputCompleted: {
    backgroundColor: Colors.dark.accentSurfaceActive,
    color: Colors.dark.accent,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm - 2,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxDone: {
    backgroundColor: Colors.dark.accent,
  },
  checkMark: {
    fontSize: FontSize.sm,
    color: Colors.dark.textOnAccent,
  },
  section: {
    paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.dark.textMuted,
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  completedCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  completedName: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  completedInfo: {
    color: Colors.dark.textDark,
    fontSize: FontSize.sm,
  },
  completedCheck: {
    color: Colors.dark.accent,
    fontSize: FontSize.xl,
  },
  upNextRow: {
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.surface,
  },
  upNextName: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.base,
  },
})
