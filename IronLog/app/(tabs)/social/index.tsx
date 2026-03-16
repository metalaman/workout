import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, TextInput, Modal, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Href } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path } from 'react-native-svg'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth-store'
import { useSocialStore } from '@/stores/social-store'
import type { Group } from '@/types/social'

export default function GroupsListScreen() {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const { groups, isLoading, loadGroups, joinGroupByCode } = useSocialStore()
  const [joinModalVisible, setJoinModalVisible] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (user?.$id) loadGroups(user.$id)
  }, [user?.$id])

  const onRefresh = useCallback(() => {
    if (user?.$id) loadGroups(user.$id)
  }, [user?.$id])

  const handleJoinByCode = async () => {
    if (!inviteCode.trim() || !user?.$id) return
    setJoining(true)
    try {
      const group = await joinGroupByCode(
        inviteCode.trim().toUpperCase(),
        user.$id,
        profile?.displayName ?? user.name ?? 'Athlete',
        profile?.avatarColor ?? '#e8ff47'
      )
      setJoinModalVisible(false)
      setInviteCode('')
      router.push(`/(tabs)/social/${group.$id}` as Href)
    } catch {
      Alert.alert('Error', 'Invalid invite code or already a member')
    } finally {
      setJoining(false)
    }
  }

  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/(tabs)/social/${item.$id}` as Href)}
    >
      <View style={[styles.groupAvatar, { backgroundColor: item.avatarColor || Colors.dark.accent }]}>
        <Text style={styles.groupAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.groupMeta} numberOfLines={1}>
          {item.memberCount} member{item.memberCount !== 1 ? 's' : ''}
          {item.description ? ` · ${item.description}` : ''}
        </Text>
      </View>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18l6-6-6-6" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </TouchableOpacity>
  )

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
          <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm13 10v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" stroke={Colors.dark.textMuted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
      <Text style={styles.emptyTitle}>No groups yet</Text>
      <Text style={styles.emptySubtitle}>Create a group or join one with an invite code</Text>
      <View style={styles.emptyActions}>
        <TouchableOpacity
          style={styles.emptyButton}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/social/create' as Href)}
        >
          <LinearGradient colors={['#e8ff47', '#a8e000']} style={styles.emptyButtonGrad}>
            <Text style={styles.emptyButtonText}>Create Group</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.emptyButtonOutline}
          activeOpacity={0.8}
          onPress={() => setJoinModalVisible(true)}
        >
          <Text style={styles.emptyButtonOutlineText}>Join with Code</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groups</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setJoinModalVisible(true)}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke={Colors.dark.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push('/(tabs)/social/create' as Href)}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M12 5v14m-7-7h14" stroke={Colors.dark.accent} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      {/* Groups List */}
      <FlatList
        data={groups}
        keyExtractor={(item) => item.$id}
        renderItem={renderGroup}
        contentContainerStyle={groups.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={isLoading ? null : EmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={Colors.dark.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Join Modal */}
      <Modal visible={joinModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setJoinModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join a Group</Text>
            <Text style={styles.modalSubtitle}>Enter the 6-character invite code</Text>
            <TextInput
              style={styles.codeInput}
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="ABC123"
              placeholderTextColor={Colors.dark.textMuted}
              maxLength={6}
              autoCapitalize="characters"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => { setJoinModalVisible(false); setInviteCode('') }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalJoin, !inviteCode.trim() && styles.modalJoinDisabled]}
                onPress={handleJoinByCode}
                disabled={!inviteCode.trim() || joining}
              >
                {joining ? (
                  <ActivityIndicator size="small" color={Colors.dark.textOnAccent} />
                ) : (
                  <Text style={styles.modalJoinText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    paddingVertical: Spacing.xl,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxxxl,
    gap: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.title,
    fontWeight: FontWeight.extrabold,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    color: Colors.dark.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
  },
  groupMeta: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.md,
    marginTop: 2,
  },
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  emptyTitle: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  emptySubtitle: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.lg,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
  },
  emptyActions: {
    gap: Spacing.lg,
    width: '100%',
  },
  emptyButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  emptyButtonGrad: {
    padding: Spacing.xl,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  emptyButtonText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  emptyButtonOutline: {
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyButtonOutlineText: {
    color: Colors.dark.accent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxxl,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxxl,
    width: '100%',
  },
  modalTitle: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  modalSubtitle: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.lg,
    marginBottom: Spacing.xxl,
  },
  codeInput: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.xxl,
  },
  modalCancel: {
    flex: 1,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
  },
  modalCancelText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
  },
  modalJoin: {
    flex: 1,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.accent,
    alignItems: 'center',
  },
  modalJoinDisabled: {
    opacity: 0.4,
  },
  modalJoinText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
})
