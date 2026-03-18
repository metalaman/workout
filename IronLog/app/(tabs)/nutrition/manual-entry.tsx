import React from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme'
import { useNutritionStore } from '@/stores/nutrition-store'
import { useAuthStore } from '@/stores/auth-store'
import type { MealType } from '@/types/nutrition'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  servingSize: z.string().min(1).transform(Number).pipe(z.number().positive()),
  servingUnit: z.string().min(1, 'Unit is required'),
  calories: z.string().min(1).transform(Number).pipe(z.number().min(0)),
  protein: z.string().transform(Number).pipe(z.number().min(0)).default('0'),
  carbs: z.string().transform(Number).pipe(z.number().min(0)).default('0'),
  fat: z.string().transform(Number).pipe(z.number().min(0)).default('0'),
  fiber: z.string().transform(Number).pipe(z.number().min(0)).default('0'),
})

type FormData = z.input<typeof schema>

export default function ManualEntry() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const { logFood, addRecent } = useNutritionStore()
  const params = useLocalSearchParams<{ mealType: string; date: string }>()
  const mealType = (params.mealType ?? 'snacks') as MealType
  const date = params.date ?? new Date().toISOString().split('T')[0]

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      servingSize: '1',
      servingUnit: 'serving',
      calories: '',
      protein: '0',
      carbs: '0',
      fat: '0',
      fiber: '0',
    },
  })

  const onSubmit = async (data: any) => {
    if (!user) return

    const foodId = `custom-${Date.now()}`
    const foodItem = {
      id: foodId,
      name: data.name,
      brand: null,
      category: 'Custom',
      servingSize: data.servingSize,
      servingUnit: data.servingUnit,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      fiber: data.fiber,
    }

    try {
      await logFood({
        userId: user.$id,
        foodItemId: foodId,
        foodName: data.name,
        foodBrand: null,
        mealType,
        servings: 1,
        servingDesc: `${data.servingSize} ${data.servingUnit}`,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        fiber: data.fiber,
        date,
        loggedAt: new Date().toISOString(),
      })

      addRecent(foodItem)
      router.dismiss(2)
    } catch {
      Alert.alert('Error', 'Failed to save food entry')
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Food</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FormField
          control={control}
          name="name"
          label="Food Name"
          placeholder="e.g. Homemade Granola"
          error={errors.name?.message}
          autoFocus
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <FormField
              control={control}
              name="servingSize"
              label="Serving Size"
              placeholder="1"
              keyboardType="decimal-pad"
              error={errors.servingSize?.message}
            />
          </View>
          <View style={styles.halfField}>
            <FormField
              control={control}
              name="servingUnit"
              label="Unit"
              placeholder="cup"
              error={errors.servingUnit?.message}
            />
          </View>
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Nutrition per serving</Text>

        <FormField
          control={control}
          name="calories"
          label="Calories"
          placeholder="0"
          keyboardType="number-pad"
          error={errors.calories?.message}
          highlight
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <FormField control={control} name="protein" label="Protein (g)" placeholder="0" keyboardType="decimal-pad" />
          </View>
          <View style={styles.halfField}>
            <FormField control={control} name="carbs" label="Carbs (g)" placeholder="0" keyboardType="decimal-pad" />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <FormField control={control} name="fat" label="Fat (g)" placeholder="0" keyboardType="decimal-pad" />
          </View>
          <View style={styles.halfField}>
            <FormField control={control} name="fiber" label="Fiber (g)" placeholder="0" keyboardType="decimal-pad" />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSubmit(onSubmit)}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Save & Log</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

function FormField({ control, name, label, placeholder, keyboardType, error, autoFocus, highlight }: {
  control: any; name: string; label: string; placeholder: string
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad'; error?: string; autoFocus?: boolean; highlight?: boolean
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, highlight && styles.fieldLabelHighlight]}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.fieldInput, error && styles.fieldInputError]}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            placeholderTextColor={Colors.dark.textDark}
            keyboardType={keyboardType ?? 'default'}
            autoFocus={autoFocus}
          />
        )}
      />
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
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
  cancelText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.lg,
  },
  title: {
    color: Colors.dark.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  content: {
    paddingHorizontal: Spacing.xxxl,
    paddingTop: Spacing.xl,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  halfField: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: Spacing.xxl,
  },
  sectionTitle: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xl,
  },
  field: {
    marginBottom: Spacing.xl,
  },
  fieldLabel: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  fieldLabelHighlight: {
    color: Colors.dark.accent,
  },
  fieldInput: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldInputError: {
    borderColor: Colors.dark.danger,
  },
  fieldError: {
    color: Colors.dark.danger,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  bottomBar: {
    paddingHorizontal: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.lg,
  },
  saveButton: {
    backgroundColor: Colors.dark.accent,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
})
