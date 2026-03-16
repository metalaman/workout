import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth-store'
import { useSocialStore } from '@/stores/social-store'
import * as db from '@/lib/database'
import type { GroupMember, Group } from '@/types/social'

export default function MembersScreen() {
  const router = useRouter()
  const { groupId, groupName } = useLocalSearchParams<{ groupId: string; groupName: string }>()
  const { user } = useAuthStore()
  const { members, loadMembers, removeMember } = useSocialStore()
  const [group, setGroup] = useState<Group | null>(null)
  const currentUserId = user?.$id

  useEffect(() => {
    if (groupId) {
      loadMembers(groupId)
      db.getGroup(groupId).then(setGroup).catch(() => {})
    }
  }, [groupId])

  const isAdmin = members.find((m) => m.userId === currentUserId)?.role === 'admin'

  const handleCopyCode = async () => {
    if (group?.inviteCode) {
      Alert.alert('Invite Code', group.inviteCode, [{ text: 'OK' }])
    }
  }

  const handleRemoveMember = (member: GroupMember) => {
    if (member.userId === currentUserId) return
    if (!isAdmin) return
    Alert.alert(
      'Remove Member',
      `Remove ${member.displayName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeMember(member.$id, groupId),
        },
      ]
    )
  }

  const renderMember = ({ item }: { item: GroupMember }) => (
    <TouchableOpacity
      style={styles.memberCard}
      activeOpacity={isAdmin && item.userId !== currentUserId ? 0.7 : 1}
      onLongPress={() => handleRemoveMember(item)}
      disabled={!isAdmin || item.userId === currentUserId}
    >
      <View style={[styles.memberAvatar, { backgroundColor: item.avatarColor || Colors.dark.textMuted }]}>
        <Text style={styles.memberAvatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName}>{item.displayName}</Text>
          {item.userId === currentUserId && (
            <Text style={styles.youBadge}>You</Text>
          )}
        </View>
        <Text style={styles.memberJoined}>
          Joined {new Date(item.joinedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </Text>
      </View>
      {item.role === 'admin' && (
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Admin</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke={Colors.dark.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{groupName || 'Members'}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Invite Code */}
      {group?.inviteCode && (
        <TouchableOpacity style={styles.inviteCard} onPress={handleCopyCode} activeOpacity={0.7}>
          <View>
            <Text style={styles.inviteLabel}>INVITE CODE</Text>
            <Text style={styles.inviteCode}>{group.inviteCode}</Text>
          </View>
          <View style={styles.copyBtn}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" stroke={Colors.dark.accent} strokeWidth={1.8} strokeLinecap="round" />
            </Svg>
            <Text style={styles.copyBtnText}>Copy</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Members Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{members.length} MEMBER{members.length !== 1 ? 'S' : ''}</Text>
      </View>

      {/* Members List */}
      <FlatList
        data={members}
        keyExtractor={(item) => item.$id}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {isAdmin && (
        <View style={styles.footer}>
          <Text style={styles.footerTip}>Long-press a member to remove them</Text>
        </View>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    flex: 1,
    textAlign: 'center',
  },
  inviteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.accentSurface,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
    borderRadius: BorderRadius.xxl,
    margin: Spacing.xxl,
    padding: Spacing.xl,
  },
  inviteLabel: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
    marginBottom: 2,
  },
  inviteCode: {
    color: Colors.dark.accent,
    fontSize: FontSize.title,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 4,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  copyBtnText: {
    color: Colors.dark.accent,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  countRow: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  countText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
  },
  list: {
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxxl,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  memberName: {
    color: Colors.dark.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
  },
  youBadge: {
    color: Colors.dark.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    backgroundColor: Colors.dark.accentSurface,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  memberJoined: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    marginTop: 1,
  },
  roleBadge: {
    backgroundColor: Colors.dark.accentSurface,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  roleBadgeText: {
    color: Colors.dark.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  footer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  footerTip: {
    color: Colors.dark.textDark,
    fontSize: FontSize.sm,
  },
})
