import { useState, useMemo } from 'react'
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Href } from 'expo-router'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { SEED_EXERCISES } from '@/constants/exercises'
import { useFilterStore } from '@/stores/filter-store'
import type { MuscleGroup } from '@/types'

const CATEGORIES: ('All' | MuscleGroup)[] = ['All', 'Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core']

export default function LibraryScreen() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'All' | MuscleGroup>('All')
  const { muscleGroups, equipment, difficulty } = useFilterStore()
  const router = useRouter()

  const filteredExercises = useMemo(() => {
    return SEED_EXERCISES.filter((e) => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
      if (selectedCategory !== 'All' && e.muscleGroup !== selectedCategory) return false
      if (muscleGroups.length > 0 && !muscleGroups.includes(e.muscleGroup)) return false
      if (equipment.length > 0 && !equipment.includes(e.equipment)) return false
      if (difficulty && e.difficulty !== difficulty) return false
      return true
    })
  }, [search, selectedCategory, muscleGroups, equipment, difficulty])

  const handleExercisePress = (index: number) => {
    // Find the original index in SEED_EXERCISES
    const exercise = filteredExercises[index]
    const originalIndex = SEED_EXERCISES.indexOf(exercise)
    router.push(`/(tabs)/library/${originalIndex}` as Href)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Exercise Library</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/library/filters' as Href)}>
            <Text style={styles.filterButton}>🔧</Text>
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
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => handleExercisePress(index)} activeOpacity={0.7}>
            <View style={styles.exerciseRow}>
              <View style={styles.exerciseIcon}>
                <Text style={styles.exerciseEmoji}>{item.icon}</Text>
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseMuscle}>{item.muscleGroup}</Text>
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
    fontSize: 18,
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
  exerciseName: {
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
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
})
