import React from 'react'
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg'

interface ExerciseIconProps {
  exerciseName?: string
  exerciseId?: string
  muscleGroup?: string
  size?: number
  color?: string
}

// Muscle group accent colors
export const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Chest: '#ff6b6b',
  Back: '#6bc5ff',
  Legs: '#7fff00',
  Shoulders: '#ffaa47',
  Arms: '#e8ff47',
  Core: '#c77dff',
}

// Normalize name to lookup key
function toKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// ─── Exercise → Muscle Mapping (all 55 exercises) ─────────────────────────
const EXERCISE_MUSCLES: Record<string, { primary: string[]; secondary: string[] }> = {
  // Chest (11)
  benchpress:          { primary: ['chest'],               secondary: ['triceps', 'shoulders'] },
  inclinebenchpress:   { primary: ['chest', 'shoulders'],  secondary: ['triceps'] },
  declinebenchpress:   { primary: ['chest'],               secondary: ['triceps'] },
  dumbbellbenchpress:  { primary: ['chest'],               secondary: ['triceps', 'shoulders'] },
  inclinedumbbellpress:{ primary: ['chest', 'shoulders'],  secondary: ['triceps'] },
  dumbbellfly:         { primary: ['chest'],               secondary: ['shoulders'] },
  cablefly:            { primary: ['chest'],               secondary: ['shoulders'] },
  chestdip:            { primary: ['chest', 'triceps'],    secondary: ['shoulders'] },
  pushup:              { primary: ['chest'],               secondary: ['triceps', 'shoulders', 'core'] },
  machinechestpress:   { primary: ['chest'],               secondary: ['triceps', 'shoulders'] },
  pecdeck:             { primary: ['chest'],               secondary: ['shoulders'] },
  // Back (12)
  barbellrow:          { primary: ['back', 'lats'],        secondary: ['biceps', 'forearms', 'traps'] },
  dumbbellrow:         { primary: ['back', 'lats'],        secondary: ['biceps', 'forearms'] },
  cablerow:            { primary: ['back', 'lats'],        secondary: ['biceps'] },
  seatedrow:           { primary: ['back', 'lats'],        secondary: ['biceps', 'traps'] },
  tbarrow:             { primary: ['back', 'lats'],        secondary: ['biceps', 'forearms', 'traps'] },
  pullup:              { primary: ['back', 'lats'],        secondary: ['biceps', 'forearms'] },
  chinup:              { primary: ['back', 'biceps'],      secondary: ['lats', 'forearms'] },
  latpulldown:         { primary: ['lats'],                secondary: ['biceps', 'back'] },
  facepull:            { primary: ['back', 'shoulders'],   secondary: ['traps'] },
  deadlift:            { primary: ['back', 'glutes', 'hamstrings'], secondary: ['quads', 'forearms', 'traps', 'core'] },
  rackpull:            { primary: ['back', 'traps'],       secondary: ['glutes', 'forearms'] },
  hyperextension:      { primary: ['back', 'glutes'],      secondary: ['hamstrings'] },
  // Legs (14)
  barbellsquat:        { primary: ['quads', 'glutes'],     secondary: ['hamstrings', 'calves', 'core'] },
  frontsquat:          { primary: ['quads'],               secondary: ['glutes', 'core'] },
  legpress:            { primary: ['quads', 'glutes'],     secondary: ['hamstrings'] },
  hacksquat:           { primary: ['quads'],               secondary: ['glutes'] },
  romaniandeadlift:    { primary: ['hamstrings', 'glutes'],secondary: ['back', 'forearms'] },
  legcurl:             { primary: ['hamstrings'],          secondary: ['calves'] },
  legextension:        { primary: ['quads'],               secondary: [] },
  walkinglunge:        { primary: ['quads', 'glutes'],     secondary: ['hamstrings', 'calves'] },
  bulgariansplitsquat: { primary: ['quads', 'glutes'],     secondary: ['hamstrings'] },
  hipthrust:           { primary: ['glutes'],              secondary: ['hamstrings', 'core'] },
  calfraise:           { primary: ['calves'],              secondary: [] },
  seatedcalfraise:     { primary: ['calves'],              secondary: [] },
  gobletsquat:         { primary: ['quads', 'glutes'],     secondary: ['core'] },
  sumodeadlift:        { primary: ['glutes', 'quads', 'back'], secondary: ['hamstrings', 'forearms', 'traps'] },
  // Shoulders (10)
  overheadpress:       { primary: ['shoulders'],           secondary: ['triceps', 'traps'] },
  dumbbellshoulderpress:{ primary: ['shoulders'],          secondary: ['triceps', 'traps'] },
  arnoldpress:         { primary: ['shoulders'],           secondary: ['triceps', 'traps'] },
  lateralraise:        { primary: ['shoulders'],           secondary: [] },
  frontraise:          { primary: ['shoulders'],           secondary: ['chest'] },
  reversefly:          { primary: ['shoulders', 'back'],   secondary: ['traps'] },
  uprightrow:          { primary: ['shoulders', 'traps'],  secondary: ['biceps'] },
  cablelateralraise:   { primary: ['shoulders'],           secondary: [] },
  machineshoulderpress:{ primary: ['shoulders'],           secondary: ['triceps'] },
  shrugs:              { primary: ['traps'],               secondary: ['shoulders'] },
  // Arms – Biceps (6)
  barbellcurl:         { primary: ['biceps'],              secondary: ['forearms'] },
  dumbbellcurl:        { primary: ['biceps'],              secondary: ['forearms'] },
  hammercurl:          { primary: ['biceps', 'forearms'],  secondary: [] },
  preachercurl:        { primary: ['biceps'],              secondary: ['forearms'] },
  cablecurl:           { primary: ['biceps'],              secondary: ['forearms'] },
  concentrationcurl:   { primary: ['biceps'],              secondary: [] },
  // Arms – Triceps (6)
  triceppushdown:      { primary: ['triceps'],             secondary: [] },
  skullcrusher:        { primary: ['triceps'],             secondary: ['shoulders'] },
  tricepdip:           { primary: ['triceps'],             secondary: ['chest', 'shoulders'] },
  overheadtricepextension: { primary: ['triceps'],         secondary: [] },
  closegripbenchpress: { primary: ['triceps', 'chest'],    secondary: ['shoulders'] },
  diamondpushup:       { primary: ['triceps'],             secondary: ['chest', 'shoulders'] },
  // Core (8)
  plank:               { primary: ['core'],                secondary: ['shoulders'] },
  crunch:              { primary: ['core'],                secondary: [] },
  abwheelrollout:      { primary: ['core'],                secondary: ['shoulders', 'lats'] },
  cablecrunch:         { primary: ['core'],                secondary: [] },
  hanginglegraise:     { primary: ['core'],                secondary: ['hip_flexors'] },
  russiantwist:        { primary: ['core'],                secondary: [] },
  sideplank:           { primary: ['core'],                secondary: ['shoulders'] },
  declinesitup:        { primary: ['core'],                secondary: [] },
}

// Fallback: muscle group name → muscle keys
const GROUP_TO_MUSCLES: Record<string, string[]> = {
  chest:     ['chest'],
  back:      ['back', 'lats'],
  legs:      ['quads', 'hamstrings', 'glutes', 'calves'],
  shoulders: ['shoulders'],
  arms:      ['biceps', 'triceps', 'forearms'],
  core:      ['core'],
}

// ─── Anatomical SVG paths (viewBox 0 0 100 200) ──────────────────────────
// Each path is carefully positioned for a front-facing human figure.
// Paths use M (move), L (line), C (cubic bezier), Q (quadratic bezier), A (arc), Z (close).

const BODY_OUTLINE = {
  // The whole body silhouette outline
  silhouette: 'M50,8 C55,8 59,12 59,17 C59,22 55,26 50,26 C45,26 41,22 41,17 C41,12 45,8 50,8 Z ' + // head
    'M44,26 L42,30 L38,32 ' + // left neck to shoulder
    'M56,26 L58,30 L62,32 ' + // right neck to shoulder
    'M38,32 L36,33 L32,35 ' + // left shoulder cap
    'M62,32 L64,33 L68,35 ' + // right shoulder cap
    'M32,35 L30,50 L28,65 L26,68 ' + // left upper arm to forearm
    'M68,35 L70,50 L72,65 L74,68 ' + // right upper arm
    'M26,68 L24,78 L23,82 ' + // left hand
    'M74,68 L76,78 L77,82 ' + // right hand
    'M38,32 L36,55 L37,80 L38,82 ' + // left torso side
    'M62,32 L64,55 L63,80 L62,82 ' + // right torso side
    'M38,82 L37,84 ' + // left hip
    'M62,82 L63,84 ' + // right hip
    'M37,84 L34,110 L32,130 L30,145 ' + // left upper leg
    'M63,84 L66,110 L68,130 L70,145 ' + // right upper leg
    'M30,145 L29,165 L28,180 L26,190 L30,192 L34,190 ' + // left lower leg + foot
    'M70,145 L71,165 L72,180 L74,190 L70,192 L66,190 ', // right lower leg + foot
}

// Individual muscle group paths — filled shapes
const MUSCLE_PATHS: Record<string, string> = {
  // Chest — pectoral muscles on upper front torso
  chest:
    'M40,34 Q42,32 50,33 Q58,32 60,34 L62,40 Q58,46 50,47 Q42,46 38,40 Z',

  // Back / Lats — visible as side "wings" from front view
  back:
    'M36,36 L34,42 L35,55 L38,52 L38,44 Z ' +
    'M64,36 L66,42 L65,55 L62,52 L62,44 Z',

  lats:
    'M35,42 L33,52 L35,60 L38,55 L38,48 Z ' +
    'M65,42 L67,52 L65,60 L62,55 L62,48 Z',

  // Shoulders / Deltoids — round caps on both sides
  shoulders:
    'M32,32 Q30,34 30,38 L33,42 L38,38 L38,33 Q36,31 32,32 Z ' +
    'M68,32 Q70,34 70,38 L67,42 L62,38 L62,33 Q64,31 68,32 Z',

  // Traps — between neck and shoulders
  traps:
    'M44,26 L42,28 L38,31 L40,32 L44,30 L50,28 L56,30 L60,32 L62,31 L58,28 L56,26 Q53,25 50,25 Q47,25 44,26 Z',

  // Biceps — front of upper arms
  biceps:
    'M32,40 L30,48 L31,56 L34,54 L35,46 L34,40 Z ' +
    'M68,40 L70,48 L69,56 L66,54 L65,46 L66,40 Z',

  // Triceps — outer/back of upper arms (visible from front as outer edge)
  triceps:
    'M30,40 L28,48 L29,56 L31,56 L30,48 L32,40 Z ' +
    'M70,40 L72,48 L71,56 L69,56 L70,48 L68,40 Z',

  // Forearms — lower arms
  forearms:
    'M29,58 L27,66 L26,72 L28,72 L30,66 L31,58 Z ' +
    'M71,58 L73,66 L74,72 L72,72 L70,66 L69,58 Z',

  // Abs / Core — center of torso below chest
  core:
    'M43,48 L43,75 Q46,78 50,78 Q54,78 57,75 L57,48 Q54,46 50,46 Q46,46 43,48 Z',

  // Quads — front of upper legs
  quads:
    'M38,84 L36,95 L34,110 L33,125 L37,126 L40,112 L42,96 L42,84 Z ' +
    'M62,84 L64,95 L66,110 L67,125 L63,126 L60,112 L58,96 L58,84 Z',

  // Hamstrings — inner/back of upper legs (visible edges from front)
  hamstrings:
    'M42,86 L43,100 L42,115 L40,116 L38,102 L38,86 Z ' +
    'M58,86 L57,100 L58,115 L60,116 L62,102 L62,86 Z',

  // Glutes — hip/buttock area
  glutes:
    'M38,78 Q40,82 42,84 L50,86 L58,84 Q60,82 62,78 L62,82 Q58,88 50,89 Q42,88 38,82 Z',

  // Calves — lower legs
  calves:
    'M31,132 L30,145 L29,158 L31,160 L33,148 L34,134 Z ' +
    'M69,132 L70,145 L71,158 L69,160 L67,148 L66,134 Z',

  // Hip flexors (for hanging leg raise, etc.)
  hip_flexors:
    'M42,78 L40,84 L42,88 L46,86 L44,80 Z ' +
    'M58,78 L60,84 L58,88 L54,86 L56,80 Z',
}

// ─── Component ────────────────────────────────────────────────────────────

export function ExerciseIcon({
  exerciseName = '',
  exerciseId = '',
  muscleGroup = '',
  size = 36,
  color = '#ff4444',
}: ExerciseIconProps) {
  const key = toKey(exerciseName || exerciseId)

  // Look up which muscles to highlight
  let primaryMuscles: string[] = []
  let secondaryMuscles: string[] = []

  const mapping = EXERCISE_MUSCLES[key]
  if (mapping) {
    primaryMuscles = mapping.primary
    secondaryMuscles = mapping.secondary
  } else {
    // Try partial matching
    const partialMatch = Object.keys(EXERCISE_MUSCLES).find(k => key.includes(k) || k.includes(key))
    if (partialMatch) {
      primaryMuscles = EXERCISE_MUSCLES[partialMatch].primary
      secondaryMuscles = EXERCISE_MUSCLES[partialMatch].secondary
    } else if (muscleGroup) {
      // Fallback to muscle group
      const groupKey = muscleGroup.toLowerCase()
      primaryMuscles = GROUP_TO_MUSCLES[groupKey] || []
    }
  }

  const allPrimary = new Set(primaryMuscles)
  const allSecondary = new Set(secondaryMuscles)

  return (
    <Svg width={size} height={size} viewBox="0 0 100 200">
      {/* Base body outline — very subtle */}
      <Path
        d={BODY_OUTLINE.silhouette}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Head */}
      <Ellipse
        cx={50} cy={17} rx={9} ry={9}
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
      />

      {/* Body fill — very subtle silhouette */}
      <Path
        d="M38,32 L36,55 L37,80 L38,84 L34,110 L32,130 L30,145 L29,165 L28,182 L34,182 L36,145 L38,115 L42,86 L50,89 L58,86 L62,115 L64,145 L66,182 L72,182 L71,165 L70,145 L68,130 L66,110 L62,84 L63,80 L64,55 L62,32 Z"
        fill="rgba(255,255,255,0.04)"
      />

      {/* Arms fill subtle */}
      <Path
        d="M32,35 L30,50 L28,65 L26,72 L28,74 L31,66 L34,50 L36,38 Z"
        fill="rgba(255,255,255,0.04)"
      />
      <Path
        d="M68,35 L70,50 L72,65 L74,72 L72,74 L69,66 L66,50 L64,38 Z"
        fill="rgba(255,255,255,0.04)"
      />

      {/* Render all muscle paths — inactive ones are barely visible */}
      {Object.entries(MUSCLE_PATHS).map(([muscleKey, path]) => {
        const isPrimary = allPrimary.has(muscleKey)
        const isSecondary = allSecondary.has(muscleKey)

        if (!isPrimary && !isSecondary) {
          // Inactive muscle — very faint
          return (
            <Path
              key={muscleKey}
              d={path}
              fill="rgba(255,255,255,0.03)"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={0.5}
            />
          )
        }

        return (
          <Path
            key={muscleKey}
            d={path}
            fill={color}
            fillOpacity={isPrimary ? 0.85 : 0.3}
            stroke={color}
            strokeOpacity={isPrimary ? 0.9 : 0.4}
            strokeWidth={isPrimary ? 1 : 0.5}
          />
        )
      })}

      {/* Structural lines overlay — subtle anatomy definition */}
      {/* Center line (linea alba) */}
      <Path
        d="M50,33 L50,78"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={0.5}
      />
      {/* Pec line */}
      <Path
        d="M40,38 Q50,42 60,38"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={0.5}
      />
      {/* Ab lines */}
      <Path
        d="M43,52 L57,52 M43,58 L57,58 M43,64 L57,64 M43,70 L57,70"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={0.4}
      />
      {/* Knee caps */}
      <Circle cx={34} cy={130} r={3} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
      <Circle cx={66} cy={130} r={3} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
    </Svg>
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
