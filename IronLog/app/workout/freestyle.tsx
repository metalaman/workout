import { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  FlatList, Modal, Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Href } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from '@/stores/auth-store'
import { useWorkoutStore } from '@/stores/workout-store'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { ExerciseIcon, MUSCLE_GROUP_COLORS, EXERCISES } from '@/components/exercise-icon'
import * as db from '@/lib/database'
import type { ActiveWorkoutExercise } from '@/types'
import { guessMuscleGroup } from '@/lib/utils'


interface SelectedExercise {
  id: string
  name: string
  muscleGroup: string
  sets: number
  reps: number
}

export default function FreestyleWorkoutScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { startWorkout } = useWorkoutStore()

  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([])
  const [showPicker, setShowPicker] = useState(true) // Start with picker open
  const [search, setSearch] = useState('')

  const filteredExercises = useMemo(() => {
    if (!search.trim()) return EXERCISES
    const q = search.toLowerCase()
    return EXERCISES.filter((e) => e.toLowerCase().includes(q))
  }, [search])

  const addExercise = (name: string) => {
    const mg = guessMuscleGroup(name)
    const id = name.toLowerCase().replace(/\s+/g, '-')
    // Don't add duplicates
    if (selectedExercises.find((e) => e.id === id)) return
    setSelectedExercises((prev) => [...prev, { id, name, muscleGroup: mg, sets: 3, reps: 10 }])
    setShowPicker(false)
    setSearch('')
  }

  const removeExercise = (idx: number) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateSets = (idx: number, sets: number) => {
    setSelectedExercises((prev) => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], sets: Math.max(1, Math.min(10, sets)) }
      return updated
    })
  }

  const updateReps = (idx: number, reps: number) => {
    setSelectedExercises((prev) => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], reps: Math.max(1, Math.min(100, reps)) }
      return updated
    })
  }

  const handleStartWorkout = async () => {
    if (selectedExercises.length === 0) return

    // Build ActiveWorkoutExercise array
    const activeExercises: ActiveWorkoutExercise[] = selectedExercises.map((ex) => ({
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: Array.from({ length: ex.sets }, (_, i) => ({
        setNumber: i + 1,
        weight: 0,
        reps: ex.reps,
        previousWeight: null,
        previousReps: null,
        isCompleted: false,
      })),
      restSeconds: 90,
    }))

    // Create session
    let sessionId = `local-${Date.now()}`
    if (user?.$id) {
      try {
        const session = await db.createWorkoutSession({
          userId: user.$id,
          programDayId: 'freestyle',
          programDayName: 'Freestyle',
          startedAt: new Date().toISOString(),
          completedAt: null,
          totalVolume: 0,
          duration: 0,
          notes: '',
        })
        sessionId = session.$id
      } catch {}
    }

    // Start workout using the same store as programmed workouts
    startWorkout({
      sessionId,
      programDayName: 'Freestyle',
      exercises: activeExercises,
    })

    // Navigate to active workout screen
    router.replace('/workout/active' as Href)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Freestyle Workout</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.subtitle}>Pick your exercises, then start your workout</Text>

      {/* Selected exercises */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {selectedExercises.map((ex, idx) => {
          const c = MUSCLE_GROUP_COLORS[ex.muscleGroup] || Colors.dark.accent
          return (
            <View key={ex.id} style={styles.exerciseCard}>
              <View style={[styles.cardAccent, { backgroundColor: c }]} />
              <View style={styles.cardContent}>
                <View style={styles.cardRow}>
                  <ExerciseIcon exerciseName={ex.name} size={36} color={c} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{ex.name}</Text>
                    <Text style={[styles.cardMG, { color: c }]}>{ex.muscleGroup}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeExercise(idx)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Sets and Reps config */}
                <View style={styles.configRow}>
                  <View style={styles.configItem}>
                    <Text style={styles.configLabel}>Sets</Text>
                    <View style={styles.stepper}>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => updateSets(idx, ex.sets - 1)}>
                        <Text style={styles.stepBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{ex.sets}</Text>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => updateSets(idx, ex.sets + 1)}>
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.configItem}>
                    <Text style={styles.configLabel}>Reps</Text>
                    <View style={styles.stepper}>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => updateReps(idx, ex.reps - 1)}>
                        <Text style={styles.stepBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{ex.reps}</Text>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => updateReps(idx, ex.reps + 1)}>
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )
        })}

        {/* Add exercise button */}
        <TouchableOpacity style={styles.addExerciseBtn} onPress={() => setShowPicker(true)}>
          <Text style={styles.addExerciseText}>+ Add Exercise</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom bar - Start Workout */}
      {selectedExercises.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomInfo}>
            <Text style={styles.bottomCount}>{selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''}</Text>
            <Text style={styles.bottomSets}>{selectedExercises.reduce((a, e) => a + e.sets, 0)} total sets</Text>
          </View>
          <TouchableOpacity onPress={handleStartWorkout}>
            <LinearGradient colors={['#e8ff47', '#7fff00']} style={styles.startBtn}>
              <Text style={styles.startBtnText}>Start Workout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Exercise picker modal */}
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
                const isSelected = selectedExercises.some((e) => e.id === item.toLowerCase().replace(/\s+/g, '-'))
                return (
                  <TouchableOpacity
                    style={[styles.exerciseRow, isSelected && styles.exerciseRowSelected]}
                    onPress={() => addExercise(item)}
                    disabled={isSelected}
                  >
                    <ExerciseIcon exerciseName={item} size={24} color={c} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.exerciseName, isSelected && { color: Colors.dark.textMuted }]}>{item}</Text>
                      <Text style={[styles.exerciseMG, { color: c }]}>{mg}</Text>
                    </View>
                    {isSelected && <Text style={styles.addedBadge}>Added</Text>}
                  </TouchableOpacity>
                )
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  scroll: { flex: 1, paddingHorizontal: Spacing.xxl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
  },
  closeBtn: { color: Colors.dark.text, fontSize: FontSize.title },
  title: { color: Colors.dark.text, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  subtitle: {
    color: Colors.dark.textMuted, fontSize: FontSize.md,
    paddingHorizontal: Spacing.xxl, marginBottom: Spacing.xl,
  },

  // Exercise cards
  exerciseCard: {
    flexDirection: 'row', backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg, marginBottom: Spacing.md, overflow: 'hidden',
  },
  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: Spacing.lg },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardName: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  cardMG: { fontSize: FontSize.sm, marginTop: 1 },
  removeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,68,68,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { color: '#ff4444', fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  configRow: { flexDirection: 'row', marginTop: Spacing.md, gap: Spacing.xl },
  configItem: { flex: 1 },
  configLabel: {
    color: Colors.dark.textMuted, fontSize: FontSize.xs, fontWeight: FontWeight.bold,
    letterSpacing: 1, marginBottom: 6,
  },
  stepper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.md, overflow: 'hidden',
  },
  stepBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { color: Colors.dark.accent, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  stepValue: {
    flex: 1, textAlign: 'center', color: Colors.dark.text,
    fontSize: FontSize.lg, fontWeight: FontWeight.bold,
  },

  // Add exercise
  addExerciseBtn: {
    paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.dark.accentBorder, borderStyle: 'dashed',
    alignItems: 'center', marginTop: Spacing.sm,
  },
  addExerciseText: { color: Colors.dark.accent, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg, paddingBottom: Spacing.xl,
    borderTopWidth: 1, borderTopColor: Colors.dark.border, backgroundColor: Colors.dark.background,
  },
  bottomInfo: {},
  bottomCount: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  bottomSets: { color: Colors.dark.textMuted, fontSize: FontSize.sm },
  startBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: BorderRadius.pill },
  startBtnText: { color: Colors.dark.textOnAccent, fontWeight: FontWeight.bold, fontSize: FontSize.lg },

  // Picker modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: '#2a2a2a', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.xxl, paddingBottom: 40, maxHeight: '80%',
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xl,
  },
  pickerTitle: { color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  searchInput: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, color: Colors.dark.text, fontSize: FontSize.lg, marginBottom: Spacing.md,
  },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  exerciseRowSelected: { opacity: 0.5 },
  exerciseName: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  exerciseMG: { fontSize: FontSize.sm, marginTop: 1 },
  addedBadge: { color: Colors.dark.accent, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
})
