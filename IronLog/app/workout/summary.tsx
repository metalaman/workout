import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, FlatList, ActivityIndicator, TextInput, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Href } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path } from 'react-native-svg'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useSessionStore } from '@/stores/session-store'
import { useSocialStore } from '@/stores/social-store'
import { useAuthStore } from '@/stores/auth-store'
import { ExerciseIcon } from '@/components/exercise-icon'
import { formatDuration, formatVolume } from '@/lib/utils'
import type { Group, WorkoutShareData } from '@/types/social'
import type { ActiveWorkoutExercise } from '@/types'

export default function WorkoutSummaryScreen() {
  const router = useRouter()
  const { lastCompletedSession, lastCompletedExercises, newPRs, clearCompletionData } = useSessionStore()
  const { groups, loadGroups, shareWorkout } = useSocialStore()
  const { user, profile } = useAuthStore()
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editExercises, setEditExercises] = useState<ActiveWorkoutExercise[]>([])

  useEffect(() => {
    if (user?.$id) loadGroups(user.$id)
  }, [user?.$id])

  useEffect(() => {
    if (lastCompletedExercises.length > 0) {
      setEditExercises(JSON.parse(JSON.stringify(lastCompletedExercises)))
    }
  }, [lastCompletedExercises])

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
  const exercisesToShow = isEditing ? editExercises : lastCompletedExercises

  // Calculate totals from exercises
  const totalSetsCompleted = exercisesToShow.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.isCompleted).length, 0
  )
  const totalSets = exercisesToShow.reduce((sum, ex) => sum + ex.sets.length, 0)

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
        Array.from(selectedGroups), JSON.stringify(workoutData), text,
        user.$id, profile?.displayName ?? user.name ?? 'Athlete', profile?.avatarColor ?? '#e8ff47'
      )
      setShared(true)
      setShareModalVisible(false)
    } catch (e) { console.warn('[Summary] share failed:', e) } finally { setSharing(false) }
  }

  const handleDone = () => {
    clearCompletionData()
    router.replace('/(tabs)' as Href)
  }

  const handleEditSet = (exIdx: number, setIdx: number, field: 'weight' | 'reps', value: string) => {
    const updated = JSON.parse(JSON.stringify(editExercises))
    const num = parseInt(value, 10) || 0
    updated[exIdx].sets[setIdx][field] = num
    setEditExercises(updated)
  }

  const handleToggleSetComplete = (exIdx: number, setIdx: number) => {
    const updated = JSON.parse(JSON.stringify(editExercises))
    updated[exIdx].sets[setIdx].isCompleted = !updated[exIdx].sets[setIdx].isCompleted
    setEditExercises(updated)
  }

  const handleSaveEdits = () => {
    // TODO: persist to Appwrite
    setIsEditing(false)
    Alert.alert('Saved', 'Workout updated')
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
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleDone} style={styles.backBtn}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke={Colors.dark.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.heroTitle}>{session.programDayName}</Text>
            <Text style={styles.heroSubtitle}>
              {new Date(session.startedAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity onPress={() => isEditing ? handleSaveEdits() : setIsEditing(true)} style={styles.editBtn}>
            <Text style={styles.editBtnText}>{isEditing ? 'Save' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatVolume(session.totalVolume) || '—'}</Text>
            <Text style={styles.statLabel}>Volume (lbs)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(session.duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.dark.accent }]}>{newPRs.length}</Text>
            <Text style={styles.statLabel}>PRs</Text>
          </View>
        </View>

        {/* Exercises performed */}
        {exercisesToShow.length > 0 && (
          <View style={styles.exercisesSection}>
            <Text style={styles.sectionTitle}>WORKOUT SUMMARY</Text>
            {exercisesToShow.map((ex, exIdx) => {
              const completedSets = ex.sets.filter((s) => s.isCompleted)
              const bestSet = completedSets.reduce(
                (best, s) => (s.weight * s.reps > best.weight * best.reps ? s : best),
                { weight: 0, reps: 0, setNumber: 0, previousWeight: null, previousReps: null, isCompleted: false }
              )
              return (
                <View key={exIdx} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <ExerciseIcon exerciseName={ex.exerciseName} size={36} />
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                      <Text style={styles.exerciseMeta}>
                        {completedSets.length}/{ex.sets.length} sets completed
                        {bestSet.weight > 0 ? ` · Best: ${bestSet.weight}×${bestSet.reps}` : ''}
                      </Text>
                    </View>
                    {newPRs.find((pr) => pr.exerciseId === ex.exerciseId) && (
                      <View style={styles.prBadge}>
                        <Text style={styles.prBadgeText}>PR</Text>
                      </View>
                    )}
                  </View>
                  {/* Sets table */}
                  <View style={styles.setsTable}>
                    <View style={styles.setHeaderRow}>
                      <Text style={[styles.setHeaderText, { flex: 0.5 }]}>SET</Text>
                      <Text style={styles.setHeaderText}>LBS</Text>
                      <Text style={styles.setHeaderText}>REPS</Text>
                      <Text style={[styles.setHeaderText, { flex: 0.5 }]}>✓</Text>
                    </View>
                    {ex.sets.map((s, setIdx) => (
                      <View key={setIdx} style={[styles.setRow, s.isCompleted && styles.setRowCompleted]}>
                        <Text style={[styles.setCellText, { flex: 0.5 }]}>{s.setNumber}</Text>
                        {isEditing ? (
                          <TextInput
                            style={styles.setCellInput}
                            value={String(editExercises[exIdx]?.sets[setIdx]?.weight ?? s.weight)}
                            onChangeText={(v) => handleEditSet(exIdx, setIdx, 'weight', v)}
                            keyboardType="numeric"
                          />
                        ) : (
                          <Text style={styles.setCellText}>{s.weight || '—'}</Text>
                        )}
                        {isEditing ? (
                          <TextInput
                            style={styles.setCellInput}
                            value={String(editExercises[exIdx]?.sets[setIdx]?.reps ?? s.reps)}
                            onChangeText={(v) => handleEditSet(exIdx, setIdx, 'reps', v)}
                            keyboardType="numeric"
                          />
                        ) : (
                          <Text style={styles.setCellText}>{s.reps || '—'}</Text>
                        )}
                        {isEditing ? (
                          <TouchableOpacity
                            style={{ flex: 0.5, alignItems: 'center' }}
                            onPress={() => handleToggleSetComplete(exIdx, setIdx)}
                          >
                            <View style={[styles.checkDot, editExercises[exIdx]?.sets[setIdx]?.isCompleted && styles.checkDotActive]} />
                          </TouchableOpacity>
                        ) : (
                          <View style={{ flex: 0.5, alignItems: 'center' }}>
                            {s.isCompleted ? (
                              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                                <Path d="M20 6L9 17l-5-5" stroke={Colors.dark.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                              </Svg>
                            ) : (
                              <Text style={styles.skippedText}>—</Text>
                            )}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* No exercises fallback */}
        {exercisesToShow.length === 0 && (
          <View style={styles.noExercises}>
            <Text style={styles.noExercisesTitle}>
              {session.programDayName} completed on{' '}
              {new Date(session.startedAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
            <Text style={styles.noExercisesSubtitle}>Duration: {formatDuration(session.duration)}</Text>
          </View>
        )}

        {/* New PRs */}
        {newPRs.length > 0 && (
          <View style={styles.prSection}>
            <Text style={styles.sectionTitle}>🏆 NEW PERSONAL RECORDS</Text>
            {newPRs.map((pr, i) => (
              <View key={i} style={styles.prCard}>
                <View>
                  <Text style={styles.prExercise}>{pr.exerciseName}</Text>
                  <Text style={styles.prDetail}>{pr.weight} lbs × {pr.reps} reps</Text>
                </View>
                <View style={styles.prBadgeLarge}>
                  <Text style={styles.prBadgeLargeText}>1RM: {pr.estimated1RM}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => setShareModalVisible(true)} activeOpacity={0.8} disabled={shared}>
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
              </View>
            ) : (
              <FlatList
                data={groups} keyExtractor={(item) => item.$id}
                renderItem={renderGroupOption}
                contentContainerStyle={styles.groupsList}
                showsVerticalScrollIndicator={false}
              />
            )}
            <TouchableOpacity
              style={[styles.shareConfirmBtn, selectedGroups.size === 0 && styles.shareConfirmDisabled]}
              onPress={handleShare} disabled={selectedGroups.size === 0 || sharing} activeOpacity={0.8}
            >
              {sharing ? <ActivityIndicator color={Colors.dark.textOnAccent} /> : (
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
  container: { flex: 1, backgroundColor: Colors.dark.background },
  scroll: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg, paddingBottom: Spacing.xxxxl },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.xl },
  emptyText: { color: Colors.dark.textMuted, fontSize: FontSize.xxl },
  backLink: { color: Colors.dark.accent, fontSize: FontSize.xl, fontWeight: FontWeight.semibold },
  // Header
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xxl },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dark.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, marginLeft: Spacing.lg },
  heroTitle: { color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.extrabold },
  heroSubtitle: { color: Colors.dark.textMuted, fontSize: FontSize.md, marginTop: 2 },
  editBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg, backgroundColor: Colors.dark.surface,
  },
  editBtnText: { color: Colors.dark.accent, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xxl },
  statCard: {
    flex: 1, backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.xxl,
    paddingVertical: Spacing.xl, alignItems: 'center',
  },
  statValue: { color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.extrabold },
  statLabel: { color: Colors.dark.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  // Exercises
  exercisesSection: { marginBottom: Spacing.xxl },
  sectionTitle: {
    color: Colors.dark.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.bold,
    letterSpacing: 1.5, marginBottom: Spacing.lg,
  },
  exerciseCard: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.xxl,
    padding: Spacing.xl, marginBottom: Spacing.md,
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.lg },
  exerciseInfo: { flex: 1 },
  exerciseName: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  exerciseMeta: { color: Colors.dark.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  prBadge: {
    backgroundColor: Colors.dark.accent, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.lg, paddingVertical: 3,
  },
  prBadgeText: { color: Colors.dark.textOnAccent, fontSize: 10, fontWeight: FontWeight.extrabold },
  // Sets table
  setsTable: {},
  setHeaderRow: {
    flexDirection: 'row', paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.dark.border, marginBottom: Spacing.xs,
  },
  setHeaderText: {
    flex: 1, color: Colors.dark.textMuted, fontSize: 10, fontWeight: FontWeight.bold,
    letterSpacing: 1, textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.md,
  },
  setRowCompleted: { backgroundColor: 'rgba(232, 255, 71, 0.04)' },
  setCellText: {
    flex: 1, color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  setCellInput: {
    flex: 1, color: Colors.dark.accent, fontSize: FontSize.lg, fontWeight: FontWeight.bold,
    textAlign: 'center', backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.md, paddingVertical: 4, marginHorizontal: 4,
  },
  checkDot: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: Colors.dark.textMuted,
  },
  checkDotActive: { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
  skippedText: { color: Colors.dark.textMuted, fontSize: FontSize.lg },
  // No exercises fallback
  noExercises: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl, marginBottom: Spacing.xxl,
  },
  noExercisesTitle: { color: Colors.dark.text, fontSize: FontSize.xl, fontWeight: FontWeight.semibold },
  noExercisesSubtitle: { color: Colors.dark.textMuted, fontSize: FontSize.lg, marginTop: Spacing.sm },
  // PR section
  prSection: { marginBottom: Spacing.xxl },
  prCard: {
    backgroundColor: Colors.dark.accentSurface, borderWidth: 1, borderColor: Colors.dark.accentBorderStrong,
    borderRadius: BorderRadius.lg, padding: Spacing.xl,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm,
  },
  prExercise: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  prDetail: { color: Colors.dark.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  prBadgeLarge: {
    backgroundColor: Colors.dark.accent, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  prBadgeLargeText: { color: Colors.dark.textOnAccent, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  // Actions
  actions: { gap: Spacing.md },
  shareButton: {
    flexDirection: 'row', backgroundColor: Colors.dark.surfaceLight, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
  },
  shareButtonDone: { backgroundColor: Colors.dark.accentSurface, borderWidth: 1, borderColor: Colors.dark.accentBorder },
  shareButtonText: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  shareButtonTextDone: { color: Colors.dark.accent },
  doneButton: { borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center' },
  doneButtonText: { color: Colors.dark.textOnAccent, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.dark.card, borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl, maxHeight: '70%', padding: Spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xxl,
  },
  modalTitle: { color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.bold },
  modalClose: { color: Colors.dark.textMuted, fontSize: FontSize.title, padding: Spacing.md },
  groupsList: { gap: Spacing.md, paddingBottom: Spacing.lg },
  groupOption: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xxl, padding: Spacing.xl, gap: Spacing.lg,
  },
  groupOptionSelected: { borderWidth: 1, borderColor: Colors.dark.accentBorder, backgroundColor: Colors.dark.accentSurface },
  groupAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  groupAvatarText: { color: Colors.dark.textOnAccent, fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold },
  groupName: { color: Colors.dark.text, fontSize: FontSize.xl, fontWeight: FontWeight.semibold, flex: 1 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    borderColor: Colors.dark.textMuted, alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
  noGroups: { alignItems: 'center', padding: Spacing.xxxxl },
  noGroupsText: { color: Colors.dark.textMuted, fontSize: FontSize.xxl },
  shareConfirmBtn: {
    backgroundColor: Colors.dark.accent, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, alignItems: 'center', marginTop: Spacing.lg,
  },
  shareConfirmDisabled: { opacity: 0.4 },
  shareConfirmText: { color: Colors.dark.textOnAccent, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
})
