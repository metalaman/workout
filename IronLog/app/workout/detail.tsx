import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { ExerciseIcon, MUSCLE_GROUP_COLORS } from '@/components/exercise-icon'
import { useSessionStore } from '@/stores/session-store'
import { formatVolume, formatDuration } from '@/lib/utils'
import Svg, { Path } from 'react-native-svg'

function guessMuscleGroup(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('bench') || n.includes('chest') || n.includes('fly') || n.includes('dip') || n.includes('push')) return 'Chest'
  if (n.includes('squat') || n.includes('leg') || n.includes('lunge') || n.includes('calf') || n.includes('deadlift') || n.includes('hip')) return 'Legs'
  if (n.includes('row') || n.includes('pull') || n.includes('lat') || n.includes('back') || n.includes('chin')) return 'Back'
  if (n.includes('shoulder') || n.includes('press') || n.includes('ohp') || n.includes('lateral') || n.includes('raise') || n.includes('delt')) return 'Shoulders'
  if (n.includes('curl') || n.includes('bicep') || n.includes('tricep') || n.includes('extension') || n.includes('skull') || n.includes('hammer') || n.includes('pushdown')) return 'Arms'
  if (n.includes('plank') || n.includes('crunch') || n.includes('ab') || n.includes('core')) return 'Core'
  return 'Chest'
}

interface SetData {
  weight: number
  reps: number
  setNumber: number
}

interface ExerciseData {
  exerciseName: string
  exerciseId: string
  sets: SetData[]
}

export default function WorkoutDetailScreen() {
  const router = useRouter()
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const { allSessions, recentSessions } = useSessionStore()

  // Find session from store
  const session = [...allSessions, ...recentSessions].find((s) => s.$id === sessionId)

  // Parse exercises from session sets (grouped by exerciseId)
  const [exercises, setExercises] = useState<ExerciseData[]>([])

  useEffect(() => {
    // For now, use session metadata. In a real app we'd load sets from Appwrite.
    // Show what we have from the session record.
  }, [sessionId])

  const workoutDate = session?.completedAt
    ? new Date(session.completedAt).toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric',
      })
    : session?.startedAt
    ? new Date(session.startedAt).toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric',
      })
    : 'Unknown date'

  const durationStr = session?.duration
    ? formatDuration(session.duration)
    : '—'

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
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
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {session?.totalVolume ? formatVolume(session.totalVolume) : '—'}
            </Text>
            <Text style={styles.statLabel}>Volume (lbs)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{durationStr}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.dark.accent }]}>
              {session?.notes || '0'}
            </Text>
            <Text style={styles.statLabel}>PRs</Text>
          </View>
        </View>

        {/* If we don't have exercise data, show a summary view */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>WORKOUT SUMMARY</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              {session?.programDayName || 'Workout'} completed on {workoutDate}
            </Text>
            {session?.totalVolume ? (
              <Text style={styles.infoSubText}>
                Total volume: {formatVolume(session.totalVolume)} lbs
              </Text>
            ) : null}
            {session?.duration ? (
              <Text style={styles.infoSubText}>
                Duration: {formatDuration(session.duration)}
              </Text>
            ) : null}
          </View>
        </View>

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
  infoSection: { paddingHorizontal: Spacing.xl, marginTop: Spacing.md },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.dark.textMuted,
    letterSpacing: 1.5, marginBottom: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.dark.border,
  },
  infoText: {
    fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  infoSubText: {
    fontSize: FontSize.lg, color: Colors.dark.textSecondary, marginTop: Spacing.xs,
  },
})
