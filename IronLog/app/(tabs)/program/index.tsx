import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions, Keyboard, Alert,
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
import Svg, { Path } from 'react-native-svg'

function guessMuscleGroup(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('bench') || n.includes('chest') || n.includes('fly') || n.includes('dip') || n.includes('push up')) return 'Chest'
  if (n.includes('squat') || n.includes('leg') || n.includes('lunge') || n.includes('calf') || n.includes('deadlift') || n.includes('hip') || n.includes('glute') || n.includes('hamstring')) return 'Legs'
  if (n.includes('row') || n.includes('pull') || n.includes('lat') || n.includes('back') || n.includes('chin')) return 'Back'
  if (n.includes('shoulder') || n.includes('press') || n.includes('ohp') || n.includes('lateral') || n.includes('raise') || n.includes('delt') || n.includes('military')) return 'Shoulders'
  if (n.includes('curl') || n.includes('bicep') || n.includes('tricep') || n.includes('extension') || n.includes('skull') || n.includes('hammer') || n.includes('pushdown')) return 'Arms'
  if (n.includes('plank') || n.includes('crunch') || n.includes('ab') || n.includes('core')) return 'Core'
  return 'Chest'
}

export default function ProgramScreen() {
  const { user } = useAuthStore()
  const {
    currentProgram, programs, days, activeDayIndex,
    setActiveDayIndex, updateDayExercises, saveDayToBackend,
    loadPrograms, moveExercise, deleteProgram, setCurrentProgram,
  } = useProgramStore()
  const { startWorkout } = useWorkoutStore()
  const router = useRouter()

  const [editingChip, setEditingChip] = useState<{ exIdx: number; setIdx: number } | null>(null)
  const [editWeight, setEditWeight] = useState('')
  const [editReps, setEditReps] = useState('')
  const repsRef = useRef<TextInput>(null)

  useEffect(() => {
    if (user?.$id) loadPrograms(user.$id)
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
    if (isNaN(w) || isNaN(r)) { setEditingChip(null); return }

    const exercises = currentDay.exercises.map((ex, ei) => {
      if (ei !== exIdx) return ex
      const sets = ex.sets.map((s, si) => si !== setIdx ? s : { ...s, weight: w, reps: r })
      return { ...ex, sets }
    })
    updateDayExercises(activeDayIndex, exercises)
    saveDayToBackend(activeDayIndex)
    setEditingChip(null)
    Keyboard.dismiss()
  }

  const handleStartWorkout = async () => {
    if (!user?.$id || !currentDay) return
    const activeExercises: ActiveWorkoutExercise[] = currentDay.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      sets: ex.sets.map((s, i) => ({
        setNumber: i + 1, weight: s.weight, reps: s.reps,
        previousWeight: s.weight, previousReps: s.reps, isCompleted: false,
      })),
      restSeconds: ex.restSeconds ?? 90,
    }))
    try {
      const session = await createWorkoutSession({
        userId: user.$id, programDayId: currentDay.$id,
        programDayName: currentDay.name,
        startedAt: new Date().toISOString(),
        completedAt: null, totalVolume: 0, duration: 0, notes: '',
      })
      startWorkout({ sessionId: session.$id, programDayName: currentDay.name, exercises: activeExercises })
    } catch {
      startWorkout({ sessionId: `local-${Date.now()}`, programDayName: currentDay.name, exercises: activeExercises })
    }
    router.push('/workout/active' as Href)
  }

  const handleSwapExercise = (exIdx: number) => {
    router.push(`/(tabs)/program/pick-exercise?dayIndex=${activeDayIndex}&swapIndex=${exIdx}` as Href)
  }

  const handleDeleteProgram = () => {
    if (!currentProgram) return
    Alert.alert('Delete Program', `Delete "${currentProgram.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProgram(currentProgram.$id) },
    ])
  }

  // Find superset groups
  const exercises = currentDay?.exercises ?? []
  const supersetGroups = new Map<number, number[]>()
  exercises.forEach((ex, i) => {
    if (ex.supersetGroup != null) {
      const arr = supersetGroups.get(ex.supersetGroup) || []
      arr.push(i)
      supersetGroups.set(ex.supersetGroup, arr)
    }
  })
  const isFirstInSuperset = (idx: number) => {
    const ex = exercises[idx]
    if (ex?.supersetGroup == null) return false
    const group = supersetGroups.get(ex.supersetGroup) || []
    return group[0] === idx
  }
  const isLastInSuperset = (idx: number) => {
    const ex = exercises[idx]
    if (ex?.supersetGroup == null) return false
    const group = supersetGroups.get(ex.supersetGroup) || []
    return group[group.length - 1] === idx
  }
  const isInSuperset = (idx: number) => exercises[idx]?.supersetGroup != null

  // Empty state
  if (!currentProgram || programs.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
              <Path d="M12 6v12M6 12h12" stroke={Colors.dark.accent} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </View>
          <Text style={styles.emptyTitle}>No Program Yet</Text>
          <Text style={styles.emptySubtitle}>Create a workout program to get started</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push('/(tabs)/program/create' as Href)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[Colors.dark.accent, Colors.dark.accentGreen]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.emptyBtnGradient}
            >
              <Text style={styles.emptyBtnText}>Create Your First Program</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header — tight */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLabel}>MY PROGRAM</Text>
            <Text style={styles.headerName}>{currentProgram.name}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push('/(tabs)/program/create' as Href)}
              activeOpacity={0.7}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M12 5v14M5 12h14" stroke={Colors.dark.accent} strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={handleDeleteProgram} activeOpacity={0.7}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke={Colors.dark.textMuted} strokeWidth={1.5} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* Week / info — compact */}
        <View style={styles.weekRow}>
          <Text style={styles.weekText}>
            Week {currentProgram.currentWeek} of {currentProgram.totalWeeks}
          </Text>
          <Text style={styles.weekDot}>·</Text>
          <Text style={styles.weekText}>{currentProgram.daysPerWeek} days/week</Text>
        </View>

        {/* Day pills — tight below header */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayPillsContainer}
        >
          {days.map((day, i) => {
            const isActive = i === activeDayIndex
            return (
              <TouchableOpacity
                key={i} onPress={() => setActiveDayIndex(i)}
                activeOpacity={0.7}
              >
                {isActive ? (
                  <LinearGradient
                    colors={[Colors.dark.accent, Colors.dark.accentGreen]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
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

        {/* Exercises — directly below pills */}
        {exercises.length === 0 ? (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayText}>No exercises in this day</Text>
            <TouchableOpacity
              style={styles.addFirstBtn}
              onPress={() => router.push(`/(tabs)/program/pick-exercise?dayIndex=${activeDayIndex}` as Href)}
              activeOpacity={0.7}
            >
              <Text style={styles.addFirstBtnText}>+ Add Exercise</Text>
            </TouchableOpacity>
          </View>
        ) : (
          exercises.map((ex, exIdx) => {
            const muscleGroup = guessMuscleGroup(ex.exerciseName)
            const muscleColor = MUSCLE_GROUP_COLORS[muscleGroup] || Colors.dark.accent
            const hasDropSets = ex.sets.some((s) => s.isDropSet)
            const inSS = isInSuperset(exIdx)
            const firstSS = isFirstInSuperset(exIdx)
            const lastSS = isLastInSuperset(exIdx)

            return (
              <View key={exIdx}>
                {/* Superset label */}
                {firstSS && (
                  <View style={styles.ssLabel}>
                    <View style={[styles.ssLine, { backgroundColor: Colors.dark.accent }]} />
                    <Text style={styles.ssText}>SUPERSET</Text>
                    <View style={[styles.ssLine, { backgroundColor: Colors.dark.accent }]} />
                  </View>
                )}
                <View style={[
                  styles.exCard,
                  { borderLeftColor: muscleColor, borderLeftWidth: 3 },
                  inSS && styles.exCardSS,
                  inSS && !lastSS && { marginBottom: 2, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
                  inSS && !firstSS && { borderTopLeftRadius: 0, borderTopRightRadius: 0 },
                ]}>
                  {/* Exercise row */}
                  <View style={styles.exRow}>
                    <View style={[styles.exIconWrap, { backgroundColor: `${muscleColor}15` }]}>
                      <ExerciseIcon exerciseName={ex.exerciseName} size={28} color={muscleColor} />
                    </View>
                    <View style={styles.exInfo}>
                      <Text style={styles.exName} numberOfLines={1}>{ex.exerciseName}</Text>
                      <Text style={[styles.exMeta, { color: muscleColor }]}>
                        {muscleGroup}
                        {hasDropSets ? ' · DROP' : ''}
                        {ex.restSeconds ? ` · ${ex.restSeconds}s` : ''}
                      </Text>
                    </View>
                    {/* Action buttons */}
                    <View style={styles.exActions}>
                      {exIdx > 0 && (
                        <TouchableOpacity
                          style={styles.exActionBtn}
                          onPress={() => moveExercise(activeDayIndex, exIdx, 'up')}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.exActionIcon}>↑</Text>
                        </TouchableOpacity>
                      )}
                      {exIdx < exercises.length - 1 && (
                        <TouchableOpacity
                          style={styles.exActionBtn}
                          onPress={() => moveExercise(activeDayIndex, exIdx, 'down')}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.exActionIcon}>↓</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.exActionBtn}
                        onPress={() => handleSwapExercise(exIdx)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.exActionIcon}>⟷</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Set chips */}
                  <View style={styles.chipRow}>
                    {ex.sets.map((s, sIdx) => {
                      const isEditing = editingChip?.exIdx === exIdx && editingChip?.setIdx === sIdx
                      if (isEditing) {
                        return (
                          <View key={sIdx} style={styles.chipEdit}>
                            <TextInput
                              style={styles.chipInput}
                              value={editWeight}
                              onChangeText={setEditWeight}
                              keyboardType="number-pad"
                              autoFocus
                              selectTextOnFocus
                              onSubmitEditing={() => repsRef.current?.focus()}
                            />
                            <Text style={styles.chipX}>×</Text>
                            <TextInput
                              ref={repsRef}
                              style={styles.chipInput}
                              value={editReps}
                              onChangeText={setEditReps}
                              keyboardType="number-pad"
                              selectTextOnFocus
                              onSubmitEditing={handleSaveEdit}
                            />
                            <TouchableOpacity
                              style={[styles.chipSave, { backgroundColor: muscleColor }]}
                              onPress={handleSaveEdit}
                            >
                              <Text style={styles.chipSaveText}>✓</Text>
                            </TouchableOpacity>
                          </View>
                        )
                      }
                      return (
                        <TouchableOpacity
                          key={sIdx}
                          style={[styles.chip, s.isDropSet && styles.chipDrop]}
                          onPress={() => handleChipTap(exIdx, sIdx)}
                          activeOpacity={0.7}
                        >
                          {s.isDropSet && <Text style={styles.chipDropIcon}>↓</Text>}
                          <Text style={styles.chipText}>{s.weight}×{s.reps}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              </View>
            )
          })
        )}

        {/* Add exercise to day */}
        {exercises.length > 0 && (
          <TouchableOpacity
            style={styles.addExBtn}
            onPress={() => router.push(`/(tabs)/program/pick-exercise?dayIndex=${activeDayIndex}` as Href)}
            activeOpacity={0.7}
          >
            <Text style={styles.addExText}>+ Add Exercise</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating start button */}
      {currentDay && currentDay.exercises.length > 0 && (
        <View style={styles.fabContainer}>
          <TouchableOpacity onPress={handleStartWorkout} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.dark.accent, Colors.dark.accentGreen]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.fab}
            >
              <Text style={styles.fabPlay}>▶</Text>
              <Text style={styles.fabText}>Start {currentDay.name}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  scrollContent: { paddingHorizontal: Spacing.xl },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 2,
  },
  headerLeft: {},
  headerLabel: {
    fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.dark.textMuted,
    letterSpacing: 2, marginBottom: 2,
  },
  headerName: { fontSize: FontSize.hero, fontWeight: FontWeight.extrabold, color: Colors.dark.text },
  headerRight: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  headerBtn: {
    width: 34, height: 34, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface, alignItems: 'center', justifyContent: 'center',
  },

  // Week
  weekRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  weekText: { fontSize: FontSize.base, color: Colors.dark.textSecondary },
  weekDot: { fontSize: FontSize.base, color: Colors.dark.textMuted },

  // Day pills
  dayPillsContainer: {
    gap: Spacing.sm, paddingBottom: Spacing.lg,
  },
  dayPill: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full, backgroundColor: Colors.dark.surface,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  dayPillActive: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  dayPillText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.dark.textSecondary },
  dayPillTextActive: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.dark.textOnAccent },

  // Empty
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxxxl },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.accentSurface, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  emptyTitle: { fontSize: FontSize.title, fontWeight: FontWeight.bold, color: Colors.dark.text, marginBottom: Spacing.md },
  emptySubtitle: { fontSize: FontSize.xl, color: Colors.dark.textSecondary, marginBottom: Spacing.xxxl, textAlign: 'center' },
  emptyBtn: { borderRadius: BorderRadius.full, overflow: 'hidden' },
  emptyBtnGradient: { paddingHorizontal: Spacing.xxxl, paddingVertical: Spacing.lg },
  emptyBtnText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.dark.textOnAccent },

  emptyDay: { alignItems: 'center', paddingTop: Spacing.xxxxl },
  emptyDayText: { fontSize: FontSize.xl, color: Colors.dark.textMuted, marginBottom: Spacing.xl },
  addFirstBtn: {
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full, backgroundColor: Colors.dark.accentSurface,
    borderWidth: 1, borderColor: Colors.dark.accentBorder,
  },
  addFirstBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.dark.accent },

  // Superset
  ssLabel: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.xs, marginBottom: 2,
  },
  ssLine: { flex: 1, height: 1 },
  ssText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.dark.accent, letterSpacing: 2 },

  // Exercise card
  exCard: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md, padding: Spacing.lg,
  },
  exCardSS: { borderLeftColor: Colors.dark.accent },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  exIconWrap: {
    width: 38, height: 38, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  exInfo: { flex: 1 },
  exName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.dark.text },
  exMeta: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginTop: 1 },
  exActions: { flexDirection: 'row', gap: 4 },
  exActionBtn: {
    width: 26, height: 26, borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center',
  },
  exActionIcon: { fontSize: 11, color: Colors.dark.textSecondary },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs + 1,
    flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  chipDrop: { backgroundColor: 'rgba(255,107,107,0.12)' },
  chipDropIcon: { fontSize: FontSize.sm, color: Colors.dark.danger },
  chipText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.dark.textSecondary },
  chipEdit: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  chipInput: {
    width: 40, fontSize: FontSize.lg, fontWeight: FontWeight.semibold,
    color: Colors.dark.text, textAlign: 'center',
    paddingVertical: 2,
  },
  chipX: { fontSize: FontSize.sm, color: Colors.dark.textMuted },
  chipSave: {
    width: 24, height: 24, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  chipSaveText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.dark.textOnAccent },

  // Add exercise
  addExBtn: {
    alignItems: 'center', paddingVertical: Spacing.lg,
    borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.dark.accentBorder,
    borderRadius: BorderRadius.lg, marginTop: Spacing.sm,
  },
  addExText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.dark.accent },

  // FAB
  fabContainer: {
    position: 'absolute', bottom: 20, left: 0, right: 0,
    alignItems: 'center',
  },
  fab: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xxxl, paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    shadowColor: Colors.dark.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  fabPlay: { fontSize: FontSize.lg, color: Colors.dark.textOnAccent },
  fabText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.dark.textOnAccent },
})
