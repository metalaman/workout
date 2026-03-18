import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput, Alert, Keyboard, TouchableWithoutFeedback,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { ExerciseIcon, MUSCLE_GROUP_COLORS } from '@/components/exercise-icon'
import { useSessionStore } from '@/stores/session-store'
import { listWorkoutSets, updateWorkoutSet, createWorkoutSet } from '@/lib/database'
import { useAuthStore } from '@/stores/auth-store'
import { formatDuration } from '@/lib/utils'
import Svg, { Path } from 'react-native-svg'
import type { WorkoutSet } from '@/types'

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

interface GroupedExercise {
  exerciseId: string
  exerciseName: string
  sets: { setNumber: number; weight: number; reps: number }[]
}

export default function WorkoutDetailScreen() {
  const router = useRouter()
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const { allSessions, recentSessions } = useSessionStore()
  const [exercises, setExercises] = useState<GroupedExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<GroupedExercise[]>([])
  const [saving, setSaving] = useState(false)
  const { user } = useAuthStore()
  const [rawSets, setRawSets] = useState<WorkoutSet[]>([])

  const session = [...allSessions, ...recentSessions].find((s) => s.$id === sessionId)

  useEffect(() => {
    if (!sessionId) return
    loadSets()
  }, [sessionId])

  async function loadSets() {
    setLoading(true)
    try {
      const sets = await listWorkoutSets(sessionId!)
      setRawSets(sets)
      // Group by exerciseId
      const grouped = new Map<string, GroupedExercise>()
      for (const s of sets) {
        const key = s.exerciseId
        if (!grouped.has(key)) {
          grouped.set(key, {
            exerciseId: s.exerciseId,
            exerciseName: (s as any).exerciseName || s.exerciseId.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            sets: [],
          })
        }
        grouped.get(key)!.sets.push({
          setNumber: s.setNumber,
          weight: s.weight,
          reps: s.reps,
        })
      }
      setExercises(Array.from(grouped.values()))
    } catch {
      // Failed to load sets
    }
    setLoading(false)
  }

  const workoutDate = session?.completedAt
    ? new Date(session.completedAt).toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric',
      })
    : session?.startedAt
    ? new Date(session.startedAt).toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric',
      })
    : 'Unknown date'

  const durationStr = session?.duration ? formatDuration(session.duration) : '—'

  // Recalculate volume from loaded sets
  const totalVolume = exercises.reduce(
    (acc, ex) => acc + ex.sets.reduce((a, s) => a + s.weight * s.reps, 0), 0
  )
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0)

  const formatVolume = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString()

  const startEditing = () => {
    setEditData(JSON.parse(JSON.stringify(exercises)))
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setEditData([])
    setIsEditing(false)
  }

  const handleEditSet = (exIdx: number, setIdx: number, field: 'weight' | 'reps', value: string) => {
    const updated = JSON.parse(JSON.stringify(editData))
    updated[exIdx].sets[setIdx][field] = parseInt(value, 10) || 0
    setEditData(updated)
  }

  const handleAddSet = (exIdx: number) => {
    const updated = JSON.parse(JSON.stringify(editData))
    const lastSet = updated[exIdx].sets[updated[exIdx].sets.length - 1]
    updated[exIdx].sets.push({
      setNumber: updated[exIdx].sets.length + 1,
      weight: lastSet?.weight ?? 0,
      reps: lastSet?.reps ?? 0,
      isNew: true,
    })
    setEditData(updated)
  }

  const handleSave = async () => {
    if (!sessionId || !user?.$id) return
    setSaving(true)
    try {
      for (let exIdx = 0; exIdx < editData.length; exIdx++) {
        const ex = editData[exIdx]
        for (let setIdx = 0; setIdx < ex.sets.length; setIdx++) {
          const s = ex.sets[setIdx]
          if ((s as any).isNew) {
            // Create new set in Appwrite
            await createWorkoutSet({
              sessionId,
              userId: user.$id,
              exerciseId: ex.exerciseId,
              exerciseName: ex.exerciseName,
              setNumber: s.setNumber,
              weight: s.weight,
              reps: s.reps,
              isCompleted: true,
            } as any)
          } else {
            // Find matching raw set and update
            const origEx = exercises[exIdx]
            if (origEx && origEx.sets[setIdx]) {
              const orig = origEx.sets[setIdx]
              if (orig.weight !== s.weight || orig.reps !== s.reps) {
                // Find the raw set $id
                const matchingRaw = rawSets.find(
                  (rs) => rs.exerciseId === ex.exerciseId && rs.setNumber === s.setNumber
                )
                if (matchingRaw) {
                  await updateWorkoutSet(matchingRaw.$id, {
                    weight: s.weight,
                    reps: s.reps,
                  })
                }
              }
            }
          }
        }
      }
      setIsEditing(false)
      setEditData([])
      await loadSets() // Reload from Appwrite
      Alert.alert('Saved', 'Workout updated successfully')
    } catch (err) {
      Alert.alert('Error', 'Failed to save changes')
    }
    setSaving(false)
  }

  const displayExercises = isEditing ? editData : exercises

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke={Colors.dark.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {session?.programDayName || 'Workout'}
          </Text>
          <Text style={styles.headerDate}>{workoutDate}</Text>
        </View>
        {isEditing ? (
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity onPress={cancelEditing} style={styles.headerActionBtn}>
              <Text style={styles.headerCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[styles.headerActionBtn, styles.headerSaveBtn]} disabled={saving}>
              <Text style={styles.headerSaveText}>{saving ? '...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={startEditing} style={styles.headerActionBtn}>
            <Text style={styles.headerEditText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {totalVolume > 0 ? formatVolume(totalVolume) : session?.totalVolume ? formatVolume(session.totalVolume) : '—'}
            </Text>
            <Text style={styles.statLabel}>Volume (lbs)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{durationStr}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.dark.accent }]}>
              {totalSets || '—'}
            </Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.dark.accent} size="large" />
          </View>
        ) : exercises.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptyTitle}>No exercise data</Text>
            <Text style={styles.emptySubtitle}>
              Set data was not recorded for this workout session.
            </Text>
          </View>
        ) : (
          <View style={styles.exercisesSection}>
            <Text style={styles.sectionTitle}>EXERCISES</Text>
            {displayExercises.map((ex, i) => {
              const mg = guessMuscleGroup(ex.exerciseName)
              const color = MUSCLE_GROUP_COLORS[mg] || Colors.dark.accent
              const exVolume = ex.sets.reduce((a, s) => a + s.weight * s.reps, 0)
              return (
                <View key={i} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <View style={[styles.exerciseIconWrap, { backgroundColor: `${color}12` }]}>
                      <ExerciseIcon exerciseName={ex.exerciseName} size={36} color={color} />
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                      <Text style={styles.exerciseMeta}>
                        {ex.sets.length} sets · {formatVolume(exVolume)} lbs
                      </Text>
                    </View>
                  </View>
                  <View style={styles.setsTable}>
                    <View style={styles.setsHeaderRow}>
                      <Text style={[styles.setsHeaderCell, { flex: 0.5 }]}>SET</Text>
                      <Text style={styles.setsHeaderCell}>WEIGHT</Text>
                      <Text style={styles.setsHeaderCell}>REPS</Text>
                    </View>
                    {ex.sets.map((s, si) => (
                      <View key={si} style={styles.setRow}>
                        <Text style={[styles.setCell, { flex: 0.5 }]}>{s.setNumber}</Text>
                        {isEditing ? (
                          <TextInput
                            style={styles.editInput}
                            value={String(s.weight)}
                            onChangeText={(v) => handleEditSet(i, si, 'weight', v)}
                            keyboardType="numeric"
                            selectTextOnFocus
                          />
                        ) : (
                          <Text style={styles.setCell}>{s.weight} lbs</Text>
                        )}
                        {isEditing ? (
                          <TextInput
                            style={styles.editInput}
                            value={String(s.reps)}
                            onChangeText={(v) => handleEditSet(i, si, 'reps', v)}
                            keyboardType="numeric"
                            selectTextOnFocus
                          />
                        ) : (
                          <Text style={styles.setCell}>{s.reps}</Text>
                        )}
                      </View>
                    ))}
                    {isEditing && (
                      <TouchableOpacity onPress={() => handleAddSet(i)} style={styles.addSetBtn}>
                        <Text style={styles.addSetText}>+ Add Set</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.dark.text,
  },
  headerDate: {
    fontSize: FontSize.base, color: Colors.dark.textSecondary, marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.xl,
    marginVertical: Spacing.xl,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  statValue: {
    fontSize: FontSize.title, fontWeight: FontWeight.extrabold, color: Colors.dark.text,
  },
  statLabel: {
    fontSize: FontSize.sm, color: Colors.dark.textMuted, marginTop: 4,
  },
  loadingContainer: {
    paddingVertical: Spacing.xxxxl, alignItems: 'center',
  },
  emptySection: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxxxl, alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.dark.text, marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.lg, color: Colors.dark.textSecondary, textAlign: 'center',
  },
  exercisesSection: {
    paddingHorizontal: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.dark.textMuted,
    letterSpacing: 1.5, marginBottom: Spacing.md,
  },
  exerciseCard: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.dark.border,
    padding: Spacing.xl, marginBottom: Spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.lg,
  },
  exerciseIconWrap: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  exerciseInfo: { flex: 1 },
  exerciseName: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.dark.text,
  },
  exerciseMeta: {
    fontSize: FontSize.base, color: Colors.dark.textSecondary, marginTop: 2,
  },
  setsTable: {
    borderTopWidth: 1, borderTopColor: Colors.dark.border, paddingTop: Spacing.md,
  },
  setsHeaderRow: {
    flexDirection: 'row', marginBottom: Spacing.sm,
  },
  setsHeaderCell: {
    flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.bold,
    color: Colors.dark.textMuted, letterSpacing: 1,
  },
  setRow: {
    flexDirection: 'row', paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  setCell: {
    flex: 1, fontSize: FontSize.xl, color: Colors.dark.text,
  },
  headerActionBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill, backgroundColor: Colors.dark.surface,
  },
  headerSaveBtn: {
    backgroundColor: Colors.dark.accent,
  },
  headerEditText: {
    color: Colors.dark.accent, fontSize: FontSize.base, fontWeight: FontWeight.bold,
  },
  headerCancelText: {
    color: Colors.dark.textSecondary, fontSize: FontSize.base, fontWeight: FontWeight.semibold,
  },
  headerSaveText: {
    color: Colors.dark.textOnAccent, fontSize: FontSize.base, fontWeight: FontWeight.bold,
  },
  editInput: {
    flex: 1, fontSize: FontSize.xl, color: Colors.dark.accent, fontWeight: FontWeight.bold,
    textAlign: 'center', backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.sm, paddingVertical: 4, marginHorizontal: 2,
  },
  addSetBtn: {
    marginTop: Spacing.md, paddingVertical: Spacing.md,
    alignItems: 'center', borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.dark.border, borderStyle: 'dashed',
  },
  addSetText: {
    color: Colors.dark.accent, fontSize: FontSize.base, fontWeight: FontWeight.semibold,
  },
})
