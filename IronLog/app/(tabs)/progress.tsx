import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'

const EXERCISES = ['Bench Press', 'Barbell Squat', 'Deadlift', 'OHP']

const CHART_DATA = [
  { week: 'W1', value: 155 },
  { week: 'W2', value: 160 },
  { week: 'W3', value: 165 },
  { week: 'W4', value: 165 },
  { week: 'W5', value: 170 },
  { week: 'W6', value: 175 },
  { week: 'W7', value: 180 },
  { week: 'W8', value: 185 },
]

const VOLUME_DATA = [60, 68, 72, 65, 78, 82, 88, 95]

const PRS = [
  { lift: 'Bench', pr: '205 lbs' },
  { lift: 'Squat', pr: '285 lbs' },
  { lift: 'Dead', pr: '335 lbs' },
]

const MAX_1RM = 200

export default function ProgressScreen() {
  const [selectedExercise, setSelectedExercise] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const current1RM = CHART_DATA[CHART_DATA.length - 1].value
  const first1RM = CHART_DATA[0].value
  const improvementPct = Math.round(((current1RM - first1RM) / first1RM) * 100)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
        </View>

        {/* Exercise selector */}
        <View style={styles.selectorContainer}>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.selectorText}>{EXERCISES[selectedExercise]}</Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>
          {showDropdown && (
            <View style={styles.dropdown}>
              {EXERCISES.map((ex, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.dropdownItem}
                  onPress={() => { setSelectedExercise(i); setShowDropdown(false) }}
                >
                  <Text style={[styles.dropdownText, i === selectedExercise && styles.dropdownTextActive]}>
                    {ex}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 1RM Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartLabel}>1RM ESTIMATE</Text>
              <Text style={styles.chartValue}>{current1RM} lbs</Text>
            </View>
            <View style={styles.barChart}>
              {CHART_DATA.map((d, i) => (
                <View key={i} style={styles.barColumn}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(d.value / MAX_1RM) * 100}%`,
                        backgroundColor: i === CHART_DATA.length - 1 ? Colors.dark.accent : 'rgba(232,255,71,0.2)',
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{d.week}</Text>
                </View>
              ))}
            </View>
            <View style={styles.improvementRow}>
              <Text style={styles.improvementUp}>↑ {improvementPct}%</Text>
              <Text style={styles.improvementText}>in {CHART_DATA.length} weeks</Text>
            </View>
          </View>
        </View>

        {/* Volume chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartLabel}>WEEKLY VOLUME</Text>
              <Text style={styles.volumeValue}>52,400 lbs</Text>
            </View>
            <View style={styles.volumeChart}>
              {VOLUME_DATA.map((v, i) => (
                <View
                  key={i}
                  style={[
                    styles.volumeBar,
                    {
                      height: `${v}%`,
                      backgroundColor: `rgba(71, 180, 255, ${0.2 + i * 0.08})`,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* PRs */}
        <View style={styles.prSection}>
          <Text style={styles.sectionTitle}>PERSONAL RECORDS</Text>
          <View style={styles.prRow}>
            {PRS.map((p, i) => (
              <View key={i} style={styles.prCard}>
                <Text style={styles.prValue}>{p.pr}</Text>
                <Text style={styles.prLift}>{p.lift}</Text>
              </View>
            ))}
          </View>
        </View>
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
  title: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
  },
  selectorContainer: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.lg,
    zIndex: 10,
  },
  selector: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    color: Colors.dark.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  selectorArrow: {
    color: Colors.dark.textMuted,
  },
  dropdown: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  dropdownText: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.lg,
  },
  dropdownTextActive: {
    color: Colors.dark.accent,
    fontWeight: FontWeight.semibold,
  },
  chartContainer: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md + 2,
  },
  chartLabel: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  chartValue: {
    color: Colors.dark.accent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    height: 100,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 8,
  },
  barLabel: {
    fontSize: 7,
    color: Colors.dark.textMuted,
  },
  improvementRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  improvementUp: {
    color: Colors.dark.accentGreen,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  improvementText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
  },
  volumeValue: {
    color: Colors.dark.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  volumeChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 60,
  },
  volumeBar: {
    flex: 1,
    borderRadius: 3,
  },
  prSection: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  prRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  prCard: {
    flex: 1,
    backgroundColor: Colors.dark.accentSurface,
    borderWidth: 1,
    borderColor: Colors.dark.accentBorder,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
  },
  prValue: {
    color: Colors.dark.accent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
  },
  prLift: {
    color: Colors.dark.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
})
