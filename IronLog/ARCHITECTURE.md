# IronLog Architecture

Deep technical reference for the IronLog codebase. Read this to understand how everything connects.

## Table of Contents

1. [Navigation & Routing](#navigation--routing)
2. [State Management](#state-management)
3. [Data Layer](#data-layer)
4. [Authentication](#authentication)
5. [Real-Time Features](#real-time-features)
6. [Component Architecture](#component-architecture)
7. [Design System](#design-system)
8. [Key Design Patterns](#key-design-patterns)
9. [Data Flow Diagrams](#data-flow-diagrams)

---

## Navigation & Routing

Uses **Expo Router v6** (file-based routing). Every file in `app/` becomes a route.

### Route Map

```
/                          → Root layout (AuthGate + Stack)
├── (auth)/                → Auth stack group
│   ├── login              → Email/password login
│   └── register           → Registration + profile creation
├── (tabs)/                → Main tab navigator (5 tabs)
│   ├── index              → Home (dashboard, calendar, FAB)
│   ├── library/           → Exercise library stack
│   │   ├── index          → Searchable exercise list
│   │   ├── [id]           → Exercise detail
│   │   └── filters        → Filter modal
│   ├── program/           → Program builder stack
│   │   ├── index          → Program overview + day editor
│   │   ├── create         → Create program wizard
│   │   ├── edit-day       → Edit day (add/remove/reorder exercises)
│   │   └── pick-exercise  → Exercise picker modal
│   ├── progress           → Stats overview (strength score, balance, PRs)
│   └── social/            → Social groups stack
│       ├── index          → Groups list + Invitations tab
│       ├── [groupId]      → Group chat (real-time)
│       ├── create         → Create / join group
│       └── members        → Member management + invite users
├── workout/               → Workout stack (slides up from bottom)
│   ├── active             → Active workout tracker
│   ├── freestyle          → Freestyle exercise picker
│   ├── summary            → Post-workout summary
│   ├── detail             → Past workout detail
│   └── cardio             → Cardio session logger
├── profile                → User profile editor
└── stats/                 → Extended stats stack
    ├── body               → Body measurements
    └── photos             → Progress photos
```

### Navigation Patterns

- **AuthGate** (`app/_layout.tsx`): Wraps the entire app. If not authenticated, redirects to `(auth)/login`. If authenticated + on auth screen, redirects to `(tabs)`.
- **Tab Navigator**: 5 tabs — Home, Library, Plan, Stats, Groups. Custom SVG icons with haptic feedback (`HapticTab`).
- **Stack Groups**: `(auth)` and `(tabs)` are Expo Router groups with their own `_layout.tsx`. `workout` and `stats` are standalone stacks.
- **Animations**: Workout screens slide up from bottom (`slide_from_bottom`). Profile and stats slide from right.

### Tab Bar Configuration

```typescript
// 5 tabs with custom SVG icons, 72px height, dark theme
{
  backgroundColor: '#0f0f0f',
  borderTopColor: 'rgba(255,255,255,0.06)',
  height: 72,
  paddingBottom: 16,
  paddingTop: 10,
}
```

Tabs: Home (`index`) | Library (`library`) | Plan (`program`) | Stats (`progress`) | Groups (`social`)

---

## State Management

**9 Zustand stores**, all using the `create<T>()` pattern. No middleware (no persist, no devtools). State lives in memory only — Appwrite is the source of truth.

### Store: `useAuthStore` (`stores/auth-store.ts`)

Manages authentication and user profile.

```typescript
interface AuthState {
  user: Models.User<Models.Preferences> | null  // Appwrite user object
  profile: UserProfile | null                     // From user_profiles collection
  isLoading: boolean                              // True during initialization
  isAuthenticated: boolean                        // Gate for navigation

  initialize: () => Promise<void>     // Check existing session on app launch
  login: (email, password) => Promise<void>
  register: (email, password, name) => Promise<void>
  logout: () => Promise<void>
  skipAuth: () => void                // Dev mode — fake user, no Appwrite
}
```

**Key behaviors:**
- `initialize()` is called once in root `_layout.tsx` on mount
- `skipAuth()` creates a fake user with ID `'dev'` and profile with avatar color `#e8ff47`
- Registration auto-creates a `user_profiles` document with random avatar color

---

### Store: `useWorkoutStore` (`stores/workout-store.ts`)

Active workout state — **in-memory only, not persisted**.

```typescript
interface WorkoutState {
  isActive: boolean                    // Is a workout in progress?
  isPaused: boolean                    // Is the timer paused?
  sessionId: string | null             // Appwrite session doc ID
  programDayName: string               // Display name for the workout
  exercises: ActiveWorkoutExercise[]   // Exercises being tracked
  currentExerciseIndex: number         // Currently selected exercise
  startTime: number | null             // Date.now() when started
  elapsedSeconds: number               // Timer value
  pausedAtSeconds: number              // Elapsed when paused
  restTimerSeconds: number             // Rest timer countdown
  isResting: boolean                   // Is rest timer active?

  startWorkout: (params) => void       // Initialize workout from program day or freestyle
  addSet: (exerciseIndex) => void      // Append set (copies prev weight/reps)
  completeSet: (exIdx, setIdx, weight, reps) => void  // Mark set complete
  nextExercise: () => void             // Advance to next exercise
  updateElapsed: (seconds) => void     // Called by timer interval
  startRest: (seconds) => void
  stopRest: () => void
  pauseWorkout: () => void             // Freeze timer
  resumeWorkout: () => void            // Resume timer
  endWorkout: () => { totalVolume, duration }  // Calculate stats + reset state
  reset: () => void                    // Full state reset
}
```

**⚠️ Critical:** `endWorkout()` resets ALL state including `exercises`. Any code that needs exercise data after ending must capture it BEFORE calling `endWorkout()`. The session store's `setLastCompleted()` accepts exercises for this reason.

---

### Store: `useProgramStore` (`stores/program-store.ts`)

Programs, days, and the program builder.

```typescript
interface ProgramState {
  programs: Program[]                  // All user programs
  currentProgram: Program | null       // Currently selected
  days: ProgramDay[]                   // Days for current program
  activeDayIndex: number               // Selected day tab index
  isLoading: boolean
  error: string | null

  // Builder state (for create flow)
  builderProgram: Partial<Program> | null
  builderDays: ProgramDay[]
  builderActiveDayIndex: number

  // Actions
  loadPrograms: (userId) => Promise<void>   // Fetch from Appwrite, fallback to defaults
  loadDays: (programId) => Promise<void>
  setActiveDayIndex: (index) => void
  updateDayExercises: (dayIndex, exercises) => void
  addExerciseToDay: (dayIndex, exercise) => void
  saveDayToBackend: (dayIndex) => Promise<void>
  loadDefaultProgram: (userId) => void      // 6-day PPL hardcoded fallback

  // Builder actions
  createNewProgram: (name, daysPerWeek, totalWeeks, userId, color?) => Promise<void>
  addDay: (name) => Promise<void>
  removeDay: (dayIndex) => Promise<void>
  addExerciseToBuilderDay: (dayIndex, exercise) => void
  removeExerciseFromDay: (dayIndex, exerciseIndex) => void
  reorderExercise: (dayIndex, fromIndex, toIndex) => void
  toggleSuperset: (dayIndex, exerciseIndex) => void
  toggleDropSet: (dayIndex, exerciseIndex) => void
  updateExerciseInDay: (dayIndex, exerciseIndex, updates) => void
  saveBuilderDay: (dayIndex) => Promise<void>    // Saves name + exercises to Appwrite
  updateDayName: (dayIndex, name) => void
  deleteProgram: (programId) => Promise<void>    // Deletes program + all days
  setCurrentProgram: (program) => void
  clearBuilder: () => void
  moveExercise: (dayIndex, fromIndex, direction: 'up' | 'down') => void
  swapExercise: (dayIndex, exerciseIndex, newExerciseId, newExerciseName) => void
}
```

**Key behaviors:**
- `createNewProgram()` skips Appwrite for dev users (checks `userId === 'dev'`)
- `addDay()` creates Appwrite doc or local placeholder
- `saveBuilderDay()` persists both `name` and `exercises` (exercises as JSON string)
- `loadDefaultProgram()` creates a hardcoded 6-day Push/Pull/Legs program
- Builder state (`builderProgram`, `builderDays`) is separate from active program state
- `moveExercise()` auto-saves to backend after reordering

---

### Store: `useSessionStore` (`stores/session-store.ts`)

Workout history, personal records, and post-workout state.

```typescript
interface SessionState {
  recentSessions: WorkoutSession[]         // Last 3 completed
  allSessions: WorkoutSession[]            // Full history (up to 100)
  personalRecords: PersonalRecord[]        // All PRs
  isLoading: boolean
  lastCompletedSession: WorkoutSession | null   // For summary screen
  lastCompletedExercises: ActiveWorkoutExercise[]  // Exercises from last workout
  newPRs: PersonalRecord[]                 // PRs set in last workout

  loadRecent: (userId) => Promise<void>
  loadAll: (userId) => Promise<void>
  loadPRs: (userId) => Promise<void>
  addSession: (session) => void            // Optimistic add to local state
  setLastCompleted: (session, exercises?) => void
  setNewPRs: (prs) => void
  clearCompletionData: () => void
}
```

---

### Store: `useSocialStore` (`stores/social-store.ts`)

Groups, messages, members, and invitations.

```typescript
interface SocialState {
  groups: Group[]
  activeGroup: Group | null
  messages: GroupMessage[]
  members: GroupMember[]
  invitations: GroupInvitation[]
  isLoading: boolean
  isMessagesLoading: boolean

  loadGroups: (userId) => Promise<void>
  setActiveGroup: (group) => void          // Resets messages + members
  loadMessages: (groupId) => Promise<void>
  loadMembers: (groupId) => Promise<void>
  createGroup: (name, description, userId, displayName, avatarColor) => Promise<Group>
  joinGroupByCode: (code, userId, displayName, avatarColor) => Promise<Group>
  sendMessage: (groupId, text, userId, userName, avatarColor) => Promise<void>
  shareWorkout: (groupIds, workoutData, text, userId, userName, avatarColor) => Promise<void>
  leaveGroup: (groupId, userId) => Promise<void>
  removeMember: (memberId, groupId) => Promise<void>
  loadInvitations: (userId) => Promise<void>
  sendInvitation: (groupId, groupName, groupColor, invitedBy, inviterName, invitedUserId) => Promise<void>
  acceptInvitation: (invitation, userId, displayName, avatarColor) => Promise<void>
  declineInvitation: (invitationId) => Promise<void>
}
```

**Key behaviors:**
- `sendMessage()` adds message to state optimistically
- `setActiveGroup()` clears messages and members (forces reload)
- `acceptInvitation()` calls `joinGroupById()` then `respondToInvitation()`

---

### Store: `useFilterStore` (`stores/filter-store.ts`)

Exercise library filter state — purely local, no Appwrite.

```typescript
interface FilterState {
  search: string
  muscleGroups: MuscleGroup[]       // Multi-select
  equipment: Equipment[]            // Multi-select
  difficulty: Difficulty | null     // Single-select or null

  setSearch: (search) => void
  toggleMuscleGroup: (group) => void
  toggleEquipment: (equip) => void
  setDifficulty: (difficulty) => void
  reset: () => void
}
```

---

### Store: `useBodyStore` (`stores/body-store.ts`)

```typescript
interface BodyState {
  stats: BodyStat[]
  isLoading: boolean
  loadStats: (userId) => Promise<void>
  addStat: (data) => Promise<void>      // Fallback to local on Appwrite failure
  removeStat: (id) => Promise<void>
}
```

### Store: `useCardioStore` (`stores/cardio-store.ts`)

```typescript
interface CardioState {
  sessions: CardioSession[]
  isLoading: boolean
  loadSessions: (userId) => Promise<void>
  addSession: (data) => Promise<void>
  removeSession: (id) => Promise<void>
}
```

### Store: `usePhotoStore` (`stores/photo-store.ts`)

```typescript
interface PhotoState {
  photos: ProgressPhoto[]
  isLoading: boolean
  loadPhotos: (userId) => Promise<void>
  addPhoto: (data) => Promise<void>
  removePhoto: (id) => Promise<void>
}
```

---

## Data Layer

### `lib/appwrite.ts` — Client Configuration

```typescript
// Exports:
export const account: Account        // Auth operations
export const databases: Databases    // CRUD operations
export const avatars: Avatars        // Avatar generation
export const storage: Storage        // File uploads
export const client: Client          // Raw client (for Realtime subscriptions)

export const DATABASE_ID = '698dd75900395a2e605e'
export const STORAGE_BUCKET = 'progress_photos'

export const COLLECTION = {
  EXERCISES, PROGRAMS, PROGRAM_DAYS, WORKOUT_SESSIONS, WORKOUT_SETS,
  PERSONAL_RECORDS, SOCIAL_POSTS, USER_PROFILES, GROUPS, GROUP_MEMBERS,
  GROUP_MESSAGES, GROUP_INVITATIONS, BODY_STATS, CARDIO_SESSIONS, PROGRESS_PHOTOS,
}

export { ID, Query } from 'react-native-appwrite'
```

### `lib/db/` — Modularized Database Operations (~63 functions)

Database operations are split into domain-specific modules under `lib/db/`. The old `lib/database.ts` is a barrel re-export for backward compatibility — prefer importing from `@/lib/db` or specific domain modules directly.

```
lib/db/
├── index.ts        — Barrel re-export of all modules
├── programs.ts     — Program & ProgramDay CRUD (11 functions)
├── workouts.ts     — WorkoutSession & WorkoutSet CRUD (8 functions)
├── records.ts      — Personal record tracking (2 functions)
├── social.ts       — Groups, messages, invitations, posts (19 functions)
├── profile.ts      — User profile & streak (3 functions)
├── body.ts         — Body stats, cardio, progress photos (9 functions)
├── nutrition.ts    — Nutrition profiles & food logs (9 functions)
└── exercises.ts    — Custom exercise CRUD (2 functions)
```

Functions are organized by entity:

**Programs:**
- `listPrograms(userId)` → `Program[]`
- `getProgram(programId)` → `Program`
- `createProgram(data)` → `Program`
- `updateProgram(programId, data)` → `Program`
- `deleteProgram(programId)` → `void`

**Program Days:**
- `listProgramDays(programId)` → `ProgramDay[]` — auto-parses exercises from JSON
- `createProgramDay(data)` → `ProgramDay` — auto-serializes exercises to JSON
- `updateProgramDay(dayId, data)` → `ProgramDay` — auto-serializes exercises to JSON
- `deleteProgramDay(dayId)` → `void`

**Workout Sessions:**
- `createWorkoutSession(data)` → `WorkoutSession`
- `completeWorkoutSession(sessionId, stats)` → `WorkoutSession`
- `listWorkoutSessions(userId, limit?)` → `WorkoutSession[]`
- `getRecentSessions(userId, limit?)` → `WorkoutSession[]` — only completed sessions

**Workout Sets:**
- `createWorkoutSet(data)` → `WorkoutSet`
- `updateWorkoutSet(setId, data)` → `WorkoutSet`
- `listWorkoutSets(sessionId)` → `WorkoutSet[]`
- `getExerciseHistory(userId, exerciseId, limit?)` → `WorkoutSet[]`

**Personal Records:**
- `listPersonalRecords(userId)` → `PersonalRecord[]`
- `checkAndUpdatePR(userId, exerciseId, exerciseName, weight, reps)` → `{ isNewPR, record }`

**Social Posts:**
- `listSocialPosts(limit?)` → `SocialPost[]`
- `createSocialPost(data)` → `SocialPost`
- `toggleLike(postId, userId)` → `SocialPost`

**User Profiles:**
- `getUserProfile(userId)` → `UserProfile | null`
- `updateUserProfile(profileId, data)` → `UserProfile`
- `updateStreak(userId, profileId)` → `UserProfile`
- `searchUsersByName(name)` → `any[]` — fulltext search for invitations

**Groups:**
- `createGroup(name, description, userId, displayName, avatarColor)` → `Group`
- `getGroup(groupId)` → `Group`
- `listUserGroups(userId)` → `Group[]` — finds memberships first, then fetches each group
- `joinGroupByCode(code, userId, displayName, avatarColor)` → `Group`
- `joinGroupById(groupId, userId, displayName, avatarColor)` → `Group`
- `leaveGroup(groupId, userId)` → `void`
- `listGroupMembers(groupId)` → `GroupMember[]`
- `removeGroupMember(memberId, groupId)` → `void`

**Group Messages:**
- `sendGroupMessage(groupId, userId, userName, avatarColor, text, type?, workoutData?)` → `GroupMessage`
- `listGroupMessages(groupId, limit?)` → `GroupMessage[]`
- `shareWorkoutToGroups(groupIds, workoutData, text, userId, userName, avatarColor)` → `void`
- `getLastGroupMessage(groupId)` → `GroupMessage | null`

**Group Invitations:**
- `sendGroupInvitation(data)` → `any`
- `listPendingInvitations(userId)` → `any[]`
- `respondToInvitation(invitationId, status)` → `void`

**Body Stats / Cardio / Photos:**
- `listBodyStats(userId)`, `createBodyStat(data)`, `deleteBodyStat(id)`
- `listCardioSessions(userId)`, `createCardioSession(data)`, `deleteCardioSession(id)`
- `listProgressPhotos(userId)`, `createProgressPhoto(data)`, `deleteProgressPhoto(id)`

### `lib/auth.ts` — Authentication

```typescript
login(email, password) → Models.Session
register(email, password, name) → Models.Session  // Also creates user_profiles doc
getCurrentUser() → Models.User | null
logout() → void
getUserProfile(userId) → UserProfile | null
```

### `lib/utils.ts` — Pure Helpers

```typescript
calculate1RM(weight, reps) → number       // Epley formula
calculateVolume(weight, reps) → number
formatDuration(seconds) → "MM:SS"
formatVolume(volume) → "12.5k" or "850"
formatWeight(weight) → "1,250"
getGreeting() → "Good morning" / "afternoon" / "evening"
formatDate(date?) → "MONDAY, JUN 16"
getRelativeTime(dateString) → "5m ago" / "Yesterday" / "Jun 10"
getDayOfWeek() → 0-6 (Monday=0)
```

---

## Authentication

### Flow

```
App Launch
  → RootLayout mounts
  → useAuthStore.initialize() called
  → account.get() checks for existing Appwrite session
  → If session exists: fetch user profile, set isAuthenticated=true
  → If no session: set isAuthenticated=false
  → AuthGate redirects:
      - Not authenticated → /(auth)/login
      - Authenticated + on auth screen → /(tabs)
```

### Dev Mode

```typescript
// In auth-store.ts
skipAuth: () => {
  set({
    user: { $id: 'dev', name: 'Alex', email: 'alex@dev.local' },
    profile: { userId: 'dev', displayName: 'Alex', avatarColor: '#e8ff47', ... },
    isAuthenticated: true,
    isLoading: false,
  })
}
```

When `userId === 'dev'` or IDs start with `local-`, Appwrite calls are skipped in the program store.

---

## Real-Time Features

### Group Chat (Appwrite Realtime)

The group chat screen (`app/(tabs)/social/[groupId].tsx`) subscribes to Appwrite's WebSocket-based Realtime API:

```typescript
const channel = `databases.${DATABASE_ID}.collections.${COLLECTION.GROUP_MESSAGES}.documents`
const unsubscribe = client.subscribe(channel, (response) => {
  // Filter for current group
  const msg = response.payload as GroupMessage
  if (msg.groupId === groupId && response.events.includes('*.create')) {
    // Add to messages state (deduplicate by $id)
  }
})
```

**Optimistic sends:** When a user sends a message, a temporary message with `$id: 'temp-*'` is added to state immediately. When the real message arrives via Realtime, the temp is deduplicated.

### Invitations

Invitations are fetched via polling (`loadInvitations(userId)`) on the social index screen mount. Not real-time yet.

---

## Component Architecture

### `ExerciseIcon` (`components/exercise-icon.tsx`)

Anatomical SVG body diagram that highlights muscles for any exercise.

- **67 exercise mappings** — maps exercise name → primary + secondary muscles
- **14 muscle SVG paths** — chest, back, lats, shoulders, traps, biceps, triceps, forearms, core, quads, hamstrings, glutes, calves, hip_flexors
- **Rendering:** Full body silhouette with highlighted muscles (primary: 85% opacity, secondary: 30%)
- **Usage:** `<ExerciseIcon exerciseName="Bench Press" size={36} color="#ff6b6b" />`
- **Lookup:** Name → lowercase/stripped → `EXERCISE_MUSCLES` map → muscle list → SVG paths

### `StrengthScoreGauge` (`components/strength-gauges.tsx`)

Arc gauge showing composite strength score (0–600) based on compound lift 1RMs.

- Levels: Beginner (<100, gray), Novice (<200, blue), Intermediate (<350, yellow), Advanced (<500, orange), Elite (500+, red)
- SVG arc with tick marks at score thresholds

### `StrengthBalanceGauge`

Radar/bar chart showing Push/Pull/Legs/Core balance.

### `HapticTab` (`components/haptic-tab.tsx`)

Tab button wrapper that triggers light haptic feedback on press.

### UI Primitives (`components/ui/`)

Shared reusable components used across screens:

- `LoadingScreen` — Full-screen centered spinner with optional message. Use instead of inline `ActivityIndicator`.
- `EmptyState` — Centered icon + title + subtitle + optional CTA button. Use for "no data" states.
- `SectionHeader` — Styled section label (e.g. "RECENT") with optional "See All" action link.

### Home Sub-Components (`components/home/`)

Extracted from the home screen for better maintainability:

- `MetricsCard` — Strength Score / Balance card with dot switcher

---

## Design System

### Theme Tokens (`constants/theme.ts`)

All design tokens are in a single file. The app uses **dark mode only** — both `Colors.dark` and `Colors.light` have identical values.

**Color Palette:**
- Background: `#0f0f0f` (near-black)
- Accent: `#e8ff47` (neon yellow-green) — used for buttons, highlights, active states
- Text hierarchy: `#ffffff` → `#888888` → `#555555` → `#444444`
- Semantic: danger `#ff6b6b`, info `#6bc5ff`
- Surfaces: Semi-transparent white (`rgba(255,255,255,0.04)` to `0.06`)

**Spacing:** Compact scale (xs:4 → xxxxl:32). Most UI uses `Spacing.lg` (12) or `Spacing.xl` (16).

**Font sizes:** Small scale (xs:8 → hero:26). Body text is `FontSize.base` (12) or `FontSize.lg` (13). Titles are `FontSize.title` (20).

**Fonts:** System fonts per platform (iOS: system-ui, Android: normal, Web: system-ui stack).

---

## Key Design Patterns

### 1. JSON Serialization for Complex Fields

Appwrite doesn't support nested objects. The `exercises` field in `program_days` stores a `ProgramExercise[]` as a **JSON string**. All serialization/deserialization happens in `database.ts`:

```typescript
// Creating: Array → JSON string
exercises: JSON.stringify(data.exercises ?? [])

// Reading: JSON string → Array
exercises: JSON.parse(doc.exercises)
```

### 2. Denormalized Fields

To avoid extra queries, frequently-displayed fields are duplicated:
- `GroupMember.displayName` / `avatarColor` (from user profile)
- `GroupMessage.userName` / `avatarColor` (from user profile)
- `GroupInvitation.groupName` / `groupColor` / `inviterName`
- `WorkoutSession.programDayName` (from program day)
- `PersonalRecord.exerciseName` (from exercise)

### 3. Local Fallback Pattern

Many store actions have this pattern:
```typescript
try {
  const result = await db.createSomething(data)
  set({ items: [result, ...state.items] })
} catch {
  const local = { ...data, $id: `local-${Date.now()}` }
  set({ items: [local, ...state.items] })
}
```

This ensures the UI works even when Appwrite is unreachable. Local IDs start with `local-`.

### 4. Exercise Data Capture Before Reset

The workout store's `endWorkout()` resets all state. Screens that need exercise data post-workout must capture it first:

```typescript
// In active.tsx
const completedExercises = [...exercises]  // CAPTURE BEFORE RESET
const { totalVolume, duration } = endWorkout()  // This resets exercises to []
setLastCompleted(session, completedExercises)
```

### 5. Store-per-Domain

Each domain has its own Zustand store. Stores don't directly reference each other — screens import from multiple stores and coordinate in component code.

### 6. Appwrite Type Casting

Appwrite returns generic `Document` types. All database.ts functions cast with `as unknown as T`:

```typescript
return doc as unknown as Program
```

This is a deliberate pattern throughout — not a bug.

---

## Data Flow Diagrams

### Starting a Strength Workout

```
User taps FAB "+" → "Strength Workout"
  → If 0 programs: redirect to Plan tab
  → If 1 program: show day picker
  → If N programs: show program picker → day picker
  → User picks a day
  → createWorkoutSession() → Appwrite creates session doc
  → workoutStore.startWorkout({ sessionId, exercises from ProgramDay })
  → router.push('/workout/active')
  → Active workout screen renders exercises with set tracking
  → User completes sets → completeSet() updates store
  → User taps End → capture exercises → endWorkout() → calculate stats
  → completeWorkoutSession() → Appwrite updates session
  → For each completed set: createWorkoutSet() + checkAndUpdatePR()
  → setLastCompleted(session, exercises)
  → router.replace('/workout/summary')
```

### Starting a Freestyle Workout

```
User taps FAB "+" → "Freestyle"
  → router.push('/workout/freestyle')
  → Exercise picker modal opens immediately
  → User adds exercises + configures sets/reps
  → User taps "Start Workout"
  → createWorkoutSession() with programDayName="Freestyle"
  → workoutStore.startWorkout({ exercises built from picker })
  → router.replace('/workout/active')
  → Same active workout flow as strength
```

### Sending a Group Message

```
User types message → taps send
  → Optimistic: add temp message to store ({ $id: 'temp-xxx' })
  → sendGroupMessage() → Appwrite creates document
  → Appwrite Realtime fires 'create' event
  → Subscription callback receives new message
  → Deduplicates (skips if already in state by sender+text match)
  → Message appears instantly for all group members
```

### PR Detection

```
Workout ends → for each completed set:
  → checkAndUpdatePR(userId, exerciseId, exerciseName, weight, reps)
  → calculate1RM = weight × (1 + reps/30)
  → Query existing PR for this user+exercise
  → If new 1RM > existing: update document, return isNewPR=true
  → If no existing: create new PR document
  → Collect all new PRs → setNewPRs() for summary screen display
```

---

## Known Technical Details

### Appwrite Quirks
- String attributes have max sizes — passing longer strings silently truncates or errors
- Unknown fields in `createDocument()` cause 400 errors — must strip extra fields
- `listDocuments()` returns max 100 docs by default — use `Query.limit()` explicitly
- The `exercises` field on `program_days` is a string, not an array — always serialize

### Performance
- Tab screens use `lazy: true` — only mount when first visited
- `ExerciseIcon` and SVG tab icons are wrapped in `React.memo`
- FlatList used for long lists (exercise library, workout history)
- `useMemo` for computed values (strength score, balance chart, filtered exercises)

### Type Safety
- Path alias `@/` maps to project root in tsconfig
- `as unknown as T` pattern for Appwrite document casting
- Zod used in form validation (program creation, registration)
- Expo Router typed routes enabled (`experiments.typedRoutes: true`)
