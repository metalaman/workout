import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '@/stores/auth-store'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { formatDate, getDayOfWeek } from '@/lib/utils'

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const MOCK_RECENT = [
  { name: 'Pull Day B', date: 'Yesterday', vol: '12,450 lbs' },
  { name: 'Leg Day', date: 'Mon', vol: '18,200 lbs' },
  { name: 'Push Day A', date: 'Sat', vol: '10,800 lbs' },
]

export default function HomeScreen() {
  const { user, profile } = useAuthStore()
  const today = getDayOfWeek()
  const displayName = profile?.displayName ?? user?.name ?? 'Athlete'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>{formatDate()}</Text>
            <Text style={styles.greeting}>Hey, {displayName} 👋</Text>
          </View>
          <LinearGradient colors={['#e8ff47', '#7fff00']} style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </LinearGradient>
        </View>

        {/* Weekly Streak */}
        <View style={styles.streakContainer}>
          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <Text style={styles.streakTitle}>🔥 {profile?.streakCount ?? 0} WEEK STREAK</Text>
              <Text style={styles.streakSubtitle}>0/5 this week</Text>
            </View>
            <View style={styles.daysRow}>
              {DAYS.map((d, i) => (
                <View key={i} style={styles.dayColumn}>
                  <LinearGradient
                    colors={i < today ? ['#e8ff47', '#a8e000'] : ['transparent', 'transparent']}
                    style={[
                      styles.dayCircle,
                      i >= today && styles.dayCircleInactive,
                      i === today && styles.dayCircleCurrent,
                    ]}
                  >
                    <Text style={[styles.dayCheck, { color: i < today ? Colors.dark.textOnAccent : Colors.dark.textMuted }]}>
                      {i < today ? '✓' : ''}
                    </Text>
                  </LinearGradient>
                  <Text style={styles.dayLabel}>{d}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Today's Workout */}
        <TouchableOpacity activeOpacity={0.9} style={styles.todayContainer}>
          <LinearGradient colors={['#e8ff47', '#7fff00']} style={styles.todayCard}>
            <View>
              <Text style={styles.todayLabel}>TODAY'S WORKOUT</Text>
              <Text style={styles.todayTitle}>Push Day A</Text>
              <Text style={styles.todaySubtitle}>5 exercises · ~45 min</Text>
            </View>
            <View style={styles.playButton}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Recent Workouts */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>RECENT</Text>
          {MOCK_RECENT.map((w, i) => (
            <View key={i} style={styles.recentCard}>
              <View>
                <Text style={styles.recentName}>{w.name}</Text>
                <Text style={styles.recentDate}>{w.date}</Text>
              </View>
              <Text style={styles.recentVolume}>{w.vol}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  dateText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
  },
  greeting: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: FontWeight.extrabold,
    fontSize: FontSize.xl,
    color: Colors.dark.textOnAccent,
  },
  streakContainer: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  streakCard: {
    backgroundColor: Colors.dark.accentSurface,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  streakTitle: {
    color: Colors.dark.accent,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  streakSubtitle: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
  },
  daysRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  dayCircleInactive: {
    backgroundColor: Colors.dark.surface,
  },
  dayCircleCurrent: {
    backgroundColor: 'rgba(232,255,71,0.2)',
    borderWidth: 1,
    borderColor: Colors.dark.accentBorderStrong,
  },
  dayCheck: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  dayLabel: {
    fontSize: FontSize.xs,
    color: Colors.dark.textMuted,
  },
  todayContainer: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  todayCard: {
    borderRadius: BorderRadius.xxl,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayLabel: {
    color: 'rgba(10,10,10,0.5)',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
  },
  todayTitle: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    marginTop: 3,
  },
  todaySubtitle: {
    color: 'rgba(10,10,10,0.5)',
    fontSize: FontSize.md,
    marginTop: 2,
  },
  playButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.dark.textOnAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: FontSize.xxl,
    color: Colors.dark.text,
  },
  recentSection: {
    paddingHorizontal: Spacing.xxl,
    flex: 1,
  },
  sectionTitle: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  recentCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentName: {
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  recentDate: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  recentVolume: {
    color: Colors.dark.accent,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
})
