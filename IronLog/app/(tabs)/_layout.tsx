import { Tabs } from 'expo-router'
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import { HapticTab } from '@/components/haptic-tab'
import { Colors, FontSize, FontWeight } from '@/constants/theme'
import { useSocialStore } from '@/stores/social-store'
import type { Href } from 'expo-router'

const TabIcon = React.memo(function TabIcon({ icon, focused, badge }: { icon: React.ReactNode; focused: boolean; badge?: boolean }) {
  return (
    <View style={tabStyles.container}>
      <View style={{ opacity: focused ? 1 : 0.4 }}>
        {icon}
        {badge && <View style={tabStyles.badge} />}
      </View>
    </View>
  )
})

// Minimal SVG tab icons (20×20)
const sz = 20
const sc = Colors.dark.text

const HomeIcon = React.memo(() => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none">
    <Path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" stroke={sc} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
))

const PlanIcon = React.memo(() => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none">
    <Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 104 0M9 5a2 2 0 014 0m-5 9l2 2 4-4" stroke={sc} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
))

const StatsIcon = React.memo(() => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none">
    <Path d="M16 8v8m-4-5v5m-4-2v2m-2 4h16a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" stroke={sc} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
))

const NutritionIcon = React.memo(() => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm4-6v2m4-2v2m4-2v2" stroke={sc} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
))

const FeedIcon = React.memo(() => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm13 10v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" stroke={sc} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
))

const ProfileIcon = React.memo(() => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke={sc} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
))

const tabStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
})

export default function TabLayout() {
  const { groups } = useSocialStore()
  const hasUnread = groups.length > 0

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        lazy: true,
        tabBarStyle: {
          backgroundColor: Colors.dark.tabBar,
          borderTopColor: Colors.dark.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 12,
          paddingTop: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={<HomeIcon />} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="program"
        options={{
          lazy: true,
          tabBarIcon: ({ focused }) => <TabIcon icon={<PlanIcon />} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          lazy: true,
          tabBarIcon: ({ focused }) => <TabIcon icon={<NutritionIcon />} label="Nutrition" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          lazy: true,
          tabBarIcon: ({ focused }) => <TabIcon icon={<FeedIcon />} focused={focused} badge={hasUnread} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          lazy: true,
          tabBarIcon: ({ focused }) => <TabIcon icon={<ProfileIcon />} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          href: null as unknown as Href,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          href: null as unknown as Href,
        }}
      />
    </Tabs>
  )
}
