import React from 'react'
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'

interface Message {
  $id: string
  userId: string
  userName: string
  avatarColor?: string
  text: string
  type?: string
  mediaUrl?: string | null
  $createdAt: string
}

interface Props {
  message: Message
  isOwn: boolean
  onImagePress?: (url: string) => void
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  } catch { return '' }
}

export const ChatBubble = React.memo(({ message, isOwn, onImagePress }: Props) => {
  const { text, type, mediaUrl, userName, avatarColor, $createdAt, $id } = message
  const initial = (userName || '?').charAt(0).toUpperCase()

  const avatar = !isOwn && (
    <View style={[styles.avatar, { backgroundColor: avatarColor || Colors.dark.textMuted }]}>
      <Text style={styles.avatarText}>{initial}</Text>
    </View>
  )

  // Sticker
  if (type === 'sticker') {
    return (
      <View style={[styles.row, isOwn && styles.rowOwn]}>
        {avatar}
        <View style={{ alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
          {!isOwn && <Text style={styles.senderName}>{userName}</Text>}
          <Text style={styles.stickerText}>{text}</Text>
          <Text style={[styles.time, isOwn && styles.timeOwn]}>{formatTime($createdAt)}</Text>
        </View>
      </View>
    )
  }

  // Image
  if (type === 'image' && mediaUrl) {
    const isUploading = $id.startsWith('optimistic-img-')
    return (
      <View style={[styles.row, isOwn && styles.rowOwn]}>
        {avatar}
        <View style={{ maxWidth: '75%' }}>
          {!isOwn && <Text style={styles.senderName}>{userName}</Text>}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => !isUploading && onImagePress?.(mediaUrl)}
            style={[styles.imageBubble, isOwn ? styles.imageBubbleOwn : styles.imageBubbleOther]}
          >
            <Image source={{ uri: mediaUrl }} style={styles.image} resizeMode="cover" />
            {isUploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator color=Colors.dark.white size="large" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={[styles.time, isOwn && styles.timeOwn, { marginTop: 4 }]}>{formatTime($createdAt)}</Text>
        </View>
      </View>
    )
  }

  // GIF
  if (type === 'gif' && mediaUrl) {
    return (
      <View style={[styles.row, isOwn && styles.rowOwn]}>
        {avatar}
        <View style={{ maxWidth: '75%' }}>
          {!isOwn && <Text style={styles.senderName}>{userName}</Text>}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onImagePress?.(mediaUrl)}
            style={[styles.imageBubble, isOwn ? styles.imageBubbleOwn : styles.imageBubbleOther]}
          >
            <Image source={{ uri: mediaUrl }} style={styles.image} resizeMode="cover" />
          </TouchableOpacity>
          <Text style={[styles.time, isOwn && styles.timeOwn, { marginTop: 4 }]}>{formatTime($createdAt)}</Text>
        </View>
      </View>
    )
  }

  // Text message (default)
  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      {avatar}
      <View style={{ maxWidth: '80%' }}>
        {!isOwn && <Text style={styles.senderName}>{userName}</Text>}
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          <Text style={[styles.text, isOwn && styles.textOwn]}>{text}</Text>
        </View>
        <Text style={[styles.time, isOwn && styles.timeOwn]}>{formatTime($createdAt)}</Text>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'flex-end',
    marginBottom: Spacing.sm, paddingHorizontal: Spacing.md, gap: 8,
  },
  rowOwn: { flexDirection: 'row-reverse' },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  avatarText: { color: Colors.dark.white, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  senderName: {
    fontSize: FontSize.xs, color: Colors.dark.textMuted,
    marginBottom: 2, marginLeft: 4,
  },
  bubble: {
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, maxWidth: '100%',
  },
  bubbleOwn: { backgroundColor: Colors.dark.accent, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: Colors.dark.surface, borderBottomLeftRadius: 4 },
  text: { fontSize: FontSize.base, color: Colors.dark.text, lineHeight: 20 },
  textOwn: { color: Colors.dark.textOnAccent },
  time: {
    fontSize: 10, color: Colors.dark.textMuted, marginTop: 2, marginLeft: 4,
  },
  timeOwn: { textAlign: 'right', marginRight: 4, marginLeft: 0 },
  stickerText: { fontSize: 64, textAlign: 'center' },
  imageBubble: {
    borderRadius: BorderRadius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  imageBubbleOwn: { borderBottomRightRadius: 4 },
  imageBubbleOther: { borderBottomLeftRadius: 4 },
  image: { width: 220, height: 220, borderRadius: BorderRadius.lg - 1 },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
})
