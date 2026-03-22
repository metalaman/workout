import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme'

interface Props {
  elapsedSeconds: number
  isPaused: boolean
  onEnd: () => void
  onPause: () => void
  onResume: () => void
}

function formatDuration(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    : `${m}:${sec.toString().padStart(2, '0')}`
}

export const BottomControls = React.memo(({ elapsedSeconds, isPaused, onEnd, onPause, onResume }: Props) => (
  <View style={styles.bar}>
    <TouchableOpacity style={styles.endBtn} onPress={onEnd} activeOpacity={0.7}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M18 6L6 18M6 6l12 12" stroke={Colors.dark.dangerDark} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </TouchableOpacity>

    <View style={styles.timerContainer}>
      <Text style={styles.timerLabel}>{isPaused ? 'PAUSED' : 'ELAPSED'}</Text>
      <Text style={[styles.timer, isPaused && styles.timerPaused]}>{formatDuration(elapsedSeconds)}</Text>
    </View>

    <TouchableOpacity
      style={[styles.pauseBtn, isPaused && styles.resumeBtnActive]}
      onPress={isPaused ? onResume : onPause}
      activeOpacity={0.7}
    >
      {isPaused ? (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M5 3l14 9-14 9V3z" fill={Colors.dark.textOnAccent} />
        </Svg>
      ) : (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M6 4h4v16H6V4zM14 4h4v16h-4V4z" fill={Colors.dark.text} />
        </Svg>
      )}
    </TouchableOpacity>
  </View>
))

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.dark.card,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  endBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,68,68,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  timerContainer: { alignItems: 'center' },
  timerLabel: {
    fontSize: FontSize.xs, color: Colors.dark.textMuted,
    fontWeight: FontWeight.semibold, letterSpacing: 1,
  },
  timer: {
    fontSize: FontSize.title, fontWeight: FontWeight.bold,
    color: Colors.dark.text, fontVariant: ['tabular-nums'],
  },
  timerPaused: { color: Colors.dark.accent },
  pauseBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  resumeBtnActive: {
    backgroundColor: Colors.dark.accent,
  },
})
