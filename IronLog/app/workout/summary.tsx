import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, FlatList, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Href } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path } from 'react-native-svg'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useSessionStore } from '@/stores/session-store'
import { useSocialStore } from '@/stores/social-store'
import { useAuthStore } from '@/stores/auth-store'
import { formatDuration, formatVolume } from '@/lib/utils'
import type { Group, WorkoutShareData } from '@/types/social'

export default function WorkoutSummaryScreen() {
  const router = useRouter()
  const { lastCompletedSession, newPRs, clearCompletionData } = useSessionStore()
  const { groups, loadGroups, shareWorkout } = useSocialStore()
  const { user, profile } = useAuthStore()
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    if (user?.$id) loadGroups(user.$id)
  }, [user?.$id])

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

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const handleShare = async () => {
    if (!user?.$id || selectedGroups.size === 0) return
    setSharing(true)

    const workoutData: WorkoutShareData = {
      programDayName: session.programDayName,
      totalVolume: session.totalVolume,
      duration: session.duration,
      prCount: newPRs.length,
      prExercises: newPRs.map((pr) => pr.exerciseName),
    }

    const prText = newPRs.length > 0 ? ` 🏆 ${newPRs.length} new PR${newPRs.length > 1 ? 's' : ''}!` : ''
    const text = `Completed ${session.programDayName}!${prText}`

    try {
      await shareWorkout(
        Array.from(selectedGroups),
        JSON.stringify(workoutData),
        text,
        user.$id,
        profile?.displayName ?? user.name ?? 'Athlete',
        profile?.avatarColor ?? '#e8ff47'
      )
      setShared(true)
      setShareModalVisible(false)
    } catch {} finally {
      setSharing(false)
    }
  }

  const handleDone = () => {
    clearCompletionData()
    router.replace('/(tabs)' as Href)
  }

  const renderGroupOption = ({ item }: { item: Group }) => {
    const selected = selectedGroups.has(item.$id)
    return (
      <TouchableOpacity
        style={[styles.groupOption, selected && styles.groupOptionSelected]}
        onPress={() => toggleGroup(item.$id)}
        activeOpacity={0.7}
      >
        <View style={[styles.groupAvatar, { backgroundColor: item.avatarColor || Colors.dark.accent }]}>
          <Text style={styles.groupAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && (
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M20 6L9 17l-5-5" stroke={Colors.dark.textOnAccent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.checkCircle}>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              <Path d="M20 6L9 17l-5-5" stroke={Colors.dark.textOnAccent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
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
          <TouchableOpacity
            onPress={() => setShareModalVisible(true)}
            activeOpacity={0.8}
            disabled={shared}
          >
            <View style={[styles.shareButton, shared && styles.shareButtonDone]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke={shared ? Colors.dark.accent : Colors.dark.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={[styles.shareButtonText, shared && styles.shareButtonTextDone]}>
                {shared ? 'Shared to Groups ✓' : 'Share to Groups'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDone} activeOpacity={0.8}>
            <LinearGradient colors={['#e8ff47', '#a8e000']} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Share Modal */}
      <Modal visible={shareModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share to Groups</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {groups.length === 0 ? (
              <View style={styles.noGroups}>
                <Text style={styles.noGroupsText}>No groups yet</Text>
                <Text style={styles.noGroupsSubtext}>Create or join a group first</Text>
              </View>
            ) : (
              <FlatList
                data={groups}
                keyExtractor={(item) => item.$id}
                renderItem={renderGroupOption}
                contentContainerStyle={styles.groupsList}
                showsVerticalScrollIndicator={false}
              />
            )}

            <TouchableOpacity
              style={[styles.shareConfirmBtn, selectedGroups.size === 0 && styles.shareConfirmDisabled]}
              onPress={handleShare}
              disabled={selectedGroups.size === 0 || sharing}
              activeOpacity={0.8}
            >
              {sharing ? (
                <ActivityIndicator color={Colors.dark.textOnAccent} />
              ) : (
                <Text style={styles.shareConfirmText}>
                  Share{selectedGroups.size > 0 ? ` to ${selectedGroups.size} group${selectedGroups.size > 1 ? 's' : ''}` : ''}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
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
    flexDirection: 'row',
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  shareButtonDone: {
    backgroundColor: Colors.dark.accentSurface,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
  },
  shareButtonText: {
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  shareButtonTextDone: {
    color: Colors.dark.accent,
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    maxHeight: '70%',
    padding: Spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  modalTitle: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
  },
  modalClose: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.title,
    padding: Spacing.md,
  },
  groupsList: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  groupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  groupOptionSelected: {
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
    backgroundColor: Colors.dark.accentSurface,
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
  },
  groupName: {
    color: Colors.dark.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.dark.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  noGroups: {
    alignItems: 'center',
    padding: Spacing.xxxxl,
  },
  noGroupsText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.semibold,
  },
  noGroupsSubtext: {
    color: Colors.dark.textDark,
    fontSize: FontSize.lg,
    marginTop: Spacing.sm,
  },
  shareConfirmBtn: {
    backgroundColor: Colors.dark.accent,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  shareConfirmDisabled: {
    opacity: 0.4,
  },
  shareConfirmText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
})
