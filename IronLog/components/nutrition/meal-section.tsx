import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme'
import type { FoodLogEntry, MealType } from '@/types/nutrition'
import { MEAL_LABELS, MEAL_ICONS, getMealCalories } from '@/lib/nutrition-utils'

interface MealSectionProps {
  mealType: MealType
  entries: FoodLogEntry[]
  onAddFood: (mealType: MealType) => void
  onRemoveEntry: (entryId: string) => void
}

export const MealSection = React.memo(function MealSection({
  mealType,
  entries,
  onAddFood,
  onRemoveEntry,
}: MealSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const totalCalories = getMealCalories(entries)

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((prev) => !prev)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{MEAL_ICONS[mealType]}</Text>
          <Text style={styles.title}>{MEAL_LABELS[mealType]}</Text>
          {entries.length > 0 && (
            <Text style={styles.count}>{entries.length}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.calories}>{Math.round(totalCalories)} cal</Text>
          <View style={[styles.chevron, expanded && styles.chevronExpanded]}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path d="M6 9l6 6 6-6" stroke={Colors.dark.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {entries.map((entry) => (
            <TouchableOpacity
              key={entry.$id}
              style={styles.entryRow}
              onLongPress={() => onRemoveEntry(entry.$id)}
              activeOpacity={0.7}
            >
              <View style={styles.entryInfo}>
                <Text style={styles.entryName} numberOfLines={1}>
                  {entry.foodName}
                </Text>
                <Text style={styles.entryServing}>
                  {entry.servings} × {entry.servingDesc}
                </Text>
              </View>
              <View style={styles.entryMacros}>
                <Text style={styles.entryCal}>{Math.round(entry.calories)}</Text>
                <Text style={styles.entryMacro}>
                  P:{Math.round(entry.protein)} C:{Math.round(entry.carbs)} F:{Math.round(entry.fat)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => onAddFood(mealType)}
            activeOpacity={0.7}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M12 5v14m-7-7h14" stroke={Colors.dark.accent} strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text style={styles.addText}>Add Food</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: {
    fontSize: 16,
  },
  title: {
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  count: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.sm,
    backgroundColor: Colors.dark.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  calories: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  body: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  entryInfo: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  entryName: {
    color: Colors.dark.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
  entryServing: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  entryMacros: {
    alignItems: 'flex-end',
  },
  entryCal: {
    color: Colors.dark.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  entryMacro: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.xs,
  },
  addText: {
    color: Colors.dark.accent,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
})
