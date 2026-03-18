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
import { client, DATABASE_ID, COLLECTION } from '@/lib/appwrite'
import type { Group, GroupInvitation } from '@/types/social'

export default function GroupsListScreen() {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const {
    groups, invitations, isLoading,
    loadGroups, loadInvitations, joinGroupByCode,
    acceptInvitation, declineInvitation,
  } = useSocialStore()

  const [activeTab, setActiveTab] = useState<'groups' | 'invitations'>('groups')
  const [joinModalVisible, setJoinModalVisible] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (user?.$id) {
      loadGroups(user.$id)
      loadInvitations(user.$id)
    }
  }, [user?.$id])

  // Real-time subscription for new invitations
  useEffect(() => {
    if (!user?.$id) return
    const channel = `databases.${DATABASE_ID}.collections.${COLLECTION.GROUP_INVITATIONS}.documents`
    const unsubscribe = client.subscribe(channel, (response) => {
      const payload = response.payload as any
      if (payload?.invitedUserId === user.$id) {
        loadInvitations(user.$id)
      }
    })
    return () => { unsubscribe() }
  }, [user?.$id])

  const onRefresh = useCallback(() => {
    if (user?.$id) {
      loadGroups(user.$id)
      loadInvitations(user.$id)
    }
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

  const handleAccept = async (inv: GroupInvitation) => {
    if (!user?.$id) return
    await acceptInvitation(inv, user.$id, profile?.displayName ?? user.name ?? 'Athlete', profile?.avatarColor ?? '#e8ff47')
    Alert.alert('Joined!', `You're now a member of ${inv.groupName}`)
  }

  const handleDecline = (inv: GroupInvitation) => {
    Alert.alert('Decline Invite', `Decline invitation to ${inv.groupName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => declineInvitation(inv.$id) },
    ])
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

  const renderInvitation = ({ item }: { item: GroupInvitation }) => {
    const timeAgo = getTimeAgo(item.$createdAt)
    return (
      <View style={styles.inviteCard}>
        <View style={[styles.inviteAvatar, { backgroundColor: item.groupColor || Colors.dark.accent }]}>
          <Text style={styles.inviteAvatarText}>{item.groupName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.inviteInfo}>
          <Text style={styles.inviteName} numberOfLines={1}>{item.groupName}</Text>
          <Text style={styles.inviteMeta} numberOfLines={1}>
            Invited by {item.inviterName} · {timeAgo}
          </Text>
          <View style={styles.inviteActions}>
            <TouchableOpacity
              style={styles.acceptBtn}
              activeOpacity={0.8}
              onPress={() => handleAccept(item)}
            >
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.declineBtn}
              activeOpacity={0.8}
              onPress={() => handleDecline(item)}
            >
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  const EmptyGroups = () => (
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

  const EmptyInvitations = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
          <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm16 2l-8 5-8-5" stroke={Colors.dark.textMuted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
      <Text style={styles.emptyTitle}>No invitations</Text>
      <Text style={styles.emptySubtitle}>When someone invites you to a group, it'll show up here</Text>
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

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'groups' && styles.tabActive]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'invitations' && styles.tabActive]}
          onPress={() => setActiveTab('invitations')}
        >
          <Text style={[styles.tabText, activeTab === 'invitations' && styles.tabTextActive]}>
            Invitations
          </Text>
          {invitations.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{invitations.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'groups' ? (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.$id}
          renderItem={renderGroup}
          contentContainerStyle={groups.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={isLoading ? null : EmptyGroups}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.dark.accent} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={invitations}
          keyExtractor={(item) => item.$id}
          renderItem={renderInvitation}
          contentContainerStyle={invitations.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={isLoading ? null : EmptyInvitations}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.dark.accent} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

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

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.xl,
  },
  headerTitle: { color: Colors.dark.text, fontSize: FontSize.hero, fontWeight: FontWeight.extrabold },
  headerActions: { flexDirection: 'row', gap: Spacing.md },
  headerBtn: {
    width: 40, height: 40, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface, alignItems: 'center', justifyContent: 'center',
  },
  // Tab bar
  tabBar: {
    flexDirection: 'row', marginHorizontal: Spacing.xxl, marginBottom: Spacing.lg,
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg, padding: 3,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.sm,
  },
  tabActive: { backgroundColor: Colors.dark.surfaceLight },
  tabText: { color: Colors.dark.textMuted, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  tabTextActive: { color: Colors.dark.text },
  badge: {
    backgroundColor: '#ff4444', borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: FontWeight.bold },
  // Lists
  listContent: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxxl, gap: Spacing.md },
  emptyContainer: { flex: 1 },
  // Group card
  groupCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xxl, padding: Spacing.xl, gap: Spacing.lg,
  },
  groupAvatar: {
    width: 48, height: 48, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  groupAvatarText: { color: Colors.dark.textOnAccent, fontSize: FontSize.title, fontWeight: FontWeight.extrabold },
  groupInfo: { flex: 1 },
  groupName: { color: Colors.dark.text, fontSize: FontSize.xl, fontWeight: FontWeight.semibold },
  groupMeta: { color: Colors.dark.textMuted, fontSize: FontSize.md, marginTop: 2 },
  // Invitation card
  inviteCard: {
    flexDirection: 'row', backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xxl, padding: Spacing.xl, gap: Spacing.lg,
    borderWidth: 1, borderColor: 'rgba(232, 255, 71, 0.15)',
  },
  inviteAvatar: {
    width: 48, height: 48, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', marginTop: 4,
  },
  inviteAvatarText: { color: Colors.dark.textOnAccent, fontSize: FontSize.title, fontWeight: FontWeight.extrabold },
  inviteInfo: { flex: 1 },
  inviteName: { color: Colors.dark.text, fontSize: FontSize.xl, fontWeight: FontWeight.semibold },
  inviteMeta: { color: Colors.dark.textMuted, fontSize: FontSize.md, marginTop: 2 },
  inviteActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  acceptBtn: {
    backgroundColor: Colors.dark.accent, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xxl,
  },
  acceptBtnText: { color: Colors.dark.textOnAccent, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  declineBtn: {
    backgroundColor: Colors.dark.surfaceLight, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xxl,
  },
  declineBtnText: { color: Colors.dark.textSecondary, fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  // Empty state
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xxxxl,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  emptyTitle: { color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  emptySubtitle: { color: Colors.dark.textMuted, fontSize: FontSize.lg, textAlign: 'center', marginBottom: Spacing.xxxl },
  emptyActions: { gap: Spacing.lg, width: '100%' },
  emptyButton: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  emptyButtonGrad: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl, alignItems: 'center', borderRadius: BorderRadius.lg },
  emptyButtonText: { color: Colors.dark.textOnAccent, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  emptyButtonOutline: {
    borderWidth: 1, borderColor: Colors.dark.accentBorder, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl, alignItems: 'center',
  },
  emptyButtonOutlineText: { color: Colors.dark.accent, fontSize: FontSize.xl, fontWeight: FontWeight.semibold },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center',
    alignItems: 'center', padding: Spacing.xxxxl,
  },
  modalContent: {
    backgroundColor: '#1a1a1a', borderRadius: BorderRadius.xxl, padding: Spacing.xxxl, width: '100%',
  },
  modalTitle: { color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  modalSubtitle: { color: Colors.dark.textMuted, fontSize: FontSize.lg, marginBottom: Spacing.xxl },
  codeInput: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl,
    color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.bold,
    textAlign: 'center', letterSpacing: 8, borderWidth: 1, borderColor: Colors.dark.accentBorder,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.xxl },
  modalCancel: {
    flex: 1, padding: Spacing.xl, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.surface, alignItems: 'center',
  },
  modalCancelText: { color: Colors.dark.textSecondary, fontSize: FontSize.xl, fontWeight: FontWeight.semibold },
  modalJoin: {
    flex: 1, padding: Spacing.xl, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.accent, alignItems: 'center',
  },
  modalJoinDisabled: { opacity: 0.4 },
  modalJoinText: { color: Colors.dark.textOnAccent, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
})
