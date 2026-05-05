import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle } from 'react-native-svg'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { listPublicPrograms, cloneProgram, getProgram, listProgramDays } from '@/lib/db/programs'
import { useAuthStore } from '@/stores/auth-store'
import { useProgramStore } from '@/stores/program-store'
import { useRouter } from 'expo-router'
import type { Program, ProgramDay } from '@/types'

export default function DiscoverScreen() {
  const { user } = useAuthStore()
  const { loadPrograms } = useProgramStore()
  const router = useRouter()
  
  const [query, setQuery] = useState('')
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [selectedDays, setSelectedDays] = useState<ProgramDay[]>([])
  const [cloning, setCloning] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchPrograms = useCallback(async (searchQuery?: string) => {
    setLoading(true)
    try {
      const results = await listPublicPrograms(searchQuery, 50)
      setPrograms(results)
    } catch (e) {
      console.error('Failed to load public programs:', e)
      Alert.alert('Error', 'Failed to load programs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPrograms(query.trim() || undefined)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, fetchPrograms])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchPrograms(query.trim() || undefined)
  }, [fetchPrograms, query])

  const handleSelectProgram = async (program: Program) => {
    setSelectedProgram(program)
    setDetailLoading(true)
    try {
      const days = await listProgramDays(program.$id)
      setSelectedDays(days)
    } catch (e) {
      console.error('Failed to load program details:', e)
      setSelectedDays([])
    } finally {
      setDetailLoading(false)
    }
  }

  const handleClone = async () => {
    if (!selectedProgram || !user?.$id) return
    
    setCloning(true)
    try {
      await cloneProgram(selectedProgram.$id, user.$id, user.name || 'User')
      await loadPrograms(user.$id)
      Alert.alert(
        'Cloned!',
        `"${selectedProgram.name}" has been added to your programs.`,
        [
          { text: 'OK', onPress: () => {
            setSelectedProgram(null)
            router.push('/(tabs)/program')
          }}
        ]
      )
    } catch (e) {
      console.error('Failed to clone program:', e)
      Alert.alert('Error', 'Failed to clone program')
    } finally {
      setCloning(false)
    }
  }

  const renderProgram = ({ item }: { item: Program }) => {
    const creatorName = item.userId === user?.$id ? 'You' : 'Community'
    
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => handleSelectProgram(item)}
      >
        <View style={[styles.dot, { backgroundColor: item.color || Colors.dark.accent }]} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardMeta}>
            {creatorName} · {item.daysPerWeek} days/week · {item.totalWeeks} week{item.totalWeeks !== 1 ? 's' : ''}
          </Text>
        </View>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M9 18l6-6-6-6" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>
    )
  }

  if (selectedProgram) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.detailHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setSelectedProgram(null)}
            activeOpacity={0.7}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke={Colors.dark.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={styles.detailHeaderContent}>
            <Text style={styles.detailTitle}>{selectedProgram.name}</Text>
            <Text style={styles.detailSubtitle}>
              {selectedProgram.daysPerWeek} days/week · {selectedProgram.totalWeeks} week{selectedProgram.totalWeeks !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.detailBody}>
          {detailLoading ? (
            <View style={styles.detailLoading}>
              <ActivityIndicator color={Colors.dark.accent} />
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>WORKOUT DAYS</Text>
              {selectedDays.map((day, idx) => (
                <View key={day.$id} style={styles.dayRow}>
                  <View style={styles.dayNumber}>
                    <Text style={styles.dayNumberText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>{day.name}</Text>
                    <Text style={styles.dayMeta}>
                      {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
                      {day.exercises.length > 0 && ` · ${day.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)} sets`}
                    </Text>
                  </View>
                </View>
              ))}
              
              {selectedDays.length === 0 && !detailLoading && (
                <Text style={styles.emptyText}>No days configured</Text>
              )}
            </>
          )}
        </View>

        <View style={styles.detailFooter}>
          <TouchableOpacity
            style={[styles.cloneBtn, cloning && styles.cloneBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleClone}
            disabled={cloning}
          >
            <LinearGradient
              colors={[Colors.dark.accent, Colors.dark.accentGreen]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cloneGradient}
            >
              {cloning ? (
                <ActivityIndicator size="small" color={Colors.dark.textOnAccent} />
              ) : (
                <>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" stroke={Colors.dark.textOnAccent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                  <Text style={styles.cloneText}>Clone to My Programs</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Find public workout programs</Text>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
            <Circle cx="11" cy="11" r="8" stroke={Colors.dark.textMuted} strokeWidth={2} />
            <Path d="M21 21l-4.35-4.35" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search programs..."
            placeholderTextColor={Colors.dark.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke={Colors.dark.textMuted} strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && programs.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.accent} />
        </View>
      ) : (
        <FlatList
          data={programs}
          keyExtractor={(item) => item.$id}
          renderItem={renderProgram}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                  <Circle cx="11" cy="11" r="8" stroke={Colors.dark.textMuted} strokeWidth={1.5} />
                  <Path d="M21 21l-4.35-4.35" stroke={Colors.dark.textMuted} strokeWidth={1.5} strokeLinecap="round" />
                </Svg>
              </View>
              <Text style={styles.emptyTitle}>
                {query ? 'No programs found' : 'No public programs'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {query ? 'Try a different search term' : 'Check back later for community programs'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.dark.textSecondary,
  },
  searchWrap: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.lg,
    height: 48,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  dot: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: Spacing.xxxxl,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.base,
    color: Colors.dark.textMuted,
    textAlign: 'center',
  },
  // Detail view
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailHeaderContent: {
    flex: 1,
  },
  detailTitle: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.extrabold,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  detailSubtitle: {
    fontSize: FontSize.base,
    color: Colors.dark.textSecondary,
  },
  detailBody: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
  },
  detailLoading: {
    paddingTop: 40,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.dark.textMuted,
    letterSpacing: 1.2,
    marginBottom: Spacing.lg,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.dark.textSecondary,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  dayMeta: {
    fontSize: FontSize.sm,
    color: Colors.dark.textMuted,
  },
  emptyText: {
    fontSize: FontSize.base,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  detailFooter: {
    padding: Spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  cloneBtn: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cloneBtnDisabled: {
    opacity: 0.6,
  },
  cloneGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  cloneText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.dark.textOnAccent,
  },
})
