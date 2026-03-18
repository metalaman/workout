import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions, Alert, Animated, PanResponder, Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Href } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth-store'
import { useProgramStore } from '@/stores/program-store'
import { useWorkoutStore } from '@/stores/workout-store'
import { createWorkoutSession, updateProgram } from '@/lib/database'
import { ExerciseIcon, MUSCLE_GROUP_COLORS } from '@/components/exercise-icon'
import type { ActiveWorkoutExercise } from '@/types'
import Svg, { Path } from 'react-native-svg'

const TABS = ['Exercises', 'Overview', 'Notes', 'Settings'] as const
type TabName = typeof TABS[number]

const CARD_HEIGHT = 80

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

// ─── Draggable Exercise Card ───────────────────────────────────────────
function DraggableExerciseCard({
  ex, exIdx, exerciseCount, activeDayIndex, muscleColor, setsText,
  hasDropSets, isFirstSS, inSS, menuExIdx, setMenuExIdx,
  moveExercise, updateDayExercises, saveDayToBackend, exercises, router,
}: any) {
  const pan = useRef(new Animated.ValueXY()).current
  const [isDragging, setIsDragging] = useState(false)
  const dragScale = useRef(new Animated.Value(1)).current

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        setIsDragging(true)
        Animated.spring(dragScale, { toValue: 1.03, useNativeDriver: true }).start()
      },
      onPanResponderMove: Animated.event([null, { dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        setIsDragging(false)
        Animated.spring(dragScale, { toValue: 1, useNativeDriver: true }).start()
        const movedBy = Math.round(gesture.dy / CARD_HEIGHT)
        if (movedBy !== 0) {
          const targetIdx = Math.max(0, Math.min(exerciseCount - 1, exIdx + movedBy))
          if (targetIdx !== exIdx) {
            // Move step by step
            const dir = movedBy > 0 ? 'down' : 'up'
            const steps = Math.abs(movedBy)
            for (let s = 0; s < steps; s++) {
              moveExercise(activeDayIndex, movedBy > 0 ? exIdx + s : exIdx - s, dir)
            }
          }
        }
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start()
      },
    })
  ).current

  return (
    <View key={exIdx}>
      {isFirstSS && (
        <View style={styles.ssLabel}>
          <View style={[styles.ssLine, { backgroundColor: Colors.dark.accent }]} />
          <Text style={styles.ssText}>SUPERSET</Text>
          <View style={[styles.ssLine, { backgroundColor: Colors.dark.accent }]} />
        </View>
      )}
      <Animated.View
        style={[
          styles.exCard,
          { borderColor: Colors.dark.border },
          isDragging && styles.exCardDragging,
          {
            transform: [
              { translateY: pan.y },
              { scale: dragScale },
            ],
            zIndex: isDragging ? 100 : 1,
          },
        ]}
      >
        <View style={styles.exRow}>
          {/* Drag handle */}
          <View {...panResponder.panHandlers} style={styles.dragHandle}>
            <Text style={styles.dragIcon}>⠿</Text>
          </View>
          {/* Exercise icon */}
          <View style={[styles.exIconWrap, { backgroundColor: `${muscleColor}12` }]}>
            <ExerciseIcon exerciseName={ex.exerciseName} size={50} color={muscleColor} />
          </View>
          <View style={styles.exInfo}>
            <Text style={styles.exName} numberOfLines={1}>{ex.exerciseName}</Text>
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

        {menuExIdx === exIdx && (
          <View style={styles.contextMenu}>
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
      </Animated.View>
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────
export default function ProgramScreen() {
  const { user } = useAuthStore()
  const {
    currentProgram, programs, days, activeDayIndex,
    setActiveDayIndex, updateDayExercises, saveDayToBackend,
    loadPrograms, moveExercise, deleteProgram, setCurrentProgram,
  } = useProgramStore()
  const { startWorkout } = useWorkoutStore()
  const router = useRouter()

  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [activeTab, setActiveTab] = useState<TabName>('Exercises')
  const [menuExIdx, setMenuExIdx] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [isPublic, setIsPublic] = useState((currentProgram as any)?.isPublic ?? false)

  const handleTogglePublic = async () => {
    if (!currentProgram) return
    const newVal = !isPublic
    setIsPublic(newVal)
    try {
      await updateProgram(currentProgram.$id, { isPublic: newVal })
    } catch {
      setIsPublic(!newVal) // revert on failure
    }
  }

  useEffect(() => {
    if (user?.$id) loadPrograms(user.$id)
  }, [user?.$id])

  const currentDay = days[activeDayIndex]
  const exercises = currentDay?.exercises ?? []

  const handleSelectProgram = (program: typeof programs[0]) => {
    setCurrentProgram(program)
    setViewMode('detail')
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

  const handleDeleteProgram = () => {
    if (!currentProgram) return
    Alert.alert('Delete Program', `Delete "${currentProgram.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteProgram(currentProgram.$id)
        setViewMode('list')
      }},
    ])
  }

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

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
  const totalVolume = exercises.reduce((acc, ex) => acc + ex.sets.reduce((a, s) => a + s.weight * s.reps, 0), 0)
  const muscleGroups = [...new Set(exercises.map((ex) => guessMuscleGroup(ex.exerciseName)))]

  // ─── LIST VIEW ───────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>My Programs</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.listContent}>
          {programs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 6v12M6 12h12" stroke={Colors.dark.accent} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </View>
              <Text style={styles.emptyTitle}>No Programs Yet</Text>
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
          ) : (
            programs.map((prog) => (
              <TouchableOpacity
                key={prog.$id}
                style={styles.programCard}
                onPress={() => handleSelectProgram(prog)}
                activeOpacity={0.7}
              >
                <View style={[styles.programDot, { backgroundColor: prog.color || Colors.dark.accent }]} />
                <View style={styles.programInfo}>
                  <Text style={styles.programName}>{prog.name}</Text>
                  <Text style={styles.programMeta}>
                    {prog.daysPerWeek} days/week · {prog.totalWeeks} weeks
                  </Text>
                </View>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M9 18l6-6-6-6" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FAB for create */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(tabs)/program/create' as Href)}
          activeOpacity={0.8}
        >
          <LinearGradient colors={[Colors.dark.accent, Colors.dark.accentGreen]} style={styles.fabGradient}>
            <Text style={styles.fabIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  // ─── DETAIL VIEW ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with back to list */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => setViewMode('list')}
              style={styles.backToList}
              activeOpacity={0.7}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M19 12H5M12 19l-7-7 7-7" stroke={Colors.dark.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.backToListText}>My Programs</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{currentDay?.name ?? 'Select a day'}</Text>
            <Text style={styles.headerSub}>
              {currentProgram?.name} · Week {currentProgram?.currentWeek} · {exercises.length} exercises
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
              <TouchableOpacity key={i} onPress={() => setActiveDayIndex(i)} activeOpacity={0.7}>
                {isActive ? (
                  <LinearGradient
                    colors={[currentProgram?.color || Colors.dark.accent, Colors.dark.accentGreen]}
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

      {/* Tab Bar */}
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
                const setsText = `${ex.sets.length} sets × ${ex.sets[0]?.reps ?? 8} reps`

                return (
                  <DraggableExerciseCard
                    key={exIdx}
                    ex={ex}
                    exIdx={exIdx}
                    exerciseCount={exercises.length}
                    activeDayIndex={activeDayIndex}
                    muscleColor={muscleColor}
                    setsText={setsText}
                    hasDropSets={hasDropSets}
                    isFirstSS={isFirstInSuperset(exIdx)}
                    inSS={isInSuperset(exIdx)}
                    menuExIdx={menuExIdx}
                    setMenuExIdx={setMenuExIdx}
                    moveExercise={moveExercise}
                    updateDayExercises={updateDayExercises}
                    saveDayToBackend={saveDayToBackend}
                    exercises={exercises}
                    router={router}
                  />
                )
              })
            )}

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

        {activeTab === 'Settings' && (
          <View style={styles.settingsContent}>
            <Text style={styles.settingsSectionTitle}>VISIBILITY</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Public Program</Text>
                <Text style={styles.settingDesc}>Allow other users to find and clone this program</Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={handleTogglePublic}
                trackColor={{ false: Colors.dark.surfaceLight, true: Colors.dark.accent }}
                thumbColor={Colors.dark.text}
              />
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Start Button */}
      {currentDay && currentDay.exercises.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={handleStartWorkout} activeOpacity={0.85} style={styles.startBtnWrap}>
            <LinearGradient
              colors={[currentProgram?.color || Colors.dark.accent, Colors.dark.accentGreen]}
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

  // ─── List view ───────────────────────────────────────────────────────
  listHeader: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg,
  },
  listTitle: {
    fontSize: FontSize.hero, fontWeight: FontWeight.extrabold, color: Colors.dark.text,
  },
  listContent: { paddingHorizontal: Spacing.xl },
  programCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.dark.border,
    padding: Spacing.xl, marginBottom: Spacing.md, gap: Spacing.lg,
  },
  programDot: { width: 12, height: 12, borderRadius: 6 },
  programInfo: { flex: 1 },
  programName: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.dark.text,
  },
  programMeta: {
    fontSize: FontSize.base, color: Colors.dark.textSecondary, marginTop: 2,
  },

  // FAB
  fab: {
    position: 'absolute', bottom: 90, right: 20,
    width: 56, height: 56, borderRadius: 28,
    shadowColor: '#e8ff47', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  fabGradient: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  fabIcon: { fontSize: 28, fontWeight: FontWeight.bold, color: Colors.dark.textOnAccent },

  // ─── Detail view header ──────────────────────────────────────────────
  headerCard: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing.sm,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerLeft: { flex: 1 },
  backToList: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  backToListText: {
    fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.dark.accent,
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

  // Tab bar
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

  // ─── Empty states ────────────────────────────────────────────────────
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxxxl, paddingTop: 100 },
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

  // ─── Exercise card ───────────────────────────────────────────────────
  exCard: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, marginBottom: Spacing.md, padding: Spacing.xl,
  },
  exCardDragging: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
    borderColor: Colors.dark.accentBorder,
  },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dragHandle: {
    width: 24, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  dragIcon: { fontSize: 18, color: Colors.dark.textMuted },
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

  // Bottom bar
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

  // Settings tab
  settingsContent: { paddingTop: Spacing.xl },
  settingsSectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.dark.textMuted,
    letterSpacing: 1.5, marginBottom: Spacing.lg,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.dark.border,
  },
  settingInfo: { flex: 1, marginRight: Spacing.xl },
  settingLabel: { fontSize: FontSize.xxl, fontWeight: FontWeight.semibold, color: Colors.dark.text },
  settingDesc: { fontSize: FontSize.base, color: Colors.dark.textSecondary, marginTop: Spacing.xs },
})
