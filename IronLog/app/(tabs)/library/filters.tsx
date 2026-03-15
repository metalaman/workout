import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useFilterStore } from '@/stores/filter-store'
import { SEED_EXERCISES } from '@/constants/exercises'
import type { MuscleGroup, Equipment, Difficulty } from '@/types'

const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']
const EQUIPMENT_OPTIONS: Equipment[] = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Bands']
const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced']

export default function FiltersScreen() {
  const {
    muscleGroups, equipment, difficulty,
    toggleMuscleGroup, toggleEquipment, setDifficulty, reset,
  } = useFilterStore()
  const router = useRouter()

  const matchCount = SEED_EXERCISES.filter((e) => {
    if (muscleGroups.length > 0 && !muscleGroups.includes(e.muscleGroup)) return false
    if (equipment.length > 0 && !equipment.includes(e.equipment)) return false
    if (difficulty && e.difficulty !== difficulty) return false
    return true
  }).length

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Filter Exercises</Text>
        <TouchableOpacity onPress={reset}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Muscle Groups */}
        <Text style={styles.sectionTitle}>MUSCLE GROUP</Text>
        <View style={styles.grid}>
          {MUSCLE_GROUPS.map((m) => {
            const selected = muscleGroups.includes(m)
            return (
              <TouchableOpacity
                key={m}
                onPress={() => toggleMuscleGroup(m)}
                style={[styles.gridItem, selected && styles.gridItemSelected]}
              >
                {selected && <Text style={styles.checkMark}>✓</Text>}
                <Text style={[styles.gridItemText, selected && styles.gridItemTextSelected]}>{m}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Equipment */}
        <Text style={styles.sectionTitle}>EQUIPMENT</Text>
        <View style={styles.grid}>
          {EQUIPMENT_OPTIONS.map((e) => {
            const selected = equipment.includes(e)
            return (
              <TouchableOpacity
                key={e}
                onPress={() => toggleEquipment(e)}
                style={[styles.gridItem, selected && styles.gridItemSelected]}
              >
                {selected && <Text style={styles.checkMark}>✓</Text>}
                <Text style={[styles.gridItemText, selected && styles.gridItemTextSelected]}>{e}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Difficulty */}
        <Text style={styles.sectionTitle}>DIFFICULTY</Text>
        <View style={styles.difficultyRow}>
          {DIFFICULTIES.map((d) => {
            const selected = difficulty === d
            return (
              <TouchableOpacity
                key={d}
                onPress={() => setDifficulty(selected ? null : d)}
                style={[styles.difficultyItem, selected && styles.gridItemSelected]}
              >
                <Text style={[styles.difficultyText, selected && styles.gridItemTextSelected]}>{d}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      {/* Apply button */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
          <LinearGradient colors={['#e8ff47', '#a8e000']} style={styles.applyButton}>
            <Text style={styles.applyText}>Show {matchCount} Exercises</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    paddingVertical: Spacing.lg,
  },
  title: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
  },
  resetText: {
    color: Colors.dark.accent,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
  },
  sectionTitle: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  gridItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md + 2,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  gridItemSelected: {
    backgroundColor: Colors.dark.accentSurfaceActive,
    borderColor: Colors.dark.accentBorderStrong,
  },
  checkMark: {
    fontSize: FontSize.sm,
    color: Colors.dark.accent,
  },
  gridItemText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  gridItemTextSelected: {
    color: Colors.dark.accent,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  difficultyItem: {
    flex: 1,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  difficultyText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  footer: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  applyButton: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  applyText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
})
