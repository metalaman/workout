import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams, Href } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth-store'
import { useSocialStore } from '@/stores/social-store'
import * as db from '@/lib/database'
import type { GroupMessage, WorkoutShareData, Group } from '@/types/social'

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function WorkoutCard({ data }: { data: WorkoutShareData }) {
  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.header}>
        <Text style={cardStyles.icon}>🏋️</Text>
        <Text style={cardStyles.title}>{data.programDayName}</Text>
      </View>
      <View style={cardStyles.statsRow}>
        <View style={cardStyles.stat}>
          <Text style={cardStyles.statValue}>{Math.round(data.totalVolume).toLocaleString()}</Text>
          <Text style={cardStyles.statLabel}>lbs</Text>
        </View>
        <View style={cardStyles.statDivider} />
        <View style={cardStyles.stat}>
          <Text style={cardStyles.statValue}>{Math.floor(data.duration / 60)}</Text>
          <Text style={cardStyles.statLabel}>min</Text>
        </View>
        {data.prCount > 0 && (
          <>
            <View style={cardStyles.statDivider} />
            <View style={cardStyles.stat}>
              <Text style={[cardStyles.statValue, { color: Colors.dark.accent }]}>{data.prCount}</Text>
              <Text style={cardStyles.statLabel}>PRs 🏆</Text>
            </View>
          </>
        )}
      </View>
      {data.prExercises && data.prExercises.length > 0 && (
        <View style={cardStyles.prRow}>
          {data.prExercises.map((ex, i) => (
            <View key={i} style={cardStyles.prPill}>
              <Text style={cardStyles.prPillText}>{ex}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

export default function GroupChatScreen() {
  const router = useRouter()
  const { groupId } = useLocalSearchParams<{ groupId: string }>()
  const { user, profile } = useAuthStore()
  const { messages, isMessagesLoading, loadMessages, sendMessage, loadMembers, members } = useSocialStore()
  const [text, setText] = useState('')
  const [group, setGroup] = useState<Group | null>(null)
  const [sending, setSending] = useState(false)
  const listRef = useRef<FlatList>(null)

  useEffect(() => {
    if (groupId) {
      db.getGroup(groupId).then(setGroup).catch(() => {})
      loadMessages(groupId)
      loadMembers(groupId)
    }
  }, [groupId])

  // Auto-refresh messages every 10s
  useEffect(() => {
    if (!groupId) return
    const interval = setInterval(() => loadMessages(groupId), 10000)
    return () => clearInterval(interval)
  }, [groupId])

  const handleSend = useCallback(async () => {
    if (!text.trim() || !user?.$id || !groupId || sending) return
    const msg = text.trim()
    setText('')
    setSending(true)
    try {
      await sendMessage(
        groupId,
        msg,
        user.$id,
        profile?.displayName ?? user.name ?? 'Athlete',
        profile?.avatarColor ?? '#e8ff47'
      )
    } catch {} finally {
      setSending(false)
    }
  }, [text, user, groupId, sending])

  const isOwnMessage = (msg: GroupMessage) => msg.userId === user?.$id

  const renderMessage = ({ item }: { item: GroupMessage }) => {
    const own = isOwnMessage(item)
    const isWorkout = item.type === 'workout_share'
    let workoutData: WorkoutShareData | null = null
    if (isWorkout && item.workoutData) {
      try { workoutData = JSON.parse(item.workoutData) } catch {}
    }

    return (
      <View style={[msgStyles.row, own && msgStyles.rowOwn]}>
        {!own && (
          <View style={[msgStyles.avatar, { backgroundColor: item.avatarColor || Colors.dark.textMuted }]}>
            <Text style={msgStyles.avatarText}>{(item.userName || '?').charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={[msgStyles.bubble, own ? msgStyles.bubbleOwn : msgStyles.bubbleOther]}>
          {!own && <Text style={msgStyles.senderName}>{item.userName}</Text>}
          {isWorkout && workoutData ? (
            <>
              {item.text ? <Text style={[msgStyles.text, own && msgStyles.textOwn]}>{item.text}</Text> : null}
              <WorkoutCard data={workoutData} />
            </>
          ) : (
            <Text style={[msgStyles.text, own && msgStyles.textOwn]}>{item.text}</Text>
          )}
          <Text style={[msgStyles.time, own && msgStyles.timeOwn]}>{formatTime(item.$createdAt)}</Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke={Colors.dark.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerInfo}
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: '/(tabs)/social/members', params: { groupId, groupName: group?.name || '' } } as any)}
        >
          {group && (
            <View style={[styles.headerAvatar, { backgroundColor: group.avatarColor || Colors.dark.accent }]}>
              <Text style={styles.headerAvatarText}>{group.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>{group?.name ?? 'Group'}</Text>
            <Text style={styles.headerSubtitle}>{members.length} member{members.length !== 1 ? 's' : ''}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {isMessagesLoading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.dark.accent} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.$id}
            renderItem={renderMessage}
            inverted
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>No messages yet</Text>
                <Text style={styles.emptyChatSub}>Start the conversation!</Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={Colors.dark.textMuted}
            multiline
            maxLength={5000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke={text.trim() ? Colors.dark.textOnAccent : Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.lg,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  headerSubtitle: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
  },
  chatArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  emptyChat: {
    alignItems: 'center',
    paddingTop: 100,
    transform: [{ scaleY: -1 }],
  },
  emptyChatText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  emptyChatSub: {
    color: Colors.dark.textDark,
    fontSize: FontSize.lg,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    gap: Spacing.md,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    color: Colors.dark.text,
    fontSize: FontSize.xl,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.dark.surface,
  },
})

const msgStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  rowOwn: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
  },
  bubbleOwn: {
    backgroundColor: 'rgba(232,255,71,0.15)',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.dark.surfaceLight,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    color: Colors.dark.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  text: {
    color: Colors.dark.text,
    fontSize: FontSize.xl,
    lineHeight: 20,
  },
  textOwn: {
    color: Colors.dark.text,
  },
  time: {
    color: Colors.dark.textDark,
    fontSize: FontSize.xs,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeOwn: {
    color: 'rgba(232,255,71,0.4)',
  },
})

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorderStrong,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  icon: {
    fontSize: 16,
  },
  title: {
    color: Colors.dark.accent,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: Colors.dark.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
  },
  statLabel: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xs,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.dark.border,
  },
  prRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  prPill: {
    backgroundColor: Colors.dark.accentSurface,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 2,
  },
  prPillText: {
    color: Colors.dark.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
})
