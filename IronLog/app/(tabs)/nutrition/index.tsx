import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import Svg, { Polyline, Circle, Line, Text as SvgText, Path } from 'react-native-svg'
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme'
import { useNutritionStore } from '@/stores/nutrition-store'
import { useAuthStore } from '@/stores/auth-store'
import { useBodyStore } from '@/stores/body-store'
import { CalorieRing } from '@/components/nutrition/calorie-ring'
import { MacroBar, MACRO_COLORS } from '@/components/nutrition/macro-bar'
import { MealSection } from '@/components/nutrition/meal-section'
import { WeekStrip } from '@/components/nutrition/week-strip'
import { computeDailySummary, groupByMeal, getDateString, getWeekDates } from '@/lib/nutrition-utils'
import NutritionOnboarding from './onboarding'
import type { MealType } from '@/types/nutrition'

const CHART_W = 300
const CHART_H = 120
const CHART_PAD = { top: 10, right: 16, bottom: 20, left: 36 }

export default function NutritionDashboard() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const {
    profile, todayLogs, weekLogs, selectedDate, isLoading, profileLoaded,
    loadProfile, loadDayLogs, loadWeekLogs, setSelectedDate, removeLog,
  } = useNutritionStore()
  const { stats: bodyStats, loadStats, addStat } = useBodyStore()

  const [weekOffset, setWeekOffset] = useState(0)
  const [weightInput, setWeightInput] = useState('')
  const [showWeightInput, setShowWeightInput] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Load profile + body stats on mount
  useEffect(() => {
    if (user) {
      loadProfile(user.$id)
      loadStats(user.$id)
    }
  }, [user])

  // Load logs when profile is ready
  useEffect(() => {
    if (user && profile?.onboardingCompleted) {
      loadDayLogs(user.$id)
      loadWeekLogs(user.$id, weekOffset)
    }
  }, [user, profile?.onboardingCompleted, weekOffset])

  // Refresh body stats whenever this tab comes into focus so weight logs
  // added in the Body Stats screen are immediately reflected here
  useFocusEffect(
    useCallback(() => {
      if (user) loadStats(user.$id)
    }, [user])
  )

  const handleSelectDate = useCallback((date: string) => {
    if (user) setSelectedDate(user.$id, date)
  }, [user])

  const handleJumpToDate = useCallback((dateStr: string) => {
    // Calculate week offset from today to the target date's week
    const today = new Date()
    const target = new Date(dateStr + 'T00:00:00')
    const todayDay = today.getDay()
    const todayMonday = new Date(today)
    todayMonday.setDate(today.getDate() - (todayDay === 0 ? 6 : todayDay - 1))
    todayMonday.setHours(0, 0, 0, 0)

    const targetDay = target.getDay()
    const targetMonday = new Date(target)
    targetMonday.setDate(target.getDate() - (targetDay === 0 ? 6 : targetDay - 1))
    targetMonday.setHours(0, 0, 0, 0)

    const diffWeeks = Math.round((targetMonday.getTime() - todayMonday.getTime()) / (7 * 86400000))
    setWeekOffset(Math.min(diffWeeks, 0))

    if (user) setSelectedDate(user.$id, dateStr)
  }, [user])

  const handleLogWeight = useCallback(async () => {
    const weight = parseFloat(weightInput)
    if (!user || isNaN(weight) || weight <= 0) return

    try {
      await addStat({
        userId: user.$id,
        bodyWeight: weight,
        bodyFat: null,
        chest: null,
        waist: null,
        hips: null,
        arms: null,
        thighs: null,
        unit: 'lbs',
        recordedAt: new Date().toISOString(),
        notes: null,
      })
      setWeightInput('')
      setShowWeightInput(false)
    } catch {
      Alert.alert('Error', 'Failed to log weight')
    }
  }, [weightInput, user])

  // Show onboarding inline if no profile after load completes
  const needsOnboarding = profileLoaded && !isLoading && profile === null
  const showQuiz = needsOnboarding || showOnboarding

  // Render onboarding inline — no navigation, no stack issues
  if (showQuiz) {
    return (
      <NutritionOnboarding
        onComplete={() => {
          setShowOnboarding(false)
          // Reload profile to pick up the saved/updated data
          if (user) loadProfile(user.$id)
        }}
      />
    )
  }

  // Still loading
  if (!profileLoaded || isLoading || !profile) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    )
  }

  const handleAddFood = (mealType: MealType) => {
    router.push({
      pathname: '/(tabs)/nutrition/food-search',
      params: { mealType, date: selectedDate },
    })
  }

  const handleRemoveEntry = (entryId: string) => {
    removeLog(entryId)
  }

  const handleRetakeQuiz = () => {
    setShowOnboarding(true)
  }

  const handleRetakeAssessmentPrompt = () => {
    Alert.alert(
      'Retake Assessment',
      'Do you want to retake your nutrition assessment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retake', onPress: handleRetakeQuiz },
      ]
    )
  }

  const summary = computeDailySummary(selectedDate, todayLogs)
  const mealGroups = groupByMeal(todayLogs)
  const isToday = selectedDate === getDateString()

  // Weight chart data — last 14 entries, oldest first
  const weightEntries = bodyStats
    .filter((s) => s.bodyWeight !== null && s.bodyWeight > 0)
    .slice(0, 14)
    .reverse()

  const latestWeight = weightEntries.length > 0
    ? weightEntries[weightEntries.length - 1].bodyWeight
    : null

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Nutrition</Text>
            <Text style={styles.dateText}>
              {isToday ? 'Today' : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Calorie Ring */}
        <View style={styles.ringSection}>
          <CalorieRing
            consumed={summary.totalCalories}
            target={profile.dailyCalories}
          />
        </View>

        {/* Macro Bars */}
        <View style={styles.macroSection}>
          <MacroBar label="Protein" current={summary.totalProtein} target={profile.proteinGrams} color={MACRO_COLORS.protein} />
          <MacroBar label="Carbs" current={summary.totalCarbs} target={profile.carbsGrams} color={MACRO_COLORS.carbs} />
          <MacroBar label="Fat" current={summary.totalFat} target={profile.fatGrams} color={MACRO_COLORS.fat} />
          <MacroBar label="Fiber" current={summary.totalFiber} target={profile.fiberGrams} color={MACRO_COLORS.fiber} />
        </View>

        {/* Week Strip */}
        <WeekStrip
          weekOffset={weekOffset}
          weekLogs={weekLogs}
          calorieTarget={profile.dailyCalories}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          onPrevWeek={() => setWeekOffset((w) => w - 1)}
          onNextWeek={() => setWeekOffset((w) => Math.min(w + 1, 0))}
          onJumpToDate={handleJumpToDate}
        />

        {/* Body Weight Section */}
        <View style={styles.weightSection}>
          <View style={styles.weightHeader}>
            <View>
              <Text style={styles.weightTitle}>Body Weight</Text>
              {latestWeight !== null && (
                <Text style={styles.weightCurrent}>{latestWeight} lbs</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.logWeightBtn}
              onPress={() => setShowWeightInput(!showWeightInput)}
              activeOpacity={0.7}
            >
              <Text style={styles.logWeightText}>{showWeightInput ? 'Cancel' : '+ Log'}</Text>
            </TouchableOpacity>
          </View>

          {/* Quick weight input */}
          {showWeightInput && (
            <View style={styles.weightInputRow}>
              <TextInput
                style={styles.weightInput}
                value={weightInput}
                onChangeText={setWeightInput}
                placeholder={latestWeight ? String(latestWeight) : '170'}
                placeholderTextColor={Colors.dark.textDark}
                keyboardType="decimal-pad"
                autoFocus
              />
              <Text style={styles.weightUnit}>lbs</Text>
              <TouchableOpacity
                style={[styles.weightSaveBtn, (!weightInput || parseFloat(weightInput) <= 0) && styles.weightSaveBtnDisabled]}
                onPress={handleLogWeight}
                activeOpacity={0.8}
                disabled={!weightInput || parseFloat(weightInput) <= 0}
              >
                <Text style={styles.weightSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Line chart */}
          {weightEntries.length >= 2 ? (
            <View style={styles.chartContainer}>
              <WeightChart entries={weightEntries} />
            </View>
          ) : weightEntries.length === 1 ? (
            <Text style={styles.chartHint}>Log a few more weigh-ins to see your trend</Text>
          ) : (
            <Text style={styles.chartHint}>No weight data yet — tap "+ Log" above</Text>
          )}
        </View>

        {/* Meal Sections */}
        <View style={styles.mealsSection}>
          <MealSection mealType="breakfast" entries={mealGroups.breakfast} onAddFood={handleAddFood} onRemoveEntry={handleRemoveEntry} />
          <MealSection mealType="lunch" entries={mealGroups.lunch} onAddFood={handleAddFood} onRemoveEntry={handleRemoveEntry} />
          <MealSection mealType="snacks" entries={mealGroups.snacks} onAddFood={handleAddFood} onRemoveEntry={handleRemoveEntry} />
          <MealSection mealType="dinner" entries={mealGroups.dinner} onAddFood={handleAddFood} onRemoveEntry={handleRemoveEntry} />
        </View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={handleRetakeAssessmentPrompt} activeOpacity={0.8}>
        <Text style={styles.fabText}>?</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

// ─── Weight Line Chart ────────────────────────────────────────────────────────

interface WeightChartProps {
  entries: Array<{ bodyWeight: number | null; recordedAt: string }>
}

function WeightChart({ entries }: WeightChartProps) {
  const weights = entries.map((e) => e.bodyWeight ?? 0).filter((w) => w > 0)
  if (weights.length < 2) return null

  const minW = Math.min(...weights)
  const maxW = Math.max(...weights)
  const range = maxW - minW || 1
  const padded = range * 0.15

  const plotW = CHART_W - CHART_PAD.left - CHART_PAD.right
  const plotH = CHART_H - CHART_PAD.top - CHART_PAD.bottom

  const points = weights.map((w, i) => {
    const x = CHART_PAD.left + (i / (weights.length - 1)) * plotW
    const y = CHART_PAD.top + plotH - ((w - (minW - padded)) / (range + padded * 2)) * plotH
    return { x, y, w }
  })

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  // Y axis labels
  const yLabels = [
    { value: Math.round(maxW), y: CHART_PAD.top + plotH - ((maxW - (minW - padded)) / (range + padded * 2)) * plotH },
    { value: Math.round(minW), y: CHART_PAD.top + plotH - ((minW - (minW - padded)) / (range + padded * 2)) * plotH },
  ]

  // X axis labels — first and last date
  const firstDate = new Date(entries[0].recordedAt)
  const lastDate = new Date(entries[entries.length - 1].recordedAt)
  const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {/* Grid lines */}
      {yLabels.map((label, i) => (
        <Line
          key={i}
          x1={CHART_PAD.left}
          y1={label.y}
          x2={CHART_W - CHART_PAD.right}
          y2={label.y}
          stroke={Colors.dark.border}
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      ))}

      {/* Y labels */}
      {yLabels.map((label, i) => (
        <SvgText
          key={`y-${i}`}
          x={CHART_PAD.left - 6}
          y={label.y + 3}
          textAnchor="end"
          fontSize={9}
          fill={Colors.dark.textMuted}
        >
          {label.value}
        </SvgText>
      ))}

      {/* X labels */}
      <SvgText x={CHART_PAD.left} y={CHART_H - 2} fontSize={8} fill={Colors.dark.textMuted}>
        {fmtDate(firstDate)}
      </SvgText>
      <SvgText x={CHART_W - CHART_PAD.right} y={CHART_H - 2} textAnchor="end" fontSize={8} fill={Colors.dark.textMuted}>
        {fmtDate(lastDate)}
      </SvgText>

      {/* Line */}
      <Polyline
        points={polylinePoints}
        fill="none"
        stroke={Colors.dark.accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 4 : 2.5}
          fill={i === points.length - 1 ? Colors.dark.accent : Colors.dark.background}
          stroke={Colors.dark.accent}
          strokeWidth={i === points.length - 1 ? 0 : 1.5}
        />
      ))}
    </Svg>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.accentSurface,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: Colors.dark.accent,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    lineHeight: 28,
  },
  title: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
  },
  dateText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
  },
  ringSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  macroSection: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  mealsSection: {
    marginTop: Spacing.xs,
  },
  // ─── Weight Section ─────────────────────────────────────────────────────────
  weightSection: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  weightTitle: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  weightCurrent: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.xs,
  },
  logWeightBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.dark.accentSurface,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
  },
  logWeightText: {
    color: Colors.dark.accent,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  weightInput: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    color: Colors.dark.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  weightUnit: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.lg,
  },
  weightSaveBtn: {
    backgroundColor: Colors.dark.accent,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
  },
  weightSaveBtnDisabled: {
    backgroundColor: Colors.dark.surfaceLight,
  },
  weightSaveText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  chartHint: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
})
