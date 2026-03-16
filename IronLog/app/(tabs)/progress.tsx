import { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth-store'
import { useSessionStore } from '@/stores/session-store'
import { calculate1RM, formatVolume } from '@/lib/utils'
import { SEED_EXERCISES } from '@/constants/exercises'
import { ExerciseIcon, MUSCLE_GROUP_COLORS } from '@/components/exercise-icon'
import { getExerciseHistory } from '@/lib/database'
import type { WorkoutSet } from '@/types'

const ALL_EXERCISES = SEED_EXERCISES.map((e) => e.name)
const TOP_EXERCISES = ['Bench Press', 'Barbell Squat', 'Deadlift', 'Overhead Press', 'Barbell Row']

export default function ProgressScreen() {
  const { user } = useAuthStore()
  const { allSessions, personalRecords, isLoading, loadAll, loadPRs } = useSessionStore()
  const [selectedExercise, setSelectedExercise] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [exerciseHistory, setExerciseHistory] = useState<WorkoutSet[]>([])
  const [showAllExercises, setShowAllExercises] = useState(false)

  const exerciseList = showAllExercises ? ALL_EXERCISES : TOP_EXERCISES

  useEffect(() => {
    if (user?.$id) {
      loadAll(user.$id)
      loadPRs(user.$id)
    }
  }, [user?.$id])

  useEffect(() => {
    if (user?.$id) {
      const exerciseName = exerciseList[selectedExercise] ?? exerciseList[0]
      const exId = exerciseName.toLowerCase().replace(/\s+/g, '-')
      getExerciseHistory(user.$id, exId, 50)
        .then(setExerciseHistory)
        .catch(() => setExerciseHistory([]))
    }
  }, [user?.$id, selectedExercise, showAllExercises])

  // Compute 1RM chart data
  const chartData = useMemo(() => {
    if (exerciseHistory.length === 0) {
      const exerciseName = exerciseList[selectedExercise] ?? exerciseList[0]
      const pr = personalRecords.find((p) => p.exerciseName === exerciseName)
      if (pr) return [{ label: 'PR', value: pr.estimated1RM }]
      return []
    }

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
    return sorted.slice(-8).map(([, value], i) => ({ label: `W${i + 1}`, value }))
  }, [exerciseHistory, personalRecords, selectedExercise, showAllExercises])

  const maxChartValue = Math.max(...chartData.map((d) => d.value), 100)
  const current1RM = chartData.length > 0 ? chartData[chartData.length - 1].value : 0
  const first1RM = chartData.length > 0 ? chartData[0].value : 0
  const improvementPct = first1RM > 0 ? Math.round(((current1RM - first1RM) / first1RM) * 100) : 0

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

  // All PRs with 1RM
  const allPRs = personalRecords.map((pr) => ({
    ...pr,
    est1RM: pr.estimated1RM || calculate1RM(pr.weight, pr.reps),
  })).sort((a, b) => b.est1RM - a.est1RM)

  // Selected exercise PR
  const selectedName = exerciseList[selectedExercise] ?? exerciseList[0]
  const selectedPR = personalRecords.find((p) => p.exerciseName === selectedName)
  const selectedMG = SEED_EXERCISES.find((e) => e.name === selectedName)?.muscleGroup ?? 'Chest'
  const mgColor = MUSCLE_GROUP_COLORS[selectedMG] || Colors.dark.accent

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
        </View>

        {/* Exercise selector */}
        <View style={styles.selectorContainer}>
          <TouchableOpacity
            style={[styles.selector, { borderColor: mgColor }]}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <View style={styles.selectorLeft}>
              <ExerciseIcon exerciseName={selectedName} size={24} color={mgColor} />
              <Text style={styles.selectorText}>{selectedName}</Text>
            </View>
            <Text style={styles.selectorArrow}>{showDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showDropdown && (
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.dropdownToggle}
                onPress={() => { setShowAllExercises(!showAllExercises); setSelectedExercise(0) }}
              >
                <Text style={styles.dropdownToggleText}>
                  {showAllExercises ? 'Show Top Lifts' : 'Show All Exercises'}
                </Text>
              </TouchableOpacity>
              <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled>
                {exerciseList.map((ex, i) => (
                  <TouchableOpacity
                    key={ex}
                    style={styles.dropdownItem}
                    onPress={() => { setSelectedExercise(i); setShowDropdown(false) }}
                  >
                    <Text style={[styles.dropdownText, i === selectedExercise && styles.dropdownTextActive]}>
                      {ex}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* 1RM Hero Card */}
        <View style={styles.heroCard}>
          <View style={[styles.heroBorder, { backgroundColor: mgColor }]} />
          <View style={styles.heroContent}>
            <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>ESTIMATED 1RM</Text>
              {selectedPR && (
                <View style={[styles.prBadge, { backgroundColor: `${mgColor}20` }]}>
                  <Text style={[styles.prBadgeText, { color: mgColor }]}>PR</Text>
                </View>
              )}
            </View>
            <Text style={[styles.heroValue, { color: current1RM > 0 ? mgColor : Colors.dark.textMuted }]}>
              {current1RM > 0 ? `${current1RM}` : '—'}
              {current1RM > 0 && <Text style={styles.heroUnit}> lbs</Text>}
            </Text>
            {selectedPR && (
              <View style={styles.heroDetails}>
                <Text style={styles.heroDetailText}>
                  Best: {selectedPR.weight} lbs × {selectedPR.reps} reps
                </Text>
                {selectedPR.achievedAt && (
                  <Text style={styles.heroDetailDate}>
                    {new Date(selectedPR.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* 1RM Trend Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartLabel}>1RM TREND</Text>
              {improvementPct !== 0 && (
                <View style={[styles.improvBadge, { backgroundColor: improvementPct > 0 ? 'rgba(127,255,0,0.1)' : 'rgba(255,107,107,0.1)' }]}>
                  <Text style={[styles.improvText, { color: improvementPct > 0 ? Colors.dark.accentGreen : Colors.dark.danger }]}>
                    {improvementPct > 0 ? '↑' : '↓'} {Math.abs(improvementPct)}%
                  </Text>
                </View>
              )}
            </View>
            {chartData.length > 0 ? (
              <View style={styles.barChart}>
                {chartData.map((d, i) => (
                  <View key={i} style={styles.barColumn}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${(d.value / maxChartValue) * 100}%`,
                          backgroundColor: i === chartData.length - 1 ? mgColor : `${mgColor}33`,
                        },
                      ]}
                    />
                    <Text style={styles.barValue}>{d.value}</Text>
                    <Text style={styles.barLabel}>{d.label}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>Complete workouts to see trends</Text>
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
                <Text style={styles.emptyChartText}>No volume data yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* All PRs list */}
        <View style={styles.prSection}>
          <Text style={styles.sectionTitle}>PERSONAL RECORDS</Text>
          {allPRs.length > 0 ? (
            allPRs.slice(0, 8).map((pr) => {
              const mg = SEED_EXERCISES.find((e) => e.name === pr.exerciseName)?.muscleGroup ?? 'Chest'
              const c = MUSCLE_GROUP_COLORS[mg] || Colors.dark.accent
              return (
                <View key={pr.$id} style={styles.prRow}>
                  <View style={[styles.prIcon, { backgroundColor: `${c}15` }]}>
                    <ExerciseIcon exerciseName={pr.exerciseName} size={22} color={c} />
                  </View>
                  <View style={styles.prInfo}>
                    <Text style={styles.prName} numberOfLines={1}>{pr.exerciseName}</Text>
                    <Text style={styles.prDetail}>{pr.weight} lbs × {pr.reps}</Text>
                  </View>
                  <View style={styles.pr1rmWrap}>
                    <Text style={[styles.pr1rm, { color: c }]}>{pr.est1RM}</Text>
                    <Text style={styles.pr1rmLabel}>1RM</Text>
                  </View>
                </View>
              )
            })
          ) : (
            <View style={styles.emptyPR}>
              <Text style={styles.emptyChartText}>Complete workouts to track PRs</Text>
            </View>
          )}
        </View>

        {/* Overview stats */}
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

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.md },
  title: { color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.bold },

  // Selector
  selectorContainer: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.lg, zIndex: 10 },
  selector: {
    backgroundColor: Colors.dark.surfaceLight, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md + 2,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  selectorLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  selectorText: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  selectorArrow: { color: Colors.dark.textMuted },
  dropdown: {
    backgroundColor: Colors.dark.surfaceLight, borderRadius: BorderRadius.lg,
    marginTop: Spacing.xs, overflow: 'hidden',
  },
  dropdownToggle: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
    backgroundColor: Colors.dark.accentSurface,
  },
  dropdownToggleText: { color: Colors.dark.accent, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  dropdownItem: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md + 2,
    borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  dropdownText: { color: Colors.dark.textSecondary, fontSize: FontSize.lg },
  dropdownTextActive: { color: Colors.dark.accent, fontWeight: FontWeight.semibold },

  // Hero 1RM card
  heroCard: {
    marginHorizontal: Spacing.xxl, marginBottom: Spacing.lg,
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.xxl,
    overflow: 'hidden', flexDirection: 'row',
  },
  heroBorder: { width: 4 },
  heroContent: { flex: 1, padding: Spacing.xl },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  heroLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.dark.textMuted, letterSpacing: 1 },
  prBadge: { paddingHorizontal: Spacing.md, paddingVertical: 2, borderRadius: BorderRadius.full },
  prBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold },
  heroValue: { fontSize: 42, fontWeight: FontWeight.black },
  heroUnit: { fontSize: FontSize.xxl, fontWeight: FontWeight.semibold },
  heroDetails: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  heroDetailText: { fontSize: FontSize.base, color: Colors.dark.textSecondary },
  heroDetailDate: { fontSize: FontSize.base, color: Colors.dark.textMuted },

  // Chart
  chartContainer: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.lg },
  chartCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: BorderRadius.xxl, padding: Spacing.xl },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md + 2 },
  chartLabel: { color: Colors.dark.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.bold, letterSpacing: 1 },
  improvBadge: { paddingHorizontal: Spacing.md, paddingVertical: 2, borderRadius: BorderRadius.full },
  improvText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.xs, height: 100 },
  barColumn: { flex: 1, alignItems: 'center', gap: 2, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 8 },
  barValue: { fontSize: 7, color: Colors.dark.textSecondary, fontWeight: FontWeight.semibold },
  barLabel: { fontSize: 7, color: Colors.dark.textMuted },
  volumeValue: { color: Colors.dark.text, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  volumeChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 60 },
  volumeBar: { flex: 1, borderRadius: 3 },
  emptyChart: { height: 60, justifyContent: 'center', alignItems: 'center' },
  emptyChartText: { color: Colors.dark.textMuted, fontSize: FontSize.md },

  // PRs
  prSection: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.xxl },
  sectionTitle: { color: Colors.dark.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.bold, letterSpacing: 1.5, marginBottom: Spacing.md },
  prRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  prIcon: { width: 38, height: 38, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  prInfo: { flex: 1 },
  prName: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.dark.text },
  prDetail: { fontSize: FontSize.sm, color: Colors.dark.textSecondary, marginTop: 1 },
  pr1rmWrap: { alignItems: 'flex-end' },
  pr1rm: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold },
  pr1rmLabel: { fontSize: 8, color: Colors.dark.textMuted, fontWeight: FontWeight.bold },
  emptyPR: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: BorderRadius.md, padding: Spacing.xl, alignItems: 'center' },

  // Stats
  statsSection: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.xxxxl },
  statsGrid: { flexDirection: 'row', gap: Spacing.sm },
  statItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: BorderRadius.md, paddingVertical: Spacing.lg, alignItems: 'center' },
  statValue: { color: Colors.dark.text, fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold },
  statLabel: { color: Colors.dark.textMuted, fontSize: FontSize.xs, marginTop: 2 },
})
