import { useState, useEffect, useRef, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, FlatList, Modal, Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Href } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from '@/stores/auth-store'
import { useSessionStore } from '@/stores/session-store'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { formatDuration, calculate1RM, formatVolume } from '@/lib/utils'
import { ExerciseIcon, MUSCLE_GROUP_COLORS, EXERCISES } from '@/components/exercise-icon'
import * as db from '@/lib/database'
import type { PersonalRecord } from '@/types'

interface FreestyleSet {
  setNumber: number
  weight: number
  reps: number
  isCompleted: boolean
}

interface FreestyleExercise {
  id: string
  name: string
  sets: FreestyleSet[]
  restSeconds: number
}

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

export default function FreestyleWorkoutScreen() {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const { setLastCompleted, setNewPRs, addSession, personalRecords, loadPRs } = useSessionStore()

  const [exercises, setExercises] = useState<FreestyleExercise[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [editingSet, setEditingSet] = useState<number | null>(null)
  const [editWeight, setEditWeight] = useState('')
  const [editReps, setEditReps] = useState('')
  const [isResting, setIsResting] = useState(false)
  const [restTime, setRestTime] = useState(0)
  const [newPRsList, setNewPRsList] = useState<PersonalRecord[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (user?.$id) loadPRs(user.$id)
  }, [user?.$id])

  // Create session on mount
  useEffect(() => {
    const createSession = async () => {
      if (!user?.$id) return
      try {
        const session = await db.createWorkoutSession({
          userId: user.$id, programDayId: 'freestyle',
          programDayName: 'Freestyle',
          startedAt: new Date().toISOString(),
          completedAt: null, totalVolume: 0, duration: 0, notes: '',
        })
        setSessionId(session.$id)
      } catch {
        setSessionId(`local-${Date.now()}`)
      }
    }
    createSession()
  }, [user?.$id])

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Rest timer
  useEffect(() => {
    if (isResting && restTime > 0) {
      restRef.current = setInterval(() => {
        setRestTime((t) => {
          if (t <= 1) {
            setIsResting(false)
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => { if (restRef.current) clearInterval(restRef.current) }
  }, [isResting, restTime])

  const prMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const pr of personalRecords) {
      const exId = pr.exerciseId || pr.exerciseName.toLowerCase().replace(/\s+/g, '-')
      map.set(exId, pr.estimated1RM || calculate1RM(pr.weight, pr.reps))
    }
    return map
  }, [personalRecords])

  const currentExercise = exercises[currentIndex]

  const filteredExercises = useMemo(() => {
    if (!search.trim()) return EXERCISES
    const q = search.toLowerCase()
    return EXERCISES.filter((e) => e.toLowerCase().includes(q))
  }, [search])

  const addExercise = (name: string) => {
    const newEx: FreestyleExercise = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      sets: [
        { setNumber: 1, weight: 0, reps: 10, isCompleted: false },
        { setNumber: 2, weight: 0, reps: 10, isCompleted: false },
        { setNumber: 3, weight: 0, reps: 10, isCompleted: false },
      ],
      restSeconds: 90,
    }
    setExercises((prev) => [...prev, newEx])
    if (exercises.length === 0) setCurrentIndex(0)
    setShowPicker(false)
    setSearch('')
  }

  const handleCompleteSet = async (setIdx: number) => {
    if (!currentExercise) return
    const w = parseFloat(editWeight) || currentExercise.sets[setIdx].weight
    const r = parseInt(editReps) || currentExercise.sets[setIdx].reps

    const updated = [...exercises]
    updated[currentIndex].sets[setIdx] = { ...updated[currentIndex].sets[setIdx], weight: w, reps: r, isCompleted: true }
    setExercises(updated)
    setEditingSet(null)
    setEditWeight('')
    setEditReps('')

    // Start rest
    setIsResting(true)
    setRestTime(currentExercise.restSeconds)

    // Save to backend
    if (user?.$id && sessionId) {
      try {
        await db.createWorkoutSet({
          sessionId, userId: user.$id,
          exerciseId: currentExercise.id,
          setNumber: setIdx + 1, weight: w, reps: r, isCompleted: true,
        })
        // Check PR
        const result = await db.checkAndUpdatePR(user.$id, currentExercise.id, currentExercise.name, w, r)
        if (result.isNewPR && result.record) {
          setNewPRsList((prev) => [...prev, result.record!])
        }
      } catch {}
    }
  }

  const addSet = () => {
    if (!currentExercise) return
    const updated = [...exercises]
    const lastSet = currentExercise.sets[currentExercise.sets.length - 1]
    updated[currentIndex].sets.push({
      setNumber: currentExercise.sets.length + 1,
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 10,
      isCompleted: false,
    })
    setExercises(updated)
  }

  const handleFinish = async () => {
    let totalVolume = 0
    for (const ex of exercises) {
      for (const s of ex.sets) {
        if (s.isCompleted) totalVolume += s.weight * s.reps
      }
    }

    if (user?.$id && sessionId && !sessionId.startsWith('local-')) {
      try {
        const session = await db.completeWorkoutSession(sessionId, {
          completedAt: new Date().toISOString(),
          totalVolume,
          duration: elapsed,
        })
        setLastCompleted(session)
        addSession(session)
        await db.updateStreak(user.$id, profile?.$id || '')
      } catch {}
    }

    setNewPRs(newPRsList)
    router.replace('/workout/summary' as Href)
  }

  if (exercises.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>Freestyle</Text>
          <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Start Your Workout</Text>
          <Text style={styles.emptySubtitle}>Add exercises and start logging</Text>
          <TouchableOpacity onPress={() => setShowPicker(true)}>
            <LinearGradient colors={['#e8ff47', '#7fff00']} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Add Exercise</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        {renderPicker()}
      </SafeAreaView>
    )
  }

  function renderPicker() {
    return (
      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <Pressable style={styles.pickerSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.pickerTitle}>Add Exercise</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={Colors.dark.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => {
                const mg = guessMuscleGroup(item)
                const c = MUSCLE_GROUP_COLORS[mg] || Colors.dark.accent
                return (
                  <TouchableOpacity style={styles.exerciseRow} onPress={() => addExercise(item)}>
                    <ExerciseIcon exerciseName={item} size={24} color={c} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.exerciseName}>{item}</Text>
                      <Text style={[styles.exerciseMG, { color: c }]}>{mg}</Text>
                    </View>
                  </TouchableOpacity>
                )
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => Alert.alert('End Workout?', 'Progress will be lost.', [
          { text: 'Cancel' }, { text: 'End', style: 'destructive', onPress: () => router.back() },
        ])}>
          <Text style={styles.backBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Freestyle</Text>
        <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
      </View>

      {/* Rest Timer Banner */}
      {isResting && (
        <View style={styles.restBanner}>
          <Text style={styles.restLabel}>REST</Text>
          <Text style={styles.restTime}>{formatDuration(restTime)}</Text>
          <TouchableOpacity onPress={() => { setIsResting(false); setRestTime(0) }}>
            <Text style={styles.skipRest}>SKIP</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Exercise tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exTabs} contentContainerStyle={{ paddingHorizontal: Spacing.xxl, gap: 8 }}>
        {exercises.map((ex, i) => {
          const mg = guessMuscleGroup(ex.name)
          const c = MUSCLE_GROUP_COLORS[mg] || Colors.dark.accent
          const active = i === currentIndex
          return (
            <TouchableOpacity
              key={i}
              style={[styles.exTab, active && { borderColor: c, backgroundColor: `${c}15` }]}
              onPress={() => setCurrentIndex(i)}
            >
              <Text style={[styles.exTabText, active && { color: c }]} numberOfLines={1}>{ex.name}</Text>
            </TouchableOpacity>
          )
        })}
        <TouchableOpacity style={styles.exTabAdd} onPress={() => setShowPicker(true)}>
          <Text style={styles.exTabAddText}>+</Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Current Exercise */}
        {currentExercise && (
          <View style={styles.exerciseSection}>
            <View style={styles.exerciseHeader}>
              <ExerciseIcon exerciseName={currentExercise.name} size={32} color={MUSCLE_GROUP_COLORS[guessMuscleGroup(currentExercise.name)] || Colors.dark.accent} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.currentName}>{currentExercise.name}</Text>
                {prMap.has(currentExercise.id) && (
                  <Text style={styles.pr1rm}>1RM: {prMap.get(currentExercise.id)} lbs</Text>
                )}
              </View>
            </View>

            {/* Sets table */}
            <View style={styles.setHeader}>
              <Text style={[styles.setHeaderText, { flex: 0.5 }]}>SET</Text>
              <Text style={[styles.setHeaderText, { flex: 1 }]}>WEIGHT</Text>
              <Text style={[styles.setHeaderText, { flex: 1 }]}>REPS</Text>
              <Text style={[styles.setHeaderText, { flex: 0.7 }]}>%1RM</Text>
              <Text style={[styles.setHeaderText, { flex: 0.5 }]} />
            </View>

            {currentExercise.sets.map((s, idx) => {
              const est1RM = prMap.get(currentExercise.id) || 0
              const pctRM = s.isCompleted && est1RM > 0 ? Math.round((s.weight / est1RM) * 100) : null
              const isEditing = editingSet === idx

              return (
                <View key={idx} style={[styles.setRow, s.isCompleted && styles.setRowCompleted]}>
                  <Text style={[styles.setNum, { flex: 0.5 }]}>{idx + 1}</Text>
                  {isEditing ? (
                    <>
                      <TextInput
                        style={[styles.setInput, { flex: 1 }]}
                        value={editWeight}
                        onChangeText={setEditWeight}
                        keyboardType="numeric"
                        placeholder={`${s.weight}`}
                        placeholderTextColor={Colors.dark.textMuted}
                        autoFocus
                      />
                      <TextInput
                        style={[styles.setInput, { flex: 1 }]}
                        value={editReps}
                        onChangeText={setEditReps}
                        keyboardType="numeric"
                        placeholder={`${s.reps}`}
                        placeholderTextColor={Colors.dark.textMuted}
                      />
                      <Text style={[styles.setVal, { flex: 0.7, color: Colors.dark.textMuted }]}>—</Text>
                      <TouchableOpacity style={{ flex: 0.5 }} onPress={() => handleCompleteSet(idx)}>
                        <LinearGradient colors={['#e8ff47', '#7fff00']} style={styles.checkBtn}>
                          <Text style={styles.checkText}>✓</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.setVal, { flex: 1 }]}>
                        {s.isCompleted ? s.weight : s.weight || '—'}
                      </Text>
                      <Text style={[styles.setVal, { flex: 1 }]}>
                        {s.isCompleted ? s.reps : s.reps || '—'}
                      </Text>
                      <Text style={[styles.setVal, { flex: 0.7, color: pctRM ? Colors.dark.accent : Colors.dark.textMuted }]}>
                        {pctRM ? `${pctRM}%` : '—'}
                      </Text>
                      <TouchableOpacity
                        style={{ flex: 0.5 }}
                        onPress={() => {
                          if (!s.isCompleted) {
                            setEditingSet(idx)
                            setEditWeight(s.weight > 0 ? `${s.weight}` : '')
                            setEditReps(s.reps > 0 ? `${s.reps}` : '')
                          }
                        }}
                      >
                        {s.isCompleted ? (
                          <View style={styles.completedBadge}>
                            <Text style={styles.completedCheck}>✓</Text>
                          </View>
                        ) : (
                          <View style={styles.logBtn}>
                            <Text style={styles.logBtnText}>LOG</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )
            })}

            <TouchableOpacity style={styles.addSetBtn} onPress={addSet}>
              <Text style={styles.addSetText}>+ Add Set</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{exercises.length}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {exercises.reduce((a, e) => a + e.sets.filter((s) => s.isCompleted).length, 0)}
            </Text>
            <Text style={styles.statLabel}>Sets Done</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {formatVolume(exercises.reduce((a, e) => a + e.sets.filter((s) => s.isCompleted).reduce((v, s) => v + s.weight * s.reps, 0), 0))}
            </Text>
            <Text style={styles.statLabel}>Volume</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Finish button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.addExBtn}>
          <Text style={styles.addExText}>+ Exercise</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleFinish}>
          <LinearGradient colors={['#e8ff47', '#7fff00']} style={styles.finishBtn}>
            <Text style={styles.finishText}>Finish</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {renderPicker()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  scroll: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
  },
  backBtn: { color: Colors.dark.text, fontSize: FontSize.title },
  topTitle: { color: Colors.dark.text, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  timer: { color: Colors.dark.accent, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },

  restBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(232,255,71,0.1)', paddingVertical: 10, gap: 12,
  },
  restLabel: { color: Colors.dark.accent, fontSize: FontSize.sm, fontWeight: FontWeight.bold, letterSpacing: 1 },
  restTime: { color: Colors.dark.accent, fontSize: FontSize.title, fontWeight: FontWeight.black },
  skipRest: { color: Colors.dark.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  exTabs: { maxHeight: 40, marginBottom: Spacing.md },
  exTab: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.dark.border, backgroundColor: Colors.dark.surface,
  },
  exTabText: { color: Colors.dark.textSecondary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  exTabAdd: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.dark.accentBorder, borderStyle: 'dashed',
  },
  exTabAddText: { color: Colors.dark.accent, fontSize: FontSize.lg },

  exerciseSection: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.xxl },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  currentName: { color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.bold },
  pr1rm: { color: Colors.dark.accent, fontSize: FontSize.md, fontWeight: FontWeight.semibold },

  setHeader: { flexDirection: 'row', marginBottom: Spacing.sm, paddingHorizontal: 4 },
  setHeaderText: { color: Colors.dark.textMuted, fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 1 },
  setRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  setRowCompleted: { backgroundColor: 'rgba(232,255,71,0.03)' },
  setNum: { color: Colors.dark.textMuted, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  setVal: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  setInput: {
    color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold,
    backgroundColor: Colors.dark.surface, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
    marginHorizontal: 2,
  },
  checkBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: Colors.dark.textOnAccent, fontWeight: FontWeight.bold, fontSize: FontSize.lg },
  completedBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(232,255,71,0.2)', alignItems: 'center', justifyContent: 'center' },
  completedCheck: { color: Colors.dark.accent, fontWeight: FontWeight.bold },
  logBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: Colors.dark.surface },
  logBtnText: { color: Colors.dark.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  addSetBtn: { marginTop: Spacing.md, alignSelf: 'center' },
  addSetText: { color: Colors.dark.accent, fontSize: FontSize.md, fontWeight: FontWeight.semibold },

  statsSection: { flexDirection: 'row', paddingHorizontal: Spacing.xxl, gap: Spacing.sm, marginBottom: Spacing.xxl },
  statCard: { flex: 1, backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center' },
  statValue: { color: Colors.dark.accent, fontSize: FontSize.title, fontWeight: FontWeight.extrabold },
  statLabel: { color: Colors.dark.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  bottomBar: {
    flexDirection: 'row', paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.dark.border, gap: Spacing.md,
    backgroundColor: Colors.dark.background,
  },
  addExBtn: {
    flex: 1, paddingVertical: 12, borderRadius: BorderRadius.lg, borderWidth: 1,
    borderColor: Colors.dark.accentBorder, alignItems: 'center', borderStyle: 'dashed',
  },
  addExText: { color: Colors.dark.accent, fontWeight: FontWeight.semibold },
  finishBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: BorderRadius.lg },
  finishText: { color: Colors.dark.textOnAccent, fontWeight: FontWeight.bold, fontSize: FontSize.xxl },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.bold },
  emptySubtitle: { color: Colors.dark.textMuted, fontSize: FontSize.md, marginTop: 4, marginBottom: 24 },
  addBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: BorderRadius.pill },
  addBtnText: { color: Colors.dark.textOnAccent, fontWeight: FontWeight.bold, fontSize: FontSize.xxl },

  // Picker modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.xxl, paddingBottom: 40, maxHeight: '80%',
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xl },
  pickerTitle: { color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  searchInput: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, color: Colors.dark.text, fontSize: FontSize.lg, marginBottom: Spacing.md,
  },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  exerciseName: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  exerciseMG: { fontSize: FontSize.sm, marginTop: 1 },
})
