import { Stack } from 'expo-router'
import { Colors } from '@/constants/theme'

export default function NutritionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.dark.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      <Stack.Screen name="food-search" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="food-detail" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="manual-entry" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  )
}
