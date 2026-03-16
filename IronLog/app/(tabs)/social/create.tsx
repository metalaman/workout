import { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Href } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth-store'
import { useSocialStore } from '@/stores/social-store'

const COLORS = [
  '#e8ff47', '#ff6b6b', '#6bc5ff', '#7fff00', '#ff9f43',
  '#a55eea', '#26de81', '#fd79a8', '#ffeaa7', '#74b9ff',
]

export default function CreateGroupScreen() {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const { createGroup } = useSocialStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [creating, setCreating] = useState(false)
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!name.trim() || !user?.$id) return
    setCreating(true)
    try {
      const group = await createGroup(
        name.trim(),
        description.trim(),
        user.$id,
        profile?.displayName ?? user.name ?? 'Athlete',
        selectedColor
      )
      setCreatedCode(group.inviteCode)
      setCreatedGroupId(group.$id)
    } catch (err) {
      Alert.alert('Error', 'Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  const handleCopyCode = async () => {
    if (createdCode) {
      Alert.alert('Invite Code', createdCode, [{ text: 'OK' }])
    }
  }

  if (createdCode) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.successContent}>
          <View style={[styles.bigAvatar, { backgroundColor: selectedColor }]}>
            <Text style={styles.bigAvatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.successTitle}>Group Created! 🎉</Text>
          <Text style={styles.successSubtitle}>Share this invite code with friends</Text>

          <TouchableOpacity style={styles.codeCard} onPress={handleCopyCode} activeOpacity={0.7}>
            <Text style={styles.codeText}>{createdCode}</Text>
            <View style={styles.copyRow}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" stroke={Colors.dark.accent} strokeWidth={1.5} strokeLinecap="round" />
              </Svg>
              <Text style={styles.copyText}>Tap to copy</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.goToGroupBtn}
            activeOpacity={0.8}
            onPress={() => {
              router.back()
              // Small delay to let back animation complete
              setTimeout(() => {
                router.push(`/(tabs)/social/${createdGroupId}` as Href)
              }, 100)
            }}
          >
            <Text style={styles.goToGroupText}>Open Group →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
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
        <Text style={styles.headerTitle}>Create Group</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {/* Preview */}
        <View style={styles.previewSection}>
          <View style={[styles.previewAvatar, { backgroundColor: selectedColor }]}>
            <Text style={styles.previewAvatarText}>
              {name ? name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        </View>

        {/* Name */}
        <Text style={styles.inputLabel}>GROUP NAME</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Gym Bros"
          placeholderTextColor={Colors.dark.textMuted}
          maxLength={30}
          autoFocus
        />

        {/* Description */}
        <Text style={styles.inputLabel}>DESCRIPTION (OPTIONAL)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="What's this group about?"
          placeholderTextColor={Colors.dark.textMuted}
          maxLength={200}
          multiline
          numberOfLines={3}
        />

        {/* Color Picker */}
        <Text style={styles.inputLabel}>GROUP COLOR</Text>
        <View style={styles.colorRow}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorDot,
                { backgroundColor: color },
                selectedColor === color && styles.colorDotSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createBtn, (!name.trim() || creating) && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={!name.trim() || creating}
          activeOpacity={0.8}
        >
          {creating ? (
            <ActivityIndicator color={Colors.dark.textOnAccent} />
          ) : (
            <Text style={styles.createBtnText}>Create Group</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  },
  form: {
    padding: Spacing.xxl,
    gap: Spacing.sm,
  },
  previewSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    marginTop: Spacing.lg,
  },
  previewAvatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarText: {
    color: Colors.dark.textOnAccent,
    fontSize: 32,
    fontWeight: FontWeight.extrabold,
  },
  inputLabel: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    color: Colors.dark.text,
    fontSize: FontSize.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: Colors.dark.text,
  },
  createBtn: {
    backgroundColor: Colors.dark.accent,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.xxxl,
  },
  createBtnDisabled: {
    opacity: 0.4,
  },
  createBtnText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  // Success state
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxxl,
  },
  bigAvatar: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  bigAvatarText: {
    color: Colors.dark.textOnAccent,
    fontSize: 40,
    fontWeight: FontWeight.extrabold,
  },
  successTitle: {
    color: Colors.dark.text,
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
    marginBottom: Spacing.md,
  },
  successSubtitle: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xl,
    marginBottom: Spacing.xxxl,
  },
  codeCard: {
    backgroundColor: Colors.dark.accentSurface,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorderStrong,
    borderRadius: BorderRadius.xxl,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xxxxl,
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  codeText: {
    color: Colors.dark.accent,
    fontSize: 36,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 6,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  copyText: {
    color: Colors.dark.accent,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  goToGroupBtn: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xxxxl,
  },
  goToGroupText: {
    color: Colors.dark.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
  },
})
