import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Href } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useSessionStore } from '@/stores/session-store'
import { useSocialStore } from '@/stores/social-store'
import { useAuthStore } from '@/stores/auth-store'
import { formatDuration, formatVolume } from '@/lib/utils'

export default function WorkoutSummaryScreen() {
  const router = useRouter()
  const { lastCompletedSession, newPRs, clearCompletionData } = useSessionStore()
  const { shareWorkout } = useSocialStore()
  const { user, profile } = useAuthStore()

  if (!lastCompletedSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No workout data</Text>
          <TouchableOpacity onPress={() => { clearCompletionData(); router.replace('/(tabs)' as Href) }}>
            <Text style={styles.backLink}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const session = lastCompletedSession

  const handleShare = async () => {
    if (!user) return
    const prText = newPRs.length > 0 ? ` 🏆 ${newPRs.length} new PR${newPRs.length > 1 ? 's' : ''}!` : ''
    await shareWorkout({
      userId: user.$id,
      userName: profile?.displayName ?? user.name ?? 'Athlete',
      avatarColor: profile?.avatarColor ?? '#e8ff47',
      sessionId: session.$id,
      text: `Completed ${session.programDayName}!${prText}`,
      stats: `${session.programDayName} · ${formatVolume(session.totalVolume)} lbs total`,
      isPR: newPRs.length > 0,
      likes: 0,
      likedBy: [],
    })
  }

  const handleDone = () => {
    clearCompletionData()
    router.replace('/(tabs)' as Href)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.heroTitle}>Workout Complete!</Text>
          <Text style={styles.heroSubtitle}>{session.programDayName}</Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(session.duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatVolume(session.totalVolume)}</Text>
            <Text style={styles.statLabel}>Total Volume (lbs)</Text>
          </View>
        </View>

        {/* New PRs */}
        {newPRs.length > 0 && (
          <View style={styles.prSection}>
            <Text style={styles.sectionTitle}>🏆 NEW PERSONAL RECORDS</Text>
            {newPRs.map((pr, i) => (
              <View key={i} style={styles.prCard}>
                <View>
                  <Text style={styles.prExercise}>{pr.exerciseName}</Text>
                  <Text style={styles.prDetail}>
                    {pr.weight} lbs × {pr.reps} reps
                  </Text>
                </View>
                <View style={styles.prBadge}>
                  <Text style={styles.prBadgeText}>1RM: {pr.estimated1RM}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleShare} activeOpacity={0.8}>
            <View style={styles.shareButton}>
              <Text style={styles.shareButtonText}>📤 Share to Feed</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDone} activeOpacity={0.8}>
            <LinearGradient colors={['#e8ff47', '#a8e000']} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxxl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  emptyText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xxl,
  },
  backLink: {
    color: Colors.dark.accent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  checkmark: {
    fontSize: 48,
    color: Colors.dark.accent,
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    color: Colors.dark.text,
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
  },
  heroSubtitle: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xl,
    marginTop: Spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.accentSurface,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
    borderRadius: BorderRadius.xxl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  statValue: {
    color: Colors.dark.accent,
    fontSize: FontSize.title,
    fontWeight: FontWeight.extrabold,
  },
  statLabel: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  prSection: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    color: Colors.dark.accent,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  prCard: {
    backgroundColor: Colors.dark.accentSurface,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorderStrong,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  prExercise: {
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  prDetail: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  prBadge: {
    backgroundColor: Colors.dark.accent,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  prBadgeText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  actions: {
    gap: Spacing.md,
    marginBottom: Spacing.xxxxl,
  },
  shareButton: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  shareButtonText: {
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  doneButton: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  doneButtonText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
})
