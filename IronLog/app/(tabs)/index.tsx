import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  Dimensions, Pressable,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Href } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { useAuthStore } from '@/stores/auth-store'
import { useProgramStore } from '@/stores/program-store'
import { useSessionStore } from '@/stores/session-store'
import { useCardioStore } from '@/stores/cardio-store'
import { useWorkoutStore } from '@/stores/workout-store'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { formatDate, getDayOfWeek, getRelativeTime, formatVolume, calculate1RM } from '@/lib/utils'
import { createWorkoutSession } from '@/lib/database'
import { ExerciseIcon, MUSCLE_GROUP_COLORS } from '@/components/exercise-icon'
import { StrengthScoreGauge, StrengthBalanceGauge } from '@/components/strength-gauges'
import type { ActiveWorkoutExercise } from '@/types'

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_W = SCREEN_W - 40
const DAYS_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

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

function getTrainingCategory(name: string): 'push' | 'pull' | 'legs' | 'core' {
  const mg = guessMuscleGroup(name)
  if (mg === 'Chest' || mg === 'Shoulders') return 'push'
  if (mg === 'Back') return 'pull'
  if (mg === 'Legs') return 'legs'
  if (mg === 'Core') return 'core'
  const n = name.toLowerCase()
  if (n.includes('curl') || n.includes('bicep')) return 'pull'
  return 'push'
}

export default function HomeScreen() {
  const { user, profile } = useAuthStore()
  const { currentProgram, days, programs, loadPrograms } = useProgramStore()
  const { recentSessions, personalRecords, allSessions, loadRecent, loadAll, loadPRs } = useSessionStore()
  const { sessions: cardioSessions, loadSessions: loadCardio } = useCardioStore()
  const { startWorkout } = useWorkoutStore()
  const router = useRouter()
  const today = getDayOfWeek()
  const displayName = profile?.displayName ?? user?.name ?? 'Athlete'
  const initial = displayName.charAt(0).toUpperCase()
  const [showActivityPicker, setShowActivityPicker] = useState(false)

  useEffect(() => {
    if (user?.$id) {
      loadPrograms(user.$id)
      loadRecent(user.$id)
      loadAll(user.$id)
      loadPRs(user.$id)
      loadCardio(user.$id)
    }
  }, [user?.$id])

  const todaysDayIndex = today < days.length ? today : 0
  const todaysDay = days[todaysDayIndex]
  const exerciseCount = todaysDay?.exercises?.length ?? 0

  // Strength Score
  const strengthScore = useMemo(() => {
    if (personalRecords.length === 0) return { score: 0, delta: 0 }
    let total = 0
    const compounds = ['bench', 'squat', 'deadlift', 'press', 'row']
    for (const pr of personalRecords) {
      const n = pr.exerciseName.toLowerCase()
      const isCompound = compounds.some((c) => n.includes(c))
      const est = pr.estimated1RM || calculate1RM(pr.weight, pr.reps)
      if (isCompound) total += est
    }
    return { score: Math.round(total), delta: 0 }
  }, [personalRecords])

  // Strength Balance
  const strengthBalance = useMemo(() => {
    const cats = { push: 0, pull: 0, legs: 0, core: 0 }
    for (const pr of personalRecords) {
      const cat = getTrainingCategory(pr.exerciseName)
      cats[cat] += pr.estimated1RM || calculate1RM(pr.weight, pr.reps)
    }
    const max = Math.max(cats.push, cats.pull, cats.legs, cats.core, 1)
    return {
      push: Math.round((cats.push / max) * 100),
      pull: Math.round((cats.pull / max) * 100),
      legs: Math.round((cats.legs / max) * 100),
      core: Math.round((cats.core / max) * 100),
    }
  }, [personalRecords])

  // Weekly calendar — with session IDs and program colors
  const weekCalendar = useMemo(() => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dayOfWeek)

    // Build map: dateKey → { sessionId, color }
    const workoutMap = new Map<string, { sessionId: string; color: string }>()
    const cardioDates = new Set<string>()

    for (const s of allSessions) {
      if (s.completedAt) {
        const d = new Date(s.completedAt)
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        // Try to find matching program color
        const matchedProg = programs.find((p) =>
          days.some((day) => day.programId === p.$id && day.name === s.programDayName)
        )
        workoutMap.set(key, { sessionId: s.$id, color: matchedProg?.color || currentProgram?.color || Colors.dark.accent })
      }
    }
    for (const c of cardioSessions) {
      const d = new Date(c.startedAt)
      cardioDates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
    }

    const calDays = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      const isToday = d.toDateString() === now.toDateString()
      const workout = workoutMap.get(key)
      const hasStrength = !!workout
      const hasCardio = cardioDates.has(key)
      calDays.push({
        date: d.getDate(), isToday, hasStrength, hasCardio,
        isPast: d < now && !isToday,
        sessionId: workout?.sessionId,
        color: workout?.color || Colors.dark.accent,
      })
    }
    return calDays
  }, [allSessions, cardioSessions])

  const completedThisWeek = weekCalendar.filter((d) => d.hasStrength || d.hasCardio).length

  // PR map for top lift
  const prMap = useMemo(() => {
    const map = new Map<string, { est1RM: number; name: string }>()
    for (const pr of personalRecords) {
      const exId = pr.exerciseId || pr.exerciseName.toLowerCase().replace(/\s+/g, '-')
      map.set(exId, { est1RM: pr.estimated1RM || calculate1RM(pr.weight, pr.reps), name: pr.exerciseName })
    }
    return map
  }, [personalRecords])

  const topLift = useMemo(() => {
    if (!todaysDay) return null
    let best: { name: string; pct: number; color: string } | null = null
    for (const ex of todaysDay.exercises) {
      const pr = prMap.get(ex.exerciseId)
      if (!pr || pr.est1RM <= 0) continue
      const maxWeight = Math.max(...ex.sets.map((s) => s.weight))
      if (maxWeight <= 0) continue
      const pct = Math.round((maxWeight / pr.est1RM) * 100)
      if (!best || pct > best.pct) {
        const mg = guessMuscleGroup(ex.exerciseName)
        best = { name: ex.exerciseName, pct, color: MUSCLE_GROUP_COLORS[mg] || Colors.dark.accent }
      }
    }
    return best
  }, [todaysDay, prMap])

  const handleStartStrength = async () => {
    setShowActivityPicker(false)
    if (!user?.$id || !todaysDay) return
    const activeExercises: ActiveWorkoutExercise[] = todaysDay.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      sets: ex.sets.map((s, i) => ({
        setNumber: i + 1, weight: s.weight, reps: s.reps,
        previousWeight: s.weight, previousReps: s.reps, isCompleted: false,
      })),
      restSeconds: ex.restSeconds ?? 90,
    }))
    try {
      const session = await createWorkoutSession({
        userId: user.$id, programDayId: todaysDay.$id,
        programDayName: todaysDay.name,
        startedAt: new Date().toISOString(),
        completedAt: null, totalVolume: 0, duration: 0, notes: '',
      })
      startWorkout({ sessionId: session.$id, programDayName: todaysDay.name, exercises: activeExercises })
    } catch {
      startWorkout({ sessionId: `local-${Date.now()}`, programDayName: todaysDay.name, exercises: activeExercises })
    }
    router.push('/workout/active' as Href)
  }

  const handleStartFreestyle = () => {
    setShowActivityPicker(false)
    router.push('/workout/freestyle' as Href)
  }

  const handleStartCardio = () => {
    setShowActivityPicker(false)
    router.push('/workout/cardio' as Href)
  }

  const handleLogBody = () => {
    setShowActivityPicker(false)
    router.push('/stats/body' as Href)
  }

  const handleProgressPhoto = () => {
    setShowActivityPicker(false)
    router.push('/stats/photos' as Href)
  }

  const handleCalendarDayPress = (day: typeof weekCalendar[0]) => {
    if (day.sessionId) {
      router.push(`/workout/detail?sessionId=${day.sessionId}` as Href)
    } else if (day.isToday && todaysDay) {
      // Open today's workout plan
      router.push('/(tabs)/program' as Href)
    }
  }

  const handleRecentWorkoutPress = (sessionId?: string) => {
    if (sessionId) {
      router.push(`/workout/detail?sessionId=${sessionId}` as Href)
    } else {
      // For placeholder/mock data, open the program tab
      router.push('/(tabs)/program' as Href)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>{formatDate()}</Text>
            <Text style={styles.greeting}>Hey, {displayName}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile' as Href)}>
            <LinearGradient colors={[profile?.avatarColor ?? '#e8ff47', '#7fff00']} style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Metrics Carousel */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_W + 12}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          style={styles.carousel}
        >
          <View style={[styles.carouselCard, { width: CARD_W }]}>
            <Text style={styles.carouselLabel}>STRENGTH SCORE</Text>
            <StrengthScoreGauge score={strengthScore.score} delta={strengthScore.delta} />
          </View>
          <View style={[styles.carouselCard, { width: CARD_W }]}>
            <StrengthBalanceGauge {...strengthBalance} />
          </View>
        </ScrollView>

        {/* Weekly Calendar — tappable */}
        <View style={styles.weekSection}>
          <View style={styles.weekHeader}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/progress' as Href)} activeOpacity={0.7}>
              <Text style={styles.sectionTitle}>THIS WEEK</Text>
            </TouchableOpacity>
            <Text style={styles.weekCount}>
              {completedThisWeek}/{profile?.weeklyGoal ?? 5} days
            </Text>
          </View>
          <View style={styles.weekRow}>
            {weekCalendar.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={styles.weekDay}
                onPress={() => handleCalendarDayPress(d)}
                activeOpacity={d.hasStrength || d.hasCardio || d.isToday ? 0.6 : 1}
                disabled={!d.sessionId && !d.isToday}
              >
                <Text style={styles.weekDayLabel}>{DAYS_LABELS[i]}</Text>
                <View
                  style={[
                    styles.weekDayCircle,
                    d.hasStrength && { backgroundColor: d.color },
                    d.isToday && { borderWidth: 2, borderColor: currentProgram?.color || Colors.dark.accent, backgroundColor: 'transparent' },
                    !d.hasStrength && !d.isToday && styles.weekDayEmpty,
                  ]}
                >
                  {d.hasStrength ? (
                    <Text style={styles.weekDayCheck}>✓</Text>
                  ) : (
                    <Text style={[styles.weekDayNum, d.isToday && { color: Colors.dark.accent }]}>
                      {d.date}
                    </Text>
                  )}
                </View>
                <View style={styles.dotsRow}>
                  {d.hasStrength && <View style={[styles.dot, { backgroundColor: d.color }]} />}
                  {d.hasCardio && <View style={[styles.dot, { backgroundColor: Colors.dark.info }]} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Workout */}
        {todaysDay && (
          <TouchableOpacity activeOpacity={0.9} style={styles.todayContainer} onPress={handleStartStrength}>
            <LinearGradient colors={['#e8ff47', '#7fff00']} style={styles.todayCard}>
              <View style={styles.todayInfo}>
                <Text style={styles.todayLabel}>TODAY'S WORKOUT</Text>
                <Text style={styles.todayTitle}>{todaysDay.name}</Text>
                <Text style={styles.todaySubtitle}>{exerciseCount} exercises · ~45 min</Text>
                {topLift && (
                  <View style={styles.topLiftRow}>
                    <View style={[styles.topLiftBadge, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                      <Text style={styles.topLiftText}>
                        Top: {topLift.pct}% 1RM {topLift.name}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Top PRs */}
        {personalRecords.length > 0 && (
          <View style={styles.prSection}>
            <Text style={styles.sectionTitle}>TOP LIFTS (1RM)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prRow}>
              {personalRecords.slice(0, 5).map((pr) => {
                const mg = guessMuscleGroup(pr.exerciseName)
                const c = MUSCLE_GROUP_COLORS[mg] || Colors.dark.accent
                return (
                  <TouchableOpacity
                    key={pr.$id}
                    style={[styles.prCard, { borderColor: `${c}30` }]}
                    onPress={() => router.push('/(tabs)/progress' as Href)}
                    activeOpacity={0.7}
                  >
                    <ExerciseIcon exerciseName={pr.exerciseName} size={20} color={c} />
                    <Text style={[styles.prValue, { color: c }]}>
                      {pr.estimated1RM || calculate1RM(pr.weight, pr.reps)}
                    </Text>
                    <Text style={styles.prName} numberOfLines={1}>
                      {pr.exerciseName.length > 12 ? pr.exerciseName.substring(0, 12) + '…' : pr.exerciseName}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        )}

        {/* Recent Workouts — tappable */}
        <View style={styles.recentSection}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/progress' as Href)} activeOpacity={0.7}>
            <Text style={styles.sectionTitle}>RECENT</Text>
          </TouchableOpacity>
          {recentSessions.length > 0 ? (
            recentSessions.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.recentCard}
                onPress={() => handleRecentWorkoutPress(s.$id)}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={styles.recentName}>{s.programDayName}</Text>
                  <Text style={styles.recentDate}>
                    {s.completedAt ? getRelativeTime(s.completedAt) : 'In progress'}
                  </Text>
                </View>
                <View style={styles.recentRight}>
                  <Text style={styles.recentVolume}>
                    {s.totalVolume > 0 ? `${formatVolume(s.totalVolume)} lbs` : '—'}
                  </Text>
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path d="M9 18l6-6-6-6" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <>
              {[
                { name: 'Pull Day B', date: 'Yesterday', vol: '12,450 lbs' },
                { name: 'Leg Day', date: 'Mon', vol: '18,200 lbs' },
                { name: 'Push Day A', date: 'Sat', vol: '10,800 lbs' },
              ].map((w, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.recentCard}
                  onPress={() => handleRecentWorkoutPress()}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.recentName}>{w.name}</Text>
                    <Text style={styles.recentDate}>{w.date}</Text>
                  </View>
                  <View style={styles.recentRight}>
                    <Text style={styles.recentVolume}>{w.vol}</Text>
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                      <Path d="M9 18l6-6-6-6" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowActivityPicker(true)}
        activeOpacity={0.8}
      >
        <LinearGradient colors={['#e8ff47', '#7fff00']} style={styles.fabGradient}>
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Activity Picker Modal */}
      <Modal
        visible={showActivityPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActivityPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowActivityPicker(false)}>
          <Pressable style={styles.bottomSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Start Activity</Text>

            <TouchableOpacity style={styles.activityRow} onPress={handleStartStrength}>
              <View style={[styles.activityIcon, { backgroundColor: 'rgba(232,255,71,0.15)' }]}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path d="M6 5v14M18 5v14M6 12h12M4 7h4M16 7h4M4 17h4M16 17h4" stroke={Colors.dark.accent} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Strength Workout</Text>
                <Text style={styles.activitySub}>Follow your program</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.activityRow} onPress={handleStartFreestyle}>
              <View style={[styles.activityIcon, { backgroundColor: 'rgba(127,255,0,0.15)' }]}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="#7fff00" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Freestyle Workout</Text>
                <Text style={styles.activitySub}>Pick exercises on the fly</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.activityRow} onPress={handleStartCardio}>
              <View style={[styles.activityIcon, { backgroundColor: 'rgba(107,197,255,0.15)' }]}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={Colors.dark.info} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Cardio</Text>
                <Text style={styles.activitySub}>Running, cycling, swimming...</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.activityRow} onPress={handleLogBody}>
              <View style={[styles.activityIcon, { backgroundColor: 'rgba(255,159,67,0.15)' }]}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 2a4 4 0 014 4v1a4 4 0 01-8 0V6a4 4 0 014-4zM6 21v-2a6 6 0 0112 0v2" stroke="#ff9f43" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Body Stat</Text>
                <Text style={styles.activitySub}>Weight, measurements, body fat</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.activityRow} onPress={handleProgressPhoto}>
              <View style={[styles.activityIcon, { backgroundColor: 'rgba(255,107,107,0.15)' }]}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" stroke={Colors.dark.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <Path d="M12 17a4 4 0 100-8 4 4 0 000 8z" stroke={Colors.dark.danger} strokeWidth={2} />
                </Svg>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Progress Photo</Text>
                <Text style={styles.activitySub}>Track your transformation</Text>
              </View>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
  },
  dateText: { color: Colors.dark.textMuted, fontSize: FontSize.md, fontWeight: FontWeight.semibold, letterSpacing: 1 },
  greeting: { color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.bold, marginTop: 2 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: FontWeight.extrabold, fontSize: FontSize.xl, color: Colors.dark.textOnAccent },

  carousel: { marginBottom: Spacing.xl },
  carouselContent: { paddingHorizontal: Spacing.xxl, gap: 12 },
  carouselCard: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.xxl,
    borderWidth: 1, borderColor: Colors.dark.border, padding: Spacing.xl,
  },
  carouselLabel: {
    color: Colors.dark.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.bold,
    letterSpacing: 1.5, marginBottom: Spacing.sm,
  },

  weekSection: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.xl },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  weekCount: { color: Colors.dark.textSecondary, fontSize: FontSize.sm },
  weekRow: { flexDirection: 'row', gap: Spacing.sm },
  weekDay: { flex: 1, alignItems: 'center' },
  weekDayLabel: { fontSize: FontSize.xs, color: Colors.dark.textMuted, marginBottom: 4 },
  weekDayCircle: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  weekDayCompleted: { backgroundColor: Colors.dark.accent },
  weekDayToday: { borderWidth: 2, borderColor: Colors.dark.accent, backgroundColor: 'transparent' },
  weekDayEmpty: { backgroundColor: Colors.dark.surface },
  weekDayCheck: { color: Colors.dark.textOnAccent, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  weekDayNum: { color: Colors.dark.textMuted, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  dotsRow: { flexDirection: 'row', gap: 3, marginTop: 3, height: 4 },
  dot: { width: 4, height: 4, borderRadius: 2 },

  todayContainer: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.xl },
  todayCard: {
    borderRadius: BorderRadius.xxl, padding: 18, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  todayInfo: { flex: 1 },
  todayLabel: { color: 'rgba(10,10,10,0.5)', fontSize: FontSize.sm, fontWeight: FontWeight.semibold, letterSpacing: 1 },
  todayTitle: { color: Colors.dark.textOnAccent, fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, marginTop: 3 },
  todaySubtitle: { color: 'rgba(10,10,10,0.5)', fontSize: FontSize.md, marginTop: 2 },
  topLiftRow: { marginTop: Spacing.sm },
  topLiftBadge: { paddingHorizontal: Spacing.md, paddingVertical: 2, borderRadius: BorderRadius.full, alignSelf: 'flex-start' },
  topLiftText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: 'rgba(10,10,10,0.7)' },
  playButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.dark.textOnAccent, alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: FontSize.xxl, color: Colors.dark.text },

  prSection: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.xl },
  prRow: { gap: Spacing.sm },
  prCard: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, padding: Spacing.lg, alignItems: 'center', width: 88, gap: 3,
  },
  prValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  prName: { fontSize: 8, color: Colors.dark.textMuted, textAlign: 'center' },

  recentSection: { paddingHorizontal: Spacing.xxl, flex: 1 },
  sectionTitle: { color: Colors.dark.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.bold, letterSpacing: 1.5, marginBottom: Spacing.md },
  recentCard: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, marginBottom: Spacing.sm,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  recentName: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  recentDate: { color: Colors.dark.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  recentRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  recentVolume: { color: Colors.dark.accent, fontSize: FontSize.md, fontWeight: FontWeight.semibold },

  fab: {
    position: 'absolute', bottom: 90, right: 20,
    width: 56, height: 56, borderRadius: 28,
    shadowColor: '#e8ff47', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  fabGradient: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  fabIcon: { fontSize: 28, fontWeight: FontWeight.bold, color: Colors.dark.textOnAccent },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.xxl, paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xl,
  },
  sheetTitle: {
    color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.bold,
    marginBottom: Spacing.xxl,
  },
  activityRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  activityIcon: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  activityInfo: { flex: 1 },
  activityTitle: { color: Colors.dark.text, fontSize: FontSize.xxl, fontWeight: FontWeight.semibold },
  activitySub: { color: Colors.dark.textMuted, fontSize: FontSize.md, marginTop: 2 },
})
