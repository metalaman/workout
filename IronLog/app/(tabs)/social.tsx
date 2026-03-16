import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth-store'
import { useSocialStore } from '@/stores/social-store'
import { useSessionStore } from '@/stores/session-store'
import { getRelativeTime, formatVolume } from '@/lib/utils'
import type { SocialPost } from '@/types'

// Fallback mock feed for when Appwrite has no data (dev/demo mode)
const MOCK_POSTS: SocialPost[] = [
  {
    $id: 'mock-1',
    userId: 'mock-mike',
    userName: 'Mike R.',
    avatarColor: '#ff6b6b',
    sessionId: null,
    text: 'New bench PR! 225 lbs 🎉',
    stats: 'Bench Press · 225 × 1',
    isPR: true,
    likes: 12,
    likedBy: [],
    $createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    $id: 'mock-2',
    userId: 'mock-sarah',
    userName: 'Sarah K.',
    avatarColor: '#6bc5ff',
    sessionId: null,
    text: 'Leg day is done. 5 exercises, 90 min 🦵',
    stats: 'Total Volume: 22,500 lbs',
    isPR: false,
    likes: 8,
    likedBy: [],
    $createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    $id: 'mock-3',
    userId: 'dev',
    userName: 'Alex (You)',
    avatarColor: '#e8ff47',
    sessionId: null,
    text: 'Week 4 complete! Progressive overload hitting different',
    stats: 'Push Day A · 12,450 lbs total',
    isPR: false,
    likes: 15,
    likedBy: [],
    $createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
]

export default function SocialScreen() {
  const { user, profile } = useAuthStore()
  const { posts, isLoading, loadFeed, shareWorkout, toggleLike } = useSocialStore()
  const { recentSessions } = useSessionStore()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadFeed()
  }, [])

  const displayPosts = posts.length > 0 ? posts : MOCK_POSTS
  const isMock = posts.length === 0

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadFeed()
    setRefreshing(false)
  }

  const handleShare = async () => {
    const lastSession = recentSessions[0]
    if (!lastSession || !lastSession.completedAt) {
      Alert.alert('No Workout', 'Complete a workout first to share it!')
      return
    }

    const volume = formatVolume(lastSession.totalVolume || 0)
    const durationMins = Math.round((lastSession.duration || 0) / 60)

    await shareWorkout({
      userId: user?.$id ?? 'dev',
      userName: profile?.displayName ?? user?.name ?? 'Athlete',
      avatarColor: profile?.avatarColor ?? '#e8ff47',
      sessionId: lastSession.$id,
      text: `Just crushed ${lastSession.programDayName}! 💪`,
      stats: `${volume} lbs total · ${durationMins} min`,
      isPR: false,
      likes: 0,
      likedBy: [],
    })

    Alert.alert('Shared! 🎉', 'Your workout has been posted to the feed.')
  }

  const handleLike = async (postId: string) => {
    if (isMock) return // Don't try to like mock posts
    await toggleLike(postId, user?.$id ?? 'dev')
  }

  const isLikedByMe = (post: SocialPost) => {
    return post.likedBy?.includes(user?.$id ?? 'dev')
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
        <TouchableOpacity onPress={handleShare}>
          <Text style={styles.shareButton}>Share</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayPosts}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.dark.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubText}>Complete a workout and share it!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const timeAgo = getRelativeTime(item.$createdAt)
          const liked = isLikedByMe(item)
          const initial = item.userName?.charAt(0)?.toUpperCase() ?? '?'

          return (
            <View style={styles.postCard}>
              {/* User header */}
              <View style={styles.postHeader}>
                <View style={[styles.postAvatar, { backgroundColor: item.avatarColor || '#6bc5ff' }]}>
                  <Text style={styles.postAvatarText}>{initial}</Text>
                </View>
                <View style={styles.postUserInfo}>
                  <View style={styles.postNameRow}>
                    <Text style={styles.postUserName}>{item.userName}</Text>
                    {item.isPR && <Text style={styles.prBadge}>🏆 PR</Text>}
                  </View>
                  <Text style={styles.postTime}>{timeAgo}</Text>
                </View>
              </View>

              {/* Content */}
              <Text style={styles.postText}>{item.text}</Text>

              {/* Stats badge */}
              {item.stats ? (
                <View style={styles.statsBadge}>
                  <Text style={styles.statsText}>{item.stats}</Text>
                </View>
              ) : null}

              {/* Reactions */}
              <View style={styles.reactions}>
                <TouchableOpacity onPress={() => handleLike(item.$id)}>
                  <Text style={[styles.reactionText, liked && styles.reactionActive]}>
                    {liked ? '❤️' : '🤍'} {item.likes || 0}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={styles.reactionText}>💬 Comment</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={styles.reactionText}>🔥 Fire</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        }}
      />
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
    paddingBottom: Spacing.lg,
  },
  title: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
  },
  shareButton: {
    color: Colors.dark.accent,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  list: {
    paddingHorizontal: Spacing.xxl,
  },
  postCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  postAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: {
    fontWeight: FontWeight.extrabold,
    fontSize: FontSize.base,
    color: Colors.dark.textOnAccent,
  },
  postUserInfo: {
    flex: 1,
  },
  postNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  postUserName: {
    color: Colors.dark.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  prBadge: {
    color: Colors.dark.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  postTime: {
    color: Colors.dark.textMuted,
    fontSize: 9,
  },
  postText: {
    color: '#ddd',
    fontSize: FontSize.base,
    marginBottom: Spacing.sm,
  },
  statsBadge: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  statsText: {
    color: Colors.dark.accent,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  reactions: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  reactionText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.md,
  },
  reactionActive: {
    color: Colors.dark.danger,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  emptySubText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
})
