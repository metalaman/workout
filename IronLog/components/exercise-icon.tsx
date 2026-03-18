import React, { useMemo } from 'react'
import Svg, { Path, Ellipse, Rect, Circle } from 'react-native-svg'

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

// ─── Close-up region type ─────────────────────────────────────────────────
type CloseUpRegion = 'chest' | 'back' | 'legs' | 'arms' | 'shoulders' | 'core' | 'fullbody'

function getCloseUpRegion(primaryMuscles: string[]): CloseUpRegion {
  for (const m of primaryMuscles) {
    if (m === 'chest') return 'chest'
    if (m === 'back' || m === 'lats') return 'back'
    if (m === 'quads' || m === 'hamstrings' || m === 'glutes' || m === 'calves') return 'legs'
    if (m === 'biceps' || m === 'triceps' || m === 'forearms') return 'arms'
    if (m === 'shoulders' || m === 'traps') return 'shoulders'
    if (m === 'core') return 'core'
  }
  return 'fullbody'
}

const VIEWBOXES: Record<CloseUpRegion, string> = {
  chest:     '0 0 100 80',
  back:      '0 0 100 80',
  legs:      '0 0 80 100',
  arms:      '0 0 60 100',
  shoulders: '0 0 100 70',
  core:      '0 0 80 100',
  fullbody:  '0 0 100 200',
}

// ─── Close-up SVG renderers ──────────────────────────────────────────────

function renderChest(color: string, primarySet: Set<string>, secondarySet: Set<string>) {
  const chestPrimary = primarySet.has('chest')
  const chestOpacity = chestPrimary ? 0.95 : secondarySet.has('chest') ? 0.4 : 0.06
  const shoulderOpacity = primarySet.has('shoulders') ? 0.95 : secondarySet.has('shoulders') ? 0.4 : 0
  const tricepOpacity = primarySet.has('triceps') ? 0.95 : secondarySet.has('triceps') ? 0.4 : 0

  return (
    <>
      {/* Torso outline — shoulders to mid-ribcage */}
      <Path
        d="M10,18 Q12,10 22,6 L32,4 Q50,2 68,4 L78,6 Q88,10 90,18 L92,32 L90,50 Q85,65 78,72 L68,76 Q50,78 32,76 L22,72 Q15,65 10,50 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
      />
      {/* Shoulder caps */}
      {shoulderOpacity > 0 && (
        <>
          <Path
            d="M10,18 Q8,12 12,7 L22,4 L28,8 L22,16 Z"
            fill={color}
            fillOpacity={shoulderOpacity}
            stroke={color}
            strokeOpacity={shoulderOpacity * 0.8}
            strokeWidth={0.8}
          />
          <Path
            d="M90,18 Q92,12 88,7 L78,4 L72,8 L78,16 Z"
            fill={color}
            fillOpacity={shoulderOpacity}
            stroke={color}
            strokeOpacity={shoulderOpacity * 0.8}
            strokeWidth={0.8}
          />
        </>
      )}
      {/* Tricep hint on outer arms */}
      {tricepOpacity > 0 && (
        <>
          <Path
            d="M8,22 L4,38 L6,50 L10,46 L10,28 Z"
            fill={color}
            fillOpacity={tricepOpacity}
            stroke={color}
            strokeOpacity={tricepOpacity * 0.6}
            strokeWidth={0.6}
          />
          <Path
            d="M92,22 L96,38 L94,50 L90,46 L90,28 Z"
            fill={color}
            fillOpacity={tricepOpacity}
            stroke={color}
            strokeOpacity={tricepOpacity * 0.6}
            strokeWidth={0.6}
          />
        </>
      )}
      {/* LEFT pec — big bold shape */}
      <Path
        d="M22,16 Q24,12 38,14 L48,18 L48,38 Q46,48 38,50 L26,46 Q16,40 14,30 L16,22 Z"
        fill={color}
        fillOpacity={chestOpacity}
        stroke={color}
        strokeOpacity={chestPrimary ? 0.9 : 0.3}
        strokeWidth={chestPrimary ? 1.5 : 0.8}
      />
      {/* RIGHT pec — big bold shape */}
      <Path
        d="M78,16 Q76,12 62,14 L52,18 L52,38 Q54,48 62,50 L74,46 Q84,40 86,30 L84,22 Z"
        fill={color}
        fillOpacity={chestOpacity}
        stroke={color}
        strokeOpacity={chestPrimary ? 0.9 : 0.3}
        strokeWidth={chestPrimary ? 1.5 : 0.8}
      />
      {/* Sternum center line */}
      <Path
        d="M50,14 L50,56"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={0.8}
      />
      {/* Pec separation line bottom */}
      <Path
        d="M22,46 Q36,54 50,52 Q64,54 78,46"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={0.6}
      />
    </>
  )
}

function renderBack(color: string, primarySet: Set<string>, secondarySet: Set<string>) {
  const backPrimary = primarySet.has('back')
  const latsPrimary = primarySet.has('lats')
  const backOpacity = backPrimary ? 0.95 : secondarySet.has('back') ? 0.4 : 0.06
  const latsOpacity = latsPrimary ? 0.95 : secondarySet.has('lats') ? 0.4 : 0.06
  const trapOpacity = primarySet.has('traps') ? 0.95 : secondarySet.has('traps') ? 0.4 : 0

  return (
    <>
      {/* Posterior torso outline */}
      <Path
        d="M10,18 Q12,10 22,6 L32,4 Q50,2 68,4 L78,6 Q88,10 90,18 L92,34 L90,52 Q85,65 78,72 L68,76 Q50,78 32,76 L22,72 Q15,65 10,52 L8,34 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
      />
      {/* Traps — diamond between neck and shoulders */}
      {trapOpacity > 0 && (
        <Path
          d="M36,4 L50,2 L64,4 L58,14 L50,16 L42,14 Z"
          fill={color}
          fillOpacity={trapOpacity}
          stroke={color}
          strokeOpacity={trapOpacity * 0.8}
          strokeWidth={0.8}
        />
      )}
      {/* Spine line */}
      <Path
        d="M50,6 L50,74"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={0.8}
      />
      {/* Left lat — wide V shape */}
      <Path
        d="M14,20 L10,34 L12,52 L18,64 L30,70 L42,68 L46,52 L44,34 L40,20 L28,16 Z"
        fill={color}
        fillOpacity={latsOpacity}
        stroke={color}
        strokeOpacity={latsPrimary ? 0.9 : 0.3}
        strokeWidth={latsPrimary ? 1.5 : 0.8}
      />
      {/* Right lat — wide V shape */}
      <Path
        d="M86,20 L90,34 L88,52 L82,64 L70,70 L58,68 L54,52 L56,34 L60,20 L72,16 Z"
        fill={color}
        fillOpacity={latsOpacity}
        stroke={color}
        strokeOpacity={latsPrimary ? 0.9 : 0.3}
        strokeWidth={latsPrimary ? 1.5 : 0.8}
      />
      {/* Upper back / rhomboids — inner area near spine */}
      <Path
        d="M40,14 L46,18 L46,38 L42,42 L36,36 L36,20 Z"
        fill={color}
        fillOpacity={backOpacity}
        stroke={color}
        strokeOpacity={backPrimary ? 0.7 : 0.2}
        strokeWidth={0.8}
      />
      <Path
        d="M60,14 L54,18 L54,38 L58,42 L64,36 L64,20 Z"
        fill={color}
        fillOpacity={backOpacity}
        stroke={color}
        strokeOpacity={backPrimary ? 0.7 : 0.2}
        strokeWidth={0.8}
      />
      {/* Lower back */}
      <Path
        d="M38,50 L44,46 L50,48 L56,46 L62,50 L58,64 L50,68 L42,64 Z"
        fill={color}
        fillOpacity={backOpacity * 0.7}
        stroke={color}
        strokeOpacity={backPrimary ? 0.5 : 0.15}
        strokeWidth={0.6}
      />
    </>
  )
}

function renderLegs(color: string, primarySet: Set<string>, secondarySet: Set<string>) {
  const quadsPrimary = primarySet.has('quads')
  const hamsPrimary = primarySet.has('hamstrings')
  const glutesPrimary = primarySet.has('glutes')
  const calvesPrimary = primarySet.has('calves')
  const quadsOpacity = quadsPrimary ? 0.95 : secondarySet.has('quads') ? 0.4 : 0.06
  const hamsOpacity = hamsPrimary ? 0.95 : secondarySet.has('hamstrings') ? 0.4 : 0.06
  const glutesOpacity = glutesPrimary ? 0.95 : secondarySet.has('glutes') ? 0.4 : 0.06
  const calvesOpacity = calvesPrimary ? 0.95 : secondarySet.has('calves') ? 0.4 : 0.06

  return (
    <>
      {/* Hip/waistband area */}
      <Path
        d="M8,4 Q20,0 40,0 Q60,0 72,4 L74,12 Q68,16 60,18 L40,20 L20,18 Q12,16 6,12 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
      />
      {/* Glutes — upper hip mass */}
      <Path
        d="M10,8 Q14,4 26,6 L38,10 L40,16 L26,18 Q14,16 10,12 Z"
        fill={color}
        fillOpacity={glutesOpacity}
        stroke={color}
        strokeOpacity={glutesPrimary ? 0.8 : 0.2}
        strokeWidth={glutesPrimary ? 1.2 : 0.6}
      />
      <Path
        d="M70,8 Q66,4 54,6 L42,10 L40,16 L54,18 Q66,16 70,12 Z"
        fill={color}
        fillOpacity={glutesOpacity}
        stroke={color}
        strokeOpacity={glutesPrimary ? 0.8 : 0.2}
        strokeWidth={glutesPrimary ? 1.2 : 0.6}
      />
      {/* Left leg outline */}
      <Path
        d="M8,14 L4,30 L2,50 L4,68 L6,80 L8,90 L14,92 L18,88 L20,78 L22,60 L24,42 L24,24 L22,18 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
      />
      {/* Right leg outline */}
      <Path
        d="M72,14 L76,30 L78,50 L76,68 L74,80 L72,90 L66,92 L62,88 L60,78 L58,60 L56,42 L56,24 L58,18 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
      />
      {/* Left quad — big front thigh */}
      <Path
        d="M10,18 L6,30 L4,44 L6,56 L10,62 L18,64 L22,56 L24,42 L24,28 L20,18 Z"
        fill={color}
        fillOpacity={quadsOpacity}
        stroke={color}
        strokeOpacity={quadsPrimary ? 0.9 : 0.25}
        strokeWidth={quadsPrimary ? 1.5 : 0.8}
      />
      {/* Right quad */}
      <Path
        d="M70,18 L74,30 L76,44 L74,56 L70,62 L62,64 L58,56 L56,42 L56,28 L60,18 Z"
        fill={color}
        fillOpacity={quadsOpacity}
        stroke={color}
        strokeOpacity={quadsPrimary ? 0.9 : 0.25}
        strokeWidth={quadsPrimary ? 1.5 : 0.8}
      />
      {/* Left hamstring — inner back thigh */}
      <Path
        d="M20,22 L24,30 L24,48 L22,58 L18,56 L14,44 L14,28 Z"
        fill={color}
        fillOpacity={hamsOpacity}
        stroke={color}
        strokeOpacity={hamsPrimary ? 0.8 : 0.2}
        strokeWidth={hamsPrimary ? 1.2 : 0.6}
      />
      {/* Right hamstring */}
      <Path
        d="M60,22 L56,30 L56,48 L58,58 L62,56 L66,44 L66,28 Z"
        fill={color}
        fillOpacity={hamsOpacity}
        stroke={color}
        strokeOpacity={hamsPrimary ? 0.8 : 0.2}
        strokeWidth={hamsPrimary ? 1.2 : 0.6}
      />
      {/* Left calf */}
      <Path
        d="M8,68 L6,78 L8,88 L12,90 L16,86 L18,76 L16,68 Z"
        fill={color}
        fillOpacity={calvesOpacity}
        stroke={color}
        strokeOpacity={calvesPrimary ? 0.8 : 0.2}
        strokeWidth={calvesPrimary ? 1.2 : 0.6}
      />
      {/* Right calf */}
      <Path
        d="M72,68 L74,78 L72,88 L68,90 L64,86 L62,76 L64,68 Z"
        fill={color}
        fillOpacity={calvesOpacity}
        stroke={color}
        strokeOpacity={calvesPrimary ? 0.8 : 0.2}
        strokeWidth={calvesPrimary ? 1.2 : 0.6}
      />
      {/* Knee lines */}
      <Ellipse cx={14} cy={66} rx={6} ry={3} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={0.8} />
      <Ellipse cx={66} cy={66} rx={6} ry={3} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={0.8} />
    </>
  )
}

function renderArms(color: string, primarySet: Set<string>, secondarySet: Set<string>) {
  const bicepsPrimary = primarySet.has('biceps')
  const tricepsPrimary = primarySet.has('triceps')
  const forearmsPrimary = primarySet.has('forearms')
  const bicepsOpacity = bicepsPrimary ? 0.95 : secondarySet.has('biceps') ? 0.4 : 0.06
  const tricepsOpacity = tricepsPrimary ? 0.95 : secondarySet.has('triceps') ? 0.4 : 0.06
  const forearmsOpacity = forearmsPrimary ? 0.95 : secondarySet.has('forearms') ? 0.4 : 0.06

  return (
    <>
      {/* Shoulder cap at top */}
      <Path
        d="M10,6 Q16,0 30,0 Q44,0 50,6 L52,14 Q48,18 40,20 L20,20 Q12,18 8,14 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
      />
      {/* Upper arm outline */}
      <Path
        d="M12,16 L8,32 L6,48 L8,56 L14,58 L18,58 L22,56 L26,58 L32,58 L38,56 L42,48 L44,32 L42,16 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
      />
      {/* Bicep — front of arm, prominent bulge */}
      <Path
        d="M14,18 L10,28 L8,40 L10,50 L16,54 L24,52 L28,44 L28,30 L24,20 Z"
        fill={color}
        fillOpacity={bicepsOpacity}
        stroke={color}
        strokeOpacity={bicepsPrimary ? 0.9 : 0.25}
        strokeWidth={bicepsPrimary ? 1.8 : 0.8}
      />
      {/* Tricep — back of arm, horseshoe shape */}
      <Path
        d="M36,18 L40,28 L42,40 L40,50 L34,54 L28,52 L26,44 L26,30 L30,20 Z"
        fill={color}
        fillOpacity={tricepsOpacity}
        stroke={color}
        strokeOpacity={tricepsPrimary ? 0.9 : 0.25}
        strokeWidth={tricepsPrimary ? 1.8 : 0.8}
      />
      {/* Bicep peak line */}
      <Path
        d="M12,34 Q18,30 24,34"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={0.6}
      />
      {/* Tricep horseshoe detail */}
      <Path
        d="M32,34 Q36,30 40,34"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={0.6}
      />
      {/* Elbow line */}
      <Ellipse cx={25} cy={57} rx={12} ry={3} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={0.8} />
      {/* Forearm */}
      <Path
        d="M12,60 L8,72 L6,84 L10,92 L18,94 L24,92 L28,84 L30,72 L28,60 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.2}
      />
      {/* Forearm muscle fill */}
      <Path
        d="M14,62 L10,74 L10,86 L16,90 L24,88 L26,76 L26,64 L22,60 Z"
        fill={color}
        fillOpacity={forearmsOpacity}
        stroke={color}
        strokeOpacity={forearmsPrimary ? 0.8 : 0.2}
        strokeWidth={forearmsPrimary ? 1.2 : 0.6}
      />
      {/* Separation line bicep/tricep */}
      <Path
        d="M26,20 L26,54"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={0.6}
      />
    </>
  )
}

function renderShoulders(color: string, primarySet: Set<string>, secondarySet: Set<string>) {
  const shouldersPrimary = primarySet.has('shoulders')
  const trapsPrimary = primarySet.has('traps')
  const shouldersOpacity = shouldersPrimary ? 0.95 : secondarySet.has('shoulders') ? 0.4 : 0.06
  const trapsOpacity = trapsPrimary ? 0.95 : secondarySet.has('traps') ? 0.4 : 0.06

  return (
    <>
      {/* Upper torso and neck base */}
      <Path
        d="M30,24 Q34,20 40,18 L50,16 L60,18 Q66,20 70,24 L74,36 Q72,50 68,58 L60,64 Q50,66 40,64 L32,58 Q28,50 26,36 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
      />
      {/* Neck */}
      <Path
        d="M42,10 Q50,6 58,10 L58,18 Q54,20 50,20 Q46,20 42,18 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1}
      />
      {/* Traps — between neck and shoulders */}
      <Path
        d="M42,12 L34,18 L28,26 L36,28 L44,22 L50,20 L56,22 L64,28 L72,26 L66,18 L58,12 Q54,10 50,10 Q46,10 42,12 Z"
        fill={color}
        fillOpacity={trapsOpacity}
        stroke={color}
        strokeOpacity={trapsPrimary ? 0.9 : 0.2}
        strokeWidth={trapsPrimary ? 1.5 : 0.6}
      />
      {/* Left deltoid — big round cap */}
      <Path
        d="M6,24 Q4,16 12,8 L24,6 Q30,8 32,14 L30,26 L26,36 L20,40 L12,38 L6,32 Z"
        fill={color}
        fillOpacity={shouldersOpacity}
        stroke={color}
        strokeOpacity={shouldersPrimary ? 0.9 : 0.25}
        strokeWidth={shouldersPrimary ? 1.8 : 0.8}
      />
      {/* Right deltoid — big round cap */}
      <Path
        d="M94,24 Q96,16 88,8 L76,6 Q70,8 68,14 L70,26 L74,36 L80,40 L88,38 L94,32 Z"
        fill={color}
        fillOpacity={shouldersOpacity}
        stroke={color}
        strokeOpacity={shouldersPrimary ? 0.9 : 0.25}
        strokeWidth={shouldersPrimary ? 1.8 : 0.8}
      />
      {/* Deltoid striations (front/side/rear heads) */}
      <Path
        d="M18,10 L20,28 M12,14 L16,34 M24,12 L24,30"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={0.5}
      />
      <Path
        d="M82,10 L80,28 M88,14 L84,34 M76,12 L76,30"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={0.5}
      />
      {/* Upper arm stubs */}
      <Path
        d="M6,34 L4,50 L8,56 L16,56 L20,50 L20,40 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
      />
      <Path
        d="M94,34 L96,50 L92,56 L84,56 L80,50 L80,40 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
      />
    </>
  )
}

function renderCore(color: string, primarySet: Set<string>, secondarySet: Set<string>) {
  const corePrimary = primarySet.has('core')
  const coreOpacity = corePrimary ? 0.95 : secondarySet.has('core') ? 0.4 : 0.06

  return (
    <>
      {/* Torso midsection outline — ribcage to hips */}
      <Path
        d="M12,4 Q16,0 26,0 L40,2 L54,0 Q64,0 68,4 L72,16 Q74,30 72,46 L70,60 Q68,72 66,80 L62,90 Q52,96 40,96 Q28,96 18,90 L14,80 Q12,72 10,60 L8,46 Q6,30 8,16 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
      />
      {/* Lower chest line / ribcage boundary */}
      <Path
        d="M16,8 Q28,16 40,18 Q52,16 64,8"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={0.8}
      />
      {/* Rectus abdominis — six pack, 3 rows of 2 */}
      {/* Top row */}
      <Path
        d="M28,18 L28,34 Q34,36 38,34 L38,18 Q34,16 28,18 Z"
        fill={color}
        fillOpacity={coreOpacity}
        stroke={color}
        strokeOpacity={corePrimary ? 0.9 : 0.2}
        strokeWidth={corePrimary ? 1.2 : 0.6}
      />
      <Path
        d="M42,18 L42,34 Q48,36 52,34 L52,18 Q48,16 42,18 Z"
        fill={color}
        fillOpacity={coreOpacity}
        stroke={color}
        strokeOpacity={corePrimary ? 0.9 : 0.2}
        strokeWidth={corePrimary ? 1.2 : 0.6}
      />
      {/* Middle row */}
      <Path
        d="M28,38 L28,54 Q34,56 38,54 L38,38 Q34,36 28,38 Z"
        fill={color}
        fillOpacity={coreOpacity}
        stroke={color}
        strokeOpacity={corePrimary ? 0.9 : 0.2}
        strokeWidth={corePrimary ? 1.2 : 0.6}
      />
      <Path
        d="M42,38 L42,54 Q48,56 52,54 L52,38 Q48,36 42,38 Z"
        fill={color}
        fillOpacity={coreOpacity}
        stroke={color}
        strokeOpacity={corePrimary ? 0.9 : 0.2}
        strokeWidth={corePrimary ? 1.2 : 0.6}
      />
      {/* Bottom row */}
      <Path
        d="M28,58 L28,74 Q34,78 38,74 L38,58 Q34,56 28,58 Z"
        fill={color}
        fillOpacity={coreOpacity}
        stroke={color}
        strokeOpacity={corePrimary ? 0.9 : 0.2}
        strokeWidth={corePrimary ? 1.2 : 0.6}
      />
      <Path
        d="M42,58 L42,74 Q48,78 52,74 L52,58 Q48,56 42,58 Z"
        fill={color}
        fillOpacity={coreOpacity}
        stroke={color}
        strokeOpacity={corePrimary ? 0.9 : 0.2}
        strokeWidth={corePrimary ? 1.2 : 0.6}
      />
      {/* Linea alba — center vertical line */}
      <Path
        d="M40,14 L40,82"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1}
      />
      {/* Horizontal tendinous inscriptions */}
      <Path
        d="M28,36 L52,36 M28,56 L52,56"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={0.6}
      />
      {/* Left oblique */}
      <Path
        d="M12,20 L16,30 L20,46 L22,60 L24,72 L28,74 L28,58 L26,42 L24,28 L20,16 Z"
        fill={color}
        fillOpacity={coreOpacity * 0.7}
        stroke={color}
        strokeOpacity={corePrimary ? 0.6 : 0.15}
        strokeWidth={corePrimary ? 1 : 0.5}
      />
      {/* Right oblique */}
      <Path
        d="M68,20 L64,30 L60,46 L58,60 L56,72 L52,74 L52,58 L54,42 L56,28 L60,16 Z"
        fill={color}
        fillOpacity={coreOpacity * 0.7}
        stroke={color}
        strokeOpacity={corePrimary ? 0.6 : 0.15}
        strokeWidth={corePrimary ? 1 : 0.5}
      />
      {/* Navel */}
      <Ellipse cx={40} cy={78} rx={3} ry={2} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={0.8} />
    </>
  )
}

function renderFullBody(color: string, primarySet: Set<string>, secondarySet: Set<string>) {
  return (
    <>
      {/* Head */}
      <Ellipse
        cx={50} cy={17} rx={9} ry={9}
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1}
      />
      {/* Body fill */}
      <Path
        d="M38,32 L36,55 L37,80 L38,84 L34,110 L32,130 L30,145 L29,165 L28,182 L34,182 L36,145 L38,115 L42,86 L50,89 L58,86 L62,115 L64,145 L66,182 L72,182 L71,165 L70,145 L68,130 L66,110 L62,84 L63,80 L64,55 L62,32 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
      />
      {/* Arms */}
      <Path
        d="M32,35 L30,50 L28,65 L26,72 L28,74 L31,66 L34,50 L36,38 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
      />
      <Path
        d="M68,35 L70,50 L72,65 L74,72 L72,74 L69,66 L66,50 L64,38 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
      />
      {/* Generic highlight for any primary muscles */}
      <Path
        d="M40,34 Q50,32 60,34 L62,55 Q58,72 50,74 Q42,72 38,55 Z"
        fill={color}
        fillOpacity={0.5}
        stroke={color}
        strokeOpacity={0.6}
        strokeWidth={1}
      />
    </>
  )
}

// ─── Component ────────────────────────────────────────────────────────────

export const ExerciseIcon = React.memo(function ExerciseIcon({
  exerciseName = '',
  exerciseId = '',
  muscleGroup = '',
  size = 36,
  color = '#ff4444',
}: ExerciseIconProps) {
  const key = toKey(exerciseName || exerciseId)

  // Memoize muscle lookup — only recompute when name/group changes
  const { primaryMuscles, secondaryMuscles } = useMemo(() => {
    let primary: string[] = []
    let secondary: string[] = []

    const mapping = EXERCISE_MUSCLES[key]
    if (mapping) {
      primary = mapping.primary
      secondary = mapping.secondary
    } else {
      const partialMatch = Object.keys(EXERCISE_MUSCLES).find(k => key.includes(k) || k.includes(key))
      if (partialMatch) {
        primary = EXERCISE_MUSCLES[partialMatch].primary
        secondary = EXERCISE_MUSCLES[partialMatch].secondary
      } else if (muscleGroup) {
        const groupKey = muscleGroup.toLowerCase()
        primary = GROUP_TO_MUSCLES[groupKey] || []
      }
    }
    return { primaryMuscles: primary, secondaryMuscles: secondary }
  }, [key, muscleGroup])

  const allPrimary = useMemo(() => new Set(primaryMuscles), [primaryMuscles])
  const allSecondary = useMemo(() => new Set(secondaryMuscles), [secondaryMuscles])

  const region = useMemo(() => getCloseUpRegion(primaryMuscles), [primaryMuscles])
  const viewBox = VIEWBOXES[region]
  const [, , vbW, vbH] = viewBox.split(' ').map(Number)

  const renderRegion = () => {
    switch (region) {
      case 'chest': return renderChest(color, allPrimary, allSecondary)
      case 'back': return renderBack(color, allPrimary, allSecondary)
      case 'legs': return renderLegs(color, allPrimary, allSecondary)
      case 'arms': return renderArms(color, allPrimary, allSecondary)
      case 'shoulders': return renderShoulders(color, allPrimary, allSecondary)
      case 'core': return renderCore(color, allPrimary, allSecondary)
      default: return renderFullBody(color, allPrimary, allSecondary)
    }
  }

  return (
    <Svg width={size} height={size} viewBox={viewBox}>
      <Rect x={0} y={0} width={vbW} height={vbH} rx={8} ry={8} fill={color} fillOpacity={0.08} />
      {renderRegion()}
    </Svg>
  )
})

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
