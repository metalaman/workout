import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Rect, Line } from 'react-native-svg'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth-store'
import { useSessionStore } from '@/stores/session-store'

/* ── Mini SVG icons for nav cards ── */
const iconSize = 26
const iconColor = Colors.dark.accent

const DumbbellIcon = () => (
  <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
    <Path d="M6.5 6.5h11M6.5 17.5h11M4 10h2.5v4H4a1 1 0 01-1-1v-2a1 1 0 011-1zm16 0h-2.5v4H20a1 1 0 001-1v-2a1 1 0 00-1-1zM6.5 6.5A1.5 1.5 0 018 5h0a1.5 1.5 0 011.5 1.5v11A1.5 1.5 0 018 19h0a1.5 1.5 0 01-1.5-1.5zM14.5 6.5A1.5 1.5 0 0116 5h0a1.5 1.5 0 011.5 1.5v11A1.5 1.5 0 0116 19h0a1.5 1.5 0 01-1.5-1.5z" stroke={iconColor} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

const ChartIcon = () => (
  <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
    <Path d="M16 8v8m-4-5v5m-4-2v2m-2 4h16a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" stroke={iconColor} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

const ScaleIcon = () => (
  <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3v1m0 16v1m-9-9h1m16 0h1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" stroke={iconColor} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

const GearIcon = () => (
  <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
    <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke={iconColor} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={iconColor} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

const ChevronRight = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

/* ── Nav Card data ── */
interface NavItem {
  icon: React.ReactNode
  label: string
  route: string
}

const navItems: NavItem[] = [
  { icon: <DumbbellIcon />, label: 'Exercise Library', route: '/(tabs)/library' },
  { icon: <ChartIcon />, label: 'Stats & Progress', route: '/(tabs)/progress' },
  { icon: <ScaleIcon />, label: 'Body Stats', route: '/stats/body' },
  { icon: <GearIcon />, label: 'Settings', route: '/settings' },
]

export default function ProfileScreen() {
  const router = useRouter()
  const { user, profile, logout } = useAuthStore()
  const { allSessions, personalRecords } = useSessionStore()

  const displayName = profile?.displayName ?? user?.name ?? 'Athlete'
  const initial = displayName.charAt(0).toUpperCase()

  const totalWorkouts = allSessions.filter((s) => s.completedAt).length
  const totalVolume = allSessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0)
  const totalDuration = allSessions.reduce((acc, s) => acc + (s.duration || 0), 0)
  const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts / 60) : 0

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout()
          } catch {
            // Still navigate away
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={[profile?.avatarColor ?? '#e8ff47', '#7fff00']}
            style={styles.avatarLarge}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </LinearGradient>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>YOUR STATS</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalWorkouts}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(0)}k` : totalVolume}
              </Text>
              <Text style={styles.statLabel}>Total Volume (lbs)</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile?.streakCount ?? 0}</Text>
              <Text style={styles.statLabel}>Week Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{avgDuration}</Text>
              <Text style={styles.statLabel}>Avg Min/Workout</Text>
            </View>
          </View>
        </View>

        {/* PRs */}
        {personalRecords.length > 0 && (
          <View style={styles.prSection}>
            <Text style={styles.sectionTitle}>PERSONAL RECORDS</Text>
            {personalRecords.slice(0, 5).map((pr, i) => (
              <View key={i} style={styles.prRow}>
                <Text style={styles.prName}>{pr.exerciseName}</Text>
                <Text style={styles.prValue}>{pr.estimated1RM} lbs</Text>
              </View>
            ))}
          </View>
        )}

        {/* Navigation Cards */}
        <View style={styles.navSection}>
          {navItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.navCard}
              activeOpacity={0.6}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.navCardLeft}>
                {item.icon}
                <Text style={styles.navCardLabel}>{item.label}</Text>
              </View>
              <ChevronRight />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  avatarText: {
    fontWeight: FontWeight.extrabold,
    fontSize: 28,
    color: Colors.dark.background,
  },
  name: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
  },
  email: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
  statsSection: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  statValue: {
    color: Colors.dark.accent,
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
  },
  statLabel: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  prSection: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  prName: {
    color: Colors.dark.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  prValue: {
    color: Colors.dark.accent,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  navSection: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
  },
  navCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  navCardLabel: {
    color: Colors.dark.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
  },
  logoutSection: {
    paddingHorizontal: Spacing.xxl,
  },
  logoutButton: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.dark.danger,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
})
