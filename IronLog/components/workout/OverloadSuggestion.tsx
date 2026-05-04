/**
 * Progressive Overload Suggestion Banner
 *
 * Analyzes the last 4 sessions for a given exercise and suggests
 * weight adjustments based on performance trends.
 *
 * Logic:
 * - Hit all target reps → suggest +5 lbs (compounds) / +2.5 lbs (isolation)
 * - Missed reps → hold current weight
 * - Plateau (same weight/reps 3+ sessions) → flag for attention
 * - No history → show nothing
 *
 * @module components/workout/OverloadSuggestion
 */
import { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { getExerciseHistory } from '@/lib/database'
import { guessMuscleGroup } from '@/lib/utils'
import type { WorkoutSet } from '@/types'

interface OverloadSuggestionProps {
  userId: string
  exerciseId: string
  exerciseName: string
  /** Current programmed weight (from the set defaults) */
  currentWeight: number
  /** Current programmed reps */
  currentReps: number
}

interface SuggestionResult {
  type: 'increase' | 'hold' | 'plateau' | 'none'
  message: string
  detail?: string
  suggestedWeight?: number
  increment?: number
}

/**
 * Determine if an exercise is a compound movement.
 * Compounds get +5 lbs, isolation gets +2.5 lbs.
 */
function isCompound(name: string): boolean {
  const compounds = [
    'bench press', 'squat', 'deadlift', 'overhead press', 'barbell row',
    'front squat', 'incline press', 'hip thrust', 'romanian deadlift',
    'leg press', 'military press', 'clean', 'snatch', 'pull-up', 'chin-up',
    'dip', 'pendlay row', 't-bar row',
  ]
  const n = name.toLowerCase()
  return compounds.some((c) => n.includes(c))
}

/**
 * Group sets by session (using sessionId) and return per-session summaries.
 * Returns the last `count` sessions, newest first.
 */
function groupBySession(sets: WorkoutSet[], count: number) {
  const sessionMap = new Map<string, { weights: number[]; reps: number[]; date: string }>()

  for (const s of sets) {
    if (!s.isCompleted || s.weight <= 0) continue
    const existing = sessionMap.get(s.sessionId)
    if (existing) {
      existing.weights.push(s.weight)
      existing.reps.push(s.reps)
    } else {
      sessionMap.set(s.sessionId, {
        weights: [s.weight],
        reps: [s.reps],
        date: (s as any).$createdAt ?? '',
      })
    }
  }

  return Array.from(sessionMap.values()).slice(0, count)
}

function analyzeTrend(
  sessions: ReturnType<typeof groupBySession>,
  exerciseName: string,
  currentWeight: number,
  currentReps: number
): SuggestionResult {
  if (sessions.length === 0) return { type: 'none', message: '' }

  const compound = isCompound(exerciseName)
  const increment = compound ? 5 : 2.5

  const lastSession = sessions[0]
  const lastMaxWeight = Math.max(...lastSession.weights)
  const lastAvgReps = Math.round(lastSession.reps.reduce((a, b) => a + b, 0) / lastSession.reps.length)
  const allHitTarget = lastSession.reps.every((r) => r >= currentReps)

  // Check for plateau: same max weight for 3+ sessions
  if (sessions.length >= 3) {
    const recentMaxWeights = sessions.slice(0, 3).map((s) => Math.max(...s.weights))
    const allSame = recentMaxWeights.every((w) => w === recentMaxWeights[0])
    const recentAvgReps = sessions.slice(0, 3).map(
      (s) => Math.round(s.reps.reduce((a, b) => a + b, 0) / s.reps.length)
    )
    const repsStagnant = recentAvgReps.every((r) => Math.abs(r - recentAvgReps[0]) <= 1)

    if (allSame && repsStagnant) {
      return {
        type: 'plateau',
        message: `Plateau detected at ${recentMaxWeights[0]} lbs`,
        detail: `Same weight for 3 sessions. Consider a deload week or changing rep scheme.`,
      }
    }
  }

  // Hit all target reps → suggest increase
  if (allHitTarget) {
    const suggested = lastMaxWeight + increment
    return {
      type: 'increase',
      message: `Consider ${lastMaxWeight + increment} lbs next`,
      detail: `You hit ${lastAvgReps} reps at ${lastMaxWeight} lbs last time. +${increment} lbs progression.`,
      suggestedWeight: suggested,
      increment,
    }
  }

  // Missed reps → hold
  return {
    type: 'hold',
    message: `Stay at ${lastMaxWeight} lbs`,
    detail: `Averaged ${lastAvgReps}/${currentReps} reps last session. Hit target reps before increasing.`,
  }
}

export function OverloadSuggestion({
  userId,
  exerciseId,
  exerciseName,
  currentWeight,
  currentReps,
}: OverloadSuggestionProps) {
  const [suggestion, setSuggestion] = useState<SuggestionResult>({ type: 'none', message: '' })
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getExerciseHistory(userId, exerciseId, 50)
      .then((sets) => {
        if (cancelled) return
        const sessions = groupBySession(sets, 4)
        const result = analyzeTrend(sessions, exerciseName, currentWeight, currentReps)
        setSuggestion(result)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setSuggestion({ type: 'none', message: '' })
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [userId, exerciseId, exerciseName, currentWeight, currentReps])

  if (loading) return null
  if (suggestion.type === 'none') return null

  const colors = {
    increase: { bg: 'rgba(127,255,0,0.08)', border: 'rgba(127,255,0,0.20)', text: '#7fff00', icon: '↑' },
    hold: { bg: 'rgba(107,197,255,0.08)', border: 'rgba(107,197,255,0.20)', text: '#6bc5ff', icon: '→' },
    plateau: { bg: 'rgba(255,159,67,0.08)', border: 'rgba(255,159,67,0.20)', text: '#ff9f43', icon: '⚠' },
    none: { bg: 'transparent', border: 'transparent', text: Colors.dark.textMuted, icon: '' },
  }

  const c = colors[suggestion.type]

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: c.bg, borderColor: c.border }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <Text style={[styles.icon, { color: c.text }]}>{c.icon}</Text>
        <Text style={[styles.message, { color: c.text }]} numberOfLines={expanded ? 3 : 1}>
          {suggestion.message}
        </Text>
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <Path d="M6 9l6 6 6-6" stroke={c.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
      {expanded && suggestion.detail && (
        <Text style={styles.detail}>{suggestion.detail}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  message: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  detail: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
    paddingLeft: 28,
  },
})
