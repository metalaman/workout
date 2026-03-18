import React, { useState, useMemo, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, ScrollView,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme'
import { useNutritionStore } from '@/stores/nutrition-store'
import { useAuthStore } from '@/stores/auth-store'
import { MacroBar, MACRO_COLORS } from '@/components/nutrition/macro-bar'
import type { MealType } from '@/types/nutrition'
import { MEAL_LABELS } from '@/lib/nutrition-utils'

const SERVING_PRESETS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3]

export default function FoodDetail() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const { logFood, addRecent, toggleFavorite, favorites } = useNutritionStore()

  const params = useLocalSearchParams<{
    foodId: string; foodName: string; foodBrand: string
    servingSize: string; servingUnit: string
    calories: string; protein: string; carbs: string; fat: string; fiber: string
    mealType: string; date: string
  }>()

  const baseCalories = parseFloat(params.calories ?? '0')
  const baseProtein = parseFloat(params.protein ?? '0')
  const baseCarbs = parseFloat(params.carbs ?? '0')
  const baseFat = parseFloat(params.fat ?? '0')
  const baseFiber = parseFloat(params.fiber ?? '0')
  const servingSize = parseFloat(params.servingSize ?? '1')
  const servingUnit = params.servingUnit ?? 'serving'
  const mealType = (params.mealType ?? 'snacks') as MealType
  const date = params.date ?? new Date().toISOString().split('T')[0]

  const [servings, setServings] = useState(1)
  const [customServings, setCustomServings] = useState('')

  const isFavorited = favorites.some((f) => f.id === params.foodId)

  const currentServings = customServings ? parseFloat(customServings) || 0 : servings

  const scaled = useMemo(() => ({
    calories: Math.round(baseCalories * currentServings),
    protein: Math.round(baseProtein * currentServings * 10) / 10,
    carbs: Math.round(baseCarbs * currentServings * 10) / 10,
    fat: Math.round(baseFat * currentServings * 10) / 10,
    fiber: Math.round(baseFiber * currentServings * 10) / 10,
  }), [currentServings])

  const handleLog = useCallback(async () => {
    if (!user || currentServings <= 0) return

    const foodItem = {
      id: params.foodId ?? `custom-${Date.now()}`,
      name: params.foodName ?? 'Unknown',
      brand: params.foodBrand || null,
      category: '',
      servingSize,
      servingUnit,
      calories: baseCalories,
      protein: baseProtein,
      carbs: baseCarbs,
      fat: baseFat,
      fiber: baseFiber,
    }

    await logFood({
      userId: user.$id,
      foodItemId: foodItem.id,
      foodName: foodItem.name,
      foodBrand: foodItem.brand,
      mealType,
      servings: currentServings,
      servingDesc: `${servingSize} ${servingUnit}`,
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
      fiber: scaled.fiber,
      date,
      loggedAt: new Date().toISOString(),
    })

    addRecent(foodItem)
    router.dismiss(2) // Go back past food-search
  }, [user, currentServings, scaled, mealType, date])

  const handleToggleFavorite = useCallback(() => {
    toggleFavorite({
      id: params.foodId ?? '',
      name: params.foodName ?? '',
      brand: params.foodBrand || null,
      category: '',
      servingSize,
      servingUnit,
      calories: baseCalories,
      protein: baseProtein,
      carbs: baseCarbs,
      fat: baseFat,
      fiber: baseFiber,
    })
  }, [])

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleToggleFavorite} activeOpacity={0.7}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill={isFavorited ? Colors.dark.danger : 'none'}>
            <Path
              d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
              stroke={Colors.dark.danger}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Food Info */}
        <Text style={styles.foodName}>{params.foodName}</Text>
        {params.foodBrand ? <Text style={styles.foodBrand}>{params.foodBrand}</Text> : null}
        <Text style={styles.servingInfo}>
          Per {servingSize} {servingUnit}  ·  {baseCalories} cal
        </Text>

        {/* Meal Badge */}
        <View style={styles.mealBadge}>
          <Text style={styles.mealBadgeText}>{MEAL_LABELS[mealType]}</Text>
        </View>

        {/* Serving Presets */}
        <Text style={styles.sectionLabel}>Servings</Text>
        <View style={styles.servingRow}>
          {SERVING_PRESETS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.servingChip, servings === s && !customServings && styles.servingChipActive]}
              onPress={() => { setServings(s); setCustomServings('') }}
              activeOpacity={0.7}
            >
              <Text style={[styles.servingChipText, servings === s && !customServings && styles.servingChipTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customRow}>
          <Text style={styles.customLabel}>Custom:</Text>
          <TextInput
            style={styles.customInput}
            value={customServings}
            onChangeText={setCustomServings}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={Colors.dark.textDark}
          />
        </View>

        {/* Live Macro Preview */}
        <View style={styles.caloriePreview}>
          <Text style={styles.previewCalories}>{scaled.calories}</Text>
          <Text style={styles.previewLabel}>calories</Text>
        </View>

        <View style={styles.macroSection}>
          <MacroBar label="Protein" current={scaled.protein} target={scaled.protein} color={MACRO_COLORS.protein} />
          <MacroBar label="Carbs" current={scaled.carbs} target={scaled.carbs} color={MACRO_COLORS.carbs} />
          <MacroBar label="Fat" current={scaled.fat} target={scaled.fat} color={MACRO_COLORS.fat} />
          <MacroBar label="Fiber" current={scaled.fiber} target={scaled.fiber} color={MACRO_COLORS.fiber} />
        </View>
      </ScrollView>

      {/* Log Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.logButton, currentServings <= 0 && styles.logButtonDisabled]}
          onPress={handleLog}
          activeOpacity={0.8}
          disabled={currentServings <= 0}
        >
          <Text style={styles.logButtonText}>
            Log {currentServings > 0 ? `${currentServings} × ` : ''}{params.foodName}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  backText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.xl,
  },
  content: {
    paddingHorizontal: Spacing.xxxl,
    paddingTop: Spacing.xl,
  },
  foodName: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
  },
  foodBrand: {
    color: Colors.dark.accent,
    fontSize: FontSize.base,
    marginTop: Spacing.xs,
  },
  servingInfo: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
    marginTop: Spacing.sm,
  },
  mealBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.dark.accentSurface,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
  },
  mealBadgeText: {
    color: Colors.dark.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  sectionLabel: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.xxxl,
    marginBottom: Spacing.lg,
  },
  servingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  servingChip: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.dark.surface,
  },
  servingChipActive: {
    backgroundColor: Colors.dark.accent,
  },
  servingChipText: {
    color: Colors.dark.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  servingChipTextActive: {
    color: Colors.dark.textOnAccent,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.xl,
  },
  customLabel: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
  },
  customInput: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    width: 80,
    textAlign: 'center',
  },
  caloriePreview: {
    alignItems: 'center',
    marginTop: Spacing.xxxl,
    marginBottom: Spacing.xxl,
  },
  previewCalories: {
    color: Colors.dark.text,
    fontSize: 36,
    fontWeight: FontWeight.bold,
  },
  previewLabel: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
  },
  macroSection: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xxxl,
  },
  bottomBar: {
    paddingHorizontal: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.lg,
  },
  logButton: {
    backgroundColor: Colors.dark.accent,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  logButtonDisabled: {
    backgroundColor: Colors.dark.surface,
  },
  logButtonText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
})
