import React, { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme'
import { useNutritionStore } from '@/stores/nutrition-store'
import { useAuthStore } from '@/stores/auth-store'
import {
  calculateNutritionTargets, lbsToKg, ftInToCm,
  GOAL_LABELS, ACTIVITY_LABELS, ACTIVITY_DESCRIPTIONS,
} from '@/lib/nutrition-utils'
import type { FitnessGoal, ActivityLevel, Sex } from '@/types/nutrition'

const STEPS = ['sex', 'age', 'height', 'weight', 'activity', 'frequency', 'goal', 'calculating', 'results'] as const
type Step = typeof STEPS[number]

const GOALS: FitnessGoal[] = ['lose_weight', 'build_muscle', 'maintain_weight', 'gain_strength', 'body_recomp', 'get_fitter', 'eat_healthy']
const ACTIVITIES: ActivityLevel[] = ['sedentary', 'lightly_active', 'moderately_active', 'very_active']

interface NutritionOnboardingProps {
  /** Called when the user finishes the quiz (inline mode). Falls back to router.back(). */
  onComplete?: () => void
}

export default function NutritionOnboarding({ onComplete }: NutritionOnboardingProps) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const profile = useNutritionStore((s) => s.profile)
  const saveProfile = useNutritionStore((s) => s.saveProfile)
  const updateProfile = useNutritionStore((s) => s.updateProfile)

  const [stepIndex, setStepIndex] = useState(0)
  const [sex, setSex] = useState<Sex>('male')
  const [age, setAge] = useState('')
  const [feet, setFeet] = useState('5')
  const [inches, setInches] = useState('10')
  const [weightLbs, setWeightLbs] = useState('')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderately_active')
  const [workoutFrequency, setWorkoutFrequency] = useState(4)
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>('build_muscle')
  const [results, setResults] = useState<ReturnType<typeof calculateNutritionTargets> | null>(null)

  const step = STEPS[stepIndex]

  const canContinue = () => {
    switch (step) {
      case 'age': return age.length > 0 && parseInt(age, 10) >= 13
      case 'weight': return weightLbs.length > 0 && parseFloat(weightLbs) > 0
      default: return true
    }
  }

  const handleNext = useCallback(async () => {
    if (step === 'goal') {
      // Move to calculating step
      setStepIndex(stepIndex + 1)

      const weightKg = lbsToKg(parseFloat(weightLbs))
      const heightCm = ftInToCm(parseInt(feet, 10), parseInt(inches, 10))
      const ageNum = parseInt(age, 10)

      const calc = calculateNutritionTargets(weightKg, heightCm, ageNum, sex, activityLevel, fitnessGoal)
      setResults(calc)

      // Simulate calculation delay for UX
      setTimeout(() => {
        setStepIndex(STEPS.indexOf('results'))
      }, 1800)
      return
    }

    if (step === 'results' && results && user) {
      const weightKg = lbsToKg(parseFloat(weightLbs))
      const heightCm = ftInToCm(parseInt(feet, 10), parseInt(inches, 10))

      const profileData = {
        userId: user.$id,
        age: parseInt(age, 10),
        sex,
        heightCm,
        weightKg,
        workoutFrequency,
        activityLevel,
        fitnessGoal,
        unitSystem: 'imperial' as const,
        dailyCalories: results.dailyCalories,
        proteinGrams: results.proteinGrams,
        carbsGrams: results.carbsGrams,
        fatGrams: results.fatGrams,
        fiberGrams: results.fiberGrams,
        onboardingCompleted: true,
      }

      if (profile) {
        // Retake: update existing profile
        await updateProfile(profileData)
      } else {
        // First time: create new profile
        await saveProfile(profileData)
      }

      if (onComplete) {
        onComplete()
      } else {
        router.back()
      }
      return
    }

    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1)
    }
  }, [step, stepIndex, age, weightLbs, feet, inches, sex, activityLevel, fitnessGoal, workoutFrequency, results, user, onComplete])

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1)
    } else if (onComplete) {
      onComplete()
    } else {
      router.back()
    }
  }

  // ─── Calculating Screen ─────────────────────────────────────────────────────
  if (step === 'calculating') {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.calculatingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.accent} />
          <Text style={styles.calculatingText}>Crunching the numbers...</Text>
          <Text style={styles.calculatingSubtext}>Personalizing your nutrition plan</Text>
        </View>
      </SafeAreaView>
    )
  }

  // ─── Results Screen ─────────────────────────────────────────────────────────
  if (step === 'results' && results) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <Text style={styles.resultsTitle}>Your Daily Targets</Text>
          <Text style={styles.resultsSubtitle}>Based on your profile and {GOAL_LABELS[fitnessGoal].toLowerCase()} goal</Text>

          <View style={styles.calorieCard}>
            <Text style={styles.calorieNumber}>{results.dailyCalories}</Text>
            <Text style={styles.calorieLabel}>calories / day</Text>
          </View>

          <View style={styles.macroGrid}>
            <MacroCard label="Protein" value={results.proteinGrams} color="#6bc5ff" />
            <MacroCard label="Carbs" value={results.carbsGrams} color={Colors.dark.accent} />
            <MacroCard label="Fat" value={results.fatGrams} color="#ffb347" />
            <MacroCard label="Fiber" value={results.fiberGrams} color="#7fff00" />
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              BMR: {results.bmr} cal · TDEE: {results.tdee} cal
            </Text>
            <Text style={styles.infoSubtext}>
              You can adjust these targets later in settings
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ─── Quiz Steps ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.progressRow}>
          {STEPS.slice(0, 7).map((_, i) => (
            <View key={i} style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]} />
          ))}
        </View>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.stepContent}>
        {step === 'sex' && (
          <>
            <Text style={styles.question}>What is your biological sex?</Text>
            <Text style={styles.hint}>Used for accurate BMR calculation</Text>
            <View style={styles.optionsGrid}>
              <OptionCard label="Male" selected={sex === 'male'} onPress={() => setSex('male')} />
              <OptionCard label="Female" selected={sex === 'female'} onPress={() => setSex('female')} />
            </View>
          </>
        )}

        {step === 'age' && (
          <>
            <Text style={styles.question}>How old are you?</Text>
            <TextInput
              style={styles.numberInput}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              placeholder="25"
              placeholderTextColor={Colors.dark.textDark}
              maxLength={3}
              autoFocus
            />
            <Text style={styles.inputUnit}>years</Text>
          </>
        )}

        {step === 'height' && (
          <>
            <Text style={styles.question}>How tall are you?</Text>
            <View style={styles.heightRow}>
              <View style={styles.heightField}>
                <TextInput
                  style={styles.numberInput}
                  value={feet}
                  onChangeText={setFeet}
                  keyboardType="number-pad"
                  maxLength={1}
                  autoFocus
                />
                <Text style={styles.inputUnit}>ft</Text>
              </View>
              <View style={styles.heightField}>
                <TextInput
                  style={styles.numberInput}
                  value={inches}
                  onChangeText={setInches}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.inputUnit}>in</Text>
              </View>
            </View>
          </>
        )}

        {step === 'weight' && (
          <>
            <Text style={styles.question}>What's your current weight?</Text>
            <TextInput
              style={styles.numberInput}
              value={weightLbs}
              onChangeText={setWeightLbs}
              keyboardType="decimal-pad"
              placeholder="170"
              placeholderTextColor={Colors.dark.textDark}
              maxLength={5}
              autoFocus
            />
            <Text style={styles.inputUnit}>lbs</Text>
          </>
        )}

        {step === 'activity' && (
          <>
            <Text style={styles.question}>How active are you?</Text>
            <Text style={styles.hint}>Outside of gym workouts</Text>
            <View style={styles.optionsList}>
              {ACTIVITIES.map((level) => (
                <OptionCard
                  key={level}
                  label={ACTIVITY_LABELS[level]}
                  subtitle={ACTIVITY_DESCRIPTIONS[level]}
                  selected={activityLevel === level}
                  onPress={() => setActivityLevel(level)}
                  fullWidth
                />
              ))}
            </View>
          </>
        )}

        {step === 'frequency' && (
          <>
            <Text style={styles.question}>How often do you work out?</Text>
            <View style={styles.frequencyRow}>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.freqChip, workoutFrequency === n && styles.freqChipActive]}
                  onPress={() => setWorkoutFrequency(n)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.freqText, workoutFrequency === n && styles.freqTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputUnit}>days per week</Text>
          </>
        )}

        {step === 'goal' && (
          <>
            <Text style={styles.question}>What's your primary goal?</Text>
            <View style={styles.optionsList}>
              {GOALS.map((g) => (
                <OptionCard
                  key={g}
                  label={GOAL_LABELS[g]}
                  selected={fitnessGoal === g}
                  onPress={() => setFitnessGoal(g)}
                  fullWidth
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.primaryButton, !canContinue() && styles.primaryButtonDisabled]}
          onPress={handleNext}
          activeOpacity={0.8}
          disabled={!canContinue()}
        >
          <Text style={[styles.primaryButtonText, !canContinue() && styles.primaryButtonTextDisabled]}>
            {step === 'goal' ? 'Calculate' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function OptionCard({ label, subtitle, selected, onPress, fullWidth }: {
  label: string
  subtitle?: string
  selected: boolean
  onPress: () => void
  fullWidth?: boolean
}) {
  return (
    <TouchableOpacity
      style={[
        styles.optionCard,
        selected && styles.optionCardSelected,
        fullWidth && styles.optionCardFull,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
      {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  )
}

function MacroCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.macroCard}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroValue}>{value}g</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.xl,
    width: 50,
  },
  progressRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  progressDot: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.dark.surface,
  },
  progressDotActive: {
    backgroundColor: Colors.dark.accent,
  },
  stepContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxxl,
    paddingTop: Spacing.xxxxl,
  },
  question: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  hint: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
    marginBottom: Spacing.xxxl,
  },
  optionsGrid: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  optionsList: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  optionCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  optionCardSelected: {
    borderColor: Colors.dark.accent,
    backgroundColor: Colors.dark.accentSurface,
  },
  optionCardFull: {
    flex: 0,
  },
  optionLabel: {
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  optionLabelSelected: {
    color: Colors.dark.accent,
  },
  optionSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  numberInput: {
    color: Colors.dark.text,
    fontSize: 48,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  inputUnit: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.lg,
    textAlign: 'center',
  },
  heightRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xxxxl,
  },
  heightField: {
    alignItems: 'center',
  },
  frequencyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.xxxl,
  },
  freqChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqChipActive: {
    backgroundColor: Colors.dark.accent,
  },
  freqText: {
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  freqTextActive: {
    color: Colors.dark.textOnAccent,
  },
  bottomBar: {
    paddingHorizontal: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Colors.dark.accent,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.dark.surface,
  },
  primaryButtonText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  primaryButtonTextDisabled: {
    color: Colors.dark.textMuted,
  },
  // ─── Calculating ────────────────────────────────────────────────────────────
  calculatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  calculatingText: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
  },
  calculatingSubtext: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
  },
  // ─── Results ────────────────────────────────────────────────────────────────
  resultsContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxxl,
    paddingTop: 60,
    alignItems: 'center',
  },
  resultsTitle: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  resultsSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
    marginBottom: Spacing.xxxxl,
    textAlign: 'center',
  },
  calorieCard: {
    backgroundColor: Colors.dark.accentSurface,
    borderRadius: BorderRadius.xxl,
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xxxxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
    marginBottom: Spacing.xxxl,
  },
  calorieNumber: {
    color: Colors.dark.accent,
    fontSize: 52,
    fontWeight: FontWeight.black,
  },
  calorieLabel: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
    marginTop: Spacing.xs,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  macroCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: Spacing.sm,
  },
  macroValue: {
    color: Colors.dark.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  macroLabel: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  infoText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
  },
  infoSubtext: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
})
