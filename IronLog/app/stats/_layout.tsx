import { Stack } from 'expo-router'
import { Colors } from '@/constants/theme'

export default function StatsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.dark.background } }}>
      <Stack.Screen name="body" />
      <Stack.Screen name="photos" />
    </Stack>
  )
}
