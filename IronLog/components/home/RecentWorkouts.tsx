import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useRouter, Href } from 'expo-router'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { getRelativeTime, formatVolume } from '@/lib/utils'
import { ExerciseIcon } from '@/components/exercise-icon'
import type { ProgramDay, Program } from '@/types'

interface WorkoutSession {
  $id?: string
  programDayName: string
  completedAt?: string
  totalVolume: number
}

interface Props {
  recentSessions: WorkoutSession[]
  days: ProgramDay[]
  currentProgram?: Program | null
  onWorkoutPress: (sessionId?: string) => void
  onProgramPress: () => void
}

export const RecentWorkouts = React.memo(({ recentSessions, days, currentProgram, onWorkoutPress, onProgramPress }: Props) => {
  const router = useRouter()

  return (
    <View style={styles.section}>
      <TouchableOpacity onPress={() => router.push('/(tabs)/progress' as Href)} activeOpacity={0.7}>
        <Text style={styles.sectionTitle}>RECENT</Text>
      </TouchableOpacity>
      {recentSessions.length > 0 ? (
        recentSessions.map((s, i) => (
          <TouchableOpacity
            key={i}
            style={styles.card}
            onPress={() => onWorkoutPress(s.$id)}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.name}>{s.programDayName}</Text>
              <Text style={styles.date}>
                {s.completedAt ? getRelativeTime(s.completedAt) : 'In progress'}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.volume}>
                {s.totalVolume > 0 ? `${formatVolume(s.totalVolume)} lbs` : '—'}
              </Text>
              <ChevronRight />
            </View>
          </TouchableOpacity>
        ))
      ) : days.length > 0 ? (
        days.slice(0, 3).map((d, i) => (
          <TouchableOpacity
            key={i}
            style={styles.card}
            onPress={onProgramPress}
            activeOpacity={0.7}
          >
            <View style={styles.dayRow}>
              <ExerciseIcon
                exerciseName={d.exercises[0]?.exerciseId}
                size={36}
                color={currentProgram?.color || Colors.dark.accent}
              />
              <View>
                <Text style={styles.name}>{d.name}</Text>
                <Text style={styles.date}>{d.exercises.length} exercises</Text>
              </View>
            </View>
            <ChevronRight />
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.card}>
          <Text style={styles.date}>No workouts yet — create a program to get started!</Text>
        </View>
      )}
    </View>
  )
})

const ChevronRight = React.memo(() => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
))

const styles = StyleSheet.create({
  section: { paddingHorizontal: Spacing.xxl, flex: 1 },
  sectionTitle: {
    color: Colors.dark.textSecondary, fontSize: FontSize.base,
    fontWeight: FontWeight.bold, letterSpacing: 1.5, marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, paddingVertical: Spacing.xl + 4, marginBottom: Spacing.sm,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderLeftWidth: 3, borderLeftColor: Colors.dark.accent,
  },
  name: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  date: { color: Colors.dark.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  volume: { color: Colors.dark.accent, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
})
