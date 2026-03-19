import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Image, Dimensions, Modal, Pressable, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from '@/stores/auth-store'
import { usePhotoStore } from '@/stores/photo-store'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import type { PhotoPose, ProgressPhoto } from '@/types'

const { width: SCREEN_W } = Dimensions.get('window')
const GRID_SIZE = (SCREEN_W - 52) / 3
const POSES: PhotoPose[] = ['Front', 'Side', 'Back']

export default function ProgressPhotosScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { photos, loadPhotos, addPhoto } = usePhotoStore()
  const [showAdd, setShowAdd] = useState(false)
  const [selectedPose, setSelectedPose] = useState<PhotoPose>('Front')
  const [photoUrl, setPhotoUrl] = useState('')
  const [bodyWeight, setBodyWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [compareMode, setCompareMode] = useState(false)
  const [comparePhotos, setComparePhotos] = useState<ProgressPhoto[]>([])
  const [filterPose, setFilterPose] = useState<PhotoPose | 'All'>('All')

  useEffect(() => {
    if (user?.$id) loadPhotos(user.$id)
  }, [user?.$id])

  const filteredPhotos = filterPose === 'All'
    ? photos
    : photos.filter((p) => p.pose === filterPose)

  const handleTakePhoto = async () => {
    // In a real app, this would use expo-image-picker
    // For now, we'll use a URL input as placeholder
    Alert.alert(
      'Add Photo',
      'Enter a photo URL or use the camera',
      [
        { text: 'Cancel' },
        {
          text: 'Use URL',
          onPress: () => setShowAdd(true),
        },
      ]
    )
  }

  const handleSavePhoto = async () => {
    if (!user?.$id || !photoUrl) return
    await addPhoto({
      userId: user.$id,
      photoUrl,
      pose: selectedPose,
      bodyWeight: bodyWeight ? parseFloat(bodyWeight) : null,
      takenAt: new Date().toISOString(),
      notes: notes || null,
    })
    setPhotoUrl('')
    setBodyWeight('')
    setNotes('')
    setShowAdd(false)
  }

  const toggleCompare = (photo: ProgressPhoto) => {
    if (comparePhotos.find((p) => p.$id === photo.$id)) {
      setComparePhotos(comparePhotos.filter((p) => p.$id !== photo.$id))
    } else if (comparePhotos.length < 2) {
      setComparePhotos([...comparePhotos, photo])
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Progress Photos</Text>
        <TouchableOpacity onPress={() => setCompareMode(!compareMode)}>
          <Text style={[styles.compareBtn, compareMode && { color: Colors.dark.accent }]}>
            {compareMode ? 'Done' : 'Compare'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pose filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: Spacing.xxl, gap: 8 }}>
        {(['All', ...POSES] as const).map((pose) => (
          <TouchableOpacity
            key={pose}
            style={[styles.filterPill, filterPose === pose && styles.filterPillActive]}
            onPress={() => setFilterPose(pose)}
          >
            <Text style={[styles.filterText, filterPose === pose && styles.filterTextActive]}>
              {pose}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Compare view */}
      {compareMode && comparePhotos.length === 2 && (
        <View style={styles.compareContainer}>
          <View style={styles.compareCard}>
            <Image source={{ uri: comparePhotos[0].photoUrl }} style={styles.compareImage} />
            <Text style={styles.compareDate}>
              {new Date(comparePhotos[0].takenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            {comparePhotos[0].bodyWeight != null && (
              <Text style={styles.compareWeight}>{comparePhotos[0].bodyWeight} lbs</Text>
            )}
          </View>
          <View style={styles.compareCard}>
            <Image source={{ uri: comparePhotos[1].photoUrl }} style={styles.compareImage} />
            <Text style={styles.compareDate}>
              {new Date(comparePhotos[1].takenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            {comparePhotos[1].bodyWeight != null && (
              <Text style={styles.compareWeight}>{comparePhotos[1].bodyWeight} lbs</Text>
            )}
          </View>
        </View>
      )}

      {compareMode && comparePhotos.length < 2 && (
        <View style={styles.compareHint}>
          <Text style={styles.compareHintText}>
            Select {2 - comparePhotos.length} more photo{comparePhotos.length === 1 ? '' : 's'} to compare
          </Text>
        </View>
      )}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Photo grid */}
        <View style={styles.grid}>
          {filteredPhotos.map((photo) => {
            const isSelected = comparePhotos.find((p) => p.$id === photo.$id)
            return (
              <TouchableOpacity
                key={photo.$id}
                style={[styles.gridItem, isSelected && styles.gridItemSelected]}
                onPress={() => compareMode ? toggleCompare(photo) : null}
              >
                <Image source={{ uri: photo.photoUrl }} style={styles.gridImage} />
                <View style={styles.gridOverlay}>
                  <Text style={styles.gridDate}>
                    {new Date(photo.takenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <View style={styles.gridPoseBadge}>
                    <Text style={styles.gridPoseText}>{photo.pose}</Text>
                  </View>
                </View>
                {isSelected && (
                  <View style={styles.selectedOverlay}>
                    <Text style={styles.selectedCheck}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        {filteredPhotos.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Photos Yet</Text>
            <Text style={styles.emptySubtitle}>Start tracking your transformation</Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Add photo FAB */}
      {!compareMode && (
        <TouchableOpacity style={styles.fab} onPress={handleTakePhoto} activeOpacity={0.8}>
          <LinearGradient colors={['#e8ff47', '#7fff00']} style={styles.fabGradient}>
            <Text style={styles.fabIcon}>📷</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Add photo modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAdd(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add Progress Photo</Text>

            {/* Pose selector */}
            <Text style={styles.fieldLabel}>Pose</Text>
            <View style={styles.poseRow}>
              {POSES.map((pose) => (
                <TouchableOpacity
                  key={pose}
                  style={[styles.posePill, selectedPose === pose && styles.posePillActive]}
                  onPress={() => setSelectedPose(pose)}
                >
                  <Text style={[styles.poseText, selectedPose === pose && styles.poseTextActive]}>
                    {pose}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Photo URL (placeholder for camera) */}
            <Text style={styles.fieldLabel}>Photo URL</Text>
            <TextInput
              style={styles.input}
              value={photoUrl}
              onChangeText={setPhotoUrl}
              placeholder="https://..."
              placeholderTextColor={Colors.dark.textMuted}
              autoCapitalize="none"
            />

            {/* Body weight */}
            <Text style={styles.fieldLabel}>Body Weight (optional)</Text>
            <TextInput
              style={styles.input}
              value={bodyWeight}
              onChangeText={setBodyWeight}
              keyboardType="decimal-pad"
              placeholder="185"
              placeholderTextColor={Colors.dark.textMuted}
            />

            {/* Notes */}
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Week 4, feeling leaner..."
              placeholderTextColor={Colors.dark.textMuted}
            />

            <TouchableOpacity onPress={handleSavePhoto}>
              <LinearGradient colors={['#e8ff47', '#7fff00']} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save Photo</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  scroll: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
  },
  backBtn: { color: Colors.dark.text, fontSize: FontSize.title },
  topTitle: { color: Colors.dark.text, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  compareBtn: { color: Colors.dark.textSecondary, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },

  filterRow: { maxHeight: 36, marginBottom: Spacing.md },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border,
  },
  filterPillActive: { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
  filterText: { color: Colors.dark.textSecondary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  filterTextActive: { color: Colors.dark.textOnAccent },

  compareContainer: {
    flexDirection: 'row', paddingHorizontal: Spacing.xxl, gap: Spacing.md, marginBottom: Spacing.xl,
  },
  compareCard: { flex: 1, alignItems: 'center' },
  compareImage: { width: '100%', aspectRatio: 3 / 4, borderRadius: BorderRadius.lg, backgroundColor: Colors.dark.surface },
  compareDate: { color: Colors.dark.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginTop: 4 },
  compareWeight: { color: Colors.dark.accent, fontSize: FontSize.sm },

  compareHint: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.md },
  compareHintText: { color: Colors.dark.textMuted, fontSize: FontSize.md, textAlign: 'center' },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.xxl, gap: 6,
  },
  gridItem: {
    width: GRID_SIZE, height: GRID_SIZE * 1.3, borderRadius: BorderRadius.md,
    overflow: 'hidden', backgroundColor: Colors.dark.surface,
  },
  gridItemSelected: { borderWidth: 2, borderColor: Colors.dark.accent },
  gridImage: { width: '100%', height: '100%' },
  gridOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 3,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  gridDate: { color: Colors.dark.white, fontSize: 8, fontWeight: FontWeight.semibold },
  gridPoseBadge: { backgroundColor: 'rgba(232,255,71,0.3)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  gridPoseText: { color: Colors.dark.accent, fontSize: 7, fontWeight: FontWeight.bold },
  selectedOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(232,255,71,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  selectedCheck: { color: Colors.dark.accent, fontSize: 24, fontWeight: FontWeight.black },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.bold },
  emptySubtitle: { color: Colors.dark.textMuted, fontSize: FontSize.md, marginTop: 4 },

  fab: {
    position: 'absolute', bottom: 30, right: 20,
    width: 56, height: 56, borderRadius: 28,
    shadowColor: '#e8ff47', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  fabGradient: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  fabIcon: { fontSize: 24 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.dark.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.xxl, paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xl,
  },
  sheetTitle: { color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.bold, marginBottom: Spacing.xxl },

  fieldLabel: { color: Colors.dark.textSecondary, fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginBottom: 6, marginTop: 12, letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, color: Colors.dark.text, fontSize: FontSize.lg,
  },

  poseRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  posePill: {
    flex: 1, paddingVertical: 10, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.surface, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  posePillActive: { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
  poseText: { color: Colors.dark.textSecondary, fontWeight: FontWeight.semibold },
  poseTextActive: { color: Colors.dark.textOnAccent },

  saveBtn: { paddingVertical: 14, borderRadius: BorderRadius.lg, alignItems: 'center', marginTop: Spacing.xxl },
  saveBtnText: { color: Colors.dark.textOnAccent, fontWeight: FontWeight.bold, fontSize: FontSize.xxl },
})
