import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth-store'
import { useSessionStore } from '@/stores/session-store'

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
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 50 }} />
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

        {/* Stats */}
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

        {/* Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Units</Text>
              <Text style={styles.settingValue}>lbs</Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Default Rest Timer</Text>
              <Text style={styles.settingValue}>90s</Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Weekly Goal</Text>
              <Text style={styles.settingValue}>{profile?.weeklyGoal ?? 5} days</Text>
            </View>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  backButton: {
    color: Colors.dark.accent,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
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
    color: Colors.dark.textOnAccent,
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
    backgroundColor: Colors.dark.accentSurface,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  statValue: {
    color: Colors.dark.accent,
    fontSize: FontSize.title,
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
  settingsSection: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  settingsCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  settingLabel: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
  },
  settingValue: {
    color: Colors.dark.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  logoutSection: {
    paddingHorizontal: Spacing.xxl,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.dark.danger,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
})
