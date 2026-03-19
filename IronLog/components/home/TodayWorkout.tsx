import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path } from 'react-native-svg'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import type { ProgramDay, Program } from '@/types'

interface Props {
  todaysDay?: ProgramDay
  exerciseCount: number
  currentProgram?: Program | null
  topLift?: { name: string; pct: number; color: string } | null
  onStart: () => void
}

export const TodayWorkout = React.memo(({ todaysDay, exerciseCount, currentProgram, topLift, onStart }: Props) => {
  if (!todaysDay || exerciseCount === 0) return null

  const gradientColors = currentProgram?.color
    ? [currentProgram.color, `${currentProgram.color}cc`]
    : ['#e8ff47', '#c5d63a']

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.info}>
          <Text style={styles.label}>TODAY'S WORKOUT</Text>
          <Text style={styles.title}>{todaysDay.name}</Text>
          <Text style={styles.subtitle}>{exerciseCount} exercises · ~{exerciseCount * 9} min</Text>
          {topLift && (
            <View style={styles.topLiftRow}>
              <View style={[styles.topLiftBadge, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                <Text style={styles.topLiftText}>Top: {topLift.pct}% 1RM {topLift.name}</Text>
              </View>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.playButton} onPress={onStart} activeOpacity={0.7}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill={Colors.dark.bg}>
            <Path d="M5 3l14 9-14 9V3z" />
          </Svg>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  )
})

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.xl },
  card: {
    borderRadius: BorderRadius.xxl, padding: 18, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  info: { flex: 1 },
  label: { color: 'rgba(10,10,10,0.5)', fontSize: FontSize.sm, fontWeight: FontWeight.semibold, letterSpacing: 1 },
  title: { color: Colors.dark.textOnAccent, fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, marginTop: 3 },
  subtitle: { color: 'rgba(10,10,10,0.5)', fontSize: FontSize.md, marginTop: 2 },
  topLiftRow: { marginTop: Spacing.sm },
  topLiftBadge: { paddingHorizontal: Spacing.md, paddingVertical: 2, borderRadius: BorderRadius.full, alignSelf: 'flex-start' },
  topLiftText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: 'rgba(10,10,10,0.7)' },
  playButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.dark.textOnAccent, alignItems: 'center', justifyContent: 'center' },
})
