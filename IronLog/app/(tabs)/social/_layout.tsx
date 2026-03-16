import { Stack } from 'expo-router'
import { Colors } from '@/constants/theme'

export default function SocialLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.dark.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[groupId]" />
      <Stack.Screen name="create" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="members" options={{ animation: 'slide_from_right' }} />
    </Stack>
  )
}
