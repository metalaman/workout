import React from 'react'
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { Colors, FontSize, Spacing } from '@/constants/theme'

interface Props {
  message?: string
}

export const LoadingScreen = React.memo(({ message }: Props) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={Colors.dark.accent} />
    {message && <Text style={styles.text}>{message}</Text>}
  </View>
))

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  text: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.sm,
  },
})
