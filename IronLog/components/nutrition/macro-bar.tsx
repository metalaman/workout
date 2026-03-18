import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme'

interface MacroBarProps {
  label: string
  current: number
  target: number
  color: string
  unit?: string
}

export const MacroBar = React.memo(function MacroBar({
  label,
  current,
  target,
  color,
  unit = 'g',
}: MacroBarProps) {
  const percentage = Math.min(current / Math.max(target, 1), 1)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.values}>
          <Text style={styles.current}>{Math.round(current)}</Text>
          <Text style={styles.target}> / {target}{unit}</Text>
        </Text>
      </View>
      <View style={styles.trackOuter}>
        <View
          style={[
            styles.trackFill,
            {
              backgroundColor: color,
              width: `${percentage * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  )
})

/** Macro colors used across the nutrition UI */
export const MACRO_COLORS = {
  protein: '#6bc5ff',
  carbs: Colors.dark.accent,
  fat: '#ffb347',
  fiber: '#7fff00',
} as const

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    color: Colors.dark.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
  values: {
    fontSize: FontSize.base,
  },
  current: {
    color: Colors.dark.text,
    fontWeight: FontWeight.semibold,
  },
  target: {
    color: Colors.dark.textSecondary,
  },
  trackOuter: {
    height: 6,
    backgroundColor: Colors.dark.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },
})
