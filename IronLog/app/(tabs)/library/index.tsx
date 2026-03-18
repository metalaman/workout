import { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Href } from 'expo-router'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { SEED_EXERCISES } from '@/constants/exercises'
import { useFilterStore } from '@/stores/filter-store'
import { ExerciseIcon } from '@/components/exercise-icon'
import type { MuscleGroup, Equipment } from '@/types'
import Svg, { Path } from 'react-native-svg'

const CATEGORIES: ('All' | MuscleGroup)[] = ['All', 'Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core']
const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']
const EQUIPMENT_OPTIONS: Equipment[] = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight']

type CustomExercise = {
  name: string
  muscleGroup: MuscleGroup
  secondaryMuscles: string[]
  equipment: Equipment
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  icon: string
  instructions: string
  isCustom: true
}

export default function LibraryScreen() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'All' | MuscleGroup>('All')
  const { muscleGroups, equipment, difficulty } = useFilterStore()
  const router = useRouter()

  // Custom exercises state
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Form state
  const [exerciseName, setExerciseName] = useState('')
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup>('Chest')
  const [selectedSecondary, setSelectedSecondary] = useState<MuscleGroup[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment>('Barbell')

  const resetForm = useCallback(() => {
    setExerciseName('')
    setPrimaryMuscle('Chest')
    setSelectedSecondary([])
    setSelectedEquipment('Barbell')
  }, [])

  const handleCreateExercise = useCallback(() => {
    const trimmed = exerciseName.trim()
    if (!trimmed) {
      Alert.alert('Missing Name', 'Please enter an exercise name.')
      return
    }

    const newExercise: CustomExercise = {
      name: trimmed,
      muscleGroup: primaryMuscle,
      secondaryMuscles: selectedSecondary,
      equipment: selectedEquipment,
      difficulty: 'Intermediate',
      icon: '⭐',
      instructions: '',
      isCustom: true,
    }

    setCustomExercises((prev) => [...prev, newExercise])
    resetForm()
    setShowCreateModal(false)
  }, [exerciseName, primaryMuscle, selectedSecondary, selectedEquipment, resetForm])

  const toggleSecondaryMuscle = useCallback((mg: MuscleGroup) => {
    setSelectedSecondary((prev) =>
      prev.includes(mg) ? prev.filter((m) => m !== mg) : [...prev, mg]
    )
  }, [])

  // Combine seed + custom, then filter
  const allExercises = useMemo(() => {
    const seed = SEED_EXERCISES.map((e) => ({ ...e, isCustom: false as const }))
    return [...seed, ...customExercises]
  }, [customExercises])

  const filteredExercises = useMemo(() => {
    return allExercises.filter((e) => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
      if (selectedCategory !== 'All' && e.muscleGroup !== selectedCategory) return false
      if (muscleGroups.length > 0 && !muscleGroups.includes(e.muscleGroup)) return false
      if (equipment.length > 0 && !equipment.includes(e.equipment)) return false
      if (difficulty && e.difficulty !== difficulty) return false
      return true
    })
  }, [search, selectedCategory, muscleGroups, equipment, difficulty, allExercises])

  const handleExercisePress = (index: number) => {
    const exercise = filteredExercises[index]
    if (exercise.isCustom) {
      // Custom exercises don't have a detail page yet
      Alert.alert(exercise.name, `${exercise.muscleGroup} · ${exercise.equipment}\n\nCustom exercise`)
      return
    }
    // Find the original index in SEED_EXERCISES
    const originalIndex = SEED_EXERCISES.findIndex((e) => e.name === exercise.name)
    if (originalIndex >= 0) {
      router.push(`/(tabs)/library/${originalIndex}` as Href)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Exercise Library</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/library/filters' as Href)} style={styles.filterButton}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M4 6h16M6 12h12M8 18h8" stroke={Colors.dark.text} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={Colors.dark.textDark}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Category chips */}
      <View style={styles.chipRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          contentContainerStyle={styles.chipList}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item)}
              style={[styles.chip, selectedCategory === item && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedCategory === item && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Exercise list */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item, i) => (item.isCustom ? `custom-${item.name}-${i}` : `seed-${i}`)}
        contentContainerStyle={styles.list}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => handleExercisePress(index)} activeOpacity={0.7}>
            <View style={styles.exerciseRow}>
              <View style={styles.exerciseIcon}>
                <ExerciseIcon exerciseName={item.name} muscleGroup={item.muscleGroup} size={32} />
              </View>
              <View style={styles.exerciseInfo}>
                <View style={styles.exerciseNameRow}>
                  <Text style={styles.exerciseName} numberOfLines={1}>{item.name}</Text>
                  {item.isCustom && (
                    <View style={styles.customBadge}>
                      <Text style={styles.customBadgeText}>Custom</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.exerciseMuscle}>{item.muscleGroup} · {item.equipment}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No exercises found</Text>
          </View>
        }
      />

      {/* FAB - Create Exercise */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.8}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M12 5v14M5 12h14" stroke={Colors.dark.textOnAccent} strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      </TouchableOpacity>

      {/* Create Exercise Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          resetForm()
          setShowCreateModal(false)
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  resetForm()
                  setShowCreateModal(false)
                }}
              >
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Exercise</Text>
              <TouchableOpacity onPress={handleCreateExercise}>
                <Text style={styles.modalCreate}>Create</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Exercise Name */}
              <Text style={styles.fieldLabel}>Exercise Name</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. Zercher Squat"
                placeholderTextColor={Colors.dark.textMuted}
                value={exerciseName}
                onChangeText={setExerciseName}
                autoFocus
              />

              {/* Primary Muscle Group */}
              <Text style={styles.fieldLabel}>Primary Muscle Group</Text>
              <View style={styles.optionGrid}>
                {MUSCLE_GROUPS.map((mg) => (
                  <TouchableOpacity
                    key={mg}
                    style={[styles.optionChip, primaryMuscle === mg && styles.optionChipActive]}
                    onPress={() => setPrimaryMuscle(mg)}
                  >
                    <Text style={[styles.optionChipText, primaryMuscle === mg && styles.optionChipTextActive]}>
                      {mg}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Secondary Muscles */}
              <Text style={styles.fieldLabel}>Secondary Muscles</Text>
              <View style={styles.optionGrid}>
                {MUSCLE_GROUPS.filter((mg) => mg !== primaryMuscle).map((mg) => (
                  <TouchableOpacity
                    key={mg}
                    style={[
                      styles.optionChip,
                      selectedSecondary.includes(mg) && styles.optionChipSecondary,
                    ]}
                    onPress={() => toggleSecondaryMuscle(mg)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        selectedSecondary.includes(mg) && styles.optionChipTextSecondary,
                      ]}
                    >
                      {mg}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Equipment */}
              <Text style={styles.fieldLabel}>Equipment</Text>
              <View style={styles.optionGrid}>
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <TouchableOpacity
                    key={eq}
                    style={[styles.optionChip, selectedEquipment === eq && styles.optionChipActive]}
                    onPress={() => setSelectedEquipment(eq)}
                  >
                    <Text style={[styles.optionChipText, selectedEquipment === eq && styles.optionChipTextActive]}>
                      {eq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Preview */}
              <View style={styles.previewSection}>
                <Text style={styles.fieldLabel}>Preview</Text>
                <View style={styles.previewCard}>
                  <View style={styles.exerciseIcon}>
                    <Text style={{ fontSize: 22 }}>⭐</Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <View style={styles.exerciseNameRow}>
                      <Text style={styles.exerciseName} numberOfLines={1}>
                        {exerciseName || 'Exercise Name'}
                      </Text>
                      <View style={styles.customBadge}>
                        <Text style={styles.customBadgeText}>Custom</Text>
                      </View>
                    </View>
                    <Text style={styles.exerciseMuscle}>
                      {primaryMuscle} · {selectedEquipment}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
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
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md + 2,
  },
  title: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 2,
    gap: Spacing.md,
  },
  searchIcon: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.lg,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: FontSize.lg,
  },
  chipRow: {
    marginBottom: Spacing.lg,
  },
  chipList: {
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.dark.surfaceLight,
  },
  chipActive: {
    backgroundColor: Colors.dark.accent,
  },
  chipText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.textSecondary,
  },
  chipTextActive: {
    color: Colors.dark.textOnAccent,
  },
  list: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 100,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  exerciseIcon: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseEmoji: {
    fontSize: FontSize.xxl,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseName: {
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    flexShrink: 1,
  },
  exerciseMuscle: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    marginTop: 1,
  },
  chevron: {
    color: Colors.dark.textDark,
    fontSize: FontSize.xxl,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xl,
  },
  customBadge: {
    backgroundColor: Colors.dark.accentSurface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
  },
  customBadgeText: {
    color: Colors.dark.accent,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalCancel: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
  },
  modalTitle: {
    color: Colors.dark.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  modalCreate: {
    color: Colors.dark.accent,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: Spacing.xxl,
    paddingBottom: 60,
  },
  fieldLabel: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },
  fieldInput: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.dark.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  optionChipActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  optionChipSecondary: {
    backgroundColor: Colors.dark.accentSurface,
    borderColor: Colors.dark.accent,
  },
  optionChipText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.textSecondary,
  },
  optionChipTextActive: {
    color: Colors.dark.textOnAccent,
  },
  optionChipTextSecondary: {
    color: Colors.dark.accent,
  },
  previewSection: {
    marginTop: Spacing.lg,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
})
