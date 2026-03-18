import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  Pressable, Animated,
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
import { formatDate, getDayOfWeek, getRelativeTime, formatVolume, calculate1RM, guessMuscleGroup } from '@/lib/utils'
import { createWorkoutSession, listProgramDays } from '@/lib/database'
import { ExerciseIcon, MUSCLE_GROUP_COLORS } from '@/components/exercise-icon'
import { StrengthScoreGauge, StrengthBalanceGauge } from '@/components/strength-gauges'
import type { ActiveWorkoutExercise, Program, ProgramDay } from '@/types'


const DAYS_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']


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
  const [weekOffset, setWeekOffset] = useState(0)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)

  // Program/Day picker state for Strength Workout
  const [showProgramPicker, setShowProgramPicker] = useState(false)
  const [showDayPicker, setShowDayPicker] = useState(false)
  const [selectedPickerProgram, setSelectedPickerProgram] = useState<Program | null>(null)
  const [pickerDays, setPickerDays] = useState<ProgramDay[]>([])
  const [loadingDays, setLoadingDays] = useState(false)
  const [metricCard, setMetricCard] = useState<0 | 1>(0)

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
    weekStart.setDate(now.getDate() - dayOfWeek + (weekOffset * 7))

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
  }, [allSessions, cardioSessions, weekOffset])

  const completedThisWeek = weekCalendar.filter((d) => d.hasStrength || d.hasCardio).length

  // Week label
  const weekLabel = useMemo(() => {
    if (weekOffset === 0) return 'THIS WEEK'
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + (weekOffset * 7))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${fmt(weekStart)} – ${fmt(weekEnd)}`
  }, [weekOffset])

  // Month picker data
  const monthCalendar = useMemo(() => {
    const now = new Date()
    const offset = weekOffset * 7
    const refDate = new Date(now)
    refDate.setDate(now.getDate() + offset)
    const year = refDate.getFullYear()
    const month = refDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // Build workout map for the month
    const workoutDates = new Map<number, { sessionId: string; color: string }>()
    for (const s of allSessions) {
      if (s.completedAt) {
        const d = new Date(s.completedAt)
        if (d.getFullYear() === year && d.getMonth() === month) {
          const matchedProg = programs.find((p: any) =>
            days.some((day: any) => day.programId === p.$id && day.name === s.programDayName)
          )
          workoutDates.set(d.getDate(), {
            sessionId: s.$id,
            color: matchedProg?.color || currentProgram?.color || Colors.dark.accent,
          })
        }
      }
    }

    const cells: { date: number; isCurrentMonth: boolean; isToday: boolean; workout?: { sessionId: string; color: string } }[] = []
    // Previous month padding
    for (let i = 0; i < firstDay; i++) cells.push({ date: 0, isCurrentMonth: false, isToday: false })
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear()
      cells.push({ date: d, isCurrentMonth: true, isToday, workout: workoutDates.get(d) })
    }
    return { year, month, cells, monthName: new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
  }, [weekOffset, allSessions, programs, days, currentProgram])

  const jumpToWeekContaining = (date: number) => {
    const now = new Date()
    const target = new Date(monthCalendar.year, monthCalendar.month, date)
    const targetWeekStart = new Date(target)
    targetWeekStart.setDate(target.getDate() - target.getDay())
    const currentWeekStart = new Date(now)
    currentWeekStart.setDate(now.getDate() - now.getDay())
    const diffWeeks = Math.round((targetWeekStart.getTime() - currentWeekStart.getTime()) / (7 * 86400000))
    setWeekOffset(diffWeeks)
    setShowMonthPicker(false)
  }

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
    if (!user?.$id) return

    if (programs.length === 0) {
      // No programs — prompt to create one
      setTimeout(() => {
        router.push('/(tabs)/program' as Href)
      }, 200)
      return
    }

    if (programs.length === 1) {
      // Single program — go straight to day picker
      await openDayPicker(programs[0])
    } else {
      // Multiple programs — show program picker first
      setShowProgramPicker(true)
    }
  }

  const openDayPicker = async (program: Program) => {
    setSelectedPickerProgram(program)
    setShowProgramPicker(false)
    setLoadingDays(true)
    setShowDayPicker(true)
    try {
      const loadedDays = await listProgramDays(program.$id)
      setPickerDays(loadedDays)
    } catch {
      // Fallback to store days if this is the current program
      if (currentProgram?.$id === program.$id) {
        setPickerDays(days)
      } else {
        setPickerDays([])
      }
    }
    setLoadingDays(false)
  }

  const handlePickDay = async (pickedDay: ProgramDay) => {
    setShowDayPicker(false)
    if (!user?.$id) return

    const activeExercises: ActiveWorkoutExercise[] = pickedDay.exercises.map((ex) => ({
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
        userId: user.$id, programDayId: pickedDay.$id,
        programDayName: pickedDay.name,
        startedAt: new Date().toISOString(),
        completedAt: null, totalVolume: 0, duration: 0, notes: '',
      })
      startWorkout({ sessionId: session.$id, programDayName: pickedDay.name, exercises: activeExercises })
    } catch {
      startWorkout({ sessionId: `local-${Date.now()}`, programDayName: pickedDay.name, exercises: activeExercises })
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

  const handleCalendarDayPress = (day: typeof weekCalendar[0], index: number) => {
    // Toggle: tap same day to deselect, or select new day
    setSelectedDayIndex(prev => prev === index ? null : index)
  }

  // Get the selected day's workout session data
  const selectedDayData = useMemo(() => {
    if (selectedDayIndex === null) return null
    const day = weekCalendar[selectedDayIndex]
    if (!day) return null

    // Find matching session
    const session = day.sessionId
      ? allSessions.find(s => s.$id === day.sessionId)
      : null

    // Build the full date for this day
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + (weekOffset * 7))
    const targetDate = new Date(weekStart)
    targetDate.setDate(weekStart.getDate() + selectedDayIndex)

    // Find the program day for this date (which day of the week it maps to)
    const dayOfWeekIndex = targetDate.getDay() === 0 ? 6 : targetDate.getDay() - 1
    const programDay = dayOfWeekIndex < days.length ? days[dayOfWeekIndex] : null

    return {
      ...day,
      session,
      programDay,
      fullDate: targetDate,
      dateLabel: targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    }
  }, [selectedDayIndex, weekCalendar, allSessions, weekOffset, days])

  const handleRecentWorkoutPress = (sessionId?: string) => {
    if (sessionId) {
      router.push(`/workout/detail?sessionId=${sessionId}` as Href)
    } else {
      // Navigate to program tab
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

        {/* Metrics Card (tap dots to switch) */}
        <View style={styles.carouselSection}>
          <View style={styles.carouselCard}>
            {metricCard === 0 ? (
              <>
                <Text style={styles.carouselLabel}>STRENGTH SCORE</Text>
                <StrengthScoreGauge score={strengthScore.score} delta={strengthScore.delta} />
              </>
            ) : (
              <StrengthBalanceGauge {...strengthBalance} />
            )}
          </View>
          <View style={styles.dotRow}>
            <TouchableOpacity onPress={() => setMetricCard(0)} hitSlop={8}>
              <View style={[styles.dot, metricCard === 0 && styles.dotActive]} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMetricCard(1)} hitSlop={8}>
              <View style={[styles.dot, metricCard === 1 && styles.dotActive]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Calendar — swipeable with calendar picker */}
        <View style={styles.weekSection}>
          <View style={styles.weekHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity onPress={() => setWeekOffset(w => w - 1)} activeOpacity={0.6} hitSlop={12}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M15 18l-6-6 6-6" stroke={Colors.dark.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => weekOffset !== 0 ? setWeekOffset(0) : null} activeOpacity={weekOffset === 0 ? 1 : 0.6}>
                <Text style={[styles.sectionTitle, weekOffset !== 0 && { color: Colors.dark.accent }]}>{weekLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setWeekOffset(w => Math.min(0, w + 1))} activeOpacity={0.6} hitSlop={12} disabled={weekOffset >= 0}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M9 18l6-6-6-6" stroke={weekOffset >= 0 ? Colors.dark.border : Colors.dark.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={styles.weekCount}>
                {completedThisWeek}/{profile?.weeklyGoal ?? 5} days
              </Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(true)} activeOpacity={0.6} hitSlop={8}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke={Colors.dark.accent} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.weekRow}>
            {weekCalendar.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={styles.weekDay}
                onPress={() => handleCalendarDayPress(d, i)}
                activeOpacity={0.6}
                disabled={false}
              >
                <Text style={styles.weekDayLabel}>{DAYS_LABELS[i]}</Text>
                <View
                  style={[
                    styles.weekDayCircle,
                    d.hasStrength && { backgroundColor: d.color },
                    d.isToday && !d.hasStrength && { borderWidth: 2, borderColor: currentProgram?.color || Colors.dark.accent, backgroundColor: 'transparent' },
                    selectedDayIndex === i && !d.hasStrength && { borderWidth: 2, borderColor: Colors.dark.accent },
                    !d.hasStrength && !d.isToday && selectedDayIndex !== i && styles.weekDayEmpty,
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

          {/* Selected Day Detail — inline card */}
          {selectedDayData && (
            <View style={styles.selectedDayCard}>
              <Text style={styles.selectedDayDate}>{selectedDayData.dateLabel}</Text>
              {selectedDayData.session ? (
                // Completed workout
                <View>
                  <View style={styles.selectedDayHeader}>
                    <View style={[styles.selectedDayDot, { backgroundColor: selectedDayData.color }]} />
                    <Text style={styles.selectedDayName}>
                      {selectedDayData.session.programDayName || 'Workout'}
                    </Text>
                  </View>
                  <View style={styles.selectedDayStats}>
                    {selectedDayData.session.totalVolume > 0 && (
                      <View style={styles.selectedDayStat}>
                        <Text style={styles.selectedDayStatValue}>
                          {formatVolume(selectedDayData.session.totalVolume)}
                        </Text>
                        <Text style={styles.selectedDayStatLabel}>lbs</Text>
                      </View>
                    )}
                    {selectedDayData.session.duration > 0 && (
                      <View style={styles.selectedDayStat}>
                        <Text style={styles.selectedDayStatValue}>
                          {Math.round(selectedDayData.session.duration / 60)}
                        </Text>
                        <Text style={styles.selectedDayStatLabel}>min</Text>
                      </View>
                    )}
                  </View>
                  {selectedDayData.session.notes ? (
                    <Text style={styles.selectedDayNotes} numberOfLines={2}>
                      {selectedDayData.session.notes}
                    </Text>
                  ) : null}
                  <TouchableOpacity
                    style={styles.selectedDayViewBtn}
                    onPress={() => router.push(`/workout/detail?sessionId=${selectedDayData.session!.$id}` as Href)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.selectedDayViewText}>View Details →</Text>
                  </TouchableOpacity>
                </View>
              ) : selectedDayData.isToday && selectedDayData.programDay ? (
                // Today — show planned workout
                <View>
                  <View style={styles.selectedDayHeader}>
                    <View style={[styles.selectedDayDot, { backgroundColor: currentProgram?.color || Colors.dark.accent }]} />
                    <Text style={styles.selectedDayName}>{selectedDayData.programDay.name}</Text>
                    <Text style={styles.selectedDayBadge}>PLANNED</Text>
                  </View>
                  <View style={styles.selectedDayExercises}>
                    {selectedDayData.programDay.exercises.slice(0, 4).map((ex, i) => (
                      <View key={i} style={styles.selectedDayExRow}>
                        <ExerciseIcon exerciseName={ex.exerciseName} size={22} color={currentProgram?.color || Colors.dark.accent} />
                        <Text style={styles.selectedDayExName} numberOfLines={1}>{ex.exerciseName}</Text>
                        <Text style={styles.selectedDayExSets}>{ex.sets.length}×{ex.sets[0]?.reps || 8}</Text>
                      </View>
                    ))}
                    {selectedDayData.programDay.exercises.length > 4 && (
                      <Text style={styles.selectedDayMore}>
                        +{selectedDayData.programDay.exercises.length - 4} more exercises
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.selectedDayViewBtn, { backgroundColor: (currentProgram?.color || Colors.dark.accent) + '15' }]}
                    onPress={handleStartStrength}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.selectedDayViewText, { color: currentProgram?.color || Colors.dark.accent }]}>Start Workout →</Text>
                  </TouchableOpacity>
                </View>
              ) : selectedDayData.programDay ? (
                // Past/future day with a scheduled program day but no session
                <View>
                  <View style={styles.selectedDayHeader}>
                    <View style={[styles.selectedDayDot, { backgroundColor: Colors.dark.textMuted }]} />
                    <Text style={[styles.selectedDayName, { color: Colors.dark.textMuted }]}>{selectedDayData.programDay.name}</Text>
                    <Text style={[styles.selectedDayBadge, { color: Colors.dark.textMuted }]}>
                      {selectedDayData.isPast ? 'MISSED' : 'SCHEDULED'}
                    </Text>
                  </View>
                  <View style={styles.selectedDayExercises}>
                    {selectedDayData.programDay.exercises.slice(0, 3).map((ex, i) => (
                      <View key={i} style={styles.selectedDayExRow}>
                        <ExerciseIcon exerciseName={ex.exerciseName} size={22} color={Colors.dark.textMuted} />
                        <Text style={[styles.selectedDayExName, { color: Colors.dark.textMuted }]} numberOfLines={1}>{ex.exerciseName}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                // Rest day
                <View style={styles.selectedDayHeader}>
                  <Text style={[styles.selectedDayName, { color: Colors.dark.textMuted }]}>Rest Day</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Today's Workout */}
        {todaysDay && selectedDayIndex === null && (
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
            <Text style={[styles.sectionTitle, { fontSize: FontSize.base, color: Colors.dark.textSecondary }]}>RECENT</Text>
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
          ) : days.length > 0 ? (
            days.slice(0, 3).map((d, i) => (
              <TouchableOpacity
                key={i}
                style={styles.recentCard}
                onPress={() => router.push('/(tabs)/program' as Href)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <ExerciseIcon
                    exerciseName={d.exercises[0]?.exerciseId}
                    size={36}
                    color={currentProgram?.color || Colors.dark.accent}
                  />
                  <View>
                    <Text style={styles.recentName}>{d.name}</Text>
                    <Text style={styles.recentDate}>{d.exercises.length} exercises</Text>
                  </View>
                </View>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                  <Path d="M9 18l6-6-6-6" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.recentCard}>
              <Text style={styles.recentDate}>No workouts yet — create a program to get started!</Text>
            </View>
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

      {/* Month Calendar Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <Pressable style={[styles.modalOverlay, { justifyContent: 'center' }]} onPress={() => setShowMonthPicker(false)}>
          <Pressable style={styles.monthPickerSheet} onPress={() => {}}>
            {/* Month nav */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={() => setWeekOffset(w => w - 4)} activeOpacity={0.6} hitSlop={12}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M15 18l-6-6 6-6" stroke={Colors.dark.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{monthCalendar.monthName}</Text>
              <TouchableOpacity onPress={() => setWeekOffset(w => Math.min(0, w + 4))} activeOpacity={0.6} hitSlop={12}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M9 18l6-6-6-6" stroke={Colors.dark.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>
            </View>
            {/* Day labels */}
            <View style={styles.monthDayLabels}>
              {DAYS_LABELS.map((l, i) => (
                <Text key={i} style={styles.monthDayLabel}>{l}</Text>
              ))}
            </View>
            {/* Calendar grid */}
            <View style={styles.monthGrid}>
              {monthCalendar.cells.map((cell, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.monthCell}
                  onPress={() => cell.isCurrentMonth && cell.date > 0 ? jumpToWeekContaining(cell.date) : null}
                  activeOpacity={cell.isCurrentMonth ? 0.6 : 1}
                  disabled={!cell.isCurrentMonth}
                >
                  {cell.isCurrentMonth && (
                    <View style={[
                      styles.monthCellInner,
                      cell.workout && { backgroundColor: cell.workout.color },
                      cell.isToday && !cell.workout && { borderWidth: 1.5, borderColor: Colors.dark.accent },
                    ]}>
                      <Text style={[
                        styles.monthCellText,
                        cell.workout && { color: '#000', fontWeight: '700' as any },
                        cell.isToday && !cell.workout && { color: Colors.dark.accent },
                      ]}>
                        {cell.date}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {/* Quick jump */}
            <TouchableOpacity
              style={styles.todayJumpBtn}
              onPress={() => { setWeekOffset(0); setShowMonthPicker(false) }}
              activeOpacity={0.7}
            >
              <Text style={styles.todayJumpText}>Jump to Today</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

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

      {/* Program Picker Modal */}
      <Modal
        visible={showProgramPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProgramPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowProgramPicker(false)}>
          <Pressable style={styles.bottomSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Choose Program</Text>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {programs.map((prog) => (
                <TouchableOpacity
                  key={prog.$id}
                  style={styles.pickerRow}
                  onPress={() => openDayPicker(prog)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.pickerColorDot, { backgroundColor: prog.color || Colors.dark.accent }]} />
                  <View style={styles.pickerInfo}>
                    <Text style={styles.pickerTitle}>{prog.name}</Text>
                    <Text style={styles.pickerSub}>{prog.daysPerWeek} days/week</Text>
                  </View>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M9 18l6-6-6-6" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ height: 20 }} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Day Picker Modal */}
      <Modal
        visible={showDayPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDayPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDayPicker(false)}>
          <Pressable style={styles.bottomSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <View style={styles.dayPickerHeader}>
              {programs.length > 1 && (
                <TouchableOpacity
                  onPress={() => { setShowDayPicker(false); setShowProgramPicker(true) }}
                  style={styles.dayPickerBack}
                  activeOpacity={0.7}
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M15 18l-6-6 6-6" stroke={Colors.dark.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Pick a Day</Text>
                {selectedPickerProgram && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 }}>
                    <View style={[styles.pickerColorDotSmall, { backgroundColor: selectedPickerProgram.color || Colors.dark.accent }]} />
                    <Text style={styles.dayPickerProgramName}>{selectedPickerProgram.name}</Text>
                  </View>
                )}
              </View>
            </View>
            {loadingDays ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: Colors.dark.textMuted, fontSize: FontSize.lg }}>Loading...</Text>
              </View>
            ) : pickerDays.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: Colors.dark.textMuted, fontSize: FontSize.lg }}>No days found. Add exercises to your program first.</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                {pickerDays.map((d) => (
                  <TouchableOpacity
                    key={d.$id}
                    style={styles.pickerRow}
                    onPress={() => handlePickDay(d)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.pickerDayIcon, { backgroundColor: (selectedPickerProgram?.color || Colors.dark.accent) + '15' }]}>
                      {d.exercises.length > 0 ? (
                        <ExerciseIcon
                          exerciseName={d.exercises[0].exerciseName}
                          size={28}
                          color={selectedPickerProgram?.color || Colors.dark.accent}
                        />
                      ) : (
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                          <Path d="M6 5v14M18 5v14M6 12h12M4 7h4M16 7h4M4 17h4M16 17h4" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" />
                        </Svg>
                      )}
                    </View>
                    <View style={styles.pickerInfo}>
                      <Text style={styles.pickerTitle}>{d.name}</Text>
                      <Text style={styles.pickerSub}>
                        {d.exercises.length} exercise{d.exercises.length !== 1 ? 's' : ''}
                        {d.exercises.length > 0 ? ` · ${d.exercises.slice(0, 3).map(e => e.exerciseName.split(' ')[0]).join(', ')}` : ''}
                      </Text>
                    </View>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M9 18l6-6-6-6" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
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
    paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xs, paddingBottom: Spacing.xs,
  },
  dateText: { color: Colors.dark.textMuted, fontSize: FontSize.md, fontWeight: FontWeight.semibold, letterSpacing: 1 },
  greeting: { color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.bold, marginTop: 2 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: FontWeight.extrabold, fontSize: FontSize.xl, color: Colors.dark.textOnAccent },

  carouselSection: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.md },
  carouselCard: {
    backgroundColor: '#1a1a1a', borderRadius: BorderRadius.xxl,
    borderWidth: 1, borderColor: Colors.dark.border, padding: Spacing.lg,
    overflow: 'hidden',
  },
  carouselLabel: {
    color: Colors.dark.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.bold,
    letterSpacing: 1.5, marginBottom: Spacing.sm,
  },
  dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: Spacing.md },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.dark.textMuted },
  dotActive: { backgroundColor: Colors.dark.accent, width: 18 },

  weekSection: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.lg },
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
    padding: Spacing.xl, paddingVertical: Spacing.xl + 4, marginBottom: Spacing.sm,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderLeftWidth: 3, borderLeftColor: Colors.dark.accent,
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

  // Program/Day picker
  pickerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    gap: 12,
  },
  pickerColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pickerColorDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pickerInfo: {
    flex: 1,
  },
  pickerTitle: {
    color: Colors.dark.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.semibold,
  },
  pickerSub: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.md,
    marginTop: 2,
  },
  pickerDayIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dayPickerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: Spacing.xl,
  },
  dayPickerBack: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dayPickerProgramName: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.md,
  },

  // Month picker
  monthPickerSheet: {
    backgroundColor: '#2a2a2a',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    marginHorizontal: 20,
    maxWidth: 380,
    alignSelf: 'center' as const,
    width: '90%' as any,
  },
  monthNav: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: Spacing.xl,
  },
  monthTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
  },
  monthDayLabels: {
    flexDirection: 'row' as const,
    marginBottom: Spacing.md,
  },
  monthDayLabel: {
    flex: 1,
    textAlign: 'center' as const,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.textMuted,
  },
  monthGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  },
  monthCell: {
    width: '14.28%' as any,
    aspectRatio: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 2,
  },
  monthCellInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  monthCellText: {
    fontSize: FontSize.base,
    color: Colors.dark.textSecondary,
  },
  todayJumpBtn: {
    alignSelf: 'center' as const,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.accent + '30',
  },
  todayJumpText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.accent,
  },

  // Selected day card
  selectedDayCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  selectedDayDate: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold as any,
    color: Colors.dark.textMuted,
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
    textTransform: 'uppercase' as any,
  },
  selectedDayHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: Spacing.md,
  },
  selectedDayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectedDayName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold as any,
    color: Colors.dark.text,
    flex: 1,
  },
  selectedDayBadge: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold as any,
    color: Colors.dark.accent,
    letterSpacing: 1,
  },
  selectedDayStats: {
    flexDirection: 'row' as const,
    gap: 20,
    marginBottom: Spacing.md,
  },
  selectedDayStat: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: 4,
  },
  selectedDayStatValue: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold as any,
    color: Colors.dark.text,
  },
  selectedDayStatLabel: {
    fontSize: FontSize.sm,
    color: Colors.dark.textMuted,
  },
  selectedDayNotes: {
    fontSize: FontSize.base,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
    fontStyle: 'italic' as any,
  },
  selectedDayExercises: {
    gap: 8,
    marginBottom: Spacing.md,
  },
  selectedDayExRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  selectedDayExName: {
    fontSize: FontSize.base,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  selectedDayExSets: {
    fontSize: FontSize.sm,
    color: Colors.dark.textMuted,
    fontWeight: FontWeight.semibold as any,
  },
  selectedDayMore: {
    fontSize: FontSize.sm,
    color: Colors.dark.textMuted,
    marginTop: 4,
    paddingLeft: 32,
  },
  selectedDayViewBtn: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: Spacing.sm,
  },
  selectedDayViewText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold as any,
    color: Colors.dark.textSecondary,
  },
})
