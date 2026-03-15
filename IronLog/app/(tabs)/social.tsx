import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'

interface Post {
  user: string
  avatar: string
  time: string
  text: string
  stats: string
  likes: number
  color: string
}

const MOCK_POSTS: Post[] = [
  {
    user: 'Mike R.',
    avatar: 'M',
    time: '2h ago',
    text: 'New bench PR! 225 lbs 🎉',
    stats: 'Bench Press · 225 × 1',
    likes: 12,
    color: '#ff6b6b',
  },
  {
    user: 'Sarah K.',
    avatar: 'S',
    time: '5h ago',
    text: 'Leg day is done. 5 exercises, 90 min 🦵',
    stats: 'Total Volume: 22,500 lbs',
    likes: 8,
    color: '#6bc5ff',
  },
  {
    user: 'Alex (You)',
    avatar: 'A',
    time: '1d ago',
    text: 'Week 4 complete! Progressive overload hitting different',
    stats: 'Push Day A · 12,450 lbs total',
    likes: 15,
    color: '#e8ff47',
  },
]

export default function SocialScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
        <TouchableOpacity>
          <Text style={styles.shareButton}>Share</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_POSTS}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            {/* User header */}
            <View style={styles.postHeader}>
              <View style={[styles.postAvatar, { backgroundColor: item.color }]}>
                <Text style={styles.postAvatarText}>{item.avatar}</Text>
              </View>
              <View style={styles.postUserInfo}>
                <Text style={styles.postUserName}>{item.user}</Text>
                <Text style={styles.postTime}>{item.time}</Text>
              </View>
            </View>

            {/* Content */}
            <Text style={styles.postText}>{item.text}</Text>

            {/* Stats badge */}
            <View style={styles.statsBadge}>
              <Text style={styles.statsText}>{item.stats}</Text>
            </View>

            {/* Reactions */}
            <View style={styles.reactions}>
              <TouchableOpacity>
                <Text style={styles.reactionText}>❤️ {item.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.reactionText}>💬 Comment</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.reactionText}>🔥 Fire</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  postUserName: {
    color: Colors.dark.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
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
})
