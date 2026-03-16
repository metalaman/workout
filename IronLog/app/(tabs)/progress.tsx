import { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth-store'
import { useSessionStore } from '@/stores/session-store'
import { calculate1RM, formatVolume } from '@/lib/utils'
import { SEED_EXERCISES } from '@/constants/exercises'
import { getExerciseHistory } from '@/lib/database'
import type { WorkoutSet } from '@/types'

const TRACKED_EXERCISES = ['Bench Press', 'Barbell Squat', 'Deadlift', 'Overhead Press']

export default function ProgressScreen() {
  const { user } = useAuthStore()
  const { allSessions, personalRecords, isLoading, loadAll, loadPRs } = useSessionStore()
  const [selectedExercise, setSelectedExercise] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [exerciseHistory, setExerciseHistory] = useState<WorkoutSet[]>([])

  useEffect(() => {
    if (user?.$id) {
      loadAll(user.$id)
      loadPRs(user.$id)
    }
  }, [user?.$id])

  // Load exercise history when selection changes
  useEffect(() => {
    if (user?.$id) {
      const exerciseName = TRACKED_EXERCISES[selectedExercise]
      const exId = exerciseName.toLowerCase().replace(/\s+/g, '-')
      getExerciseHistory(user.$id, exId, 50)
        .then(setExerciseHistory)
        .catch(() => setExerciseHistory([]))
    }
  }, [user?.$id, selectedExercise])

  // Compute 1RM chart data from exercise history (group by week)
  const chartData = useMemo(() => {
    if (exerciseHistory.length === 0) {
      // Fallback: generate from PR data or defaults
      const exerciseName = TRACKED_EXERCISES[selectedExercise]
      const pr = personalRecords.find((p) => p.exerciseName === exerciseName)
      if (pr) {
        return [{ label: 'PR', value: pr.estimated1RM }]
      }
      return []
    }

    // Group sets by week and find max 1RM per week
    const weekMap = new Map<string, number>()
    for (const s of exerciseHistory) {
      if (!s.isCompleted || s.weight <= 0) continue
      const date = new Date((s as any).$createdAt ?? Date.now())
      const weekStart = new Date(date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const key = weekStart.toISOString().split('T')[0]
      const est = calculate1RM(s.weight, s.reps)
      weekMap.set(key, Math.max(weekMap.get(key) ?? 0, est))
    }

    const sorted = Array.from(weekMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    return sorted.slice(-8).map(([date, value], i) => ({
      label: `W${i + 1}`,
      value,
    }))
  }, [exerciseHistory, personalRecords, selectedExercise])

  const maxChartValue = Math.max(...chartData.map((d) => d.value), 100)
  const current1RM = chartData.length > 0 ? chartData[chartData.length - 1].value : 0
  const first1RM = chartData.length > 0 ? chartData[0].value : 0
  const improvementPct = first1RM > 0 ? Math.round(((current1RM - first1RM) / first1RM) * 100) : 0

  // Compute weekly volume from sessions
  const weeklyVolume = useMemo(() => {
    const weekMap = new Map<string, number>()
    for (const session of allSessions) {
      if (!session.completedAt) continue
      const date = new Date(session.completedAt)
      const weekStart = new Date(date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const key = weekStart.toISOString().split('T')[0]
      weekMap.set(key, (weekMap.get(key) ?? 0) + (session.totalVolume || 0))
    }
    const sorted = Array.from(weekMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    return sorted.slice(-8).map(([, vol]) => vol)
  }, [allSessions])

  const maxVolume = Math.max(...weeklyVolume, 1)
  const latestVolume = weeklyVolume.length > 0 ? weeklyVolume[weeklyVolume.length - 1] : 0

  // Top PRs
  const topPRs = personalRecords.slice(0, 3)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
        </View>

        {/* Exercise selector */}
        <View style={styles.selectorContainer}>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.selectorText}>{TRACKED_EXERCISES[selectedExercise]}</Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>
          {showDropdown && (
            <View style={styles.dropdown}>
              {TRACKED_EXERCISES.map((ex, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.dropdownItem}
                  onPress={() => { setSelectedExercise(i); setShowDropdown(false) }}
                >
                  <Text style={[styles.dropdownText, i === selectedExercise && styles.dropdownTextActive]}>
                    {ex}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 1RM Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartLabel}>1RM ESTIMATE</Text>
              <Text style={styles.chartValue}>
                {current1RM > 0 ? `${current1RM} lbs` : '—'}
              </Text>
            </View>
            {chartData.length > 0 ? (
              <>
                <View style={styles.barChart}>
                  {chartData.map((d, i) => (
                    <View key={i} style={styles.barColumn}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${(d.value / maxChartValue) * 100}%`,
                            backgroundColor: i === chartData.length - 1
                              ? Colors.dark.accent
                              : 'rgba(232,255,71,0.2)',
                          },
                        ]}
                      />
                      <Text style={styles.barLabel}>{d.label}</Text>
                    </View>
                  ))}
                </View>
                {improvementPct !== 0 && (
                  <View style={styles.improvementRow}>
                    <Text style={[styles.improvementUp, improvementPct < 0 && { color: Colors.dark.danger }]}>
                      {improvementPct > 0 ? '↑' : '↓'} {Math.abs(improvementPct)}%
                    </Text>
                    <Text style={styles.improvementText}>in {chartData.length} weeks</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>
                  Complete workouts to see your progress
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Volume chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartLabel}>WEEKLY VOLUME</Text>
              <Text style={styles.volumeValue}>
                {latestVolume > 0 ? `${formatVolume(latestVolume)} lbs` : '—'}
              </Text>
            </View>
            {weeklyVolume.length > 0 ? (
              <View style={styles.volumeChart}>
                {weeklyVolume.map((v, i) => (
                  <View
                    key={i}
                    style={[
                      styles.volumeBar,
                      {
                        height: `${(v / maxVolume) * 100}%`,
                        backgroundColor: `rgba(71, 180, 255, ${0.2 + i * 0.1})`,
                        minHeight: 4,
                      },
                    ]}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>
                  No volume data yet
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* PRs */}
        <View style={styles.prSection}>
          <Text style={styles.sectionTitle}>PERSONAL RECORDS</Text>
          {topPRs.length > 0 ? (
            <View style={styles.prRow}>
              {topPRs.map((p) => (
                <View key={p.$id} style={styles.prCard}>
                  <Text style={styles.prValue}>{p.weight} lbs</Text>
                  <Text style={styles.prReps}>{p.reps === 1 ? '1RM' : `${p.reps}RM`}</Text>
                  <Text style={styles.prLift}>
                    {p.exerciseName.length > 8 ? p.exerciseName.substring(0, 8) + '…' : p.exerciseName}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPR}>
              <Text style={styles.emptyChartText}>
                Complete workouts to track PRs
              </Text>
            </View>
          )}
        </View>

        {/* Recent workouts summary */}
        {allSessions.length > 0 && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>OVERVIEW</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{allSessions.filter((s) => s.completedAt).length}</Text>
                <Text style={styles.statLabel}>Workouts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatVolume(allSessions.reduce((a, s) => a + (s.totalVolume || 0), 0))}
                </Text>
                <Text style={styles.statLabel}>Total lbs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{personalRecords.length}</Text>
                <Text style={styles.statLabel}>PRs Set</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  title: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
  },
  selectorContainer: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.lg,
    zIndex: 10,
  },
  selector: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  selectorArrow: {
    color: Colors.dark.textMuted,
  },
  dropdown: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  dropdownText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.lg,
  },
  dropdownTextActive: {
    color: Colors.dark.accent,
    fontWeight: FontWeight.semibold,
  },
  chartContainer: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md + 2,
  },
  chartLabel: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  chartValue: {
    color: Colors.dark.accent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    height: 100,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 8,
  },
  barLabel: {
    fontSize: 7,
    color: Colors.dark.textMuted,
  },
  improvementRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  improvementUp: {
    color: Colors.dark.accentGreen,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  improvementText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
  },
  volumeValue: {
    color: Colors.dark.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  volumeChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 60,
  },
  volumeBar: {
    flex: 1,
    borderRadius: 3,
  },
  emptyChart: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.md,
  },
  prSection: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  prRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  prCard: {
    flex: 1,
    backgroundColor: Colors.dark.accentSurface,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
  },
  prValue: {
    color: Colors.dark.accent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
  },
  prReps: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 1,
  },
  prLift: {
    color: Colors.dark.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  emptyPR: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  statsSection: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxxxl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    color: Colors.dark.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
  },
  statLabel: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
})
