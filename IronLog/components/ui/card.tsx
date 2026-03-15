import { View, StyleSheet, ViewStyle } from 'react-native'
import { Colors, BorderRadius, Spacing } from '@/constants/theme'

interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'accent' | 'transparent'
  style?: ViewStyle
}

export function Card({ children, variant = 'default', style }: CardProps) {
  return (
    <View style={[styles.base, variantStyles[variant], style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
})

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: Colors.dark.surface,
  },
  accent: {
    backgroundColor: Colors.dark.accentSurface,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
})
