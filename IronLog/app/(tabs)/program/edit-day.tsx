import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams, Href } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useProgramStore } from '@/stores/program-store'
import { ExerciseIcon, MUSCLE_GROUP_COLORS } from '@/components/exercise-icon'
import type { ProgramExercise, ProgramSet } from '@/types'
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

export default function EditDayScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ dayIndex?: string; isNew?: string }>()
  const dayIndex = parseInt(params.dayIndex ?? '0', 10)
  const isNew = params.isNew === 'true'

  const {
    builderDays, builderProgram, currentProgram,
    addDay, removeExerciseFromDay, reorderExercise,
    toggleSuperset, toggleDropSet, updateExerciseInDay,
    saveBuilderDay, setBuilderActiveDayIndex,
  } = useProgramStore()

  const day = builderDays[dayIndex]
  const [dayName, setDayName] = useState(day?.name ?? `Day ${dayIndex + 1}`)
  const [expandedEx, setExpandedEx] = useState<number | null>(null)
  const program = builderProgram || currentProgram

  // Create the day if it's new and doesn't exist
  const didInit = useRef(false)
  useEffect(() => {
    if (isNew && !builderDays[dayIndex] && !didInit.current) {
      didInit.current = true
      addDay(dayName).catch(() => {})
    }
  }, [isNew, dayIndex, builderDays, addDay, dayName])

  const exercises = day?.exercises ?? []

  const handleAddExercise = () => {
    router.push(`/(tabs)/program/pick-exercise?dayIndex=${dayIndex}` as Href)
  }

  const handleMoveUp = (exIdx: number) => {
    if (exIdx > 0) reorderExercise(dayIndex, exIdx, exIdx - 1)
  }

  const handleMoveDown = (exIdx: number) => {
    if (exIdx < exercises.length - 1) reorderExercise(dayIndex, exIdx, exIdx + 1)
  }

  const handleDeleteExercise = (exIdx: number) => {
    Alert.alert('Remove Exercise', `Remove ${exercises[exIdx].exerciseName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeExerciseFromDay(dayIndex, exIdx) },
    ])
  }

  const handleAddSet = (exIdx: number) => {
    const ex = exercises[exIdx]
    const lastSet = ex.sets[ex.sets.length - 1] ?? { weight: 0, reps: 10 }
    const newSets: ProgramSet[] = [...ex.sets, { weight: lastSet.weight, reps: lastSet.reps, isDropSet: ex.sets[0]?.isDropSet }]
    updateExerciseInDay(dayIndex, exIdx, { sets: newSets })
  }

  const handleRemoveSet = (exIdx: number) => {
    const ex = exercises[exIdx]
    if (ex.sets.length <= 1) return
    updateExerciseInDay(dayIndex, exIdx, { sets: ex.sets.slice(0, -1) })
  }

  const handleUpdateSet = (exIdx: number, setIdx: number, field: 'weight' | 'reps', value: string) => {
    const ex = exercises[exIdx]
    const sets = [...ex.sets]
    const num = parseInt(value, 10) || 0
    sets[setIdx] = { ...sets[setIdx], [field]: num }
    updateExerciseInDay(dayIndex, exIdx, { sets })
  }

  const handleDone = async () => {
    await saveBuilderDay(dayIndex)
    // If there are more days to add
    const totalDays = program?.daysPerWeek ?? 1
    if (isNew && dayIndex + 1 < totalDays && dayIndex + 1 >= builderDays.length) {
      Alert.alert(
        'Add Next Day?',
        `Day ${dayIndex + 1} of ${totalDays} done. Add day ${dayIndex + 2}?`,
        [
          { text: 'Done for Now', onPress: () => router.back() },
          {
            text: 'Add Next Day',
            onPress: () => {
              router.replace(`/(tabs)/program/edit-day?dayIndex=${dayIndex + 1}&isNew=true` as Href)
            },
          },
        ]
      )
    } else {
      router.back()
    }
  }

  // Find superset groups
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
    if (ex.supersetGroup == null) return false
    const group = supersetGroups.get(ex.supersetGroup) || []
    return group[0] === idx
  }

  const isInSuperset = (idx: number) => exercises[idx]?.supersetGroup != null

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke={Colors.dark.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isNew ? 'Build Day' : 'Edit Day'}</Text>
          <TouchableOpacity onPress={handleDone} style={styles.doneBtn} activeOpacity={0.7}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Day name */}
        <View style={styles.dayNameRow}>
          <TextInput
            style={styles.dayNameInput}
            value={dayName}
            onChangeText={setDayName}
            placeholder="Day name (e.g. Push A)"
            placeholderTextColor={Colors.dark.textMuted}
            maxLength={30}
          />
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏋️</Text>
              <Text style={styles.emptyTitle}>No exercises yet</Text>
              <Text style={styles.emptySubtitle}>Add exercises to build your workout day</Text>
            </View>
          ) : (
            exercises.map((ex, exIdx) => {
              const muscleGroup = guessMuscleGroup(ex.exerciseName)
              const muscleColor = MUSCLE_GROUP_COLORS[muscleGroup] || Colors.dark.accent
              const hasDropSets = ex.sets.some((s) => s.isDropSet)
              const isExpanded = expandedEx === exIdx
              const inSuperset = isInSuperset(exIdx)
              const firstInSuperset = isFirstInSuperset(exIdx)

              return (
                <View key={exIdx}>
                  {/* Superset label */}
                  {firstInSuperset && (
                    <View style={styles.supersetLabel}>
                      <View style={[styles.supersetLine, { backgroundColor: Colors.dark.accent }]} />
                      <Text style={styles.supersetText}>SUPERSET</Text>
                      <View style={[styles.supersetLine, { backgroundColor: Colors.dark.accent }]} />
                    </View>
                  )}
                  <View style={[
                    styles.exerciseCard,
                    { borderLeftColor: muscleColor, borderLeftWidth: 3 },
                    inSuperset && styles.supersetCard,
                  ]}>
                    {/* Exercise header */}
                    <TouchableOpacity
                      style={styles.exerciseHeader}
                      onPress={() => setExpandedEx(isExpanded ? null : exIdx)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.iconWrap, { backgroundColor: `${muscleColor}15` }]}>
                        <ExerciseIcon exerciseName={ex.exerciseName} size={28} color={muscleColor} />
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                        <Text style={[styles.exerciseMeta, { color: muscleColor }]}>
                          {muscleGroup} · {ex.sets.length} sets
                          {hasDropSets ? ' · DROP' : ''}
                        </Text>
                      </View>
                      <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
                    </TouchableOpacity>

                    {/* Set chips (always visible) */}
                    <View style={styles.setChipsRow}>
                      {ex.sets.map((s, sIdx) => (
                        <View key={sIdx} style={[
                          styles.setChip,
                          s.isDropSet && styles.setChipDrop,
                        ]}>
                          {s.isDropSet && <Text style={styles.dropArrow}>↓</Text>}
                          <Text style={styles.setChipText}>{s.weight}×{s.reps}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Expanded section */}
                    {isExpanded && (
                      <View style={styles.expandedSection}>
                        {/* Individual set editing */}
                        <View style={styles.setsHeader}>
                          <Text style={styles.setsLabel}>SET</Text>
                          <Text style={styles.setsLabel}>WEIGHT</Text>
                          <Text style={styles.setsLabel}>REPS</Text>
                        </View>
                        {ex.sets.map((s, sIdx) => (
                          <View key={sIdx} style={styles.setRow}>
                            <View style={styles.setNumWrap}>
                              <Text style={styles.setNum}>{sIdx + 1}</Text>
                              {s.isDropSet && <Text style={styles.setDropBadge}>↓</Text>}
                            </View>
                            <TextInput
                              style={styles.setInput}
                              value={s.weight.toString()}
                              onChangeText={(v) => handleUpdateSet(exIdx, sIdx, 'weight', v)}
                              keyboardType="number-pad"
                              selectTextOnFocus
                            />
                            <TextInput
                              style={styles.setInput}
                              value={s.reps.toString()}
                              onChangeText={(v) => handleUpdateSet(exIdx, sIdx, 'reps', v)}
                              keyboardType="number-pad"
                              selectTextOnFocus
                            />
                          </View>
                        ))}

                        {/* Set count controls */}
                        <View style={styles.setCountRow}>
                          <TouchableOpacity
                            style={styles.setCountBtn}
                            onPress={() => handleRemoveSet(exIdx)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.setCountBtnText}>− Set</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.setCountBtn, styles.setCountBtnAdd]}
                            onPress={() => handleAddSet(exIdx)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.setCountBtnText, styles.setCountBtnAddText]}>+ Set</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Toggles */}
                        <View style={styles.toggleRow}>
                          <TouchableOpacity
                            style={[styles.toggleBtn, hasDropSets && styles.toggleBtnActive]}
                            onPress={() => toggleDropSet(dayIndex, exIdx)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.toggleIcon}>↓</Text>
                            <Text style={[styles.toggleText, hasDropSets && styles.toggleTextActive]}>
                              Drop Set
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.toggleBtn, inSuperset && styles.toggleBtnActive]}
                            onPress={() => toggleSuperset(dayIndex, exIdx)}
                            activeOpacity={0.7}
                            disabled={exIdx === exercises.length - 1 && !inSuperset}
                          >
                            <Text style={styles.toggleIcon}>⟷</Text>
                            <Text style={[
                              styles.toggleText,
                              inSuperset && styles.toggleTextActive,
                              exIdx === exercises.length - 1 && !inSuperset && { opacity: 0.3 },
                            ]}>
                              Superset
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Rest time */}
                        <View style={styles.restRow}>
                          <Text style={styles.restLabel}>Rest</Text>
                          <View style={styles.restBtns}>
                            {[60, 90, 120, 180].map((sec) => (
                              <TouchableOpacity
                                key={sec}
                                style={[
                                  styles.restBtn,
                                  (ex.restSeconds ?? 90) === sec && styles.restBtnActive,
                                ]}
                                onPress={() => updateExerciseInDay(dayIndex, exIdx, { restSeconds: sec })}
                                activeOpacity={0.7}
                              >
                                <Text style={[
                                  styles.restBtnText,
                                  (ex.restSeconds ?? 90) === sec && styles.restBtnTextActive,
                                ]}>
                                  {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        {/* Move / Delete */}
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={[styles.moveBtn, exIdx === 0 && styles.moveBtnDisabled]}
                            onPress={() => handleMoveUp(exIdx)}
                            disabled={exIdx === 0}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.moveBtnText}>↑ Up</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.moveBtn, exIdx === exercises.length - 1 && styles.moveBtnDisabled]}
                            onPress={() => handleMoveDown(exIdx)}
                            disabled={exIdx === exercises.length - 1}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.moveBtnText}>↓ Down</Text>
                          </TouchableOpacity>
                          <View style={styles.flex} />
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDeleteExercise(exIdx)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.deleteBtnText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )
            })
          )}

          {/* Add Exercise button */}
          <TouchableOpacity style={styles.addExerciseBtn} onPress={handleAddExercise} activeOpacity={0.7}>
            <View style={styles.addCircle}>
              <Text style={styles.addCircleText}>+</Text>
            </View>
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <Text style={styles.bottomInfo}>
            {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} · {exercises.reduce((a, e) => a + e.sets.length, 0)} sets
          </Text>
          <TouchableOpacity onPress={handleDone} activeOpacity={0.7}>
            <LinearGradient
              colors={[Colors.dark.accent, Colors.dark.accentGreen]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveBtnGradient}
            >
              <Text style={styles.saveBtnText}>Save Day</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.dark.text },
  doneBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full, backgroundColor: Colors.dark.accentSurface,
  },
  doneBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.dark.accent },
  dayNameRow: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  dayNameInput: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    fontSize: FontSize.xxl, fontWeight: FontWeight.semibold, color: Colors.dark.text,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  content: { paddingHorizontal: Spacing.xl },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.xl },
  emptyTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.dark.text, marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: FontSize.xl, color: Colors.dark.textSecondary },

  // Superset
  supersetLabel: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.sm, marginBottom: Spacing.xs,
  },
  supersetLine: { flex: 1, height: 1 },
  supersetText: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.dark.accent,
    letterSpacing: 2,
  },
  supersetCard: {
    borderLeftColor: Colors.dark.accent,
    marginLeft: 4,
  },

  // Exercise card
  exerciseCard: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md, overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.lg,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.dark.text },
  exerciseMeta: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginTop: 1 },
  chevron: { fontSize: FontSize.sm, color: Colors.dark.textMuted, marginRight: Spacing.sm },

  // Set chips
  setChipsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg,
  },
  setChip: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs + 1,
    flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  setChipDrop: { backgroundColor: 'rgba(255,107,107,0.12)' },
  dropArrow: { fontSize: FontSize.sm, color: Colors.dark.danger },
  setChipText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.dark.textSecondary },

  // Expanded
  expandedSection: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  setsHeader: {
    flexDirection: 'row', marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  setsLabel: {
    flex: 1, fontSize: FontSize.xs, fontWeight: FontWeight.bold,
    color: Colors.dark.textMuted, letterSpacing: 1, textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  setNumWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  setNum: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.dark.textMuted },
  setDropBadge: { fontSize: FontSize.sm, color: Colors.dark.danger },
  setInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.dark.text,
    textAlign: 'center',
  },

  // Set count
  setCountRow: {
    flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm, marginBottom: Spacing.lg,
  },
  setCountBtn: {
    flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  setCountBtnAdd: {
    backgroundColor: Colors.dark.accentSurface, borderColor: Colors.dark.accentBorder,
  },
  setCountBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.dark.textSecondary },
  setCountBtnAddText: { color: Colors.dark.accent },

  // Toggles
  toggleRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: Colors.dark.border,
  },
  toggleBtnActive: {
    backgroundColor: Colors.dark.accentSurface, borderColor: Colors.dark.accentBorderStrong,
  },
  toggleIcon: { fontSize: FontSize.lg },
  toggleText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.dark.textSecondary },
  toggleTextActive: { color: Colors.dark.accent },

  // Rest
  restRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg,
  },
  restLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.dark.textSecondary },
  restBtns: { flexDirection: 'row', gap: Spacing.sm, flex: 1 },
  restBtn: {
    flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  restBtnActive: { backgroundColor: Colors.dark.accentSurface, borderColor: Colors.dark.accentBorderStrong },
  restBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.dark.textSecondary },
  restBtnTextActive: { color: Colors.dark.accent },

  // Move / delete
  actionRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  moveBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  moveBtnDisabled: { opacity: 0.3 },
  moveBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.dark.textSecondary },
  deleteBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, backgroundColor: 'rgba(255,107,107,0.1)',
  },
  deleteBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.dark.danger },

  // Add exercise
  addExerciseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.md, paddingVertical: Spacing.xxl,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.dark.accentBorder,
    borderRadius: BorderRadius.xl, marginTop: Spacing.md,
  },
  addCircle: {
    width: 32, height: 32, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.accentSurface, alignItems: 'center', justifyContent: 'center',
  },
  addCircleText: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.dark.accent },
  addExerciseText: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.dark.accent },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.dark.border,
  },
  bottomInfo: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.dark.textSecondary },
  saveBtnGradient: {
    paddingHorizontal: Spacing.xxxl, paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  saveBtnText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.dark.textOnAccent },
})
