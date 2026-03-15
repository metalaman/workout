import { Stack } from 'expo-router'
import { Colors } from '@/constants/theme'

export default function ProgramLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.dark.background } }}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
