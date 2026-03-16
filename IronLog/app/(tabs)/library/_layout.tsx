import { Stack } from 'expo-router'
import { Colors } from '@/constants/theme'

export default function LibraryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.dark.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="filters" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  )
}
