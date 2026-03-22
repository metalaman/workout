import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, Image, Dimensions, Alert, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams, Href } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import * as ImagePicker from 'expo-image-picker'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth-store'
import { useSocialStore } from '@/stores/social-store'
import { client, DATABASE_ID, COLLECTION, storage, CHAT_MEDIA_BUCKET, ID, Permission, Role, getFileUrl } from '@/lib/appwrite'
import * as db from '@/lib/database'
import type { GroupMessage, WorkoutShareData, Group } from '@/types/social'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IMAGE_BUBBLE_WIDTH = SCREEN_WIDTH * 0.6

// ─── Fitness Stickers ────────────────────────────────────────────────────────
const FITNESS_STICKERS = [
  '💪', '🔥', '🏋️', '🎯', '🏆', '💯', '⚡', '🦾',
  '🏃', '🧘', '🥇', '👊', '🫡', '😤', '🤯', '🙌',
  '💥', '🚀', '🧨', '😎', '🥵', '🫠', '👏', '❤️‍🔥',
]

// ─── Tenor GIF search ────────────────────────────────────────────────────────
const TENOR_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ'

interface TenorGif {
  id: string
  url: string // tinygif URL for preview
  fullUrl: string // gif URL for sending
}

async function searchTenorGifs(query: string): Promise<TenorGif[]> {
  try {
    const q = encodeURIComponent(query || 'fitness workout')
    const res = await fetch(
      `https://tenor.googleapis.com/v2/search?q=${q}&key=${TENOR_KEY}&limit=20&media_filter=tinygif,gif`
    )
    const data = await res.json()
    return (data.results || []).map((r: any) => ({
      id: r.id,
      url: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url || '',
      fullUrl: r.media_formats?.gif?.url || r.media_formats?.tinygif?.url || '',
    }))
  } catch {
    return []
  }
}

async function fetchTenorTrending(): Promise<TenorGif[]> {
  try {
    const res = await fetch(
      `https://tenor.googleapis.com/v2/featured?key=${TENOR_KEY}&limit=20&media_filter=tinygif,gif`
    )
    const data = await res.json()
    return (data.results || []).map((r: any) => ({
      id: r.id,
      url: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url || '',
      fullUrl: r.media_formats?.gif?.url || r.media_formats?.tinygif?.url || '',
    }))
  } catch {
    return []
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function GroupChatScreen() {
  const router = useRouter()
  const { groupId } = useLocalSearchParams<{ groupId: string }>()
  const { user, profile } = useAuthStore()
  const { messages, isMessagesLoading, loadMessages, sendMessage, loadMembers, members, markGroupRead, onNewMessage } = useSocialStore()
  const [text, setText] = useState('')
  const [group, setGroup] = useState<Group | null>(null)
  const [sending, setSending] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const listRef = useRef<FlatList>(null)

  // Bottom sheet states
  const [showStickers, setShowStickers] = useState(false)
  const [showGifs, setShowGifs] = useState(false)
  const [gifQuery, setGifQuery] = useState('')
  const [gifs, setGifs] = useState<TenorGif[]>([])
  const [gifsLoading, setGifsLoading] = useState(false)

  // Fullscreen image viewer
  const [viewerImage, setViewerImage] = useState<string | null>(null)

  useEffect(() => {
    if (groupId) {
      db.getGroup(groupId).then(setGroup).catch((e) => console.warn('[GroupChat] loadGroup failed:', e))
      loadMessages(groupId)
      loadMembers(groupId)
      // Mark this group as read
      markGroupRead(groupId)
    }
  }, [groupId])

  // Real-time subscription for new messages
  useEffect(() => {
    if (!groupId) return
    const channel = `databases.${DATABASE_ID}.collections.${COLLECTION.GROUP_MESSAGES}.documents`
    const unsubscribe = client.subscribe(channel, (response) => {
      const events = response.events || []
      const payload = response.payload as any
      if (payload?.groupId !== groupId) return
      if (events.some((e: string) => e.includes('.create') || e.includes('.delete'))) {
        loadMessages(groupId)
        // Mark as read since user is viewing this chat
        markGroupRead(groupId)
      }
    })
    return () => { unsubscribe() }
  }, [groupId])

  // Load trending GIFs when panel opens
  useEffect(() => {
    if (showGifs && gifs.length === 0 && !gifQuery) {
      setGifsLoading(true)
      fetchTenorTrending().then(setGifs).finally(() => setGifsLoading(false))
    }
  }, [showGifs])

  const getUserInfo = () => ({
    userId: user?.$id || '',
    userName: profile?.displayName ?? user?.name ?? 'Athlete',
    avatarColor: profile?.avatarColor ?? '#e8ff47',
  })

  // ─── Send text message ──────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!text.trim() || !user?.$id || !groupId || sending) return
    const msg = text.trim()
    setText('')
    setSending(true)

    const { userId, userName, avatarColor } = getUserInfo()
    const optimisticMsg: GroupMessage = {
      $id: `optimistic-${Date.now()}`,
      $createdAt: new Date().toISOString(),
      groupId,
      userId,
      userName,
      avatarColor,
      text: msg,
      type: 'message',
      workoutData: null,
      mediaUrl: null,
    }
    useSocialStore.setState((s) => ({ messages: [optimisticMsg, ...s.messages] }))

    try {
      await sendMessage(groupId, msg, userId, userName, avatarColor, 'message', null)
    } catch {
      useSocialStore.setState((s) => ({ messages: s.messages.filter((m) => m.$id !== optimisticMsg.$id) }))
    } finally {
      setSending(false)
    }
  }, [text, user, groupId, sending])

  // ─── Send sticker ───────────────────────────────────────────────────────
  const handleSendSticker = async (sticker: string) => {
    if (!user?.$id || !groupId) return
    setShowStickers(false)
    const { userId, userName, avatarColor } = getUserInfo()

    const optimisticMsg: GroupMessage = {
      $id: `optimistic-sticker-${Date.now()}`,
      $createdAt: new Date().toISOString(),
      groupId, userId, userName, avatarColor,
      text: sticker,
      type: 'sticker',
      workoutData: null,
      mediaUrl: null,
    }
    useSocialStore.setState((s) => ({ messages: [optimisticMsg, ...s.messages] }))

    try {
      await sendMessage(groupId, sticker, userId, userName, avatarColor, 'sticker', null)
    } catch {
      useSocialStore.setState((s) => ({ messages: s.messages.filter((m) => m.$id !== optimisticMsg.$id) }))
    }
  }

  // ─── Send GIF ───────────────────────────────────────────────────────────
  const handleSendGif = async (gif: TenorGif) => {
    if (!user?.$id || !groupId) return
    setShowGifs(false)
    const { userId, userName, avatarColor } = getUserInfo()

    const optimisticMsg: GroupMessage = {
      $id: `optimistic-gif-${Date.now()}`,
      $createdAt: new Date().toISOString(),
      groupId, userId, userName, avatarColor,
      text: '',
      type: 'gif',
      workoutData: null,
      mediaUrl: gif.fullUrl,
    }
    useSocialStore.setState((s) => ({ messages: [optimisticMsg, ...s.messages] }))

    try {
      await sendMessage(groupId, '', userId, userName, avatarColor, 'gif', gif.fullUrl)
    } catch {
      useSocialStore.setState((s) => ({ messages: s.messages.filter((m) => m.$id !== optimisticMsg.$id) }))
    }
  }

  // ─── Search GIFs ────────────────────────────────────────────────────────
  const handleGifSearch = useCallback(async (query: string) => {
    setGifQuery(query)
    if (!query.trim()) {
      setGifsLoading(true)
      fetchTenorTrending().then(setGifs).finally(() => setGifsLoading(false))
      return
    }
    setGifsLoading(true)
    const results = await searchTenorGifs(query)
    setGifs(results)
    setGifsLoading(false)
  }, [])

  // ─── Pick & send image ──────────────────────────────────────────────────
  const handlePickImage = async () => {
    if (!user?.$id || !groupId) return

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to send images.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    })

    if (result.canceled || !result.assets?.[0]) return

    const asset = result.assets[0]
    const { userId, userName, avatarColor } = getUserInfo()
    setUploadingImage(true)

    // Optimistic placeholder
    const optimisticId = `optimistic-img-${Date.now()}`
    const optimisticMsg: GroupMessage = {
      $id: optimisticId,
      $createdAt: new Date().toISOString(),
      groupId, userId, userName, avatarColor,
      text: '',
      type: 'image',
      workoutData: null,
      mediaUrl: asset.uri, // local URI as placeholder
    }
    useSocialStore.setState((s) => ({ messages: [optimisticMsg, ...s.messages] }))

    try {
      // Upload to Appwrite storage
      const fileId = ID.unique()
      const uri = asset.uri
      const fileName = uri.split('/').pop() || 'photo.jpg'
      const mimeType = asset.mimeType || 'image/jpeg'

      // Create a file object for Appwrite RN SDK
      const file = {
        name: fileName,
        type: mimeType,
        size: asset.fileSize || 0,
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      }

      await storage.createFile(CHAT_MEDIA_BUCKET, fileId, file as any, [
        Permission.read(Role.any()),
        Permission.write(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ])

      // Get the file view URL
      const fileUrl = getFileUrl(CHAT_MEDIA_BUCKET, fileId)

      // Send message with media URL
      await sendMessage(groupId, '', userId, userName, avatarColor, 'image', fileUrl)

      // Remove optimistic, real message comes via Realtime
      useSocialStore.setState((s) => ({
        messages: s.messages.filter((m) => m.$id !== optimisticId),
      }))
    } catch (err) {
      console.warn('Image upload failed:', err)
      useSocialStore.setState((s) => ({
        messages: s.messages.filter((m) => m.$id !== optimisticId),
      }))
      Alert.alert('Upload failed', 'Could not send image. Try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const isOwnMessage = (msg: GroupMessage) => msg.userId === user?.$id

  // ─── Render message ─────────────────────────────────────────────────────
  const renderMessage = ({ item }: { item: GroupMessage }) => {
    const own = isOwnMessage(item)
    const msgType = item.type

    // Sticker message — large centered emoji
    if (msgType === 'sticker') {
      return (
        <View style={[msgStyles.row, own && msgStyles.rowOwn]}>
          {!own && (
            <View style={[msgStyles.avatar, { backgroundColor: item.avatarColor || Colors.dark.textMuted }]}>
              <Text style={msgStyles.avatarText}>{(item.userName || '?').charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={{ alignItems: own ? 'flex-end' : 'flex-start' }}>
            {!own && <Text style={msgStyles.senderNameSticker}>{item.userName}</Text>}
            <Text style={stickerStyles.large}>{item.text}</Text>
            <Text style={[msgStyles.time, own && msgStyles.timeOwn, { marginTop: 2 }]}>{formatTime(item.$createdAt)}</Text>
          </View>
        </View>
      )
    }

    // Image message
    if (msgType === 'image' && item.mediaUrl) {
      const isUploading = item.$id.startsWith('optimistic-img-')
      return (
        <View style={[msgStyles.row, own && msgStyles.rowOwn]}>
          {!own && (
            <View style={[msgStyles.avatar, { backgroundColor: item.avatarColor || Colors.dark.textMuted }]}>
              <Text style={msgStyles.avatarText}>{(item.userName || '?').charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={{ maxWidth: '75%' }}>
            {!own && <Text style={msgStyles.senderNameSticker}>{item.userName}</Text>}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => !isUploading && setViewerImage(item.mediaUrl)}
              style={[imageStyles.bubble, own ? imageStyles.bubbleOwn : imageStyles.bubbleOther]}
            >
              <Image
                source={{ uri: item.mediaUrl! }}
                style={imageStyles.image}
                resizeMode="cover"
              />
              {isUploading && (
                <View style={imageStyles.uploadOverlay}>
                  <ActivityIndicator color={Colors.dark.white} size="large" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={[msgStyles.time, own && msgStyles.timeOwn, { marginTop: 4 }]}>{formatTime(item.$createdAt)}</Text>
          </View>
        </View>
      )
    }

    // GIF message
    if (msgType === 'gif' && item.mediaUrl) {
      return (
        <View style={[msgStyles.row, own && msgStyles.rowOwn]}>
          {!own && (
            <View style={[msgStyles.avatar, { backgroundColor: item.avatarColor || Colors.dark.textMuted }]}>
              <Text style={msgStyles.avatarText}>{(item.userName || '?').charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={{ maxWidth: '75%' }}>
            {!own && <Text style={msgStyles.senderNameSticker}>{item.userName}</Text>}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setViewerImage(item.mediaUrl)}
              style={[imageStyles.bubble, own ? imageStyles.bubbleOwn : imageStyles.bubbleOther]}
            >
              <Image
                source={{ uri: item.mediaUrl! }}
                style={imageStyles.gif}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <Text style={[msgStyles.time, own && msgStyles.timeOwn, { marginTop: 4 }]}>{formatTime(item.$createdAt)}</Text>
          </View>
        </View>
      )
    }

    // Workout share
    const isWorkout = msgType === 'workout_share'
    let workoutData: WorkoutShareData | null = null
    if (isWorkout && item.workoutData) {
      try { workoutData = JSON.parse(item.workoutData) } catch (e) { console.warn('[GroupChat] parse workoutData failed:', e) }
    }

    // Text message (default)
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

        {/* Input bar */}
        <View style={styles.inputBar}>
          {/* Media buttons */}
          <TouchableOpacity
            style={styles.mediaBtn}
            onPress={() => { setShowStickers(!showStickers); setShowGifs(false) }}
          >
            <Text style={{ fontSize: 20 }}>😀</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaBtn}
            onPress={() => { setShowGifs(!showGifs); setShowStickers(false) }}
          >
            <Text style={styles.gifLabel}>GIF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaBtn}
            onPress={handlePickImage}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator color={Colors.dark.accent} size="small" />
            ) : (
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke={Colors.dark.textMuted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={(t) => {
              setText(t)
              if (t) { setShowStickers(false); setShowGifs(false) }
            }}
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

        {/* Sticker panel */}
        {showStickers && (
          <View style={panelStyles.container}>
            <View style={panelStyles.header}>
              <Text style={panelStyles.title}>Stickers</Text>
              <TouchableOpacity onPress={() => setShowStickers(false)}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 6L6 18M6 6l12 12" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            </View>
            <View style={panelStyles.stickerGrid}>
              {FITNESS_STICKERS.map((sticker, i) => (
                <TouchableOpacity
                  key={i}
                  style={panelStyles.stickerBtn}
                  onPress={() => handleSendSticker(sticker)}
                  activeOpacity={0.6}
                >
                  <Text style={panelStyles.stickerEmoji}>{sticker}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* GIF panel */}
        {showGifs && (
          <View style={panelStyles.container}>
            <View style={panelStyles.header}>
              <Text style={panelStyles.title}>GIFs</Text>
              <TouchableOpacity onPress={() => setShowGifs(false)}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 6L6 18M6 6l12 12" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            </View>
            <TextInput
              style={panelStyles.gifSearch}
              value={gifQuery}
              onChangeText={handleGifSearch}
              placeholder="Search GIFs..."
              placeholderTextColor={Colors.dark.textMuted}
              autoFocus={false}
            />
            {gifsLoading ? (
              <ActivityIndicator color={Colors.dark.accent} style={{ marginTop: Spacing.xl }} />
            ) : (
              <ScrollView
                style={panelStyles.gifScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={panelStyles.gifGrid}>
                  {gifs.map((gif) => (
                    <TouchableOpacity
                      key={gif.id}
                      style={panelStyles.gifItem}
                      onPress={() => handleSendGif(gif)}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{ uri: gif.url }}
                        style={panelStyles.gifImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Fullscreen image viewer */}
      <Modal visible={!!viewerImage} transparent animationType="fade">
        <View style={viewerStyles.overlay}>
          <TouchableOpacity style={viewerStyles.closeBtn} onPress={() => setViewerImage(null)}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path d="M18 6L6 18M6 6l12 12" stroke={Colors.dark.white} strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
          {viewerImage && (
            <Image
              source={{ uri: viewerImage }}
              style={viewerStyles.image}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.dark.border, gap: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.lg },
  headerAvatar: {
    width: 36, height: 36, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: Colors.dark.textOnAccent, fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  headerTitle: { color: Colors.dark.text, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  headerSubtitle: { color: Colors.dark.textMuted, fontSize: FontSize.sm },
  chatArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  emptyChat: { alignItems: 'center', paddingTop: 100, transform: [{ scaleY: -1 }] },
  emptyChatText: { color: Colors.dark.textMuted, fontSize: FontSize.xxl, fontWeight: FontWeight.semibold, marginBottom: Spacing.sm },
  emptyChatSub: { color: Colors.dark.textDark, fontSize: FontSize.lg },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.dark.border, gap: 4,
  },
  mediaBtn: {
    width: 36, height: 36, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  gifLabel: {
    color: Colors.dark.textMuted, fontSize: 11, fontWeight: FontWeight.extrabold,
    borderWidth: 1.5, borderColor: Colors.dark.textMuted, borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 1, overflow: 'hidden',
  },
  textInput: {
    flex: 1, backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    color: Colors.dark.text, fontSize: FontSize.xl, maxHeight: 100,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.accent, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.dark.surface },
})

const msgStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.lg, gap: Spacing.md },
  rowOwn: { flexDirection: 'row-reverse' },
  avatar: { width: 28, height: 28, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.dark.textOnAccent, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  bubble: { maxWidth: '75%', borderRadius: BorderRadius.xxl, padding: Spacing.lg },
  bubbleOwn: { backgroundColor: 'rgba(232,255,71,0.15)', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: Colors.dark.surfaceLight, borderBottomLeftRadius: 4 },
  senderName: { color: Colors.dark.accent, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: 2 },
  senderNameSticker: { color: Colors.dark.textMuted, fontSize: FontSize.xs, fontWeight: FontWeight.semibold, marginBottom: 2, marginLeft: 4 },
  text: { color: Colors.dark.text, fontSize: FontSize.xl, lineHeight: 20 },
  textOwn: { color: Colors.dark.text },
  time: { color: Colors.dark.textDark, fontSize: FontSize.xs, marginTop: 4, alignSelf: 'flex-end' },
  timeOwn: { color: 'rgba(232,255,71,0.4)' },
})

const imageStyles = StyleSheet.create({
  bubble: { borderRadius: 16, overflow: 'hidden' },
  bubbleOwn: { borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4 },
  image: { width: IMAGE_BUBBLE_WIDTH, height: IMAGE_BUBBLE_WIDTH * 0.75, borderRadius: 16 },
  gif: { width: IMAGE_BUBBLE_WIDTH * 0.8, height: IMAGE_BUBBLE_WIDTH * 0.6, borderRadius: 12 },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
})

const stickerStyles = StyleSheet.create({
  large: { fontSize: 64, lineHeight: 72 },
})

const panelStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.card, borderTopWidth: 1, borderTopColor: Colors.dark.border,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
    maxHeight: 280,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: { color: Colors.dark.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  stickerGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 4,
  },
  stickerBtn: {
    width: (SCREEN_WIDTH - Spacing.xl * 2 - 4 * 7) / 8,
    aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
  },
  stickerEmoji: { fontSize: 28 },
  gifSearch: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    color: Colors.dark.text, fontSize: FontSize.lg, marginBottom: Spacing.md,
  },
  gifScroll: { maxHeight: 200 },
  gifGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 4,
  },
  gifItem: {
    width: (SCREEN_WIDTH - Spacing.xl * 2 - 4) / 2,
    height: 100, borderRadius: 8, overflow: 'hidden',
  },
  gifImage: { width: '100%', height: '100%' },
})

const viewerStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center', alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute', top: 60, right: 20, zIndex: 10,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  image: { width: SCREEN_WIDTH, height: SCREEN_WIDTH },
})

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.background, borderWidth: 1,
    borderColor: Colors.dark.accentBorderStrong, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginTop: Spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  icon: { fontSize: 16 },
  title: { color: Colors.dark.accent, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  stat: { alignItems: 'center' },
  statValue: { color: Colors.dark.text, fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold },
  statLabel: { color: Colors.dark.textMuted, fontSize: FontSize.xs },
  statDivider: { width: 1, height: 24, backgroundColor: Colors.dark.border },
  prRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  prPill: { backgroundColor: Colors.dark.accentSurface, borderRadius: BorderRadius.pill, paddingHorizontal: Spacing.md, paddingVertical: 2 },
  prPillText: { color: Colors.dark.accent, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
})
