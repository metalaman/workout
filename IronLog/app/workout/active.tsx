import { useState, useEffect, useRef, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Href } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useWorkoutStore } from '@/stores/workout-store'
import { useSessionStore } from '@/stores/session-store'
import { useAuthStore } from '@/stores/auth-store'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { formatDuration, calculate1RM } from '@/lib/utils'
import { ExerciseIcon, MUSCLE_GROUP_COLORS } from '@/components/exercise-icon'
import * as db from '@/lib/database'
import type { PersonalRecord } from '@/types'
import Svg, { Path } from 'react-native-svg'

const TABS = ['Track', 'Overview', 'History', 'Notes'] as const
type TabName = typeof TABS[number]

function guessMuscleGroup(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('bench') || n.includes('chest') || n.includes('fly') || n.includes('dip')) return 'Chest'
  if (n.includes('squat') || n.includes('leg') || n.includes('lunge') || n.includes('calf') || n.includes('deadlift') || n.includes('hip')) return 'Legs'
  if (n.includes('row') || n.includes('pull') || n.includes('lat') || n.includes('back') || n.includes('chin')) return 'Back'
  if (n.includes('shoulder') || n.includes('press') || n.includes('ohp') || n.includes('lateral') || n.includes('raise') || n.includes('delt')) return 'Shoulders'
  if (n.includes('curl') || n.includes('bicep') || n.includes('tricep') || n.includes('extension') || n.includes('skull') || n.includes('hammer') || n.includes('pushdown')) return 'Arms'
  if (n.includes('plank') || n.includes('crunch') || n.includes('ab') || n.includes('core')) return 'Core'
  return 'Chest'
}

export default function ActiveWorkoutScreen() {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const {
    programDayName, exercises, currentExerciseIndex, elapsedSeconds,
    isResting, restTimerSeconds, sessionId, isPaused,
    addSet, completeSet, nextExercise, updateElapsed, startRest, stopRest,
    pauseWorkout, resumeWorkout, endWorkout, isActive,
  } = useWorkoutStore()
  const { setLastCompleted, setNewPRs, addSession, loadRecent, personalRecords, loadPRs } = useSessionStore()

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [activeTab, setActiveTab] = useState<TabName>('Track')
  const [editingSet, setEditingSet] = useState<number | null>(null)
  const [editWeight, setEditWeight] = useState('')
  const [editReps, setEditReps] = useState('')
  const [workoutNotes, setWorkoutNotes] = useState('')
  const weightRef = useRef<TextInput>(null)
  const repsRef = useRef<TextInput>(null)

  useEffect(() => {
    if (user?.$id) loadPRs(user.$id)
  }, [user?.$id])

  const prMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const pr of personalRecords) {
      const exId = pr.exerciseId || pr.exerciseName.toLowerCase().replace(/\s+/g, '-')
      map.set(exId, pr.estimated1RM || calculate1RM(pr.weight, pr.reps))
    }
    return map
  }, [personalRecords])

  // Main timer — pauses when isPaused
  useEffect(() => {
    if (isPaused) return
    timerRef.current = setInterval(() => {
      updateElapsed(useWorkoutStore.getState().elapsedSeconds + 1)
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isPaused])

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
  const currentMG = guessMuscleGroup(currentExercise.exerciseName)
  const currentColor = MUSCLE_GROUP_COLORS[currentMG] || Colors.dark.accent
  const current1RM = prMap.get(currentExercise.exerciseId) || 0
  const completedSetsCount = currentExercise.sets.filter((s) => s.isCompleted).length
  const totalSetsAllExercises = exercises.reduce((a, ex) => a + ex.sets.length, 0)
  const completedSetsAll = exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.isCompleted).length, 0)

  const get1RMPercent = (weight: number): number => {
    if (!current1RM || weight <= 0) return 0
    return Math.round((weight / current1RM) * 100)
  }

  const handleCompleteSet = async (setIndex: number) => {
    const set = currentExercise.sets[setIndex]
    const weight = editingSet === setIndex && editWeight ? parseFloat(editWeight) : set.weight || set.previousWeight || 0
    const reps = editingSet === setIndex && editReps ? parseInt(editReps, 10) : set.reps || set.previousReps || 0

    completeSet(currentExerciseIndex, setIndex, weight, reps)
    setEditingSet(null)

    if (user?.$id && sessionId) {
      try {
        await db.createWorkoutSet({
          sessionId,
          userId: user.$id,
          exerciseId: currentExercise.exerciseId,
          exerciseName: currentExercise.exerciseName,
          setNumber: set.setNumber,
          weight,
          reps,
          isCompleted: true,
        })
      } catch { /* continue */ }
    }

    // Auto-start rest
    if (setIndex < currentExercise.sets.length - 1) {
      startRest(currentExercise.restSeconds)
    }

    // Auto-advance to next exercise if all sets done
    const allDone = currentExercise.sets.every((s, i) => i === setIndex || s.isCompleted)
    if (allDone && currentExerciseIndex < exercises.length - 1) {
      setTimeout(() => nextExercise(), 500)
    }
  }

  const handleCompleteExercise = async () => {
    // Complete all remaining sets with default values and move on
    const setsToSave: { setNumber: number; weight: number; reps: number }[] = []
    currentExercise.sets.forEach((set, i) => {
      if (!set.isCompleted) {
        const w = set.weight || set.previousWeight || 0
        const r = set.reps || set.previousReps || 0
        completeSet(currentExerciseIndex, i, w, r)
        setsToSave.push({ setNumber: set.setNumber, weight: w, reps: r })
      }
    })
    // Persist auto-completed sets to Appwrite
    if (user?.$id && sessionId) {
      for (const s of setsToSave) {
        try {
          await db.createWorkoutSet({
            sessionId,
            userId: user.$id,
            exerciseId: currentExercise.exerciseId,
            exerciseName: currentExercise.exerciseName,
            setNumber: s.setNumber,
            weight: s.weight,
            reps: s.reps,
            isCompleted: true,
          })
        } catch { /* continue */ }
      }
    }
    if (currentExerciseIndex < exercises.length - 1) {
      nextExercise()
    } else {
      handleEndWorkout()
    }
  }

  const handleEndWorkout = () => {
    Alert.alert('End Workout?', 'Your progress will be saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: async () => {
          // Capture exercises before endWorkout resets them
          const completedExercises = [...exercises]
          const { totalVolume, duration } = endWorkout()
          const completedSession = {
            $id: sessionId ?? `local-${Date.now()}`,
            userId: user?.$id ?? 'dev',
            programDayId: '',
            programDayName,
            startedAt: new Date(Date.now() - duration * 1000).toISOString(),
            completedAt: new Date().toISOString(),
            totalVolume,
            duration,
            notes: workoutNotes,
          }

          if (user?.$id && sessionId && !sessionId.startsWith('local-')) {
            try {
              await db.completeWorkoutSession(sessionId, {
                completedAt: new Date().toISOString(),
                totalVolume,
                duration,
              })
              const newPRs: PersonalRecord[] = []
              for (const ex of completedExercises) {
                for (const s of ex.sets) {
                  if (s.isCompleted && s.weight > 0) {
                    try {
                      const result = await db.checkAndUpdatePR(
                        user.$id, ex.exerciseId, ex.exerciseName, s.weight, s.reps
                      )
                      if (result.isNewPR && result.record) {
                        if (!newPRs.find((p) => p.exerciseId === ex.exerciseId)) {
                          newPRs.push(result.record)
                        }
                      }
                    } catch { /* continue */ }
                  }
                }
              }
              if (profile?.$id) {
                try { await db.updateStreak(user.$id, profile.$id) } catch { /* continue */ }
              }
              setNewPRs(newPRs)
            } catch { /* continue */ }
          }

          setLastCompleted(completedSession, completedExercises)
          addSession(completedSession)
          if (user?.$id) loadRecent(user.$id)
          router.replace('/workout/summary' as Href)
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header — clean, no back arrow */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutName} numberOfLines={1}>{programDayName}</Text>
          <Text style={styles.headerProgress}>{completedSetsAll}/{totalSetsAllExercises} sets</Text>
        </View>
        <Text style={[styles.timer, isPaused && styles.timerPaused]}>{formatDuration(elapsedSeconds)}</Text>
      </View>

      {/* Tab bar — Caliber style */}
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

      {/* Rest timer overlay */}
      {isResting && (
        <View style={styles.restOverlay}>
          <Text style={styles.restLabel}>REST</Text>
          <Text style={styles.restTime}>{formatDuration(restTimerSeconds)}</Text>
          <TouchableOpacity onPress={stopRest} activeOpacity={0.7}>
            <Text style={styles.skipRest}>Skip Rest →</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {activeTab === 'Track' && (
          <>
            {/* Current exercise header card */}
            <View style={[styles.exerciseCard, { borderColor: `${currentColor}40` }]}>
              <View style={styles.exerciseCardHeader}>
                <View style={[styles.exIconLarge, { backgroundColor: `${currentColor}12` }]}>
                  <ExerciseIcon exerciseName={currentExercise.exerciseName} size={40} color={currentColor} />
                </View>
                <View style={styles.exerciseCardInfo}>
                  <Text style={styles.exerciseCounter}>
                    EXERCISE {currentExerciseIndex + 1} OF {exercises.length}
                  </Text>
                  <Text style={styles.exerciseName}>{currentExercise.exerciseName}</Text>
                  <View style={styles.exerciseMetaRow}>
                    <Text style={styles.exerciseMeta}>
                      Reps: {currentExercise.sets[0]?.reps ?? '—'}
                    </Text>
                    <Text style={styles.exerciseMetaDot}>·</Text>
                    <Text style={styles.exerciseMeta}>
                      Rest: {Math.floor((currentExercise.restSeconds || 90) / 60)}:{((currentExercise.restSeconds || 90) % 60).toString().padStart(2, '0')} min
                    </Text>
                  </View>
                </View>
              </View>
              {/* Info row: 1RM badge + action buttons */}
              <View style={styles.exerciseInfoRow}>
                {current1RM > 0 && (
                  <View style={[styles.rm1Badge, { backgroundColor: `${currentColor}20` }]}>
                    <Text style={[styles.rm1Text, { color: currentColor }]}>1RM: {current1RM} lbs</Text>
                  </View>
                )}
                <View style={{ flex: 1 }} />
                <View style={styles.actionBtns}>
                  <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke={Colors.dark.textMuted} strokeWidth={1.5} strokeLinecap="round" />
                    </Svg>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke={Colors.dark.textMuted} strokeWidth={1.5} strokeLinecap="round" />
                    </Svg>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Set cards — Caliber style */}
            {currentExercise.sets.map((set, i) => {
              const pct = set.isCompleted ? get1RMPercent(set.weight) : 0
              const isEditing = editingSet === i || !set.isCompleted
              return (
                <View key={i} style={[styles.setCard, set.isCompleted && styles.setCardCompleted]}>
                  <View style={styles.setCardHeader}>
                    <Text style={[styles.setLabel, set.isCompleted && { color: Colors.dark.accent }]}>
                      Set {set.setNumber}
                    </Text>
                    {set.isCompleted && pct > 0 && (
                      <View style={[styles.pctBadge, { backgroundColor: `${currentColor}20` }]}>
                        <Text style={[styles.pctText, { color: currentColor }]}>{pct}% 1RM</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.setCardInputs}>
                    {/* Reps */}
                    <View style={styles.inputGroup}>
                      {isEditing ? (
                        <TextInput
                          style={[styles.setInput, set.isCompleted && styles.setInputDone]}
                          value={editingSet === i ? editReps : (set.reps ? set.reps.toString() : '')}
                          placeholder={set.previousReps?.toString() ?? '8'}
                          placeholderTextColor={Colors.dark.textDark}
                          keyboardType="number-pad"
                          onFocus={() => {
                            setEditingSet(i)
                            setEditWeight(set.weight ? set.weight.toString() : '')
                            setEditReps(set.reps ? set.reps.toString() : '')
                          }}
                          onChangeText={setEditReps}
                        />
                      ) : (
                        <Text style={styles.setValueDone}>{set.reps}</Text>
                      )}
                      <Text style={styles.inputLabel}>reps</Text>
                      {set.previousReps != null && (
                        <Text style={styles.lastHint}>Last: {set.previousReps} reps</Text>
                      )}
                    </View>
                    {/* Weight */}
                    <View style={styles.inputGroup}>
                      {isEditing ? (
                        <TextInput
                          style={[styles.setInput, set.isCompleted && styles.setInputDone]}
                          value={editingSet === i ? editWeight : (set.weight ? set.weight.toString() : '')}
                          placeholder={set.previousWeight?.toString() ?? '135'}
                          placeholderTextColor={Colors.dark.textDark}
                          keyboardType="number-pad"
                          onFocus={() => {
                            setEditingSet(i)
                            setEditWeight(set.weight ? set.weight.toString() : '')
                            setEditReps(set.reps ? set.reps.toString() : '')
                          }}
                          onChangeText={setEditWeight}
                        />
                      ) : (
                        <Text style={styles.setValueDone}>{set.weight}</Text>
                      )}
                      <Text style={styles.inputLabel}>lbs</Text>
                      {set.previousWeight != null && (
                        <Text style={styles.lastHint}>Last: {set.previousWeight} lbs</Text>
                      )}
                    </View>
                    {/* Check button */}
                    <TouchableOpacity
                      style={[styles.checkBtn, set.isCompleted && styles.checkBtnDone]}
                      onPress={() => !set.isCompleted && handleCompleteSet(i)}
                      activeOpacity={0.7}
                      disabled={set.isCompleted}
                    >
                      {set.isCompleted ? (
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                          <Path d="M20 6L9 17l-5-5" stroke={Colors.dark.textOnAccent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      ) : (
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                          <Path d="M20 6L9 17l-5-5" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })}

            {/* + Add Set */}
            <TouchableOpacity style={styles.addSetBtn} activeOpacity={0.7} onPress={() => addSet(currentExerciseIndex)}>
              <Text style={styles.addSetText}>+ Add Set</Text>
            </TouchableOpacity>

            {/* Complete Exercise button */}
            <View style={styles.completeExBtnWrap}>
              <TouchableOpacity onPress={handleCompleteExercise} activeOpacity={0.85}>
                <LinearGradient
                  colors={[Colors.dark.accent, Colors.dark.accentGreen]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.completeExBtn}
                >
                  <Text style={styles.completeExText}>
                    {currentExerciseIndex < exercises.length - 1
                      ? `Complete Exercise (${completedSetsCount}/${currentExercise.sets.length})`
                      : `Finish Workout (${completedSetsCount}/${currentExercise.sets.length})`
                    }
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Up next */}
            {upNextExercises.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>UP NEXT</Text>
                {upNextExercises.map((ex, i) => {
                  const mg = guessMuscleGroup(ex.exerciseName)
                  const c = MUSCLE_GROUP_COLORS[mg] || Colors.dark.accent
                  return (
                    <View key={i} style={styles.upNextCard}>
                      <View style={[styles.upNextIcon, { backgroundColor: `${c}12` }]}>
                        <ExerciseIcon exerciseName={ex.exerciseName} size={20} color={c} />
                      </View>
                      <View style={styles.upNextInfo}>
                        <Text style={styles.upNextName}>{ex.exerciseName}</Text>
                        <Text style={styles.upNextSets}>{ex.sets.length} sets</Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            )}

            {/* Completed */}
            {completedExercises.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>COMPLETED</Text>
                {completedExercises.map((ex, i) => {
                  const mg = guessMuscleGroup(ex.exerciseName)
                  const c = MUSCLE_GROUP_COLORS[mg] || Colors.dark.accent
                  const exPR = prMap.get(ex.exerciseId) || 0
                  const topWeight = Math.max(...ex.sets.filter((s) => s.isCompleted).map((s) => s.weight))
                  const topPct = exPR > 0 && topWeight > 0 ? Math.round((topWeight / exPR) * 100) : 0
                  return (
                    <View key={i} style={styles.completedCard}>
                      <View style={[styles.completedIcon, { backgroundColor: `${c}15` }]}>
                        <ExerciseIcon exerciseName={ex.exerciseName} size={20} color={c} />
                      </View>
                      <View style={styles.completedInfo}>
                        <Text style={styles.completedName}>{ex.exerciseName}</Text>
                        <Text style={styles.completedDetail}>
                          {ex.sets.length} sets · {ex.sets[0]?.weight}-{ex.sets[ex.sets.length - 1]?.weight} lbs
                        </Text>
                      </View>
                      {topPct > 0 && (
                        <View style={[styles.pctBadge, { backgroundColor: `${c}20` }]}>
                          <Text style={[styles.pctText, { color: c }]}>{topPct}%</Text>
                        </View>
                      )}
                      <Text style={styles.completedCheck}>✓</Text>
                    </View>
                  )
                })}
              </View>
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
                <Text style={[styles.overviewValue, { color: Colors.dark.accent }]}>{completedSetsAll}</Text>
                <Text style={styles.overviewLabel}>Sets Done</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewValue}>{formatDuration(elapsedSeconds)}</Text>
                <Text style={styles.overviewLabel}>Duration</Text>
              </View>
            </View>
            <Text style={styles.overviewSectionTitle}>EXERCISE PROGRESS</Text>
            {exercises.map((ex, i) => {
              const done = ex.sets.filter((s) => s.isCompleted).length
              const total = ex.sets.length
              const mg = guessMuscleGroup(ex.exerciseName)
              const c = MUSCLE_GROUP_COLORS[mg] || Colors.dark.accent
              return (
                <View key={i} style={styles.progressRow}>
                  <View style={[styles.progressDot, { backgroundColor: i <= currentExerciseIndex ? c : Colors.dark.textDark }]} />
                  <Text style={[styles.progressName, i < currentExerciseIndex && { color: Colors.dark.textSecondary }]}>
                    {ex.exerciseName}
                  </Text>
                  <Text style={[styles.progressCount, { color: done === total ? Colors.dark.accent : Colors.dark.textMuted }]}>
                    {done}/{total}
                  </Text>
                </View>
              )
            })}
          </View>
        )}

        {activeTab === 'History' && (
          <View style={styles.historyContent}>
            <Text style={styles.historyPlaceholder}>
              Previous session data will appear here once you have workout history.
            </Text>
          </View>
        )}

        {activeTab === 'Notes' && (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.notesContent}>
              <View style={styles.notesDoneRow}>
                <Text style={styles.notesSectionLabel}>WORKOUT NOTES</Text>
                <TouchableOpacity onPress={Keyboard.dismiss} style={styles.notesDoneBtn}>
                  <Text style={styles.notesDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.notesInput}
                value={workoutNotes}
                onChangeText={setWorkoutNotes}
                placeholder="Add notes for this workout..."
                placeholderTextColor={Colors.dark.textMuted}
                multiline
                textAlignVertical="top"
                blurOnSubmit={true}
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>
          </TouchableWithoutFeedback>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom control bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomEndBtn}
          onPress={handleEndWorkout}
          activeOpacity={0.7}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M18 6L6 18M6 6l12 12" stroke="#ff4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>

        <View style={styles.bottomTimerContainer}>
          <Text style={styles.bottomTimerLabel}>{isPaused ? 'PAUSED' : 'ELAPSED'}</Text>
          <Text style={[styles.bottomTimer, isPaused && styles.bottomTimerPaused]}>{formatDuration(elapsedSeconds)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.bottomPauseBtn, isPaused && styles.bottomResumeBtnActive]}
          onPress={() => isPaused ? resumeWorkout() : pauseWorkout()}
          activeOpacity={0.7}
        >
          {isPaused ? (
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M5 3l14 9-14 9V3z" fill={Colors.dark.textOnAccent} />
            </Svg>
          ) : (
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M6 4h4v16H6V4zM14 4h4v16h-4V4z" fill={Colors.dark.text} />
            </Svg>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.xl },
  emptyText: { color: Colors.dark.textMuted, fontSize: FontSize.xxl },
  backLink: { color: Colors.dark.accent, fontSize: FontSize.xl, fontWeight: FontWeight.semibold },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  headerCenter: { flex: 1 },
  workoutName: { color: Colors.dark.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  headerProgress: { color: Colors.dark.textMuted, fontSize: FontSize.sm },
  timer: { color: Colors.dark.accent, fontSize: FontSize.title, fontWeight: FontWeight.bold, fontVariant: ['tabular-nums'] },
  timerPaused: { opacity: 0.4 },

  // Tab bar
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
    paddingHorizontal: Spacing.md,
  },
  tab: {
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.dark.accent },
  tabText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.dark.textMuted },
  tabTextActive: { color: Colors.dark.text },

  // Rest
  restOverlay: {
    backgroundColor: Colors.dark.accentSurface, borderWidth: 1, borderColor: Colors.dark.accentBorder,
    marginHorizontal: Spacing.xl, borderRadius: BorderRadius.xxl,
    paddingVertical: Spacing.xl, alignItems: 'center', marginVertical: Spacing.md,
  },
  restLabel: { color: Colors.dark.accent, fontSize: FontSize.sm, fontWeight: FontWeight.bold, letterSpacing: 2 },
  restTime: { color: Colors.dark.accent, fontSize: 36, fontWeight: FontWeight.extrabold, fontVariant: ['tabular-nums'] },
  skipRest: { color: Colors.dark.textMuted, fontSize: FontSize.base, marginTop: Spacing.xs },

  scroll: { flex: 1 },

  // Current exercise header card
  exerciseCard: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    backgroundColor: Colors.dark.surface, borderWidth: 1,
    borderRadius: BorderRadius.xxl, padding: Spacing.xl, marginBottom: Spacing.md,
  },
  exerciseCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
  },
  exIconLarge: {
    width: 56, height: 56, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  exerciseCardInfo: { flex: 1 },
  exerciseCounter: {
    color: Colors.dark.accent, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1.5,
  },
  exerciseName: {
    color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.bold, marginTop: 2,
  },
  exerciseMetaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 3 },
  exerciseMeta: { color: Colors.dark.textSecondary, fontSize: FontSize.base },
  exerciseMetaDot: { color: Colors.dark.textMuted, fontSize: FontSize.sm },
  exerciseInfoRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: Spacing.lg,
  },
  rm1Badge: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  rm1Text: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  actionBtns: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    width: 32, height: 32, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surfaceLight, alignItems: 'center', justifyContent: 'center',
  },

  // Set cards — Caliber style
  setCard: {
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border,
    borderRadius: BorderRadius.lg, padding: Spacing.xl,
  },
  setCardCompleted: {
    borderColor: `${Colors.dark.accent}30`,
    backgroundColor: Colors.dark.accentSurface,
  },
  setCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  setLabel: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.dark.textSecondary },
  pctBadge: { paddingHorizontal: Spacing.md, paddingVertical: 2, borderRadius: BorderRadius.full },
  pctText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  setCardInputs: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.lg,
  },
  inputGroup: { flex: 1 },
  setInput: {
    backgroundColor: Colors.dark.surfaceLight, borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.dark.text,
    textAlign: 'center',
  },
  setInputDone: {
    backgroundColor: Colors.dark.accentSurfaceActive, color: Colors.dark.accent,
  },
  setValueDone: {
    backgroundColor: Colors.dark.accentSurfaceActive, borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.dark.accent,
    textAlign: 'center', overflow: 'hidden',
  },
  inputLabel: {
    fontSize: FontSize.sm, color: Colors.dark.textMuted, textAlign: 'center',
    marginTop: 3,
  },
  lastHint: {
    fontSize: FontSize.xs, color: Colors.dark.textDark, textAlign: 'center',
    marginTop: 2,
  },
  checkBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.surfaceLight, alignItems: 'center', justifyContent: 'center',
    marginTop: 0,
  },
  checkBtnDone: { backgroundColor: Colors.dark.accent },

  // Add set
  addSetBtn: {
    marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, marginTop: Spacing.xs,
    alignItems: 'center', paddingVertical: Spacing.lg,
    borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.dark.border,
    borderRadius: BorderRadius.lg,
  },
  addSetText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.dark.textMuted },

  // Complete exercise
  completeExBtnWrap: { marginHorizontal: Spacing.xl, marginBottom: Spacing.xxl },
  completeExBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.xl, borderRadius: BorderRadius.lg,
  },
  completeExText: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.dark.textOnAccent },

  // Sections
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.lg },
  sectionTitle: { color: Colors.dark.textMuted, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1.5, marginBottom: Spacing.sm },

  // Up next
  upNextCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  upNextIcon: {
    width: 32, height: 32, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  upNextInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  upNextName: { color: Colors.dark.textSecondary, fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  upNextSets: { color: Colors.dark.textDark, fontSize: FontSize.sm },

  // Completed
  completedCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: BorderRadius.md,
    padding: Spacing.lg, flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md, marginBottom: Spacing.sm,
  },
  completedIcon: { width: 32, height: 32, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  completedInfo: { flex: 1 },
  completedName: { color: Colors.dark.textSecondary, fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  completedDetail: { color: Colors.dark.textDark, fontSize: FontSize.sm },
  completedCheck: { color: Colors.dark.accent, fontSize: FontSize.xl },

  // Overview tab
  overviewContent: { padding: Spacing.xl },
  overviewRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xxl },
  overviewCard: {
    flex: 1, backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: Colors.dark.border,
  },
  overviewValue: { fontSize: FontSize.title, fontWeight: FontWeight.extrabold, color: Colors.dark.text },
  overviewLabel: { fontSize: FontSize.sm, color: Colors.dark.textMuted, marginTop: 2 },
  overviewSectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.dark.textMuted,
    letterSpacing: 1.5, marginBottom: Spacing.md,
  },
  progressRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  progressDot: { width: 8, height: 8, borderRadius: 4 },
  progressName: { fontSize: FontSize.xl, color: Colors.dark.text, flex: 1 },
  progressCount: { fontSize: FontSize.base, fontWeight: FontWeight.bold },

  // History tab
  historyContent: { padding: Spacing.xl },
  historyPlaceholder: { color: Colors.dark.textMuted, fontSize: FontSize.xl, textAlign: 'center', paddingTop: Spacing.xxxxl },

  // Notes tab
  notesContent: { padding: Spacing.xl, flex: 1 },
  notesDoneRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  notesSectionLabel: {
    color: Colors.dark.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
  },
  notesDoneBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    backgroundColor: Colors.dark.accent, borderRadius: BorderRadius.pill,
  },
  notesDoneText: {
    color: Colors.dark.textOnAccent, fontSize: FontSize.sm, fontWeight: FontWeight.bold,
  },
  notesInput: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.dark.border,
    padding: Spacing.xl, minHeight: 200,
    fontSize: FontSize.xl, color: Colors.dark.text,
  },

  // Bottom control bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  bottomEndBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTimerContainer: {
    alignItems: 'center',
  },
  bottomTimerLabel: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.dark.textMuted,
    letterSpacing: 1.5,
  },
  bottomTimer: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.extrabold,
    color: Colors.dark.text,
    fontVariant: ['tabular-nums'] as const,
  },
  bottomTimerPaused: {
    color: Colors.dark.textMuted,
  },
  bottomPauseBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomResumeBtnActive: {
    backgroundColor: Colors.dark.accent,
  },
})
