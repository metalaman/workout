import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme'

interface Props {
  title: string
  actionLabel?: string
  onAction?: () => void
}

export const SectionHeader = React.memo(({ title, actionLabel, onAction }: Props) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    {actionLabel && onAction && (
      <TouchableOpacity onPress={onAction} activeOpacity={0.7} hitSlop={8}>
        <Text style={styles.action}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
))

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  action: {
    color: Colors.dark.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
})
