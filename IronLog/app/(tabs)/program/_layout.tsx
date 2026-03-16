import { Stack } from 'expo-router'
import { Colors } from '@/constants/theme'

export default function ProgramLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.dark.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="edit-day" />
      <Stack.Screen name="pick-exercise" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  )
}
