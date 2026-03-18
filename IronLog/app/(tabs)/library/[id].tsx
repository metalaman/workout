import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { SEED_EXERCISES } from '@/constants/exercises'
import { useAuthStore } from '@/stores/auth-store'
import { getExerciseHistory } from '@/lib/database'
import { calculate1RM, getRelativeTime } from '@/lib/utils'
import type { WorkoutSet } from '@/types'
import { ExerciseIcon } from '@/components/exercise-icon'

export default function ExerciseDetailScreen() {
  const params = useLocalSearchParams<{
    id: string; name?: string; muscleGroup?: string; equipment?: string;
    secondaryMuscles?: string; difficulty?: string; instructions?: string;
  }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const [history, setHistory] = useState<WorkoutSet[]>([])

  const isCustom = params.id === 'custom'
  const exerciseIndex = isCustom ? -1 : parseInt(params.id ?? '0', 10)

  const exercise = isCustom
    ? {
        name: params.name ?? 'Custom Exercise',
        muscleGroup: params.muscleGroup ?? 'Chest',
        equipment: params.equipment ?? 'Bodyweight',
        secondaryMuscles: (() => { try { return JSON.parse(params.secondaryMuscles ?? '[]') } catch { return [] } })(),
        difficulty: params.difficulty ?? 'Intermediate',
        icon: '⭐',
        instructions: params.instructions ?? 'Custom exercise — no instructions provided.',
      }
    : SEED_EXERCISES[exerciseIndex]

  useEffect(() => {
    if (user?.$id && exercise) {
      const exId = exercise.name.toLowerCase().replace(/\s+/g, '-')
      getExerciseHistory(user.$id, exId, 20)
        .then(setHistory)
        .catch(() => {})
    }
  }, [user?.$id, exercise])

  if (!exercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Exercise not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // Group history by session (approximate by date)
  const groupedHistory: { date: string; sets: WorkoutSet[] }[] = []
  let lastDate = ''
  for (const s of history) {
    const date = s.$id ? new Date().toISOString().slice(0, 10) : 'Unknown'
    if (date !== lastDate) {
      groupedHistory.push({ date, sets: [s] })
      lastDate = date
    } else {
      groupedHistory[groupedHistory.length - 1].sets.push(s)
    }
  }

  const best1RM = history.length > 0
    ? Math.max(...history.map((s) => calculate1RM(s.weight, s.reps)))
    : null

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Exercise Info */}
        <View style={styles.infoSection}>
          <View style={styles.iconLarge}>
            <ExerciseIcon exerciseName={exercise.name} muscleGroup={exercise.muscleGroup as any} size={40} />
          </View>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{exercise.muscleGroup}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{exercise.equipment}</Text>
            </View>
            <View style={[styles.badge, styles.difficultyBadge]}>
              <Text style={styles.badgeText}>{exercise.difficulty}</Text>
            </View>
            {isCustom && (
              <View style={[styles.badge, { backgroundColor: 'rgba(232,255,71,0.15)', borderWidth: 1, borderColor: '#e8ff47' }]}>
                <Text style={[styles.badgeText, { color: '#e8ff47' }]}>Custom</Text>
              </View>
            )}
          </View>
        </View>

        {/* Secondary muscles */}
        {exercise.secondaryMuscles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SECONDARY MUSCLES</Text>
            <View style={styles.muscleRow}>
              {exercise.secondaryMuscles.map((m, i) => (
                <View key={i} style={styles.musclePill}>
                  <Text style={styles.musclePillText}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INSTRUCTIONS</Text>
          <View style={styles.instructionCard}>
            <Text style={styles.instructionText}>{exercise.instructions}</Text>
          </View>
        </View>

        {/* Stats */}
        {best1RM && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>YOUR STATS</Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{best1RM}</Text>
                <Text style={styles.statLabel}>Est. 1RM</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{history.length}</Text>
                <Text style={styles.statLabel}>Total Sets</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {Math.max(...history.map((s) => s.weight))}
                </Text>
                <Text style={styles.statLabel}>Max Weight</Text>
              </View>
            </View>
          </View>
        )}

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HISTORY</Text>
          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>No history yet. Start lifting! 💪</Text>
            </View>
          ) : (
            history.slice(0, 15).map((s, i) => (
              <View key={i} style={styles.historyRow}>
                <Text style={styles.historySet}>Set {s.setNumber}</Text>
                <Text style={styles.historyWeight}>{s.weight} lbs</Text>
                <Text style={styles.historyReps}>× {s.reps}</Text>
                <Text style={styles.history1RM}>1RM: {calculate1RM(s.weight, s.reps)}</Text>
              </View>
            ))
          )}
        </View>

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
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  backButton: {
    color: Colors.dark.accent,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },
  iconLarge: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.dark.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  iconEmoji: {
    fontSize: 32,
  },
  exerciseName: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  badge: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  difficultyBadge: {
    backgroundColor: Colors.dark.accentSurface,
  },
  badgeText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  section: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  musclePill: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  musclePillText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.sm,
  },
  instructionCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  instructionText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.accentSurface,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    color: Colors.dark.accent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
  },
  statLabel: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  emptyHistory: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyHistoryText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.base,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    gap: Spacing.lg,
  },
  historySet: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    width: 35,
  },
  historyWeight: {
    color: Colors.dark.accent,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    flex: 1,
  },
  historyReps: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
    flex: 1,
  },
  history1RM: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
  },
})
