/**
 * Nutrition Types
 *
 * Types for nutrition profiles, food items, food logs,
 * and daily nutrition summaries.
 *
 * @module types/nutrition
 */

/** Fitness goal options for nutrition calculation */
export type FitnessGoal =
  | 'build_muscle'
  | 'lose_weight'
  | 'gain_strength'
  | 'get_fitter'
  | 'eat_healthy'
  | 'maintain_weight'
  | 'body_recomp'

/** Activity level for TDEE calculation */
export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'

/** Biological sex for BMR calculation */
export type Sex = 'male' | 'female'

/** Meal type categories */
export type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner'

/**
 * User's nutrition profile with onboarding data and calculated targets.
 * Stored in `nutrition_profiles` Appwrite collection.
 * One per user — created during nutrition onboarding.
 */
export interface NutritionProfile {
  /** Appwrite document ID */
  $id: string
  /** Appwrite Auth user ID */
  userId: string
  /** Age in years */
  age: number
  /** Biological sex */
  sex: Sex
  /** Height in centimeters */
  heightCm: number
  /** Weight in kilograms */
  weightKg: number
  /** How many days per week the user works out */
  workoutFrequency: number
  /** User's general activity level */
  activityLevel: ActivityLevel
  /** Primary fitness goal */
  fitnessGoal: FitnessGoal
  /** Preferred unit system: 'imperial' or 'metric' */
  unitSystem: 'imperial' | 'metric'
  /** Calculated daily calorie target */
  dailyCalories: number
  /** Daily protein target in grams */
  proteinGrams: number
  /** Daily carbs target in grams */
  carbsGrams: number
  /** Daily fat target in grams */
  fatGrams: number
  /** Daily fiber target in grams */
  fiberGrams: number
  /** Whether onboarding has been completed */
  onboardingCompleted: boolean
}

/**
 * A food item from the database (bundled or custom).
 * Stored in `food_items` Appwrite collection for custom user foods.
 * Bundled foods are in `constants/food-database.ts` and not stored in Appwrite.
 */
export interface FoodItem {
  /** Unique ID (prefixed 'bundled-' for built-in, or Appwrite doc ID for custom) */
  id: string
  /** Food name */
  name: string
  /** Brand name — null for generic foods */
  brand: string | null
  /** Category for browsing (e.g., 'Protein', 'Grains', 'Dairy') */
  category: string
  /** Serving size amount (e.g., 100, 1, 2) */
  servingSize: number
  /** Serving unit (e.g., 'g', 'oz', 'cup', 'slice', 'piece') */
  servingUnit: string
  /** Calories per serving */
  calories: number
  /** Protein per serving in grams */
  protein: number
  /** Carbohydrates per serving in grams */
  carbs: number
  /** Fat per serving in grams */
  fat: number
  /** Fiber per serving in grams */
  fiber: number
}

/**
 * A logged food entry for a specific meal on a specific date.
 * Stored in `food_logs` Appwrite collection.
 */
export interface FoodLogEntry {
  /** Appwrite document ID */
  $id: string
  /** User ID */
  userId: string
  /** Reference to the food item (bundled ID or custom food doc ID) */
  foodItemId: string
  /** Food name (denormalized for display) */
  foodName: string
  /** Brand name (denormalized) — null for generic foods */
  foodBrand: string | null
  /** Which meal this belongs to */
  mealType: MealType
  /** Number of servings consumed (e.g., 1.5) */
  servings: number
  /** Serving size description (denormalized, e.g., "1 cup") */
  servingDesc: string
  /** Total calories (calories per serving × servings) */
  calories: number
  /** Total protein in grams */
  protein: number
  /** Total carbs in grams */
  carbs: number
  /** Total fat in grams */
  fat: number
  /** Total fiber in grams */
  fiber: number
  /** Date string YYYY-MM-DD for grouping */
  date: string
  /** ISO timestamp when this was logged */
  loggedAt: string
}

/**
 * Computed daily summary — not stored, calculated from FoodLogEntry array.
 */
export interface DailyNutritionSummary {
  /** Date string YYYY-MM-DD */
  date: string
  /** Total calories consumed */
  totalCalories: number
  /** Total protein in grams */
  totalProtein: number
  /** Total carbs in grams */
  totalCarbs: number
  /** Total fat in grams */
  totalFat: number
  /** Total fiber in grams */
  totalFiber: number
  /** All log entries for this day */
  entries: FoodLogEntry[]
}
