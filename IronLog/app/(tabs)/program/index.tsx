import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'

interface SetData {
  weight: number
  reps: number
}

interface ExerciseData {
  name: string
  sets: SetData[]
}

interface DayData {
  name: string
  exercises: ExerciseData[]
}

const DEFAULT_PROGRAM: DayData[] = [
  {
    name: 'Push A',
    exercises: [
      { name: 'Bench Press', sets: [{ weight: 185, reps: 8 }, { weight: 185, reps: 8 }, { weight: 195, reps: 6 }, { weight: 195, reps: 6 }] },
      { name: 'Incline DB Press', sets: [{ weight: 65, reps: 10 }, { weight: 65, reps: 10 }, { weight: 70, reps: 8 }] },
      { name: 'Cable Flyes', sets: [{ weight: 30, reps: 12 }, { weight: 30, reps: 12 }, { weight: 30, reps: 12 }] },
      { name: 'OHP', sets: [{ weight: 115, reps: 8 }, { weight: 115, reps: 8 }, { weight: 120, reps: 6 }] },
      { name: 'Tricep Pushdown', sets: [{ weight: 50, reps: 12 }, { weight: 55, reps: 10 }, { weight: 55, reps: 10 }] },
    ],
  },
  {
    name: 'Pull A',
    exercises: [
      { name: 'Barbell Row', sets: [{ weight: 155, reps: 8 }, { weight: 155, reps: 8 }, { weight: 165, reps: 6 }] },
      { name: 'Lat Pulldown', sets: [{ weight: 120, reps: 10 }, { weight: 120, reps: 10 }, { weight: 130, reps: 8 }] },
      { name: 'Seated Cable Row', sets: [{ weight: 100, reps: 12 }, { weight: 100, reps: 12 }, { weight: 110, reps: 10 }] },
      { name: 'Face Pulls', sets: [{ weight: 40, reps: 15 }, { weight: 40, reps: 15 }] },
      { name: 'Barbell Curl', sets: [{ weight: 65, reps: 10 }, { weight: 65, reps: 10 }, { weight: 70, reps: 8 }] },
    ],
  },
  {
    name: 'Legs',
    exercises: [
      { name: 'Barbell Squat', sets: [{ weight: 225, reps: 6 }, { weight: 225, reps: 6 }, { weight: 235, reps: 5 }, { weight: 235, reps: 5 }] },
      { name: 'Romanian Deadlift', sets: [{ weight: 185, reps: 8 }, { weight: 185, reps: 8 }, { weight: 195, reps: 6 }] },
      { name: 'Leg Press', sets: [{ weight: 360, reps: 10 }, { weight: 360, reps: 10 }, { weight: 400, reps: 8 }] },
      { name: 'Leg Curl', sets: [{ weight: 90, reps: 12 }, { weight: 90, reps: 12 }, { weight: 100, reps: 10 }] },
      { name: 'Calf Raises', sets: [{ weight: 180, reps: 15 }, { weight: 180, reps: 15 }, { weight: 200, reps: 12 }] },
    ],
  },
  {
    name: 'Push B',
    exercises: [
      { name: 'OHP', sets: [{ weight: 120, reps: 8 }, { weight: 120, reps: 8 }, { weight: 125, reps: 6 }] },
      { name: 'Incline DB Press', sets: [{ weight: 70, reps: 8 }, { weight: 70, reps: 8 }, { weight: 75, reps: 6 }] },
      { name: 'Cable Flyes', sets: [{ weight: 35, reps: 12 }, { weight: 35, reps: 12 }] },
      { name: 'Lateral Raises', sets: [{ weight: 20, reps: 15 }, { weight: 20, reps: 15 }, { weight: 25, reps: 12 }] },
      { name: 'Skull Crushers', sets: [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }, { weight: 65, reps: 8 }] },
    ],
  },
  {
    name: 'Pull B',
    exercises: [
      { name: 'Deadlift', sets: [{ weight: 275, reps: 5 }, { weight: 275, reps: 5 }, { weight: 295, reps: 3 }] },
      { name: 'Pull-ups', sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 6 }] },
      { name: 'T-Bar Row', sets: [{ weight: 90, reps: 10 }, { weight: 90, reps: 10 }, { weight: 100, reps: 8 }] },
      { name: 'Face Pulls', sets: [{ weight: 45, reps: 15 }, { weight: 45, reps: 15 }] },
      { name: 'Hammer Curls', sets: [{ weight: 30, reps: 12 }, { weight: 30, reps: 12 }, { weight: 35, reps: 10 }] },
    ],
  },
  {
    name: 'Legs B',
    exercises: [
      { name: 'Leg Press', sets: [{ weight: 400, reps: 8 }, { weight: 400, reps: 8 }, { weight: 440, reps: 6 }] },
      { name: 'Bulgarian Split Squat', sets: [{ weight: 40, reps: 10 }, { weight: 40, reps: 10 }, { weight: 45, reps: 8 }] },
      { name: 'Leg Curl', sets: [{ weight: 100, reps: 10 }, { weight: 100, reps: 10 }, { weight: 110, reps: 8 }] },
      { name: 'Leg Extension', sets: [{ weight: 110, reps: 12 }, { weight: 110, reps: 12 }, { weight: 120, reps: 10 }] },
      { name: 'Calf Raises', sets: [{ weight: 200, reps: 15 }, { weight: 200, reps: 15 }] },
    ],
  },
]

export default function ProgramScreen() {
  const [activeDay, setActiveDay] = useState(0)
  const [program, setProgram] = useState(DEFAULT_PROGRAM)
  const [editingCell, setEditingCell] = useState<{ ex: number; set: number; field: 'weight' | 'reps' } | null>(null)

  const currentDay = program[activeDay]

  const handleCellEdit = (exIdx: number, setIdx: number, field: 'weight' | 'reps', value: string) => {
    const num = parseInt(value, 10)
    if (isNaN(num)) return

    setProgram((prev) => {
      const updated = [...prev]
      const day = { ...updated[activeDay] }
      const exercises = [...day.exercises]
      const exercise = { ...exercises[exIdx] }
      const sets = [...exercise.sets]
      sets[setIdx] = { ...sets[setIdx], [field]: num }
      exercise.sets = sets
      exercises[exIdx] = exercise
      day.exercises = exercises
      updated[activeDay] = day
      return updated
    })
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>MY PROGRAM</Text>
        <Text style={styles.headerTitle}>Push Pull Legs</Text>
        <Text style={styles.headerSubtitle}>6 days/week · Week 4 of 8</Text>
      </View>

      {/* Day tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayTabs}
      >
        {program.map((day, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => { setActiveDay(i); setEditingCell(null) }}
            style={[styles.dayTab, activeDay === i && styles.dayTabActive]}
          >
            <Text style={[styles.dayTabText, activeDay === i && styles.dayTabTextActive]}>{day.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Exercises */}
      <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
        {currentDay.exercises.map((ex, exIdx) => (
          <View key={exIdx} style={styles.exerciseBlock}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <Text style={styles.editIcon}>✏️</Text>
            </View>
            <View style={styles.setsRow}>
              {ex.sets.map((s, setIdx) => {
                const isEditing =
                  editingCell?.ex === exIdx && editingCell?.set === setIdx

                return (
                  <TouchableOpacity
                    key={setIdx}
                    style={styles.setBox}
                    onPress={() => setEditingCell({ ex: exIdx, set: setIdx, field: 'weight' })}
                  >
                    {isEditing ? (
                      <View style={styles.setEditContainer}>
                        <TextInput
                          style={styles.setEditInput}
                          defaultValue={s.weight.toString()}
                          keyboardType="number-pad"
                          autoFocus
                          selectTextOnFocus
                          onSubmitEditing={(e) => {
                            handleCellEdit(exIdx, setIdx, 'weight', e.nativeEvent.text)
                            setEditingCell({ ex: exIdx, set: setIdx, field: 'reps' })
                          }}
                        />
                        <TextInput
                          style={styles.setEditInputSmall}
                          defaultValue={s.reps.toString()}
                          keyboardType="number-pad"
                          selectTextOnFocus
                          onSubmitEditing={(e) => {
                            handleCellEdit(exIdx, setIdx, 'reps', e.nativeEvent.text)
                            setEditingCell(null)
                          }}
                          onBlur={() => setEditingCell(null)}
                        />
                      </View>
                    ) : (
                      <>
                        <Text style={styles.setWeight}>{s.weight}</Text>
                        <Text style={styles.setReps}>{s.reps} reps</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        ))}

        {/* Add exercise */}
        <TouchableOpacity style={styles.addExercise}>
          <Text style={styles.addExerciseText}>+ Add Exercise</Text>
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
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  headerLabel: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  headerSubtitle: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.md,
    marginTop: 2,
  },
  dayTabs: {
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  dayTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.surfaceLight,
  },
  dayTabActive: {
    backgroundColor: Colors.dark.accent,
  },
  dayTabText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  dayTabTextActive: {
    color: Colors.dark.textOnAccent,
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
  },
  exerciseBlock: {
    marginBottom: Spacing.md + 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  exerciseName: {
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  editIcon: {
    fontSize: FontSize.sm,
    color: Colors.dark.textDark,
  },
  setsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  setBox: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  setWeight: {
    color: Colors.dark.accent,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  setReps: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xs,
  },
  setEditContainer: {
    alignItems: 'center',
    gap: 2,
  },
  setEditInput: {
    color: Colors.dark.accent,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    minWidth: 30,
    padding: 0,
  },
  setEditInputSmall: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    minWidth: 20,
    padding: 0,
  },
  addExercise: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.dark.borderLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md + 2,
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  addExerciseText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.base,
  },
})
