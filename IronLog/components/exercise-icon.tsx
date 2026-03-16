import React from 'react'
import Svg, { Circle, Line, Path, Rect, G } from 'react-native-svg'

interface ExerciseIconProps {
  exerciseName?: string
  exerciseId?: string
  muscleGroup?: string
  size?: number
  color?: string
}

// Muscle group colors for subtle accents
export const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Chest: '#ff6b6b',
  Back: '#6bc5ff',
  Legs: '#7fff00',
  Shoulders: '#ffaa47',
  Arms: '#e8ff47',
  Core: '#c77dff',
}

// Normalize name to key
function toKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function ExerciseIcon({
  exerciseName = '',
  exerciseId = '',
  muscleGroup = '',
  size = 36,
  color = '#e8ff47',
}: ExerciseIconProps) {
  const key = toKey(exerciseName || exerciseId)
  const s = size
  const sw = Math.max(1.5, s / 18) // stroke width scales with size

  const renderFigure = () => {
    // === CHEST ===
    if (key.includes('benchpress')) {
      // Lying figure pressing barbell up
      return (
        <G>
          {/* Bench */}
          <Rect x={s*0.1} y={s*0.62} width={s*0.8} height={s*0.06} rx={s*0.02} fill={color} opacity={0.3} />
          {/* Body lying */}
          <Circle cx={s*0.25} cy={s*0.5} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.32} y1={s*0.5} x2={s*0.7} y2={s*0.5} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* Arms up pressing */}
          <Line x1={s*0.4} y1={s*0.5} x2={s*0.35} y2={s*0.25} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.55} y1={s*0.5} x2={s*0.6} y2={s*0.25} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* Barbell */}
          <Line x1={s*0.2} y1={s*0.25} x2={s*0.75} y2={s*0.25} stroke={color} strokeWidth={sw*1.2} strokeLinecap="round" />
          <Circle cx={s*0.2} cy={s*0.25} r={s*0.05} fill={color} opacity={0.5} />
          <Circle cx={s*0.75} cy={s*0.25} r={s*0.05} fill={color} opacity={0.5} />
          {/* Legs */}
          <Line x1={s*0.7} y1={s*0.5} x2={s*0.8} y2={s*0.62} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('incline') && key.includes('press')) {
      // Incline press figure
      return (
        <G>
          <Line x1={s*0.2} y1={s*0.75} x2={s*0.5} y2={s*0.35} stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.3} />
          <Circle cx={s*0.35} cy={s*0.35} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.38} y1={s*0.42} x2={s*0.45} y2={s*0.65} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.42} y1={s*0.48} x2={s*0.55} y2={s*0.22} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.42} y1={s*0.48} x2={s*0.28} y2={s*0.22} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.2} y1={s*0.22} x2={s*0.63} y2={s*0.22} stroke={color} strokeWidth={sw*1.2} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('cablefly') || key.includes('cableflye')) {
      // Standing figure with arms wide
      return (
        <G>
          <Circle cx={s*0.5} cy={s*0.18} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.5} y1={s*0.25} x2={s*0.5} y2={s*0.58} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.35} x2={s*0.2} y2={s*0.3} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.35} x2={s*0.8} y2={s*0.3} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.2} y1={s*0.3} x2={s*0.35} y2={s*0.45} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.8} y1={s*0.3} x2={s*0.65} y2={s*0.45} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.58} x2={s*0.35} y2={s*0.82} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.58} x2={s*0.65} y2={s*0.82} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('dumbbellfly') || key.includes('dumbbellflye')) {
      return renderFlyFigure(s, sw, color)
    }

    if (key.includes('chestdip') || key.includes('dip')) {
      return (
        <G>
          <Line x1={s*0.2} y1={s*0.3} x2={s*0.2} y2={s*0.75} stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.3} />
          <Line x1={s*0.8} y1={s*0.3} x2={s*0.8} y2={s*0.75} stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.3} />
          <Circle cx={s*0.5} cy={s*0.2} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.5} y1={s*0.27} x2={s*0.5} y2={s*0.55} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.35} x2={s*0.2} y2={s*0.4} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.35} x2={s*0.8} y2={s*0.4} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.55} x2={s*0.4} y2={s*0.78} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.55} x2={s*0.6} y2={s*0.78} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('machinechestpress')) {
      return renderSeatedPressFigure(s, sw, color)
    }

    // === BACK ===
    if (key.includes('barbellrow') || key.includes('tbarrow')) {
      // Bent over row
      return (
        <G>
          <Circle cx={s*0.35} cy={s*0.22} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.38} y1={s*0.28} x2={s*0.55} y2={s*0.48} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.55} y1={s*0.48} x2={s*0.5} y2={s*0.8} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.55} y1={s*0.48} x2={s*0.72} y2={s*0.78} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* Arms pulling */}
          <Line x1={s*0.45} y1={s*0.35} x2={s*0.42} y2={s*0.55} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.42} y1={s*0.55} x2={s*0.5} y2={s*0.55} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* Bar */}
          <Line x1={s*0.3} y1={s*0.58} x2={s*0.7} y2={s*0.58} stroke={color} strokeWidth={sw*1.2} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('pullup')) {
      // Hanging from bar pulling up
      return (
        <G>
          <Line x1={s*0.15} y1={s*0.1} x2={s*0.85} y2={s*0.1} stroke={color} strokeWidth={sw*1.5} strokeLinecap="round" />
          <Circle cx={s*0.5} cy={s*0.25} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.5} y1={s*0.1} x2={s*0.38} y2={s*0.18} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.1} x2={s*0.62} y2={s*0.18} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.32} x2={s*0.5} y2={s*0.58} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.58} x2={s*0.38} y2={s*0.8} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.58} x2={s*0.62} y2={s*0.8} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('latpulldown')) {
      return (
        <G>
          <Line x1={s*0.15} y1={s*0.08} x2={s*0.85} y2={s*0.08} stroke={color} strokeWidth={sw*1.2} strokeLinecap="round" />
          <Rect x={s*0.3} y={s*0.55} width={s*0.4} height={s*0.08} rx={s*0.02} fill={color} opacity={0.2} />
          <Circle cx={s*0.5} cy={s*0.32} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.5} y1={s*0.39} x2={s*0.5} y2={s*0.55} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.44} x2={s*0.25} y2={s*0.2} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.44} x2={s*0.75} y2={s*0.2} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.25} y1={s*0.2} x2={s*0.2} y2={s*0.08} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.75} y1={s*0.2} x2={s*0.8} y2={s*0.08} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.55} x2={s*0.38} y2={s*0.78} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.55} x2={s*0.62} y2={s*0.78} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('seatedcablerow')) {
      return (
        <G>
          <Rect x={s*0.15} y={s*0.5} width={s*0.35} height={s*0.06} rx={s*0.02} fill={color} opacity={0.2} />
          <Circle cx={s*0.4} cy={s*0.3} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.4} y1={s*0.37} x2={s*0.4} y2={s*0.5} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.4} y1={s*0.5} x2={s*0.25} y2={s*0.78} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.4} y1={s*0.42} x2={s*0.58} y2={s*0.45} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.58} y1={s*0.45} x2={s*0.55} y2={s*0.38} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.55} y1={s*0.38} x2={s*0.82} y2={s*0.38} stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.5} />
        </G>
      )
    }

    if (key.includes('deadlift') && !key.includes('romanian')) {
      // Standing bent figure lifting bar from ground
      return (
        <G>
          <Circle cx={s*0.45} cy={s*0.18} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.45} y1={s*0.25} x2={s*0.5} y2={s*0.5} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.5} x2={s*0.38} y2={s*0.78} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.5} x2={s*0.65} y2={s*0.78} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.47} y1={s*0.35} x2={s*0.42} y2={s*0.6} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.47} y1={s*0.35} x2={s*0.58} y2={s*0.6} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.2} y1={s*0.62} x2={s*0.8} y2={s*0.62} stroke={color} strokeWidth={sw*1.5} strokeLinecap="round" />
          <Circle cx={s*0.2} cy={s*0.62} r={s*0.05} fill={color} opacity={0.4} />
          <Circle cx={s*0.8} cy={s*0.62} r={s*0.05} fill={color} opacity={0.4} />
        </G>
      )
    }

    // === LEGS ===
    if (key.includes('barbellsquat') || key.includes('squat') && !key.includes('bulgarian') && !key.includes('split')) {
      return (
        <G>
          <Circle cx={s*0.5} cy={s*0.15} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.5} y1={s*0.22} x2={s*0.5} y2={s*0.48} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* Squat position legs */}
          <Line x1={s*0.5} y1={s*0.48} x2={s*0.32} y2={s*0.55} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.32} y1={s*0.55} x2={s*0.3} y2={s*0.8} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.48} x2={s*0.68} y2={s*0.55} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.68} y1={s*0.55} x2={s*0.7} y2={s*0.8} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* Barbell on shoulders */}
          <Line x1={s*0.2} y1={s*0.22} x2={s*0.8} y2={s*0.22} stroke={color} strokeWidth={sw*1.3} strokeLinecap="round" />
          <Circle cx={s*0.2} cy={s*0.22} r={s*0.04} fill={color} opacity={0.4} />
          <Circle cx={s*0.8} cy={s*0.22} r={s*0.04} fill={color} opacity={0.4} />
          {/* Arms holding bar */}
          <Line x1={s*0.5} y1={s*0.28} x2={s*0.35} y2={s*0.22} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.28} x2={s*0.65} y2={s*0.22} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('romaniandeadlift')) {
      return (
        <G>
          <Circle cx={s*0.4} cy={s*0.2} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.42} y1={s*0.27} x2={s*0.55} y2={s*0.5} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.55} y1={s*0.5} x2={s*0.45} y2={s*0.8} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.55} y1={s*0.5} x2={s*0.65} y2={s*0.8} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.48} y1={s*0.36} x2={s*0.38} y2={s*0.58} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.15} y1={s*0.6} x2={s*0.75} y2={s*0.6} stroke={color} strokeWidth={sw*1.2} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('legpress')) {
      return (
        <G>
          <Line x1={s*0.6} y1={s*0.15} x2={s*0.85} y2={s*0.8} stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.3} />
          <Circle cx={s*0.35} cy={s*0.45} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.35} y1={s*0.52} x2={s*0.35} y2={s*0.68} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.35} y1={s*0.68} x2={s*0.55} y2={s*0.55} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.55} y1={s*0.55} x2={s*0.65} y2={s*0.4} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Rect x={s*0.58} y={s*0.3} width={s*0.2} height={s*0.15} rx={s*0.03} fill={color} opacity={0.15} />
        </G>
      )
    }

    if (key.includes('legcurl')) {
      return (
        <G>
          <Rect x={s*0.15} y={s*0.4} width={s*0.65} height={s*0.06} rx={s*0.02} fill={color} opacity={0.2} />
          <Circle cx={s*0.25} cy={s*0.32} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.32} y1={s*0.35} x2={s*0.7} y2={s*0.4} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.7} y1={s*0.4} x2={s*0.75} y2={s*0.55} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.75} y1={s*0.55} x2={s*0.6} y2={s*0.65} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('legextension')) {
      return (
        <G>
          <Rect x={s*0.25} y={s*0.5} width={s*0.3} height={s*0.08} rx={s*0.02} fill={color} opacity={0.2} />
          <Circle cx={s*0.4} cy={s*0.28} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.4} y1={s*0.35} x2={s*0.4} y2={s*0.5} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.4} y1={s*0.5} x2={s*0.42} y2={s*0.62} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.42} y1={s*0.62} x2={s*0.7} y2={s*0.55} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('bulgariansplitsquat')) {
      return (
        <G>
          <Rect x={s*0.62} y={s*0.52} width={s*0.22} height={s*0.08} rx={s*0.02} fill={color} opacity={0.2} />
          <Circle cx={s*0.4} cy={s*0.15} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.4} y1={s*0.22} x2={s*0.4} y2={s*0.48} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.4} y1={s*0.48} x2={s*0.3} y2={s*0.62} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.3} y1={s*0.62} x2={s*0.28} y2={s*0.82} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.4} y1={s*0.48} x2={s*0.55} y2={s*0.58} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.55} y1={s*0.58} x2={s*0.65} y2={s*0.52} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('calfraise')) {
      return (
        <G>
          <Rect x={s*0.2} y={s*0.75} width={s*0.6} height={s*0.06} rx={s*0.02} fill={color} opacity={0.3} />
          <Circle cx={s*0.5} cy={s*0.18} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.5} y1={s*0.25} x2={s*0.5} y2={s*0.52} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.52} x2={s*0.45} y2={s*0.7} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.52} x2={s*0.55} y2={s*0.7} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* On toes */}
          <Line x1={s*0.45} y1={s*0.7} x2={s*0.45} y2={s*0.75} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.55} y1={s*0.7} x2={s*0.55} y2={s*0.75} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </G>
      )
    }

    // === SHOULDERS ===
    if (key.includes('overheadpress') || key.includes('ohp')) {
      return (
        <G>
          <Circle cx={s*0.5} cy={s*0.3} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.5} y1={s*0.37} x2={s*0.5} y2={s*0.62} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.62} x2={s*0.38} y2={s*0.85} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.62} x2={s*0.62} y2={s*0.85} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* Arms pressing overhead */}
          <Line x1={s*0.5} y1={s*0.42} x2={s*0.32} y2={s*0.32} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.32} y1={s*0.32} x2={s*0.28} y2={s*0.12} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.42} x2={s*0.68} y2={s*0.32} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.68} y1={s*0.32} x2={s*0.72} y2={s*0.12} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* Barbell */}
          <Line x1={s*0.15} y1={s*0.12} x2={s*0.85} y2={s*0.12} stroke={color} strokeWidth={sw*1.3} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('lateralraise')) {
      return (
        <G>
          <Circle cx={s*0.5} cy={s*0.2} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.5} y1={s*0.27} x2={s*0.5} y2={s*0.58} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.58} x2={s*0.38} y2={s*0.82} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.58} x2={s*0.62} y2={s*0.82} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* Arms out to sides */}
          <Line x1={s*0.5} y1={s*0.35} x2={s*0.18} y2={s*0.35} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.35} x2={s*0.82} y2={s*0.35} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* Dumbbells */}
          <Rect x={s*0.1} y={s*0.32} width={s*0.08} height={s*0.06} rx={s*0.02} fill={color} opacity={0.5} />
          <Rect x={s*0.82} y={s*0.32} width={s*0.08} height={s*0.06} rx={s*0.02} fill={color} opacity={0.5} />
        </G>
      )
    }

    if (key.includes('facepull')) {
      return (
        <G>
          <Circle cx={s*0.4} cy={s*0.25} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.4} y1={s*0.32} x2={s*0.4} y2={s*0.58} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.4} y1={s*0.58} x2={s*0.3} y2={s*0.82} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.4} y1={s*0.58} x2={s*0.5} y2={s*0.82} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* Arms pulling rope to face */}
          <Line x1={s*0.4} y1={s*0.38} x2={s*0.55} y2={s*0.3} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.55} y1={s*0.3} x2={s*0.48} y2={s*0.22} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.4} y1={s*0.38} x2={s*0.55} y2={s*0.4} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.55} y1={s*0.4} x2={s*0.48} y2={s*0.28} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* Cable line */}
          <Line x1={s*0.55} y1={s*0.35} x2={s*0.85} y2={s*0.35} stroke={color} strokeWidth={sw*0.7} strokeLinecap="round" opacity={0.4} />
        </G>
      )
    }

    if (key.includes('arnoldpress')) {
      return renderOHPFigure(s, sw, color)
    }

    if (key.includes('reardeltfly') || key.includes('reardeltflye')) {
      return renderBentOverFlyFigure(s, sw, color)
    }

    // === ARMS ===
    if (key.includes('barbellcurl') || key.includes('preachercurl')) {
      return (
        <G>
          <Circle cx={s*0.5} cy={s*0.18} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.5} y1={s*0.25} x2={s*0.5} y2={s*0.58} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.58} x2={s*0.38} y2={s*0.82} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.58} x2={s*0.62} y2={s*0.82} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* Curling arms */}
          <Line x1={s*0.5} y1={s*0.35} x2={s*0.38} y2={s*0.48} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.38} y1={s*0.48} x2={s*0.35} y2={s*0.35} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.35} x2={s*0.62} y2={s*0.48} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.62} y1={s*0.48} x2={s*0.65} y2={s*0.35} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* Bar */}
          <Line x1={s*0.28} y1={s*0.35} x2={s*0.72} y2={s*0.35} stroke={color} strokeWidth={sw*1.1} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('triceppushdown')) {
      return (
        <G>
          <Circle cx={s*0.5} cy={s*0.22} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.5} y1={s*0.29} x2={s*0.5} y2={s*0.58} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.58} x2={s*0.38} y2={s*0.82} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.58} x2={s*0.62} y2={s*0.82} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* Arms pushing down */}
          <Line x1={s*0.5} y1={s*0.38} x2={s*0.4} y2={s*0.42} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.4} y1={s*0.42} x2={s*0.42} y2={s*0.55} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.38} x2={s*0.6} y2={s*0.42} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.6} y1={s*0.42} x2={s*0.58} y2={s*0.55} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* Cable */}
          <Line x1={s*0.5} y1={s*0.05} x2={s*0.5} y2={s*0.15} stroke={color} strokeWidth={sw*0.7} strokeLinecap="round" opacity={0.4} />
        </G>
      )
    }

    if (key.includes('hammercurl')) {
      return (
        <G>
          <Circle cx={s*0.5} cy={s*0.18} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.5} y1={s*0.25} x2={s*0.5} y2={s*0.58} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.58} x2={s*0.38} y2={s*0.82} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.58} x2={s*0.62} y2={s*0.82} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.35} x2={s*0.38} y2={s*0.48} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.38} y1={s*0.48} x2={s*0.35} y2={s*0.38} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Rect x={s*0.32} y={s*0.32} width={s*0.06} height={s*0.1} rx={s*0.02} fill={color} opacity={0.4} />
          <Line x1={s*0.5} y1={s*0.35} x2={s*0.62} y2={s*0.48} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.62} y1={s*0.48} x2={s*0.65} y2={s*0.38} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Rect x={s*0.62} y={s*0.32} width={s*0.06} height={s*0.1} rx={s*0.02} fill={color} opacity={0.4} />
        </G>
      )
    }

    if (key.includes('skullcrusher')) {
      return (
        <G>
          <Rect x={s*0.1} y={s*0.55} width={s*0.8} height={s*0.06} rx={s*0.02} fill={color} opacity={0.2} />
          <Circle cx={s*0.2} cy={s*0.45} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.27} y1={s*0.45} x2={s*0.7} y2={s*0.45} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.45} y1={s*0.45} x2={s*0.42} y2={s*0.25} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.42} y1={s*0.25} x2={s*0.3} y2={s*0.2} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.22} y1={s*0.2} x2={s*0.38} y2={s*0.2} stroke={color} strokeWidth={sw*1.1} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('overheadtricepextension')) {
      return renderOHPFigure(s, sw, color)
    }

    // === CORE ===
    if (key.includes('plank')) {
      return (
        <G>
          <Circle cx={s*0.2} cy={s*0.42} r={s*0.06} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.26} y1={s*0.45} x2={s*0.75} y2={s*0.48} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.2} y1={s*0.48} x2={s*0.2} y2={s*0.62} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.75} y1={s*0.48} x2={s*0.82} y2={s*0.62} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.75} y1={s*0.48} x2={s*0.68} y2={s*0.62} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('cablecrunch')) {
      return (
        <G>
          <Circle cx={s*0.5} cy={s*0.25} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.5} y1={s*0.32} x2={s*0.48} y2={s*0.52} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.48} y1={s*0.52} x2={s*0.42} y2={s*0.75} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.48} y1={s*0.52} x2={s*0.58} y2={s*0.75} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.1} x2={s*0.5} y2={s*0.18} stroke={color} strokeWidth={sw*0.7} strokeLinecap="round" opacity={0.4} />
        </G>
      )
    }

    if (key.includes('hanginglegraise')) {
      return (
        <G>
          <Line x1={s*0.2} y1={s*0.08} x2={s*0.8} y2={s*0.08} stroke={color} strokeWidth={sw*1.5} strokeLinecap="round" />
          <Circle cx={s*0.5} cy={s*0.22} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.5} y1={s*0.08} x2={s*0.42} y2={s*0.15} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.08} x2={s*0.58} y2={s*0.15} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.29} x2={s*0.5} y2={s*0.5} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.5} x2={s*0.35} y2={s*0.5} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.5} y1={s*0.5} x2={s*0.65} y2={s*0.5} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.35} y1={s*0.5} x2={s*0.35} y2={s*0.68} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.65} y1={s*0.5} x2={s*0.65} y2={s*0.68} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('abwheelrollout')) {
      return (
        <G>
          <Circle cx={s*0.65} cy={s*0.55} r={s*0.08} fill="none" stroke={color} strokeWidth={sw} />
          <Circle cx={s*0.3} cy={s*0.38} r={s*0.06} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.35} y1={s*0.42} x2={s*0.55} y2={s*0.52} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.42} y1={s*0.46} x2={s*0.58} y2={s*0.52} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.55} y1={s*0.52} x2={s*0.48} y2={s*0.72} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.55} y1={s*0.52} x2={s*0.62} y2={s*0.72} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </G>
      )
    }

    if (key.includes('russiantwist')) {
      return (
        <G>
          <Circle cx={s*0.5} cy={s*0.22} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
          <Line x1={s*0.5} y1={s*0.29} x2={s*0.48} y2={s*0.52} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.48} y1={s*0.52} x2={s*0.35} y2={s*0.72} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.48} y1={s*0.52} x2={s*0.6} y2={s*0.72} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {/* Twisted arms */}
          <Line x1={s*0.49} y1={s*0.38} x2={s*0.7} y2={s*0.35} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={s*0.49} y1={s*0.38} x2={s*0.72} y2={s*0.42} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </G>
      )
    }

    // === FALLBACK by muscle group ===
    return renderGenericFigure(s, sw, color, muscleGroup)
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {renderFigure()}
    </Svg>
  )
}

// Helper figures for reuse
function renderFlyFigure(s: number, sw: number, color: string) {
  return (
    <G>
      <Circle cx={s*0.5} cy={s*0.18} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
      <Line x1={s*0.5} y1={s*0.25} x2={s*0.5} y2={s*0.58} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.35} x2={s*0.22} y2={s*0.42} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.35} x2={s*0.78} y2={s*0.42} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.58} x2={s*0.38} y2={s*0.82} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.58} x2={s*0.62} y2={s*0.82} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </G>
  )
}

function renderOHPFigure(s: number, sw: number, color: string) {
  return (
    <G>
      <Circle cx={s*0.5} cy={s*0.28} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
      <Line x1={s*0.5} y1={s*0.35} x2={s*0.5} y2={s*0.62} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.62} x2={s*0.38} y2={s*0.85} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.62} x2={s*0.62} y2={s*0.85} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.42} x2={s*0.32} y2={s*0.3} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.32} y1={s*0.3} x2={s*0.3} y2={s*0.12} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.42} x2={s*0.68} y2={s*0.3} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.68} y1={s*0.3} x2={s*0.7} y2={s*0.12} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Rect x={s*0.25} y={s*0.08} width={s*0.08} height={s*0.08} rx={s*0.02} fill={color} opacity={0.4} />
      <Rect x={s*0.67} y={s*0.08} width={s*0.08} height={s*0.08} rx={s*0.02} fill={color} opacity={0.4} />
    </G>
  )
}

function renderSeatedPressFigure(s: number, sw: number, color: string) {
  return (
    <G>
      <Rect x={s*0.25} y={s*0.5} width={s*0.3} height={s*0.08} rx={s*0.02} fill={color} opacity={0.2} />
      <Circle cx={s*0.4} cy={s*0.28} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
      <Line x1={s*0.4} y1={s*0.35} x2={s*0.4} y2={s*0.5} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.4} y1={s*0.42} x2={s*0.62} y2={s*0.38} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.62} y1={s*0.38} x2={s*0.72} y2={s*0.42} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.4} y1={s*0.5} x2={s*0.35} y2={s*0.72} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </G>
  )
}

function renderBentOverFlyFigure(s: number, sw: number, color: string) {
  return (
    <G>
      <Circle cx={s*0.35} cy={s*0.3} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
      <Line x1={s*0.38} y1={s*0.36} x2={s*0.55} y2={s*0.52} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.55} y1={s*0.52} x2={s*0.45} y2={s*0.78} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.55} y1={s*0.52} x2={s*0.68} y2={s*0.78} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.44} y1={s*0.42} x2={s*0.28} y2={s*0.52} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.28} y1={s*0.52} x2={s*0.18} y2={s*0.38} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.44} y1={s*0.42} x2={s*0.58} y2={s*0.5} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.58} y1={s*0.5} x2={s*0.72} y2={s*0.38} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </G>
  )
}

function renderGenericFigure(s: number, sw: number, color: string, muscleGroup: string) {
  // Generic standing figure with highlighted muscle area
  const groupLower = muscleGroup.toLowerCase()

  return (
    <G>
      <Circle cx={s*0.5} cy={s*0.18} r={s*0.07} fill="none" stroke={color} strokeWidth={sw} />
      <Line x1={s*0.5} y1={s*0.25} x2={s*0.5} y2={s*0.55} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.35} x2={s*0.3} y2={s*0.48} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.35} x2={s*0.7} y2={s*0.48} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.55} x2={s*0.38} y2={s*0.82} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={s*0.5} y1={s*0.55} x2={s*0.62} y2={s*0.82} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* Muscle highlight */}
      {groupLower === 'chest' && <Circle cx={s*0.5} cy={s*0.32} r={s*0.06} fill={color} opacity={0.15} />}
      {groupLower === 'back' && <Rect x={s*0.42} y={s*0.28} width={s*0.16} height={s*0.15} rx={s*0.03} fill={color} opacity={0.15} />}
      {groupLower === 'legs' && (
        <>
          <Line x1={s*0.38} y1={s*0.56} x2={s*0.38} y2={s*0.82} stroke={color} strokeWidth={sw*3} strokeLinecap="round" opacity={0.12} />
          <Line x1={s*0.62} y1={s*0.56} x2={s*0.62} y2={s*0.82} stroke={color} strokeWidth={sw*3} strokeLinecap="round" opacity={0.12} />
        </>
      )}
      {groupLower === 'shoulders' && (
        <>
          <Circle cx={s*0.38} cy={s*0.3} r={s*0.04} fill={color} opacity={0.2} />
          <Circle cx={s*0.62} cy={s*0.3} r={s*0.04} fill={color} opacity={0.2} />
        </>
      )}
      {groupLower === 'arms' && (
        <>
          <Line x1={s*0.38} y1={s*0.36} x2={s*0.3} y2={s*0.48} stroke={color} strokeWidth={sw*2.5} strokeLinecap="round" opacity={0.15} />
          <Line x1={s*0.62} y1={s*0.36} x2={s*0.7} y2={s*0.48} stroke={color} strokeWidth={sw*2.5} strokeLinecap="round" opacity={0.15} />
        </>
      )}
      {groupLower === 'core' && <Rect x={s*0.42} y={s*0.38} width={s*0.16} height={s*0.18} rx={s*0.03} fill={color} opacity={0.15} />}
    </G>
  )
}

// Comprehensive exercise list for pickers
export const EXERCISES: string[] = [
  // Chest
  'Bench Press', 'Incline Bench Press', 'Decline Bench Press', 'Dumbbell Bench Press',
  'Incline Dumbbell Press', 'Dumbbell Fly', 'Cable Fly', 'Chest Dip', 'Push-up',
  'Machine Chest Press', 'Pec Deck',
  // Back
  'Barbell Row', 'Dumbbell Row', 'Cable Row', 'Seated Row', 'T-Bar Row',
  'Pull-up', 'Chin-up', 'Lat Pulldown', 'Face Pull', 'Deadlift',
  'Rack Pull', 'Hyperextension',
  // Legs
  'Barbell Squat', 'Front Squat', 'Leg Press', 'Hack Squat',
  'Romanian Deadlift', 'Leg Curl', 'Leg Extension', 'Walking Lunge',
  'Bulgarian Split Squat', 'Hip Thrust', 'Calf Raise', 'Seated Calf Raise',
  'Goblet Squat', 'Sumo Deadlift',
  // Shoulders
  'Overhead Press', 'Dumbbell Shoulder Press', 'Arnold Press',
  'Lateral Raise', 'Front Raise', 'Reverse Fly', 'Upright Row',
  'Cable Lateral Raise', 'Machine Shoulder Press', 'Shrugs',
  // Arms
  'Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl',
  'Cable Curl', 'Concentration Curl',
  'Tricep Pushdown', 'Skull Crusher', 'Tricep Dip', 'Overhead Tricep Extension',
  'Close-Grip Bench Press', 'Diamond Push-up',
  // Core
  'Plank', 'Crunch', 'Ab Wheel Rollout', 'Cable Crunch',
  'Hanging Leg Raise', 'Russian Twist', 'Side Plank', 'Decline Sit-up',
]
