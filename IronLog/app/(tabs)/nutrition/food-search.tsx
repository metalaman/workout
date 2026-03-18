import React, { useState, useMemo, useCallback } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme'
import { useNutritionStore } from '@/stores/nutrition-store'
import { searchFoods, getFoodCategories, getFoodsByCategory } from '@/constants/food-database'
import type { FoodItem, MealType } from '@/types/nutrition'

type Tab = 'search' | 'recent' | 'favorites'

export default function FoodSearch() {
  const router = useRouter()
  const params = useLocalSearchParams<{ mealType: string; date: string }>()
  const mealType = (params.mealType ?? 'snacks') as MealType
  const date = params.date ?? new Date().toISOString().split('T')[0]

  const { recents, favorites } = useNutritionStore()

  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('search')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = useMemo(() => getFoodCategories(), [])

  const results = useMemo(() => {
    if (activeTab === 'recent') return recents
    if (activeTab === 'favorites') return favorites
    if (query.trim()) return searchFoods(query, 30)
    if (selectedCategory) return getFoodsByCategory(selectedCategory)
    return []
  }, [query, activeTab, selectedCategory, recents, favorites])

  const handleSelectFood = useCallback((food: FoodItem) => {
    router.push({
      pathname: '/(tabs)/nutrition/food-detail',
      params: {
        foodId: food.id,
        foodName: food.name,
        foodBrand: food.brand ?? '',
        servingSize: String(food.servingSize),
        servingUnit: food.servingUnit,
        calories: String(food.calories),
        protein: String(food.protein),
        carbs: String(food.carbs),
        fat: String(food.fat),
        fiber: String(food.fiber),
        mealType,
        date,
      },
    })
  }, [mealType, date])

  const renderFood = useCallback(({ item }: { item: FoodItem }) => (
    <TouchableOpacity
      style={styles.foodRow}
      onPress={() => handleSelectFood(item)}
      activeOpacity={0.7}
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
        {item.brand && <Text style={styles.foodBrand}>{item.brand}</Text>}
        <Text style={styles.foodServing}>
          {item.servingSize} {item.servingUnit}
        </Text>
      </View>
      <View style={styles.foodCal}>
        <Text style={styles.foodCalText}>{item.calories}</Text>
        <Text style={styles.foodCalLabel}>cal</Text>
      </View>
    </TouchableOpacity>
  ), [handleSelectFood])

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Food</Text>
        <TouchableOpacity
          onPress={() => router.push({
            pathname: '/(tabs)/nutrition/manual-entry',
            params: { mealType, date },
          })}
          activeOpacity={0.7}
        >
          <Text style={styles.createText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={(text) => { setQuery(text); setSelectedCategory(null); setActiveTab('search') }}
          placeholder="Search foods..."
          placeholderTextColor={Colors.dark.textDark}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['search', 'recent', 'favorites'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => { setActiveTab(tab); setQuery(''); setSelectedCategory(null) }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'search' ? 'All' : tab === 'recent' ? 'Recent' : 'Favorites'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category chips (only in search tab with no query) */}
      {activeTab === 'search' && !query.trim() && (
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, selectedCategory === item && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(selectedCategory === item ? null : item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryText, selectedCategory === item && styles.categoryTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderFood}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'recent' ? 'No recent foods yet' :
               activeTab === 'favorites' ? 'No favorites yet' :
               query ? 'No foods found' : 'Search or browse by category'}
            </Text>
          </View>
        }
      />
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
  cancelText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.lg,
  },
  title: {
    color: Colors.dark.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  createText: {
    color: Colors.dark.accent,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  searchBar: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    color: Colors.dark.text,
    fontSize: FontSize.lg,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  tab: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.dark.surface,
  },
  tabActive: {
    backgroundColor: Colors.dark.accent,
  },
  tabText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
  tabTextActive: {
    color: Colors.dark.textOnAccent,
    fontWeight: FontWeight.bold,
  },
  categoryRow: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  categoryChipActive: {
    borderColor: Colors.dark.accentBorder,
    backgroundColor: Colors.dark.accentSurface,
  },
  categoryText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.sm,
  },
  categoryTextActive: {
    color: Colors.dark.accent,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  foodInfo: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  foodName: {
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
  },
  foodBrand: {
    color: Colors.dark.accent,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  foodServing: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  foodCal: {
    alignItems: 'flex-end',
  },
  foodCalText: {
    color: Colors.dark.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  foodCalLabel: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.xs,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.base,
  },
})
