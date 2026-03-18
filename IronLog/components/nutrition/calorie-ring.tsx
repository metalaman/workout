import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme'

interface CalorieRingProps {
  consumed: number
  target: number
  size?: number
  strokeWidth?: number
}

export const CalorieRing = React.memo(function CalorieRing({
  consumed,
  target,
  size = 160,
  strokeWidth = 10,
}: CalorieRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min(consumed / Math.max(target, 1), 1.5)
  const strokeDashoffset = circumference * (1 - Math.min(percentage, 1))

  const getRingColor = () => {
    if (percentage <= 0.85) return Colors.dark.accent
    if (percentage <= 1.0) return Colors.dark.accentGreen
    return Colors.dark.danger
  }

  const remaining = target - consumed
  const isOver = remaining < 0

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.dark.surface}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getRingColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.consumed}>{Math.round(consumed)}</Text>
        <Text style={styles.divider}>of {target}</Text>
        <Text style={[styles.remaining, isOver && styles.overBudget]}>
          {isOver ? `${Math.abs(Math.round(remaining))} over` : `${Math.round(remaining)} left`}
        </Text>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
  },
  consumed: {
    color: Colors.dark.text,
    fontSize: FontSize.hero,
    fontWeight: FontWeight.bold,
  },
  divider: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  remaining: {
    color: Colors.dark.accent,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.xs,
  },
  overBudget: {
    color: Colors.dark.danger,
  },
})
