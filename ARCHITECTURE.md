# Architecture

Deep technical reference for the IronLog codebase. Read this before making changes.

## 1. App Structure — Expo Router

IronLog uses **file-based routing** via Expo Router v4. Every `.tsx` file under `app/` becomes a route.

### Route Groups

```
app/
├── _layout.tsx           → RootLayout (AuthGate wrapper + Stack navigator)
├── profile.tsx           → /profile (modal)
│
├── (auth)/               → Auth group (login/register)
│   ├── _layout.tsx       → Stack navigator
│   ├── login.tsx         → /login
│   └── register.tsx      → /register
│
├── (tabs)/               → Main tab navigator (5 tabs)
│   ├── _layout.tsx       → Bottom tab bar
│   ├── index.tsx         → Home tab (/)
│   ├── progress.tsx      → Stats tab
│   │
│   ├── library/          → Exercise library (nested stack)
│   │   ├── index.tsx     → Library list
│   │   ├── [id].tsx      → Exercise detail (dynamic route)
│   │   └── filters.tsx   → Filter modal (presentation: 'modal')
│   │
│   ├── program/          → Program management (nested stack)
│   │   ├── index.tsx     → Program list + day view
│   │   ├── create.tsx    → Create wizard
│   │   ├── edit-day.tsx  → Day editor
│   │   └── pick-exercise.tsx → Exercise picker (modal)
│   │
│   └── social/           → Groups (nested stack)
│       ├── index.tsx     → Groups list + invitations
│       ├── [groupId].tsx → Group chat (dynamic route)
│       ├── create.tsx    → Create group (slide_from_bottom)
│       └── members.tsx   → Members list + invite
│
├── workout/              → Workout flow (slides up from bottom)
│   ├── _layout.tsx       → Stack navigator
│   ├── active.tsx        → Active workout tracker
│   ├── freestyle.tsx     → Freestyle exercise picker → active
│   ├── cardio.tsx        → Cardio logger
│   ├── summary.tsx       → Post-workout summary
│   └── detail.tsx        → Past workout detail
│
└── stats/                → Stats screens (slides from right)
    ├── _layout.tsx       → Stack navigator
    ├── body.tsx          → Body measurements
    └── photos.tsx        → Progress photos
```

### Navigation Flow

```
Login ──→ Home Tab
              │
              ├── [tap date] ──→ inline day card (no navigation)
              ├── [tap "+"] ──→ Activity Picker Bottom Sheet
              │     ├── Strength ──→ Program/Day Picker ──→ /workout/active
              │     ├── Freestyle ──→ /workout/freestyle ──→ /workout/active
              │     ├── Cardio ──→ /workout/cardio
              │     ├── Body Stat ──→ /stats/body
              │     └── Progress Photo ──→ /stats/photos
              │
              └── /workout/active ──→ /workout/summary ──→ Home

Library Tab ──→ [tap exercise] ──→ /library/[id]
             └── [tap filter] ──→ /library/filters (modal)

Plan Tab ──→ [tap program] ──→ Day view
          ├── [tap "+"] ──→ /program/create ──→ /program/edit-day
          └── [tap "Add Exercise"] ──→ /program/pick-exercise (modal)

Groups Tab ──→ [tap group] ──→ /social/[groupId] (chat)
            ├── [tap "Create"] ──→ /social/create
            └── [tap members icon] ──→ /social/members
```

### Auth Gate

The root `_layout.tsx` wraps everything in an `AuthGate` component:
- If `isAuthenticated === false` and not in `(auth)` group → redirect to login
- If `isAuthenticated === true` and in `(auth)` group → redirect to tabs
- While loading → show ActivityIndicator

---

## 2. State Management — Zustand

All state is managed via Zustand stores in `stores/`. There is **no Redux, no Context** — just plain Zustand stores imported directly into components.

### Store Overview

| Store | File | Purpose |
|-------|------|---------|
| `useAuthStore` | `auth-store.ts` | User auth, profile, skipAuth |
| `useWorkoutStore` | `workout-store.ts` | Active workout state (transient) |
| `useSessionStore` | `session-store.ts` | Completed sessions, PRs, post-workout data |
| `useProgramStore` | `program-store.ts` | Programs, days, builder state |
| `useSocialStore` | `social-store.ts` | Groups, messages, invitations |
| `useFilterStore` | `filter-store.ts` | Exercise library search/filter |
| `useBodyStore` | `body-store.ts` | Body measurements |
| `useCardioStore` | `cardio-store.ts` | Cardio sessions |
| `usePhotoStore` | `photo-store.ts` | Progress photos |

### Auth Store (`auth-store.ts`)

```typescript
interface AuthState {
  user: Models.User | null          // Appwrite user object
  profile: UserProfile | null       // User profile from user_profiles collection
  isLoading: boolean                // True during initialization
  isAuthenticated: boolean          // True if logged in or skipAuth

  initialize: () => Promise<void>   // Check for existing session on app start
  login: (email, password) => Promise<void>
  register: (email, password, name) => Promise<void>
  logout: () => Promise<void>
  skipAuth: () => void              // Creates fake dev user (userId: 'dev')
}
```

**Dev mode:** `skipAuth()` creates a mock user with `$id: 'dev'`. Throughout the codebase, checks like `userId === 'dev' || userId.startsWith('local')` skip Appwrite calls and use local-only state.

### Workout Store (`workout-store.ts`)

**Transient state** — only exists while a workout is in progress. Gets reset when `endWorkout()` is called.

```typescript
interface WorkoutState {
  isActive: boolean                  // Is a workout in progress?
  isPaused: boolean                  // Is the timer paused?
  sessionId: string | null           // Appwrite session document ID
  programDayName: string             // "Push Day A", "Freestyle", etc.
  exercises: ActiveWorkoutExercise[] // The exercises being tracked
  currentExerciseIndex: number       // Which exercise is active
  startTime: number | null           // Date.now() when workout started
  elapsedSeconds: number             // Running timer
  pausedAtSeconds: number            // Where timer was when paused
  restTimerSeconds: number           // Rest timer countdown
  isResting: boolean                 // Is rest timer active?

  startWorkout: (params) => void     // Begin a new workout
  addSet: (exerciseIndex) => void    // Add a new set (copies last set's weight/reps)
  completeSet: (exerciseIndex, setIndex, weight, reps) => void
  nextExercise: () => void
  pauseWorkout: () => void
  resumeWorkout: () => void
  endWorkout: () => { totalVolume, duration }  // Returns stats, resets state
  reset: () => void
}
```

> ⚠️ **Critical:** `endWorkout()` resets ALL state. If you need the exercises data after ending (e.g., for the summary screen), you must capture it **before** calling `endWorkout()`. See `active.tsx` where `completedExercises = [...exercises]` is captured before `endWorkout()`.

### Session Store (`session-store.ts`)

Persists workout history and PRs.

```typescript
interface SessionState {
  recentSessions: WorkoutSession[]          // Last 3 completed
  allSessions: WorkoutSession[]             // All sessions
  personalRecords: PersonalRecord[]         // All PRs
  lastCompletedSession: WorkoutSession | null // Just-finished workout
  lastCompletedExercises: ActiveWorkoutExercise[] // Exercises from just-finished workout
  newPRs: PersonalRecord[]                  // PRs set in last workout

  loadRecent: (userId) => Promise<void>
  loadAll: (userId) => Promise<void>
  loadPRs: (userId) => Promise<void>
  addSession: (session) => void
  setLastCompleted: (session, exercises?) => void  // Called right before endWorkout
  setNewPRs: (prs) => void
  clearCompletionData: () => void
}
```

### Program Store (`program-store.ts`)

The most complex store. Manages both the **active program** (what you see on Home) and the **builder state** (when creating/editing programs).

```typescript
interface ProgramState {
  // Active data
  programs: Program[]                 // All user's programs
  currentProgram: Program | null      // The selected/active program
  days: ProgramDay[]                  // Days of the current program
  activeDayIndex: number

  // Builder state (create/edit flow)
  builderProgram: Partial<Program> | null
  builderDays: ProgramDay[]
  builderActiveDayIndex: number

  // CRUD
  loadPrograms: (userId) => Promise<void>
  loadDays: (programId) => Promise<void>
  createNewProgram: (name, daysPerWeek, totalWeeks, userId, color?) => Promise<void>
  addDay: (name) => Promise<void>
  removeDay: (dayIndex) => Promise<void>
  deleteProgram: (programId) => Promise<void>
  saveBuilderDay: (dayIndex) => Promise<void>    // Saves name + exercises to Appwrite

  // Exercise management
  addExerciseToBuilderDay: (dayIndex, exercise) => void
  removeExerciseFromDay: (dayIndex, exerciseIndex) => void
  reorderExercise: (dayIndex, fromIndex, toIndex) => void
  moveExercise: (dayIndex, fromIndex, direction) => void  // 'up' | 'down'
  swapExercise: (dayIndex, exerciseIndex, newId, newName) => void
  toggleSuperset: (dayIndex, exerciseIndex) => void
  toggleDropSet: (dayIndex, exerciseIndex) => void
  updateExerciseInDay: (dayIndex, exerciseIndex, updates) => void
  updateDayName: (dayIndex, name) => void
}
```

**Dual state pattern:** The store maintains both `days` (active view) and `builderDays` (edit mode). When you modify exercises in the builder, both arrays are updated so changes reflect immediately everywhere.

**Default program:** If no programs exist (new user or dev mode), `loadDefaultProgram()` creates a local Push/Pull/Legs program with 6 days of exercises.

### Social Store (`social-store.ts`)

```typescript
interface SocialState {
  groups: Group[]
  activeGroup: Group | null
  messages: GroupMessage[]
  members: GroupMember[]
  invitations: GroupInvitation[]

  loadGroups: (userId) => Promise<void>
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

---

## 3. Data Flow

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Appwrite   │ ←──→ │  database.ts │ ←──→ │   Zustand    │ ←──→ │   Screen     │
│   Cloud      │      │  (CRUD ops)  │      │   Stores     │      │   (.tsx)     │
└──────────────┘      └──────────────┘      └──────────────┘      └──────────────┘
```

1. **Screen mounts** → calls store action (e.g., `loadPrograms(userId)`)
2. **Store action** → calls `database.ts` function (e.g., `db.listPrograms(userId)`)
3. **database.ts** → calls Appwrite SDK (`databases.listDocuments(...)`)
4. **Response** → store updates state via `set()`
5. **Screen** re-renders via Zustand's reactivity

### Error Handling Pattern

Every store action follows the same pattern:
```typescript
try {
  const data = await db.someOperation(params)
  set({ data })
} catch {
  // Silently fail OR fall back to local data
  // Appwrite errors are caught, not thrown to UI
}
```

**Local fallback:** When Appwrite calls fail (or user is in dev mode), stores create local documents with `$id: 'local-${Date.now()}'`. These work fine for the UI but don't persist across app restarts.

---

## 4. Real-Time Features

### Group Chat (Appwrite Realtime)

`social/[groupId].tsx` subscribes to the `group_messages` collection:

```typescript
const channel = `databases.${DATABASE_ID}.collections.${COLLECTION.GROUP_MESSAGES}.documents`
const unsubscribe = client.subscribe(channel, (response) => {
  if (response.payload.groupId !== groupId) return
  if (events.some(e => e.includes('.create'))) {
    loadMessages(groupId)  // Refresh from server
  }
})
```

**Optimistic updates:** When sending a message, an optimistic `GroupMessage` is added to the store immediately (with `$id: 'optimistic-${Date.now()}'`), before the Appwrite call completes. If the send fails, the optimistic message is removed.

### Group Invitations

`social/index.tsx` subscribes to `group_invitations` for real-time invite notifications, filtering by `invitedUserId`.

---

## 5. Theme System

All design tokens live in `constants/theme.ts`:

```typescript
Colors.dark.background    // '#0f0f0f'
Colors.dark.surface       // 'rgba(255,255,255,0.04)'
Colors.dark.accent        // '#e8ff47'
Colors.dark.text          // '#ffffff'
Colors.dark.textSecondary // '#888888'
Colors.dark.textMuted     // '#555555'
Colors.dark.danger        // '#ff6b6b'
Colors.dark.info          // '#6bc5ff'
Colors.dark.textOnAccent  // '#0a0a0a' (dark text on lime accent)

Spacing.xs  // 4
Spacing.sm  // 6
Spacing.md  // 8
Spacing.lg  // 12
Spacing.xl  // 16
Spacing.xxl // 20

FontSize.xs    // 8
FontSize.sm    // 10
FontSize.base  // 12
FontSize.xl    // 14
FontSize.title // 20
FontSize.hero  // 26

FontWeight.regular  // '400'
FontWeight.semibold // '600'
FontWeight.bold     // '700'

BorderRadius.sm   // 8
BorderRadius.lg   // 12
BorderRadius.pill // 20
BorderRadius.full // 9999
```

**Note:** `Colors.light` is an exact mirror of `Colors.dark` — the app is dark-mode only. Both keys exist so `useThemeColor()` works without errors, but they return the same values.

---

## 6. Key Components

### ExerciseIcon (`components/exercise-icon.tsx`)

~600 lines. Renders a Caliber-style anatomical muscle map SVG.

**Props:** `exerciseName?`, `exerciseId?`, `muscleGroup?`, `size?`, `color?`

**How it works:**
1. Normalizes the exercise name to a lookup key
2. Finds the exercise in `EXERCISE_MUSCLES` map (55 entries)
3. Falls back to: partial name match → muscleGroup prop → generic outline
4. Renders a full body silhouette with 13 SVG muscle group paths
5. Primary muscles: bright color at 85% opacity
6. Secondary muscles: same color at 30% opacity

### StrengthGauges (`components/strength-gauges.tsx`)

Two gauge components:
- **StrengthScoreGauge** — speedometer arc, score number, level badge, delta indicator
- **StrengthBalanceGauge** — horizontal bar chart for push/pull/legs/core balance

Both use raw SVG for rendering (no chart library).

---

## 7. Key Patterns

### Serialization for Appwrite

Appwrite doesn't support nested objects in string attributes. The `exercises` field in `program_days` is stored as a JSON string:

```typescript
// Writing → serialize
const payload = { ...data, exercises: JSON.stringify(data.exercises) }

// Reading → deserialize
const parsed = doc as ProgramDay
if (typeof parsed.exercises === 'string') {
  parsed.exercises = JSON.parse(parsed.exercises)
}
```

This is handled automatically in `database.ts` — don't bypass it.

### ID Prefix Convention

- `local-*` — locally created, not in Appwrite
- `dev` — dev/skipAuth user
- `optimistic-*` — optimistic UI update, pending server confirmation
- Everything else — Appwrite-generated IDs

### Screen ↔ Store Data Capture

The `endWorkout()` call in `workout-store.ts` resets all state. The `active.tsx` screen captures exercises BEFORE calling it:

```typescript
const completedExercises = [...exercises]  // Capture before reset
const { totalVolume, duration } = endWorkout()  // This resets everything
setLastCompleted(completedSession, completedExercises)  // Save for summary
```

This is a critical pattern. Any future code that needs post-workout data must follow this same approach.
