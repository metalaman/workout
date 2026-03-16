import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path } from 'react-native-svg'
import { useAuthStore } from '@/stores/auth-store'
import { useCardioStore } from '@/stores/cardio-store'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'
import { formatDuration } from '@/lib/utils'
import type { CardioType } from '@/types'

const CARDIO_TYPES: { type: CardioType; icon: string; color: string }[] = [
  { type: 'Running', icon: 'run', color: '#ff6b6b' },
  { type: 'Cycling', icon: 'cycle', color: '#6bc5ff' },
  { type: 'Swimming', icon: 'swim', color: '#43d9ff' },
  { type: 'Walking', icon: 'walk', color: '#7fff00' },
  { type: 'Rowing', icon: 'row', color: '#ff9f43' },
  { type: 'Elliptical', icon: 'ellip', color: '#e8ff47' },
  { type: 'HIIT', icon: 'hiit', color: '#ff6bff' },
  { type: 'Other', icon: 'other', color: '#888888' },
]

export default function CardioScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { addSession } = useCardioStore()
  const [selectedType, setSelectedType] = useState<CardioType | null>(null)
  const [useTimer, setUseTimer] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [timerElapsed, setTimerElapsed] = useState(0)
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [distanceUnit, setDistanceUnit] = useState<'mi' | 'km'>('mi')
  const [calories, setCalories] = useState('')
  const [heartRate, setHeartRate] = useState('')
  const [notes, setNotes] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setTimerElapsed((t) => t + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRunning])

  const handleSave = async () => {
    if (!selectedType || !user?.$id) return
    const durationMins = useTimer ? Math.ceil(timerElapsed / 60) : parseInt(duration) || 0
    if (durationMins === 0) return

    await addSession({
      userId: user.$id,
      type: selectedType,
      durationMinutes: durationMins,
      distance: distance ? parseFloat(distance) : null,
      distanceUnit,
      calories: calories ? parseInt(calories) : null,
      avgHeartRate: heartRate ? parseInt(heartRate) : null,
      startedAt: new Date().toISOString(),
      notes: notes || null,
    })
    router.back()
  }

  if (!selectedType) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>Cardio</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.pickLabel}>What type of cardio?</Text>
        <View style={styles.typeGrid}>
          {CARDIO_TYPES.map((ct) => (
            <TouchableOpacity
              key={ct.type}
              style={[styles.typeCard, { borderColor: `${ct.color}30` }]}
              onPress={() => setSelectedType(ct.type)}
            >
              <View style={[styles.typeIconCircle, { backgroundColor: `${ct.color}20` }]}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={ct.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <Text style={[styles.typeName, { color: ct.color }]}>{ct.type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    )
  }

  const typeInfo = CARDIO_TYPES.find((t) => t.type === selectedType)!

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setSelectedType(null)}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: typeInfo.color }]}>{selectedType}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Timer toggle */}
        <View style={styles.timerSection}>
          <View style={styles.timerToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, !useTimer && styles.toggleActive]}
              onPress={() => setUseTimer(false)}
            >
              <Text style={[styles.toggleText, !useTimer && styles.toggleTextActive]}>Manual</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, useTimer && styles.toggleActive]}
              onPress={() => setUseTimer(true)}
            >
              <Text style={[styles.toggleText, useTimer && styles.toggleTextActive]}>Timer</Text>
            </TouchableOpacity>
          </View>

          {useTimer ? (
            <View style={styles.timerDisplay}>
              <Text style={[styles.timerBig, { color: typeInfo.color }]}>
                {formatDuration(timerElapsed)}
              </Text>
              <TouchableOpacity onPress={() => setIsRunning(!isRunning)}>
                <LinearGradient
                  colors={isRunning ? ['#ff6b6b', '#ff4040'] : [typeInfo.color, typeInfo.color + '99']}
                  style={styles.timerBtn}
                >
                  <Text style={styles.timerBtnText}>{isRunning ? 'STOP' : 'START'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor={Colors.dark.textMuted}
              />
            </View>
          )}
        </View>

        {/* Distance */}
        <View style={styles.inputGroup}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Distance</Text>
            <View style={styles.unitToggle}>
              <TouchableOpacity
                style={[styles.unitBtn, distanceUnit === 'mi' && styles.unitActive]}
                onPress={() => setDistanceUnit('mi')}
              >
                <Text style={[styles.unitText, distanceUnit === 'mi' && styles.unitTextActive]}>mi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitBtn, distanceUnit === 'km' && styles.unitActive]}
                onPress={() => setDistanceUnit('km')}
              >
                <Text style={[styles.unitText, distanceUnit === 'km' && styles.unitTextActive]}>km</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TextInput
            style={styles.input}
            value={distance}
            onChangeText={setDistance}
            keyboardType="decimal-pad"
            placeholder="3.1"
            placeholderTextColor={Colors.dark.textMuted}
          />
        </View>

        {/* Optional fields */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Calories (optional)</Text>
          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
            placeholder="250"
            placeholderTextColor={Colors.dark.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Avg Heart Rate (optional)</Text>
          <TextInput
            style={styles.input}
            value={heartRate}
            onChangeText={setHeartRate}
            keyboardType="numeric"
            placeholder="145"
            placeholderTextColor={Colors.dark.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Notes</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="How did it feel?"
            placeholderTextColor={Colors.dark.textMuted}
          />
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Save button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handleSave} style={{ flex: 1 }}>
          <LinearGradient colors={[typeInfo.color, typeInfo.color + '99']} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save Cardio</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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

  pickLabel: {
    color: Colors.dark.textSecondary, fontSize: FontSize.xxl, fontWeight: FontWeight.semibold,
    textAlign: 'center', marginVertical: Spacing.xxl,
  },
  typeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.xxl, gap: Spacing.md,
  },
  typeCard: {
    width: '47%', backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.xl,
    borderWidth: 1, padding: Spacing.xxl, alignItems: 'center', gap: 8,
  },
  typeIconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  typeName: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },

  timerSection: { marginBottom: Spacing.xxl },
  timerToggle: {
    flexDirection: 'row', backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg,
    padding: 3, marginBottom: Spacing.xl,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md, alignItems: 'center' },
  toggleActive: { backgroundColor: Colors.dark.accent },
  toggleText: { color: Colors.dark.textMuted, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  toggleTextActive: { color: Colors.dark.textOnAccent },

  timerDisplay: { alignItems: 'center', gap: 16, paddingVertical: 20 },
  timerBig: { fontSize: 48, fontWeight: FontWeight.black },
  timerBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: BorderRadius.pill },
  timerBtnText: { color: Colors.dark.textOnAccent, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, letterSpacing: 2 },

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

  bottomBar: {
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.dark.border,
  },
  saveBtn: { paddingVertical: 14, borderRadius: BorderRadius.lg, alignItems: 'center' },
  saveBtnText: { color: Colors.dark.textOnAccent, fontWeight: FontWeight.bold, fontSize: FontSize.xxl },
})
