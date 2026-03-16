import { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Keyboard,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Href } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth-store'
import { useProgramStore } from '@/stores/program-store'
import { useWorkoutStore } from '@/stores/workout-store'
import { createWorkoutSession } from '@/lib/database'
import { ExerciseIcon, MUSCLE_GROUP_COLORS } from '@/components/exercise-icon'
import type { ActiveWorkoutExercise } from '@/types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Derive muscle group from exercise name for color accents
function guessMuscleGroup(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('bench') || n.includes('chest') || n.includes('fly') || n.includes('push up') || n.includes('pushup') || n.includes('dip'))
    return 'Chest'
  if (n.includes('squat') || n.includes('leg') || n.includes('lunge') || n.includes('calf') || n.includes('hamstring') || n.includes('quad') || n.includes('glute') || n.includes('deadlift') || n.includes('hip'))
    return 'Legs'
  if (n.includes('row') || n.includes('pull') || n.includes('lat') || n.includes('back') || n.includes('chin'))
    return 'Back'
  if (n.includes('shoulder') || n.includes('press') || n.includes('ohp') || n.includes('lateral') || n.includes('raise') || n.includes('delt') || n.includes('military'))
    return 'Shoulders'
  if (n.includes('curl') || n.includes('bicep') || n.includes('tricep') || n.includes('extension') || n.includes('skull') || n.includes('hammer') || n.includes('pushdown'))
    return 'Arms'
  if (n.includes('plank') || n.includes('crunch') || n.includes('ab') || n.includes('core') || n.includes('sit up') || n.includes('situp'))
    return 'Core'
  return 'Chest' // fallback
}

function getMuscleColor(exerciseName: string): string {
  const group = guessMuscleGroup(exerciseName)
  return MUSCLE_GROUP_COLORS[group] || Colors.dark.accent
}

export default function ProgramScreen() {
  const { user } = useAuthStore()
  const {
    currentProgram,
    days,
    activeDayIndex,
    setActiveDayIndex,
    updateDayExercises,
    saveDayToBackend,
    loadPrograms,
  } = useProgramStore()
  const { startWorkout } = useWorkoutStore()
  const router = useRouter()

  // editingChip tracks which set chip is being edited: { exIdx, setIdx }
  const [editingChip, setEditingChip] = useState<{ exIdx: number; setIdx: number } | null>(null)
  const [editWeight, setEditWeight] = useState('')
  const [editReps, setEditReps] = useState('')
  const repsRef = useRef<TextInput>(null)
  const dayScrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    if (user?.$id) {
      loadPrograms(user.$id)
    }
  }, [user?.$id])

  const currentDay = days[activeDayIndex]

  const handleChipTap = (exIdx: number, setIdx: number) => {
    if (!currentDay) return
    const s = currentDay.exercises[exIdx].sets[setIdx]
    setEditWeight(s.weight.toString())
    setEditReps(s.reps.toString())
    setEditingChip({ exIdx, setIdx })
  }

  const handleSaveEdit = () => {
    if (!editingChip || !currentDay) return
    const { exIdx, setIdx } = editingChip
    const w = parseInt(editWeight, 10)
    const r = parseInt(editReps, 10)
    if (isNaN(w) || isNaN(r)) {
      setEditingChip(null)
      return
    }

    const exercises = currentDay.exercises.map((ex, ei) => {
      if (ei !== exIdx) return ex
      const sets = ex.sets.map((s, si) => {
        if (si !== setIdx) return s
        return { ...s, weight: w, reps: r }
      })
      return { ...ex, sets }
    })

    updateDayExercises(activeDayIndex, exercises)
    saveDayToBackend(activeDayIndex)
    setEditingChip(null)
    Keyboard.dismiss()
  }

  const handleCancelEdit = () => {
    setEditingChip(null)
    Keyboard.dismiss()
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
      startWorkout({
        sessionId: session.$id,
        programDayName: currentDay.name,
        exercises: activeExercises,
      })
    } catch {
      startWorkout({
        sessionId: `local-${Date.now()}`,
        programDayName: currentDay.name,
        exercises: activeExercises,
      })
    }

    router.push('/workout/active' as Href)
  }

  const handleAddExercise = () => {
    router.push('/(tabs)/library' as Href)
  }

  // ── Empty state ──────────────────────────────
  if (!currentProgram || days.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Text style={styles.emptyIcon}>📋</Text>
          </View>
          <Text style={styles.emptyTitle}>No Program Yet</Text>
          <Text style={styles.emptySub}>
            Create your first program to start tracking your lifts
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // ── Main screen ──────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>MY PROGRAM</Text>
        <Text style={styles.headerTitle}>{currentProgram.name}</Text>
        <Text style={styles.headerWeek}>
          Week {currentProgram.currentWeek} of {currentProgram.totalWeeks}
        </Text>
      </View>

      {/* Day selector pills */}
      <ScrollView
        ref={dayScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayPillRow}
      >
        {days.map((day, i) => {
          const isActive = activeDayIndex === i
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={() => {
                setActiveDayIndex(i)
                setEditingChip(null)
              }}
            >
              {isActive ? (
                <LinearGradient
                  colors={[Colors.dark.accent, Colors.dark.accentGreen]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dayPillActive}
                >
                  <Text style={styles.dayPillTextActive}>{day.name}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.dayPill}>
                  <Text style={styles.dayPillText}>{day.name}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Exercise list */}
      <ScrollView
        style={styles.exerciseScroll}
        contentContainerStyle={styles.exerciseList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentDay?.exercises.map((ex, exIdx) => {
          const muscleGroup = guessMuscleGroup(ex.exerciseName)
          const accentColor = getMuscleColor(ex.exerciseName)

          return (
            <View key={exIdx} style={styles.exerciseCard}>
              {/* Left accent border */}
              <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />

              <View style={styles.cardBody}>
                {/* Top row: icon + name + rest */}
                <View style={styles.cardTopRow}>
                  <View style={styles.iconWrap}>
                    <ExerciseIcon
                      exerciseName={ex.exerciseName}
                      muscleGroup={muscleGroup}
                      size={34}
                      color={accentColor}
                    />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.exerciseName} numberOfLines={1}>
                      {ex.exerciseName}
                    </Text>
                    <Text style={[styles.muscleLabel, { color: accentColor }]}>
                      {muscleGroup} · {ex.sets.length} sets
                    </Text>
                  </View>
                  <View style={styles.restBadge}>
                    <Text style={styles.restText}>90s</Text>
                  </View>
                </View>

                {/* Sets row: compact chips */}
                <View style={styles.setsRow}>
                  {ex.sets.map((s, setIdx) => {
                    const isEditing =
                      editingChip?.exIdx === exIdx && editingChip?.setIdx === setIdx

                    if (isEditing) {
                      return (
                        <View key={setIdx} style={[styles.setChipEditing, { borderColor: accentColor }]}>
                          <TextInput
                            style={[styles.editInput, { color: accentColor }]}
                            value={editWeight}
                            onChangeText={setEditWeight}
                            keyboardType="number-pad"
                            autoFocus
                            selectTextOnFocus
                            onSubmitEditing={() => repsRef.current?.focus()}
                            returnKeyType="next"
                          />
                          <Text style={styles.editX}>×</Text>
                          <TextInput
                            ref={repsRef}
                            style={styles.editInput}
                            value={editReps}
                            onChangeText={setEditReps}
                            keyboardType="number-pad"
                            selectTextOnFocus
                            onSubmitEditing={handleSaveEdit}
                            returnKeyType="done"
                          />
                          <TouchableOpacity onPress={handleSaveEdit} style={styles.editDone}>
                            <Text style={[styles.editDoneText, { color: accentColor }]}>✓</Text>
                          </TouchableOpacity>
                        </View>
                      )
                    }

                    return (
                      <TouchableOpacity
                        key={setIdx}
                        style={styles.setChip}
                        activeOpacity={0.6}
                        onPress={() => handleChipTap(exIdx, setIdx)}
                      >
                        <Text style={styles.chipWeight}>{s.weight}</Text>
                        <Text style={styles.chipX}>×</Text>
                        <Text style={styles.chipReps}>{s.reps}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            </View>
          )
        })}

        {/* Add exercise card */}
        <TouchableOpacity
          style={styles.addCard}
          activeOpacity={0.6}
          onPress={handleAddExercise}
        >
          <View style={styles.addIconCircle}>
            <Text style={styles.addIcon}>+</Text>
          </View>
          <Text style={styles.addText}>Add Exercise</Text>
        </TouchableOpacity>

        {/* Spacer for floating button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating start button */}
      {currentDay && (
        <View style={styles.floatingWrap}>
          <TouchableOpacity activeOpacity={0.85} onPress={handleStartWorkout}>
            <LinearGradient
              colors={[Colors.dark.accent, Colors.dark.accentGreen]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.floatingBtn}
            >
              <Text style={styles.floatingPlay}>▶</Text>
              <Text style={styles.floatingText}>Start {currentDay.name}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

// ── Styles ──────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },

  // Header
  header: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.dark.textMuted,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  headerWeek: {
    fontSize: FontSize.base,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },

  // Day pills
  dayPillRow: {
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  dayPill: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  dayPillActive: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  dayPillText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.textSecondary,
  },
  dayPillTextActive: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.dark.textOnAccent,
  },

  // Exercise list
  exerciseScroll: {
    flex: 1,
  },
  exerciseList: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.sm,
  },

  // Exercise card
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  cardAccent: {
    width: 3,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  cardBody: {
    flex: 1,
    padding: Spacing.xl,
    paddingLeft: Spacing.lg,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  cardInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
    marginBottom: 1,
  },
  muscleLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  restBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  restText: {
    fontSize: FontSize.xs,
    color: Colors.dark.textMuted,
    fontWeight: FontWeight.semibold,
  },

  // Sets
  setsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  setChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 1,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipWeight: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
  },
  chipX: {
    fontSize: FontSize.sm,
    color: Colors.dark.textMuted,
    marginHorizontal: 2,
  },
  chipReps: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.textSecondary,
  },

  // Editing chip
  setChipEditing: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
  },
  editInput: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
    textAlign: 'center',
    minWidth: 32,
    paddingVertical: 2,
    padding: 0,
  },
  editX: {
    fontSize: FontSize.sm,
    color: Colors.dark.textMuted,
    marginHorizontal: 2,
  },
  editDone: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  editDoneText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },

  // Add exercise card
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl + 4,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.dark.borderLight,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: FontSize.xxl,
    color: Colors.dark.textMuted,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.xxl + 2,
  },
  addText: {
    fontSize: FontSize.base,
    color: Colors.dark.textMuted,
    fontWeight: FontWeight.semibold,
  },

  // Floating start button
  floatingWrap: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl + 8,
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.full,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    gap: Spacing.md,
  },
  floatingPlay: {
    fontSize: FontSize.lg,
    color: Colors.dark.textOnAccent,
  },
  floatingText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.dark.textOnAccent,
    letterSpacing: 0.3,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxxl,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  emptySub: {
    fontSize: FontSize.base,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
})
