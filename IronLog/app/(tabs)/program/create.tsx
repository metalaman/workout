import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Href } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth-store'
import { useProgramStore } from '@/stores/program-store'
import Svg, { Path } from 'react-native-svg'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const PROGRAM_COLORS = [
  '#e8ff47', '#ff6b6b', '#6bc5ff', '#7fff00',
  '#ffaa47', '#c77dff', '#ff69b4', '#00d4aa',
]

export default function CreateProgramScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { createNewProgram } = useProgramStore()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PROGRAM_COLORS[0])
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim() || !user?.$id || isCreating) return
    setIsCreating(true)
    try {
      // createNewProgram handles local fallback internally
      await createNewProgram(
        name.trim(),
        daysPerWeek,
        0,
        user.$id,
        selectedColor,
      )
    } catch {
      // Already handled in store
    }
    setIsCreating(false)
    // Navigate to edit the first day of the new program
    router.replace('/(tabs)/program/edit-day?dayIndex=0&isNew=true' as Href)
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke={Colors.dark.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Program</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress dots */}
        <View style={styles.progressRow}>
          {[0, 1].map((i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i <= step && { backgroundColor: selectedColor },
                i < step && { opacity: 0.5 },
              ]}
            />
          ))}
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>STEP 1 OF 2</Text>
              <Text style={styles.stepTitle}>Name & Color</Text>
              <Text style={styles.stepSubtitle}>
                Give it a memorable name and pick a color to identify it
              </Text>
              <TextInput
                style={[styles.nameInput, { borderColor: selectedColor + '40' }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Push Pull Legs"
                placeholderTextColor={Colors.dark.textMuted}
                autoFocus
                maxLength={40}
                returnKeyType="next"
                onSubmitEditing={() => name.trim() && setStep(1)}
              />
              <Text style={styles.charCount}>{name.length}/40</Text>

              {/* Color Picker */}
              <Text style={styles.colorLabel}>PROGRAM COLOR</Text>
              <View style={styles.colorRow}>
                {PROGRAM_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorCircleSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                    activeOpacity={0.7}
                  >
                    {selectedColor === color && (
                      <Text style={styles.colorCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>STEP 2 OF 2</Text>
              <Text style={styles.stepTitle}>How many days per week?</Text>
              <Text style={styles.stepSubtitle}>
                Select how many workout days you want each week
              </Text>
              <View style={styles.dayGrid}>
                {DAY_LABELS.map((label, i) => {
                  const dayNum = i + 1
                  const isSelected = dayNum <= daysPerWeek
                  return (
                    <TouchableOpacity
                      key={label}
                      onPress={() => setDaysPerWeek(dayNum)}
                      activeOpacity={0.7}
                      style={[styles.dayPill, isSelected && { borderColor: selectedColor + '60' }]}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={[selectedColor, Colors.dark.accentGreen]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.dayPillGradient}
                        >
                          <Text style={[styles.dayPillText, styles.dayPillTextSelected]}>{label}</Text>
                          <Text style={[styles.dayPillNum, styles.dayPillNumSelected]}>Day {dayNum}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.dayPillInner}>
                          <Text style={styles.dayPillText}>{label}</Text>
                          <Text style={styles.dayPillNum}>—</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
              <View style={[styles.daySummary, { backgroundColor: selectedColor + '10' }]}>
                <Text style={[styles.daySummaryText, { color: selectedColor }]}>
                  {daysPerWeek} day{daysPerWeek !== 1 ? 's' : ''} per week
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom buttons */}
        <View style={styles.bottomBar}>
          {step > 0 && (
            <TouchableOpacity
              style={styles.backStepBtn}
              onPress={() => setStep(step - 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.backStepText}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={styles.flex} />
          {step < 1 ? (
            <TouchableOpacity
              style={[styles.nextBtn, !name.trim() && step === 0 && styles.nextBtnDisabled]}
              onPress={() => {
                if (step === 0 && !name.trim()) return
                setStep(step + 1)
              }}
              activeOpacity={0.7}
              disabled={step === 0 && !name.trim()}
            >
              <LinearGradient
                colors={[selectedColor, Colors.dark.accentGreen]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextBtnGradient}
              >
                <Text style={styles.nextBtnText}>Next</Text>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 12h14M12 5l7 7-7 7" stroke={Colors.dark.textOnAccent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextBtn, isCreating && styles.nextBtnDisabled]}
              onPress={handleCreate}
              activeOpacity={0.7}
              disabled={isCreating}
            >
              <LinearGradient
                colors={[selectedColor, Colors.dark.accentGreen]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextBtnGradient}
              >
                <Text style={styles.nextBtnText}>
                  {isCreating ? 'Creating...' : 'Create & Add Days'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.dark.text,
  },
  progressRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 8, paddingBottom: Spacing.xl,
  },
  progressDot: {
    width: 32, height: 4, borderRadius: 2,
    backgroundColor: Colors.dark.surface,
  },
  content: {
    paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxxl,
  },
  stepContainer: {},
  stepLabel: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    color: Colors.dark.accent, letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  stepTitle: {
    fontSize: FontSize.hero, fontWeight: FontWeight.extrabold,
    color: Colors.dark.text, marginBottom: Spacing.md,
  },
  stepSubtitle: {
    fontSize: FontSize.xl, color: Colors.dark.textSecondary,
    lineHeight: 20, marginBottom: Spacing.xxxl,
  },
  nameInput: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xl,
    fontSize: FontSize.title,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.text,
    borderWidth: 1,
  },
  charCount: {
    fontSize: FontSize.sm, color: Colors.dark.textMuted,
    textAlign: 'right', marginTop: Spacing.sm,
  },

  // Color picker
  colorLabel: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.dark.textMuted,
    letterSpacing: 1.5, marginTop: Spacing.xxxl, marginBottom: Spacing.lg,
  },
  colorRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 14,
  },
  colorCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderColor: '#ffffff',
    shadowColor: '#fff', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  colorCheck: {
    fontSize: 16, fontWeight: FontWeight.bold, color: Colors.dark.textOnAccent,
  },

  dayGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, justifyContent: 'center',
  },
  dayPill: {
    width: 80, height: 72, borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.dark.surface,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  dayPillGradient: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  dayPillInner: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  dayPillText: {
    fontSize: FontSize.base, fontWeight: FontWeight.semibold,
    color: Colors.dark.textSecondary,
  },
  dayPillTextSelected: { color: Colors.dark.textOnAccent },
  dayPillNum: { fontSize: FontSize.sm, color: Colors.dark.textMuted },
  dayPillNumSelected: { color: 'rgba(0,0,0,0.5)' },
  daySummary: {
    alignItems: 'center', marginTop: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  daySummaryText: {
    fontSize: FontSize.xl, fontWeight: FontWeight.semibold,
  },
  weeksRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.xxl,
  },
  weekBtn: {
    width: 52, height: 52, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  weekBtnText: {
    fontSize: FontSize.title, fontWeight: FontWeight.bold,
    color: Colors.dark.text,
  },
  weeksInputWrap: { alignItems: 'center' },
  weeksInput: {
    fontSize: 48, fontWeight: FontWeight.black,
    textAlign: 'center', minWidth: 80,
  },
  weeksLabel: {
    fontSize: FontSize.base, color: Colors.dark.textSecondary,
    marginTop: -4,
  },
  quickWeeks: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 10, marginTop: Spacing.xxxxl,
  },
  quickWeekPill: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  quickWeekText: {
    fontSize: FontSize.lg, fontWeight: FontWeight.semibold,
    color: Colors.dark.textSecondary,
  },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xl,
    borderTopWidth: 1, borderTopColor: Colors.dark.border,
  },
  backStepBtn: {
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
  },
  backStepText: {
    fontSize: FontSize.xl, fontWeight: FontWeight.semibold,
    color: Colors.dark.textSecondary,
  },
  nextBtn: { overflow: 'hidden', borderRadius: BorderRadius.full },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.xxxl, paddingVertical: Spacing.lg,
  },
  nextBtnText: {
    fontSize: FontSize.xl, fontWeight: FontWeight.bold,
    color: Colors.dark.textOnAccent,
  },
})
