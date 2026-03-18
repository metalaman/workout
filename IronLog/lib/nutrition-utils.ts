/**
 * Nutrition Utility Functions
 *
 * Pure calculation functions for BMR, TDEE, calorie targets, and macro splits.
 * No side effects, no state, no Appwrite calls.
 *
 * @module lib/nutrition-utils
 */

import type { ActivityLevel, FitnessGoal, Sex, FoodLogEntry, DailyNutritionSummary, MealType } from '@/types/nutrition'

// ─── BMR & TDEE ─────────────────────────────────────────────────────────────

/**
 * Calculate Basal Metabolic Rate using the Mifflin-St Jeor equation.
 * This is the most accurate modern BMR formula.
 *
 * Male:   (10 × weightKg) + (6.25 × heightCm) - (5 × age) + 5
 * Female: (10 × weightKg) + (6.25 × heightCm) - (5 × age) - 161
 *
 * @param weightKg - Body weight in kilograms
 * @param heightCm - Height in centimeters
 * @param age - Age in years
 * @param sex - Biological sex
 * @returns BMR in calories/day, rounded to nearest integer
 */
export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age)
  return Math.round(sex === 'male' ? base + 5 : base - 161)
}

/**
 * Activity level multipliers for TDEE calculation.
 * Applied to BMR to estimate Total Daily Energy Expenditure.
 */
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
}

/**
 * Calculate Total Daily Energy Expenditure.
 * TDEE = BMR × activity multiplier
 *
 * @param bmr - Basal Metabolic Rate
 * @param activityLevel - User's activity level
 * @returns TDEE in calories/day, rounded to nearest integer
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel])
}

// ─── Goal-Based Adjustments ─────────────────────────────────────────────────

/**
 * Calorie adjustments per fitness goal (relative to TDEE).
 * Negative = deficit, positive = surplus.
 */
const GOAL_CALORIE_ADJUSTMENTS: Record<FitnessGoal, number> = {
  lose_weight: -500,
  body_recomp: -100,
  get_fitter: -200,
  maintain_weight: 0,
  eat_healthy: 0,
  gain_strength: 250,
  build_muscle: 300,
}

/**
 * Calculate daily calorie target based on TDEE and fitness goal.
 * Ensures a minimum floor of 1200 calories for safety.
 *
 * @param tdee - Total Daily Energy Expenditure
 * @param fitnessGoal - User's fitness goal
 * @returns Goal-adjusted daily calories, minimum 1200
 */
export function calculateGoalCalories(tdee: number, fitnessGoal: FitnessGoal): number {
  const adjusted = tdee + GOAL_CALORIE_ADJUSTMENTS[fitnessGoal]
  return Math.max(1200, Math.round(adjusted))
}

// ─── Macro Calculations ─────────────────────────────────────────────────────

/**
 * Macro ratio splits per fitness goal.
 * Values are percentages of total calories: [protein%, carbs%, fat%]
 */
const MACRO_RATIOS: Record<FitnessGoal, { protein: number; carbs: number; fat: number }> = {
  build_muscle: { protein: 0.30, carbs: 0.45, fat: 0.25 },
  lose_weight: { protein: 0.35, carbs: 0.35, fat: 0.30 },
  gain_strength: { protein: 0.30, carbs: 0.45, fat: 0.25 },
  get_fitter: { protein: 0.30, carbs: 0.40, fat: 0.30 },
  eat_healthy: { protein: 0.25, carbs: 0.45, fat: 0.30 },
  maintain_weight: { protein: 0.25, carbs: 0.45, fat: 0.30 },
  body_recomp: { protein: 0.35, carbs: 0.35, fat: 0.30 },
}

/**
 * Calculate macro targets in grams from calorie target and fitness goal.
 * Uses calorie-per-gram conversions: protein=4, carbs=4, fat=9.
 * Fiber is fixed at 25-38g based on calorie level.
 *
 * @param goalCalories - Daily calorie target
 * @param fitnessGoal - User's fitness goal
 * @returns Macro targets in grams { protein, carbs, fat, fiber }
 */
export function calculateMacros(
  goalCalories: number,
  fitnessGoal: FitnessGoal
): { protein: number; carbs: number; fat: number; fiber: number } {
  const ratios = MACRO_RATIOS[fitnessGoal]

  const protein = Math.round((goalCalories * ratios.protein) / 4)
  const carbs = Math.round((goalCalories * ratios.carbs) / 4)
  const fat = Math.round((goalCalories * ratios.fat) / 9)

  // Fiber recommendation: ~14g per 1000 calories, clamped to 25-38g
  const fiber = Math.min(38, Math.max(25, Math.round(goalCalories * 0.014)))

  return { protein, carbs, fat, fiber }
}

/**
 * Run the full nutrition calculation pipeline.
 * Takes raw user inputs and returns all calculated targets.
 *
 * @returns Object with bmr, tdee, dailyCalories, and macro targets
 */
export function calculateNutritionTargets(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
  activityLevel: ActivityLevel,
  fitnessGoal: FitnessGoal
): {
  bmr: number
  tdee: number
  dailyCalories: number
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
  fiberGrams: number
} {
  const bmr = calculateBMR(weightKg, heightCm, age, sex)
  const tdee = calculateTDEE(bmr, activityLevel)
  const dailyCalories = calculateGoalCalories(tdee, fitnessGoal)
  const macros = calculateMacros(dailyCalories, fitnessGoal)

  return {
    bmr,
    tdee,
    dailyCalories,
    proteinGrams: macros.protein,
    carbsGrams: macros.carbs,
    fatGrams: macros.fat,
    fiberGrams: macros.fiber,
  }
}

// ─── Unit Conversions ───────────────────────────────────────────────────────

/** Convert pounds to kilograms */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10
}

/** Convert kilograms to pounds */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10
}

/** Convert feet + inches to centimeters */
export function ftInToCm(feet: number, inches: number): number {
  return Math.round((feet * 30.48) + (inches * 2.54) * 10) / 10
}

/** Convert centimeters to feet + inches */
export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return { feet, inches }
}

// ─── Date Helpers ───────────────────────────────────────────────────────────

/**
 * Get a date string in YYYY-MM-DD format.
 * Used for grouping food logs by day.
 *
 * @param date - Date to format (defaults to today)
 * @returns String like "2026-03-17"
 */
export function getDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get array of 7 date strings for a week.
 * Week starts on Monday.
 *
 * @param weekOffset - 0 for current week, -1 for previous, etc.
 * @returns Array of 7 YYYY-MM-DD strings (Mon → Sun)
 */
export function getWeekDates(weekOffset = 0): string[] {
  const now = new Date()
  const dayOfWeek = now.getDay()
  // Adjust so Monday = 0
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset + (weekOffset * 7))

  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(getDateString(d))
  }
  return dates
}

// ─── Summary Helpers ────────────────────────────────────────────────────────

/**
 * Compute a daily nutrition summary from a list of food log entries.
 *
 * @param date - The date to summarize
 * @param entries - Food log entries for that date
 * @returns DailyNutritionSummary with totals
 */
export function computeDailySummary(date: string, entries: FoodLogEntry[]): DailyNutritionSummary {
  return entries.reduce<DailyNutritionSummary>(
    (acc, entry) => ({
      ...acc,
      totalCalories: acc.totalCalories + entry.calories,
      totalProtein: acc.totalProtein + entry.protein,
      totalCarbs: acc.totalCarbs + entry.carbs,
      totalFat: acc.totalFat + entry.fat,
      totalFiber: acc.totalFiber + entry.fiber,
      entries: [...acc.entries, entry],
    }),
    {
      date,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      entries: [],
    }
  )
}

/**
 * Group food log entries by meal type.
 *
 * @param entries - Food log entries
 * @returns Record of MealType → entries
 */
export function groupByMeal(entries: FoodLogEntry[]): Record<MealType, FoodLogEntry[]> {
  return {
    breakfast: entries.filter((e) => e.mealType === 'breakfast'),
    lunch: entries.filter((e) => e.mealType === 'lunch'),
    snacks: entries.filter((e) => e.mealType === 'snacks'),
    dinner: entries.filter((e) => e.mealType === 'dinner'),
  }
}

/**
 * Get the meal-level calorie total.
 *
 * @param entries - Entries for a single meal
 * @returns Total calories for that meal
 */
export function getMealCalories(entries: FoodLogEntry[]): number {
  return entries.reduce((sum, e) => sum + e.calories, 0)
}

// ─── Display Helpers ────────────────────────────────────────────────────────

/** Fitness goal display labels */
export const GOAL_LABELS: Record<FitnessGoal, string> = {
  build_muscle: 'Build Muscle',
  lose_weight: 'Lose Weight',
  gain_strength: 'Gain Strength',
  get_fitter: 'Get Fitter Overall',
  eat_healthy: 'Eat Healthy',
  maintain_weight: 'Maintain Weight',
  body_recomp: 'Body Recomposition',
}

/** Activity level display labels */
export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  lightly_active: 'Lightly Active',
  moderately_active: 'Moderately Active',
  very_active: 'Very Active',
}

/** Activity level descriptions */
export const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, string> = {
  sedentary: 'Little to no exercise, desk job',
  lightly_active: 'Light exercise 1-3 days/week',
  moderately_active: 'Moderate exercise 3-5 days/week',
  very_active: 'Hard exercise 6-7 days/week',
}

/** Meal type display labels */
export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
}

/** Meal type icons (emoji for now, can be swapped for SVG later) */
export const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  snacks: '🍎',
  dinner: '🌙',
}
