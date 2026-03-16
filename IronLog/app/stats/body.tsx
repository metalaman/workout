import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Line } from 'react-native-svg'
import { useAuthStore } from '@/stores/auth-store'
import { useBodyStore } from '@/stores/body-store'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'

const MEASUREMENTS = [
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'arms', label: 'Arms' },
  { key: 'thighs', label: 'Thighs' },
] as const

export default function BodyStatsScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { stats, loadStats, addStat } = useBodyStore()
  const [showForm, setShowForm] = useState(true)
  const [bodyWeight, setBodyWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [measurements, setMeasurements] = useState<Record<string, string>>({})
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs')
  const [measureUnit, setMeasureUnit] = useState<'in' | 'cm'>('in')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (user?.$id) loadStats(user.$id)
  }, [user?.$id])

  const handleSave = async () => {
    if (!user?.$id) return
    await addStat({
      userId: user.$id,
      bodyWeight: bodyWeight ? parseFloat(bodyWeight) : null,
      bodyFat: bodyFat ? parseFloat(bodyFat) : null,
      chest: measurements.chest ? parseFloat(measurements.chest) : null,
      waist: measurements.waist ? parseFloat(measurements.waist) : null,
      hips: measurements.hips ? parseFloat(measurements.hips) : null,
      arms: measurements.arms ? parseFloat(measurements.arms) : null,
      thighs: measurements.thighs ? parseFloat(measurements.thighs) : null,
      unit: weightUnit,
      recordedAt: new Date().toISOString(),
      notes: notes || null,
    })
    setBodyWeight('')
    setBodyFat('')
    setMeasurements({})
    setNotes('')
    setShowForm(false)
  }

  // Simple weight trend chart
  const weightHistory = stats.filter((s) => s.bodyWeight != null).slice(0, 14).reverse()
  const weights = weightHistory.map((s) => s.bodyWeight!)
  const minW = Math.min(...weights, 0)
  const maxW = Math.max(...weights, 1)
  const range = maxW - minW || 1

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Body Stats</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtn}>{showForm ? 'History' : '+ Log'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {showForm ? (
          <>
            {/* Weight */}
            <View style={styles.inputGroup}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Body Weight</Text>
                <View style={styles.unitToggle}>
                  <TouchableOpacity
                    style={[styles.unitBtn, weightUnit === 'lbs' && styles.unitActive]}
                    onPress={() => setWeightUnit('lbs')}
                  >
                    <Text style={[styles.unitText, weightUnit === 'lbs' && styles.unitTextActive]}>lbs</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unitBtn, weightUnit === 'kg' && styles.unitActive]}
                    onPress={() => setWeightUnit('kg')}
                  >
                    <Text style={[styles.unitText, weightUnit === 'kg' && styles.unitTextActive]}>kg</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TextInput
                style={styles.input}
                value={bodyWeight}
                onChangeText={setBodyWeight}
                keyboardType="decimal-pad"
                placeholder="185"
                placeholderTextColor={Colors.dark.textMuted}
              />
            </View>

            {/* Body Fat */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Body Fat %</Text>
              <TextInput
                style={styles.input}
                value={bodyFat}
                onChangeText={setBodyFat}
                keyboardType="decimal-pad"
                placeholder="15"
                placeholderTextColor={Colors.dark.textMuted}
              />
            </View>

            {/* Measurements */}
            <View style={styles.inputGroup}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Measurements</Text>
                <View style={styles.unitToggle}>
                  <TouchableOpacity
                    style={[styles.unitBtn, measureUnit === 'in' && styles.unitActive]}
                    onPress={() => setMeasureUnit('in')}
                  >
                    <Text style={[styles.unitText, measureUnit === 'in' && styles.unitTextActive]}>in</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unitBtn, measureUnit === 'cm' && styles.unitActive]}
                    onPress={() => setMeasureUnit('cm')}
                  >
                    <Text style={[styles.unitText, measureUnit === 'cm' && styles.unitTextActive]}>cm</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.measureGrid}>
                {MEASUREMENTS.map((m) => (
                  <View key={m.key} style={styles.measureItem}>
                    <Text style={styles.measureLabel}>{m.label}</Text>
                    <TextInput
                      style={styles.measureInput}
                      value={measurements[m.key] || ''}
                      onChangeText={(v) => setMeasurements((prev) => ({ ...prev, [m.key]: v }))}
                      keyboardType="decimal-pad"
                      placeholder="—"
                      placeholderTextColor={Colors.dark.textMuted}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholder="Morning weight, fasted..."
                placeholderTextColor={Colors.dark.textMuted}
              />
            </View>

            <TouchableOpacity onPress={handleSave}>
              <LinearGradient colors={['#e8ff47', '#7fff00']} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Weight Trend */}
            {weightHistory.length > 1 && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>WEIGHT TREND</Text>
                <Svg width="100%" height={120} viewBox={`0 0 ${Math.max(weightHistory.length - 1, 1) * 30} 100`}>
                  {weightHistory.map((s, i) => {
                    if (i === 0) return null
                    const x1 = (i - 1) * 30
                    const x2 = i * 30
                    const y1 = 90 - ((weights[i - 1] - minW) / range) * 80
                    const y2 = 90 - ((weights[i] - minW) / range) * 80
                    return (
                      <Line
                        key={i}
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={Colors.dark.accent} strokeWidth={2}
                      />
                    )
                  })}
                </Svg>
                <View style={styles.chartLabels}>
                  <Text style={styles.chartLabel}>{minW.toFixed(1)}</Text>
                  <Text style={styles.chartLabel}>{maxW.toFixed(1)}</Text>
                </View>
              </View>
            )}

            {/* History list */}
            <Text style={styles.sectionTitle}>HISTORY</Text>
            {stats.map((s) => (
              <View key={s.$id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>
                    {new Date(s.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  {s.bodyWeight != null && (
                    <Text style={styles.historyWeight}>{s.bodyWeight} {s.unit}</Text>
                  )}
                </View>
                <View style={styles.historyDetails}>
                  {s.bodyFat != null && (
                    <Text style={styles.historyDetail}>BF: {s.bodyFat}%</Text>
                  )}
                  {s.chest != null && <Text style={styles.historyDetail}>Chest: {s.chest}"</Text>}
                  {s.waist != null && <Text style={styles.historyDetail}>Waist: {s.waist}"</Text>}
                  {s.hips != null && <Text style={styles.historyDetail}>Hips: {s.hips}"</Text>}
                  {s.arms != null && <Text style={styles.historyDetail}>Arms: {s.arms}"</Text>}
                  {s.thighs != null && <Text style={styles.historyDetail}>Thighs: {s.thighs}"</Text>}
                </View>
                {s.notes && <Text style={styles.historyNotes}>{s.notes}</Text>}
              </View>
            ))}
            {stats.length === 0 && (
              <Text style={styles.emptyText}>No entries yet. Start logging!</Text>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  scroll: { flex: 1, paddingHorizontal: Spacing.xxl },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
  },
  backBtn: { color: Colors.dark.text, fontSize: FontSize.title },
  topTitle: { color: Colors.dark.text, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  addBtn: { color: Colors.dark.accent, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },

  inputGroup: { marginBottom: Spacing.xxl },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputLabel: { color: Colors.dark.textSecondary, fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, color: Colors.dark.text, fontSize: FontSize.xxl,
  },

  unitToggle: { flexDirection: 'row', gap: 4 },
  unitBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.dark.surface },
  unitActive: { backgroundColor: Colors.dark.accent },
  unitText: { color: Colors.dark.textMuted, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  unitTextActive: { color: Colors.dark.textOnAccent },

  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  measureItem: { width: '47%' },
  measureLabel: { color: Colors.dark.textMuted, fontSize: FontSize.sm, marginBottom: 4 },
  measureInput: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.md,
    padding: Spacing.lg, color: Colors.dark.text, fontSize: FontSize.lg,
  },

  saveBtn: { paddingVertical: 14, borderRadius: BorderRadius.lg, alignItems: 'center', marginTop: Spacing.md },
  saveBtnText: { color: Colors.dark.textOnAccent, fontWeight: FontWeight.bold, fontSize: FontSize.xxl },

  chartContainer: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, marginBottom: Spacing.xxl,
  },
  chartTitle: { color: Colors.dark.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.bold, letterSpacing: 1.5, marginBottom: Spacing.md },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  chartLabel: { color: Colors.dark.textMuted, fontSize: FontSize.xs },

  sectionTitle: { color: Colors.dark.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.bold, letterSpacing: 1.5, marginBottom: Spacing.md },

  historyCard: {
    backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, marginBottom: Spacing.sm,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  historyDate: { color: Colors.dark.textSecondary, fontSize: FontSize.md },
  historyWeight: { color: Colors.dark.accent, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  historyDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  historyDetail: { color: Colors.dark.textMuted, fontSize: FontSize.sm },
  historyNotes: { color: Colors.dark.textMuted, fontSize: FontSize.sm, marginTop: 4, fontStyle: 'italic' },

  emptyText: { color: Colors.dark.textMuted, fontSize: FontSize.lg, textAlign: 'center', marginTop: 40 },
})
