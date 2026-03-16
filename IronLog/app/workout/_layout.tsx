import { Stack } from 'expo-router'
import { Colors } from '@/constants/theme'

export default function WorkoutLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.dark.background } }}>
      <Stack.Screen name="active" />
      <Stack.Screen name="freestyle" />
      <Stack.Screen name="cardio" />
      <Stack.Screen name="summary" />
      <Stack.Screen name="detail" />
    </Stack>
  )
}
