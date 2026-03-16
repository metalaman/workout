import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions, Keyboard, Alert, Modal, Pressable,
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

const TABS = ['Exercises', 'Overview', 'Notes'] as const
type TabName = typeof TABS[number]

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

  const [activeTab, setActiveTab] = useState<TabName>('Exercises')
  const [menuExIdx, setMenuExIdx] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (user?.$id) loadPrograms(user.$id)
  }, [user?.$id])

  const currentDay = days[activeDayIndex]

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

  const handleDeleteProgram = () => {
    if (!currentProgram) return
    Alert.alert('Delete Program', `Delete "${currentProgram.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProgram(currentProgram.$id) },
    ])
  }

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
    return (supersetGroups.get(ex.supersetGroup) || [])[0] === idx
  }
  const isInSuperset = (idx: number) => exercises[idx]?.supersetGroup != null

  // Total sets/volume for overview
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
  const totalVolume = exercises.reduce((acc, ex) => acc + ex.sets.reduce((a, s) => a + s.weight * s.reps, 0), 0)
  const muscleGroups = [...new Set(exercises.map((ex) => guessMuscleGroup(ex.exerciseName)))]

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
      {/* Workout Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLabel}>
              {currentProgram.name} · Week {currentProgram.currentWeek}
            </Text>
            <Text style={styles.headerTitle}>{currentDay?.name ?? 'Select a day'}</Text>
            <Text style={styles.headerSub}>
              {exercises.length} exercises · {totalSets} sets
            </Text>
          </View>
          <View style={styles.headerActions}>
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
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke={Colors.dark.textMuted} strokeWidth={1.5} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* Day selector pills */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayPillsRow}
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
      </View>

      {/* Tab Bar — Caliber style */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'Exercises' && (
          <>
            {exercises.length === 0 ? (
              <View style={styles.emptyDay}>
                <Text style={styles.emptyDayText}>No exercises yet</Text>
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
                const setsText = `${ex.sets.length} sets × ${ex.sets[0]?.reps ?? 8} reps`

                return (
                  <View key={exIdx}>
                    {firstSS && (
                      <View style={styles.ssLabel}>
                        <View style={[styles.ssLine, { backgroundColor: Colors.dark.accent }]} />
                        <Text style={styles.ssText}>SUPERSET</Text>
                        <View style={[styles.ssLine, { backgroundColor: Colors.dark.accent }]} />
                      </View>
                    )}
                    <View style={[styles.exCard, { borderColor: Colors.dark.border }]}>
                      <View style={styles.exRow}>
                        {/* Large exercise icon */}
                        <View style={[styles.exIconWrap, { backgroundColor: `${muscleColor}12` }]}>
                          <ExerciseIcon exerciseName={ex.exerciseName} size={50} color={muscleColor} />
                        </View>
                        <View style={styles.exInfo}>
                          <Text style={styles.exName} numberOfLines={1}>{ex.exerciseName}</Text>
                          {/* Set/rep pill */}
                          <View style={styles.exBadgeRow}>
                            <View style={[styles.exBadge, { backgroundColor: `${muscleColor}18` }]}>
                              <Text style={[styles.exBadgeText, { color: muscleColor }]}>{setsText}</Text>
                            </View>
                            {hasDropSets && (
                              <View style={[styles.exBadge, { backgroundColor: 'rgba(255,107,107,0.12)' }]}>
                                <Text style={[styles.exBadgeText, { color: Colors.dark.danger }]}>DROP</Text>
                              </View>
                            )}
                            {ex.restSeconds && (
                              <View style={[styles.exBadge, { backgroundColor: Colors.dark.surface }]}>
                                <Text style={[styles.exBadgeText, { color: Colors.dark.textMuted }]}>{ex.restSeconds}s</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        {/* Three-dot menu */}
                        <TouchableOpacity
                          style={styles.menuBtn}
                          onPress={() => setMenuExIdx(menuExIdx === exIdx ? null : exIdx)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.menuDots}>⋯</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Context menu */}
                      {menuExIdx === exIdx && (
                        <View style={styles.contextMenu}>
                          {exIdx > 0 && (
                            <TouchableOpacity style={styles.contextItem} onPress={() => { moveExercise(activeDayIndex, exIdx, 'up'); setMenuExIdx(null) }}>
                              <Text style={styles.contextText}>↑ Move Up</Text>
                            </TouchableOpacity>
                          )}
                          {exIdx < exercises.length - 1 && (
                            <TouchableOpacity style={styles.contextItem} onPress={() => { moveExercise(activeDayIndex, exIdx, 'down'); setMenuExIdx(null) }}>
                              <Text style={styles.contextText}>↓ Move Down</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity style={styles.contextItem} onPress={() => {
                            setMenuExIdx(null)
                            router.push(`/(tabs)/program/pick-exercise?dayIndex=${activeDayIndex}&swapIndex=${exIdx}` as Href)
                          }}>
                            <Text style={styles.contextText}>⟷ Swap Exercise</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.contextItem, { borderBottomWidth: 0 }]} onPress={() => {
                            const exs = [...exercises]
                            exs.splice(exIdx, 1)
                            updateDayExercises(activeDayIndex, exs)
                            saveDayToBackend(activeDayIndex)
                            setMenuExIdx(null)
                          }}>
                            <Text style={[styles.contextText, { color: Colors.dark.danger }]}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                )
              })
            )}

            {/* Add exercise */}
            {exercises.length > 0 && (
              <TouchableOpacity
                style={styles.addExBtn}
                onPress={() => router.push(`/(tabs)/program/pick-exercise?dayIndex=${activeDayIndex}` as Href)}
                activeOpacity={0.7}
              >
                <Text style={styles.addExIcon}>+</Text>
                <Text style={styles.addExText}>Add Exercise</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {activeTab === 'Overview' && (
          <View style={styles.overviewContent}>
            <View style={styles.overviewRow}>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewValue}>{exercises.length}</Text>
                <Text style={styles.overviewLabel}>Exercises</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewValue}>{totalSets}</Text>
                <Text style={styles.overviewLabel}>Total Sets</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={[styles.overviewValue, { color: Colors.dark.accent }]}>
                  {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
                </Text>
                <Text style={styles.overviewLabel}>Volume (lbs)</Text>
              </View>
            </View>
            <Text style={styles.overviewSectionTitle}>MUSCLE GROUPS</Text>
            {muscleGroups.map((mg) => {
              const c = MUSCLE_GROUP_COLORS[mg] || Colors.dark.accent
              const count = exercises.filter((ex) => guessMuscleGroup(ex.exerciseName) === mg).length
              return (
                <View key={mg} style={styles.mgRow}>
                  <View style={[styles.mgDot, { backgroundColor: c }]} />
                  <Text style={styles.mgName}>{mg}</Text>
                  <Text style={styles.mgCount}>{count} exercises</Text>
                </View>
              )
            })}
          </View>
        )}

        {activeTab === 'Notes' && (
          <View style={styles.notesContent}>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes for this workout day..."
              placeholderTextColor={Colors.dark.textMuted}
              multiline
              textAlignVertical="top"
            />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Start Button — full width like Caliber */}
      {currentDay && currentDay.exercises.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={handleStartWorkout} activeOpacity={0.85} style={styles.startBtnWrap}>
            <LinearGradient
              colors={[Colors.dark.accent, Colors.dark.accentGreen]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.startBtn}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M5 3l14 9-14 9V3z" fill={Colors.dark.textOnAccent} />
              </Svg>
              <Text style={styles.startBtnText}>Start {currentDay.name}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl },

  // Header card
  headerCard: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerLeft: { flex: 1 },
  headerLabel: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.dark.textMuted,
    letterSpacing: 1, marginBottom: 2,
  },
  headerTitle: {
    fontSize: FontSize.hero, fontWeight: FontWeight.extrabold, color: Colors.dark.text,
  },
  headerSub: {
    fontSize: FontSize.base, color: Colors.dark.textSecondary, marginTop: 2,
  },
  headerActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  headerBtn: {
    width: 32, height: 32, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface, alignItems: 'center', justifyContent: 'center',
  },

  // Day pills
  dayPillsRow: { gap: Spacing.sm, paddingBottom: Spacing.sm },
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

  // Tab bar — Caliber style accent underline
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
    paddingHorizontal: Spacing.xl,
  },
  tab: {
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.dark.accent },
  tabText: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.dark.textMuted },
  tabTextActive: { color: Colors.dark.text },

  // Empty states
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

  // Exercise card — Caliber style
  exCard: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, marginBottom: Spacing.md, padding: Spacing.xl,
  },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  exIconWrap: {
    width: 64, height: 64, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  exInfo: { flex: 1 },
  exName: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.dark.text, marginBottom: Spacing.xs },
  exBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  exBadge: {
    paddingHorizontal: Spacing.md, paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  exBadgeText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  menuBtn: {
    width: 32, height: 32, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  menuDots: { fontSize: FontSize.title, color: Colors.dark.textMuted, marginTop: -4 },

  // Context menu
  contextMenu: {
    marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.dark.border,
    paddingTop: Spacing.md,
  },
  contextItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  contextText: { fontSize: FontSize.xl, color: Colors.dark.textSecondary },

  // Add exercise
  addExBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.xl,
    borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.dark.accentBorder,
    borderRadius: BorderRadius.lg, marginTop: Spacing.sm,
  },
  addExIcon: { fontSize: FontSize.xxl, color: Colors.dark.accent },
  addExText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.dark.accent },

  // Overview tab
  overviewContent: { paddingTop: Spacing.xl },
  overviewRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xxl },
  overviewCard: {
    flex: 1, backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: Colors.dark.border,
  },
  overviewValue: { fontSize: FontSize.hero, fontWeight: FontWeight.extrabold, color: Colors.dark.text },
  overviewLabel: { fontSize: FontSize.sm, color: Colors.dark.textMuted, marginTop: 2 },
  overviewSectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.dark.textMuted,
    letterSpacing: 1.5, marginBottom: Spacing.md,
  },
  mgRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  mgDot: { width: 8, height: 8, borderRadius: 4 },
  mgName: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.dark.text, flex: 1 },
  mgCount: { fontSize: FontSize.base, color: Colors.dark.textSecondary },

  // Notes tab
  notesContent: { paddingTop: Spacing.xl },
  notesInput: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.dark.border,
    padding: Spacing.xl, minHeight: 200,
    fontSize: FontSize.xl, color: Colors.dark.text,
  },

  // Bottom bar — full-width button like Caliber
  bottomBar: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  startBtnWrap: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.md, paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  startBtnText: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.dark.textOnAccent },
})
