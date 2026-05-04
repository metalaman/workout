/**
 * Workout History Timeline
 *
 * Reverse-chronological list of all completed workouts with volume summaries.
 * Accessible from the home screen. Tap to expand per-exercise detail.
 *
 * @module app/workout/history
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { useAuthStore } from '@/stores/auth-store'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { formatVolume, guessMuscleGroup } from '@/lib/utils'
import { ExerciseIcon, MUSCLE_GROUP_COLORS } from '@/components/exercise-icon'
import * as db from '@/lib/database'
import type { WorkoutSession, WorkoutSet } from '@/types'

interface SessionWithSets extends WorkoutSession {
  sets?: WorkoutSet[]
}

function formatHistoryDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' })

  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

/** Group sessions by month for section headers */
function groupByMonth(sessions: WorkoutSession[]): { month: string; sessions: WorkoutSession[] }[] {
  const groups = new Map<string, WorkoutSession[]>()

  for (const s of sessions) {
    const d = new Date(s.completedAt ?? s.startedAt)
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const existing = groups.get(key) ?? []
    existing.push(s)
    groups.set(key, existing)
  }

  return Array.from(groups.entries()).map(([month, sessions]) => ({ month, sessions }))
}

export default function HistoryScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [sessions, setSessions] = useState<SessionWithSets[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingSets, setLoadingSets] = useState<string | null>(null)

  const loadSessions = useCallback(async (showRefresh = false) => {
    if (!user?.$id) return
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const data = await db.listWorkoutSessions(user.$id, 100)
      // Only show completed sessions
      const completed = data.filter((s) => s.completedAt)
      setSessions(completed)
    } catch {
      // Keep existing data
    }
    setLoading(false)
    setRefreshing(false)
  }, [user?.$id])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const toggleExpand = async (sessionId: string) => {
    if (expandedId === sessionId) {
      setExpandedId(null)
      return
    }

    setExpandedId(sessionId)

    // Load sets for this session if not already loaded
    const session = sessions.find((s) => s.$id === sessionId)
    if (session && !session.sets) {
      setLoadingSets(sessionId)
      try {
        const sets = await db.listWorkoutSets(sessionId)
        setSessions((prev) =>
          prev.map((s) => (s.$id === sessionId ? { ...s, sets } : s))
        )
      } catch {
        // Keep session without sets
      }
      setLoadingSets(null)
    }
  }

  const monthGroups = useMemo(() => groupByMonth(sessions), [sessions])

  // Aggregate stats
  const stats = useMemo(() => {
    const totalVolume = sessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0)
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    const thisWeekStart = new Date()
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
    thisWeekStart.setHours(0, 0, 0, 0)
    const thisWeek = sessions.filter(
      (s) => new Date(s.completedAt ?? s.startedAt) >= thisWeekStart
    ).length
    return { total: sessions.length, totalVolume, totalDuration, thisWeek }
  }, [sessions])

  /** Group sets by exercise for expanded view */
  const getExerciseSummary = (sets: WorkoutSet[]) => {
    const exercises = new Map<string, { name: string; sets: { weight: number; reps: number }[] }>()
    for (const s of sets) {
      if (!s.isCompleted) continue
      const existing = exercises.get(s.exerciseId)
      if (existing) {
        existing.sets.push({ weight: s.weight, reps: s.reps })
      } else {
        exercises.set(s.exerciseId, {
          name: s.exerciseName ?? s.exerciseId,
          sets: [{ weight: s.weight, reps: s.reps }],
        })
      }
    }
    return Array.from(exercises.values())
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.dark.accent} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke={Colors.dark.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.thisWeek}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatVolume(stats.totalVolume)}</Text>
          <Text style={styles.statLabel}>Total lbs</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatDuration(stats.totalDuration)}</Text>
          <Text style={styles.statLabel}>Total Time</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSessions(true)}
            tintColor={Colors.dark.accent}
          />
        }
      >
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptySubtitle}>Complete your first workout to see it here</Text>
          </View>
        ) : (
          monthGroups.map((group) => (
            <View key={group.month} style={styles.monthGroup}>
              <Text style={styles.monthLabel}>{group.month.toUpperCase()}</Text>

              {group.sessions.map((session) => {
                const isExpanded = expandedId === session.$id
                const setsLoading = loadingSets === session.$id
                const sessionSets = (session as SessionWithSets).sets

                return (
                  <TouchableOpacity
                    key={session.$id}
                    style={[styles.sessionCard, isExpanded && styles.sessionCardExpanded]}
                    onPress={() => toggleExpand(session.$id)}
                    activeOpacity={0.7}
                  >
                    {/* Timeline dot + line */}
                    <View style={styles.timelineDot} />

                    {/* Session info */}
                    <View style={styles.sessionContent}>
                      <View style={styles.sessionHeader}>
                        <View style={styles.sessionHeaderLeft}>
                          <Text style={styles.sessionName}>{session.programDayName || 'Workout'}</Text>
                          <Text style={styles.sessionDate}>{formatHistoryDate(session.completedAt ?? session.startedAt)}</Text>
                        </View>
                        <View style={styles.sessionHeaderRight}>
                          {session.totalVolume > 0 && (
                            <Text style={styles.sessionVolume}>{formatVolume(session.totalVolume)} lbs</Text>
                          )}
                          {session.duration > 0 && (
                            <Text style={styles.sessionDuration}>{formatDuration(session.duration)}</Text>
                          )}
                        </View>
                      </View>

                      {/* Expanded: per-exercise detail */}
                      {isExpanded && (
                        <View style={styles.expandedContent}>
                          {setsLoading ? (
                            <ActivityIndicator color={Colors.dark.accent} size="small" style={{ paddingVertical: Spacing.lg }} />
                          ) : sessionSets && sessionSets.length > 0 ? (
                            getExerciseSummary(sessionSets).map((exercise, idx) => {
                              const mg = guessMuscleGroup(exercise.name)
                              const c = MUSCLE_GROUP_COLORS[mg] || Colors.dark.accent
                              const exVolume = exercise.sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
                              return (
                                <View key={idx} style={styles.exerciseRow}>
                                  <View style={[styles.exerciseIcon, { backgroundColor: `${c}12` }]}>
                                    <ExerciseIcon exerciseName={exercise.name} size={18} color={c} />
                                  </View>
                                  <View style={styles.exerciseInfo}>
                                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                                    <Text style={styles.exerciseSets}>
                                      {exercise.sets.map((s) => `${s.weight}×${s.reps}`).join('  ')}
                                    </Text>
                                  </View>
                                  <Text style={[styles.exerciseVolume, { color: c }]}>
                                    {formatVolume(exVolume)}
                                  </Text>
                                </View>
                              )
                            })
                          ) : (
                            <Text style={styles.noSetsText}>Set details not available</Text>
                          )}

                          {session.notes ? (
                            <View style={styles.notesRow}>
                              <Text style={styles.notesIcon}>📝</Text>
                              <Text style={styles.notesText} numberOfLines={2}>{session.notes}</Text>
                            </View>
                          ) : null}
                        </View>
                      )}
                    </View>

                    {/* Expand indicator */}
                    <Svg
                      width={14} height={14} viewBox="0 0 24 24" fill="none"
                      style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }], marginTop: 4 }}
                    >
                      <Path d="M6 9l6 6 6-6" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </TouchableOpacity>
                )
              })}
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
  },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: 2,
  },

  scroll: { flex: 1 },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: Spacing.md,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
  },
  emptySubtitle: {
    fontSize: FontSize.base,
    color: Colors.dark.textMuted,
  },

  // Month groups
  monthGroup: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  monthLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.dark.textMuted,
    letterSpacing: 1.5,
    marginBottom: Spacing.lg,
  },

  // Session cards
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  sessionCardExpanded: {
    borderColor: Colors.dark.accentBorder,
  },

  // Timeline dot
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.accent,
    marginTop: 6,
  },

  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionHeaderLeft: {
    flex: 1,
  },
  sessionHeaderRight: {
    alignItems: 'flex-end',
  },
  sessionName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
  },
  sessionDate: {
    fontSize: FontSize.sm,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  sessionVolume: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.accent,
  },
  sessionDuration: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },

  // Expanded content
  expandedContent: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    gap: Spacing.md,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  exerciseIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.textSecondary,
  },
  exerciseSets: {
    fontSize: FontSize.sm,
    color: Colors.dark.textMuted,
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  exerciseVolume: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  noSetsText: {
    fontSize: FontSize.sm,
    color: Colors.dark.textDark,
    fontStyle: 'italic',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  notesIcon: {
    fontSize: FontSize.sm,
  },
  notesText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    fontStyle: 'italic',
  },
})
