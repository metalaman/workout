import { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useProgramStore } from '@/stores/program-store'
import { ExerciseIcon, MUSCLE_GROUP_COLORS } from '@/components/exercise-icon'
import { SEED_EXERCISES } from '@/constants/exercises'
import type { MuscleGroup, ProgramExercise } from '@/types'
import Svg, { Path } from 'react-native-svg'

const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']

export default function PickExerciseScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ dayIndex?: string; swapIndex?: string }>()
  const dayIndex = parseInt(params.dayIndex ?? '0', 10)
  const swapIndex = params.swapIndex != null ? parseInt(params.swapIndex, 10) : null

  const { addExerciseToBuilderDay, builderDays, swapExercise } = useProgramStore()

  const [search, setSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null)
  const [customName, setCustomName] = useState('')
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>('Chest')
  const [showCustom, setShowCustom] = useState(false)

  const filteredExercises = useMemo(() => {
    return SEED_EXERCISES.filter((ex) => {
      const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase())
      const matchMuscle = !selectedMuscle || ex.muscleGroup === selectedMuscle
      return matchSearch && matchMuscle
    })
  }, [search, selectedMuscle])

  const handleSelectExercise = (name: string, muscleGroup: string) => {
    const exId = name.toLowerCase().replace(/\s+/g, '-')
    if (swapIndex != null) {
      // Swap mode: replace exercise keeping same sets
      swapExercise(dayIndex, swapIndex, exId, name)
      router.back()
      return
    }
    const exercise: ProgramExercise = {
      exerciseId: exId,
      exerciseName: name,
      sets: [
        { weight: 0, reps: 10 },
        { weight: 0, reps: 10 },
        { weight: 0, reps: 10 },
      ],
    }
    addExerciseToBuilderDay(dayIndex, exercise)
    router.back()
  }

  const handleAddCustom = () => {
    if (!customName.trim()) return
    handleSelectExercise(customName.trim(), customMuscle)
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M18 6L6 18M6 6l12 12" stroke={Colors.dark.text} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {swapIndex != null ? 'Swap Exercise' : 'Add Exercise'}
          </Text>
          <TouchableOpacity onPress={() => setShowCustom(!showCustom)} style={styles.customBtn} activeOpacity={0.7}>
            <Text style={styles.customBtnText}>{showCustom ? 'List' : 'Custom'}</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
              <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search exercises..."
              placeholderTextColor={Colors.dark.textMuted}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={styles.clearSearch}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Muscle group filters */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, !selectedMuscle && styles.filterPillActive]}
            onPress={() => setSelectedMuscle(null)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, !selectedMuscle && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          {MUSCLE_GROUPS.map((mg) => (
            <TouchableOpacity
              key={mg}
              style={[
                styles.filterPill,
                selectedMuscle === mg && styles.filterPillActive,
                selectedMuscle === mg && { borderColor: MUSCLE_GROUP_COLORS[mg] },
              ]}
              onPress={() => setSelectedMuscle(selectedMuscle === mg ? null : mg)}
              activeOpacity={0.7}
            >
              <View style={[styles.filterDot, { backgroundColor: MUSCLE_GROUP_COLORS[mg] }]} />
              <Text style={[styles.filterText, selectedMuscle === mg && { color: MUSCLE_GROUP_COLORS[mg] }]}>
                {mg}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {showCustom ? (
          <View style={styles.customSection}>
            <Text style={styles.customTitle}>Custom Exercise</Text>
            <TextInput
              style={styles.customInput}
              value={customName}
              onChangeText={setCustomName}
              placeholder="Exercise name"
              placeholderTextColor={Colors.dark.textMuted}
              autoFocus
            />
            <Text style={styles.customLabel}>Muscle Group</Text>
            <View style={styles.customMuscleRow}>
              {MUSCLE_GROUPS.map((mg) => (
                <TouchableOpacity
                  key={mg}
                  style={[
                    styles.customMusclePill,
                    customMuscle === mg && { backgroundColor: `${MUSCLE_GROUP_COLORS[mg]}20`, borderColor: MUSCLE_GROUP_COLORS[mg] },
                  ]}
                  onPress={() => setCustomMuscle(mg)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.customMuscleText, customMuscle === mg && { color: MUSCLE_GROUP_COLORS[mg] }]}>
                    {mg}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.addCustomBtn, !customName.trim() && { opacity: 0.4 }]}
              onPress={handleAddCustom}
              disabled={!customName.trim()}
              activeOpacity={0.7}
            >
              <Text style={styles.addCustomBtnText}>Add Custom Exercise</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const color = MUSCLE_GROUP_COLORS[item.muscleGroup] || Colors.dark.accent
              return (
                <TouchableOpacity
                  style={styles.exerciseRow}
                  onPress={() => handleSelectExercise(item.name, item.muscleGroup)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.exIconWrap, { backgroundColor: `${color}12` }]}>
                    <ExerciseIcon exerciseName={item.name} muscleGroup={item.muscleGroup} size={30} color={color} />
                  </View>
                  <View style={styles.exInfo}>
                    <Text style={styles.exName}>{item.name}</Text>
                    <View style={styles.exMetaRow}>
                      <View style={[styles.exMuscleTag, { backgroundColor: `${color}15` }]}>
                        <Text style={[styles.exMuscleText, { color }]}>{item.muscleGroup}</Text>
                      </View>
                      <Text style={styles.exEquipment}>{item.equipment}</Text>
                    </View>
                  </View>
                  <View style={styles.exAddBtn}>
                    <Text style={styles.exAddText}>+</Text>
                  </View>
                </TouchableOpacity>
              )
            }}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyText}>No exercises found</Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.dark.text },
  customBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: Colors.dark.surface,
  },
  customBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.dark.accent },

  // Search
  searchRow: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl, paddingVertical: Platform.OS === 'ios' ? Spacing.lg : Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.xl, color: Colors.dark.text },
  clearSearch: { fontSize: FontSize.lg, color: Colors.dark.textMuted, padding: 4 },

  // Filters
  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg,
  },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: Colors.dark.surface,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  filterPillActive: {
    backgroundColor: Colors.dark.accentSurface, borderColor: Colors.dark.accentBorderStrong,
  },
  filterDot: { width: 6, height: 6, borderRadius: 3 },
  filterText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.dark.textSecondary },
  filterTextActive: { color: Colors.dark.accent },

  // List
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  exIconWrap: {
    width: 48, height: 48, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  exInfo: { flex: 1 },
  exName: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.dark.text },
  exMetaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 3 },
  exMuscleTag: { paddingHorizontal: Spacing.md, paddingVertical: 1, borderRadius: BorderRadius.full },
  exMuscleText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  exEquipment: { fontSize: FontSize.sm, color: Colors.dark.textMuted },
  exAddBtn: {
    width: 32, height: 32, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.accentSurface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.dark.accentBorder,
  },
  exAddText: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.dark.accent },

  // Empty
  emptyList: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: FontSize.xl, color: Colors.dark.textMuted },

  // Custom
  customSection: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  customTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.dark.text, marginBottom: Spacing.xl },
  customInput: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    fontSize: FontSize.xxl, fontWeight: FontWeight.semibold, color: Colors.dark.text,
    borderWidth: 1, borderColor: Colors.dark.border, marginBottom: Spacing.xl,
  },
  customLabel: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.dark.textMuted, letterSpacing: 1, marginBottom: Spacing.md },
  customMuscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xxl },
  customMusclePill: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full, backgroundColor: Colors.dark.surface,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  customMuscleText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.dark.textSecondary },
  addCustomBtn: {
    backgroundColor: Colors.dark.accent, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.lg, alignItems: 'center',
  },
  addCustomBtnText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.dark.textOnAccent },
})
