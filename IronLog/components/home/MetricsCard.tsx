import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { StrengthScoreGauge, StrengthBalanceGauge } from '@/components/strength-gauges'

interface Props {
  strengthScore: { score: number; delta: number }
  strengthBalance: { push: number; pull: number; legs: number; core: number }
}

export const MetricsCard = React.memo(({ strengthScore, strengthBalance }: Props) => {
  const [activeCard, setActiveCard] = useState<0 | 1>(0)

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        {activeCard === 0 ? (
          <>
            <Text style={styles.label}>STRENGTH SCORE</Text>
            <StrengthScoreGauge score={strengthScore.score} delta={strengthScore.delta} />
          </>
        ) : (
          <StrengthBalanceGauge {...strengthBalance} />
        )}
      </View>
      <View style={styles.dotRow}>
        <TouchableOpacity onPress={() => setActiveCard(0)} hitSlop={8}>
          <View style={[styles.dot, activeCard === 0 && styles.dotActive]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveCard(1)} hitSlop={8}>
          <View style={[styles.dot, activeCard === 1 && styles.dotActive]} />
        </TouchableOpacity>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.border,
  },
  dotActive: {
    backgroundColor: Colors.dark.accent,
  },
})
