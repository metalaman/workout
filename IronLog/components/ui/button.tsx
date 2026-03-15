import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style, textStyle }: ButtonProps) {
  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.8} style={style}>
        <LinearGradient colors={['#e8ff47', '#a8e000']} style={styles.primary}>
          {loading ? (
            <ActivityIndicator color={Colors.dark.textOnAccent} />
          ) : (
            <Text style={[styles.primaryText, textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[variant === 'secondary' ? styles.secondary : styles.ghost, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? Colors.dark.accent : Colors.dark.textSecondary} />
      ) : (
        <Text style={[variant === 'secondary' ? styles.secondaryText : styles.ghostText, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  primary: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  secondary: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  secondaryText: {
    color: Colors.dark.accent,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  ghost: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
})
