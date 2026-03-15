import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'

interface ChipProps {
  label: string
  selected?: boolean
  onPress?: () => void
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      {selected && <Text style={styles.check}>✓</Text>}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.dark.surfaceLight,
  },
  chipSelected: {
    backgroundColor: Colors.dark.accent,
  },
  check: {
    fontSize: FontSize.sm,
    color: Colors.dark.textOnAccent,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.textSecondary,
  },
  labelSelected: {
    color: Colors.dark.textOnAccent,
  },
})
