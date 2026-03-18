import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'

interface StrengthGaugeProps {
  score: number
  delta?: number
}

function getLevel(score: number): { label: string; color: string } {
  if (score < 100) return { label: 'BEGINNER', color: '#888888' }
  if (score < 200) return { label: 'NOVICE', color: '#6bc5ff' }
  if (score < 350) return { label: 'INTERMEDIATE', color: '#e8ff47' }
  if (score < 500) return { label: 'ADVANCED', color: '#ff9f43' }
  return { label: 'ELITE', color: '#ff6b6b' }
}

function getArcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const rad = (a: number) => (a * Math.PI) / 180
  const x1 = cx + r * Math.cos(rad(startAngle))
  const y1 = cy + r * Math.sin(rad(startAngle))
  const x2 = cx + r * Math.cos(rad(endAngle))
  const y2 = cy + r * Math.sin(rad(endAngle))
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
}

export const StrengthScoreGauge = React.memo(function StrengthScoreGauge({ score, delta = 0 }: StrengthGaugeProps) {
  const level = getLevel(score)
  const cx = 100
  const cy = 95
  const r = 75
  const startAngle = 150
  const endAngle = 390
  const totalArc = endAngle - startAngle
  const maxScore = 600
  const pct = Math.min(score / maxScore, 1)
  const fillAngle = startAngle + totalArc * pct

  // Tick marks at score thresholds
  const ticks = [0, 100, 200, 350, 500, 600]
  const tickLabels = ['0', '100', '200', '350', '500', '600']

  return (
    <View style={gaugeStyles.container}>
      <Svg width={200} height={120} viewBox="0 0 200 130">
        {/* Background arc */}
        <Path
          d={getArcPath(cx, cy, r, startAngle, endAngle)}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        {score > 0 && (
          <Path
            d={getArcPath(cx, cy, r, startAngle, fillAngle)}
            stroke={level.color}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* Tick marks */}
        {ticks.map((t, i) => {
          const angle = startAngle + (t / maxScore) * totalArc
          const rad = (angle * Math.PI) / 180
          const innerR = r - 14
          const outerR = r - 8
          const x1 = cx + innerR * Math.cos(rad)
          const y1 = cy + innerR * Math.sin(rad)
          const x2 = cx + outerR * Math.cos(rad)
          const y2 = cy + outerR * Math.sin(rad)
          return (
            <G key={i}>
              <Path d={`M${x1} ${y1} L${x2} ${y2}`} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
            </G>
          )
        })}
        {/* Needle dot */}
        {(() => {
          const nAngle = (fillAngle * Math.PI) / 180
          const nx = cx + r * Math.cos(nAngle)
          const ny = cy + r * Math.sin(nAngle)
          return <Circle cx={nx} cy={ny} r={5} fill={level.color} />
        })()}
      </Svg>
      {/* Score text overlay */}
      <View style={gaugeStyles.scoreOverlay}>
        <Text style={[gaugeStyles.score, { color: level.color }]}>{score}</Text>
        <View style={[gaugeStyles.levelBadge, { backgroundColor: `${level.color}20` }]}>
          <Text style={[gaugeStyles.levelText, { color: level.color }]}>{level.label}</Text>
        </View>
        {delta !== 0 && (
          <Text style={[gaugeStyles.delta, { color: delta > 0 ? '#7fff00' : Colors.dark.danger }]}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta)} pts
          </Text>
        )}
      </View>
    </View>
  )
})

interface BalanceGaugeProps {
  push: number
  pull: number
  legs: number
  core: number
}

function getBalanceColor(pct: number): string {
  if (pct < 40) return '#ff6b6b'
  if (pct < 70) return '#ff9f43'
  return '#7fff00'
}

export const StrengthBalanceGauge = React.memo(function StrengthBalanceGauge({ push, pull, legs, core }: BalanceGaugeProps) {
  const groups = [
    { label: 'PUSH', value: push },
    { label: 'PULL', value: pull },
    { label: 'LEGS', value: legs },
    { label: 'CORE', value: core },
  ]
  const avg = Math.round((push + pull + legs + core) / 4)
  const overallColor = getBalanceColor(avg)

  return (
    <View style={balanceStyles.container}>
      <View style={balanceStyles.header}>
        <Text style={balanceStyles.title}>STRENGTH BALANCE</Text>
        <View style={[balanceStyles.scoreBadge, { backgroundColor: `${overallColor}20` }]}>
          <Text style={[balanceStyles.scoreText, { color: overallColor }]}>{avg}%</Text>
        </View>
      </View>
      <View style={balanceStyles.barsContainer}>
        {groups.map((g) => {
          const c = getBalanceColor(g.value)
          return (
            <View key={g.label} style={balanceStyles.barRow}>
              <Text style={balanceStyles.barLabel}>{g.label}</Text>
              <View style={balanceStyles.barTrack}>
                <View style={[balanceStyles.barFill, { width: `${g.value}%`, backgroundColor: c }]} />
              </View>
              <Text style={[balanceStyles.barValue, { color: c }]}>{g.value}%</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
})

const gaugeStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 8 },
  scoreOverlay: {
    position: 'absolute', top: 50, left: 0, right: 0, alignItems: 'center',
  },
  score: { fontSize: 36, fontWeight: FontWeight.black },
  levelBadge: {
    paddingHorizontal: 10, paddingVertical: 2, borderRadius: BorderRadius.full, marginTop: 2,
  },
  levelText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, letterSpacing: 1.5 },
  delta: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginTop: 4 },
})

const balanceStyles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 4, paddingVertical: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: Colors.dark.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.bold, letterSpacing: 1.5 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: BorderRadius.full },
  scoreText: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  barsContainer: { gap: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { color: Colors.dark.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, width: 36 },
  barTrack: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, width: 32, textAlign: 'right' },
})
