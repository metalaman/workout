import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { HapticTab } from '@/components/haptic-tab'
import { Colors, FontSize, FontWeight } from '@/constants/theme'

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={tabStyles.container}>
      <Text style={[tabStyles.icon, { opacity: focused ? 1 : 0.4 }]}>{icon}</Text>
      <Text style={[tabStyles.label, { color: focused ? Colors.dark.accent : Colors.dark.textMuted, fontWeight: focused ? FontWeight.bold : FontWeight.regular }]}>
        {label}
      </Text>
    </View>
  )
}

const tabStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    marginBottom: 1,
  },
  label: {
    fontSize: FontSize.xs,
  },
})

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors.dark.tabBar,
          borderTopColor: Colors.dark.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📚" label="Library" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="program"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" label="Program" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📈" label="Progress" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👥" label="Social" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
