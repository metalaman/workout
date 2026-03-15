import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'

interface InputProps extends TextInputProps {
  label?: string
  icon?: string
}

export function Input({ label, icon, style, ...props }: InputProps) {
  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.container}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.dark.textMuted}
          {...props}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  icon: {
    fontSize: FontSize.xl,
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: FontSize.lg,
  },
})
