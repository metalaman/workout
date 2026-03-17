# 🏋️ IronLog — Workout Tracker

A feature-rich workout tracking app built with React Native (Expo) and Appwrite. Inspired by [Caliber](https://caliberstrong.com/) — dark theme, anatomical exercise illustrations, strength scoring, and group-based social features.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React Native (Expo) | SDK 54 |
| Language | TypeScript | ~5.9.2 |
| Routing | Expo Router (file-based) | v4 |
| State | Zustand | 5.x |
| Backend | Appwrite (Cloud) | — |
| Styling | NativeWind (Tailwind) + StyleSheet | 4.x |
| Charts | Victory Native | — |
| Animations | react-native-reanimated | — |
| Gestures | react-native-gesture-handler | — |
| SVG | react-native-svg | — |
| Forms | react-hook-form + zod | — |

## Quick Start

### Prerequisites
- Node.js ≥ 18
- Expo CLI (`npx expo`)
- iOS Simulator / Android Emulator / Expo Go

### Setup

```bash
# Clone
git clone git@github.com:metalaman/workout.git
cd workout/IronLog

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Appwrite credentials (see below)

# Start dev server
npx expo start
```

### Environment Variables

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=698d5a490007a7ec0e2e
```

### Dev Mode (Skip Auth)

On the login screen, tap **"Skip"** to use the app without an Appwrite account. This creates a local user (`userId: 'dev'`) with a default Push/Pull/Legs program. Data is stored in-memory only and won't persist across app restarts.

---

## Appwrite Backend

- **Endpoint:** `https://nyc.cloud.appwrite.io/v1`
- **Project ID:** `698d5a490007a7ec0e2e`
- **Database ID:** `698dd75900395a2e605e`

### Collections (15 total)

| Collection ID | Purpose | Key Attributes |
|--------------|---------|----------------|
| `exercises` | Exercise library | `name` (str), `muscleGroup` (str), `secondaryMuscles` (str[]), `equipment` (str), `difficulty` (str), `icon` (str), `instructions` (str) |
| `programs` | Workout programs | `userId` (str), `name` (str), `daysPerWeek` (int), `currentWeek` (int), `totalWeeks` (int), `color` (str) |
| `program_days` | Days within a program | `programId` (str), `userId` (str), `name` (str), `order` (int), `exercises` (str — **JSON-serialized** `ProgramExercise[]`) |
| `workout_sessions` | Completed/in-progress workouts | `userId` (str), `programDayId` (str), `programDayName` (str), `startedAt` (str), `completedAt` (str), `totalVolume` (float), `duration` (int), `notes` (str) |
| `workout_sets` | Individual sets within a session | `sessionId` (str), `userId` (str), `exerciseId` (str), `setNumber` (int), `weight` (float), `reps` (int), `isCompleted` (bool), `rpe` (float) |
| `personal_records` | Per-exercise PRs | `userId` (str), `exerciseId` (str), `exerciseName` (str), `weight` (float), `reps` (int), `estimated1RM` (float), `achievedAt` (str) |
| `social_posts` | Global social feed posts | `userId` (str), `userName` (str), `avatarColor` (str), `sessionId` (str), `text` (str), `stats` (str), `isPR` (bool), `likes` (int), `likedBy` (str[]) |
| `user_profiles` | User display info & streaks | `userId` (str), `displayName` (str), `avatarColor` (str), `streakCount` (int), `lastWorkoutDate` (str), `weeklyGoal` (int) |
| `groups` | Social groups | `name` (str), `description` (str), `createdBy` (str), `avatarColor` (str), `memberCount` (int), `inviteCode` (str) |
| `group_members` | Group membership | `groupId` (str), `userId` (str), `displayName` (str), `avatarColor` (str), `role` (str: admin/member), `joinedAt` (str) |
| `group_messages` | Group chat messages | `groupId` (str), `userId` (str), `userName` (str), `avatarColor` (str), `text` (str), `type` (str: message/workout_share), `workoutData` (str) |
| `group_invitations` | Pending group invites | `groupId` (str), `groupName` (str), `groupColor` (str), `invitedBy` (str), `inviterName` (str), `invitedUserId` (str), `status` (str: pending/accepted/declined) |
| `body_stats` | Body measurements | `userId` (str), `bodyWeight` (float), `bodyFat` (float), `chest`/`waist`/`hips`/`arms`/`thighs` (float), `unit` (str), `recordedAt` (str), `notes` (str) |
| `cardio_sessions` | Cardio activity logs | `userId` (str), `type` (str), `durationMinutes` (int), `distance` (float), `distanceUnit` (str), `calories` (int), `avgHeartRate` (int), `startedAt` (str), `notes` (str) |
| `progress_photos` | Progress photo tracking | `userId` (str), `photoUrl` (str), `pose` (str: Front/Side/Back), `bodyWeight` (float), `takenAt` (str), `notes` (str) |

> ⚠️ **Important:** `program_days.exercises` is stored as a **JSON string** in Appwrite (not an array). The `database.ts` layer handles serialization/deserialization automatically. If you write to this field directly, you must `JSON.stringify()` the exercises array.

### Indexes

Key indexes configured:
- `programs`: `by_user` (userId)
- `program_days`: `by_program` (programId), `by_user` (userId)
- `workout_sessions`: `by_user` (userId), `by_date` (userId + startedAt)
- `workout_sets`: `by_session` (sessionId), `by_exercise` (userId + exerciseId)
- `personal_records`: `by_user` (userId), `by_exercise` (userId + exerciseId)
- `user_profiles`: `by_user` (userId), `search_name` (fulltext on displayName)
- `group_invitations`: `by_invitee` (invitedUserId + status), `by_group` (groupId + status)

---

## Directory Structure

```
IronLog/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # Root layout (AuthGate + Stack)
│   ├── profile.tsx               # User profile screen
│   │
│   ├── (auth)/                   # Auth group (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   │
│   ├── (tabs)/                   # Main tab navigator
│   │   ├── _layout.tsx           # Tab bar (Home, Library, Plan, Stats, Groups)
│   │   ├── index.tsx             # Home screen
│   │   ├── progress.tsx          # Progress/stats screen
│   │   │
│   │   ├── library/              # Exercise library
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx         # Browse exercises
│   │   │   ├── [id].tsx          # Exercise detail
│   │   │   └── filters.tsx       # Filter modal
│   │   │
│   │   ├── program/              # Program management
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx         # Program list + day view
│   │   │   ├── create.tsx        # Create program wizard
│   │   │   ├── edit-day.tsx      # Edit day (add exercises, config sets)
│   │   │   └── pick-exercise.tsx # Exercise picker modal
│   │   │
│   │   └── social/               # Groups & social
│   │       ├── _layout.tsx
│   │       ├── index.tsx         # Groups list + invitations tabs
│   │       ├── [groupId].tsx     # Group chat
│   │       ├── create.tsx        # Create group
│   │       └── members.tsx       # Group members + invite
│   │
│   ├── workout/                  # Workout flow (modal stack)
│   │   ├── _layout.tsx
│   │   ├── active.tsx            # Active workout tracker
│   │   ├── freestyle.tsx         # Freestyle workout (pick exercises → active)
│   │   ├── cardio.tsx            # Cardio logging
│   │   ├── summary.tsx           # Post-workout summary
│   │   └── detail.tsx            # Past workout detail
│   │
│   └── stats/                    # Stats screens (modal stack)
│       ├── _layout.tsx
│       ├── body.tsx              # Body measurements
│       └── photos.tsx            # Progress photos
│
├── components/                   # Shared components
│   ├── exercise-icon.tsx         # Anatomical muscle map SVG (600+ lines)
│   ├── strength-gauges.tsx       # Strength Score + Balance gauges
│   ├── haptic-tab.tsx            # Tab bar button with haptic feedback
│   └── ui/                       # Generic UI primitives
│       ├── button.tsx
│       ├── card.tsx
│       ├── chip.tsx
│       ├── collapsible.tsx
│       └── input.tsx
│
├── constants/
│   ├── theme.ts                  # Colors, Spacing, FontSize, FontWeight, etc.
│   └── exercises.ts              # Seed exercise library (35 exercises)
│
├── hooks/
│   ├── use-color-scheme.ts
│   ├── use-color-scheme.web.ts
│   └── use-theme-color.ts
│
├── lib/                          # Core business logic
│   ├── appwrite.ts               # Appwrite client + collection constants
│   ├── auth.ts                   # Auth functions (login, register, logout)
│   ├── database.ts               # All Appwrite CRUD operations (600+ lines)
│   └── utils.ts                  # Utility functions (1RM, formatting, etc.)
│
├── stores/                       # Zustand state stores
│   ├── auth-store.ts             # User authentication state
│   ├── workout-store.ts          # Active workout state (in-progress)
│   ├── session-store.ts          # Completed sessions + PRs
│   ├── program-store.ts          # Programs + days + builder
│   ├── social-store.ts           # Groups, messages, invitations
│   ├── filter-store.ts           # Exercise library filters
│   ├── body-store.ts             # Body measurements
│   ├── cardio-store.ts           # Cardio sessions
│   └── photo-store.ts            # Progress photos
│
├── types/                        # TypeScript interfaces
│   ├── index.ts                  # Barrel export
│   ├── exercise.ts               # Exercise, ExerciseFilters, MuscleGroup, etc.
│   ├── program.ts                # Program, ProgramDay, ProgramExercise, ProgramSet
│   ├── workout.ts                # WorkoutSession, WorkoutSet, ActiveWorkoutExercise
│   ├── social.ts                 # Group, GroupMember, GroupMessage, GroupInvitation
│   └── user.ts                   # UserProfile, PersonalRecord, BodyStat, CardioSession, ProgressPhoto
│
├── app.json                      # Expo config
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

---

## Features

### 🏠 Home Screen
- **Strength Score gauge** — aggregate 1RM-based score with level badge (Beginner → Elite)
- **Strength Balance gauge** — push/pull/legs/core balance visualization
- **Weekly calendar** — colored checkmarks for completed days, browsable with ← → chevrons
- **Month calendar picker** — tap 📅 icon to jump to any date
- **Inline day detail** — tap a date to see workout summary or today's plan
- **Recent workouts** — shows actual program days with ExerciseIcon + exercise count
- **"+" FAB** — opens activity type picker (Strength, Freestyle, Cardio, Body Stat, Progress Photo)
- **Program/day picker** — strength workout prompts for program + day selection

### 💪 Active Workout
- **Tab bar** — Track, Overview, History, Notes
- **Exercise cards** — set/rep/weight inputs with "Last:" hints from previous sessions
- **1RM badge** — shows % of 1RM after completing a set
- **+ Add Set** — appends a new set with previous set's weight/reps
- **Complete Exercise** — advances to next exercise
- **Rest timer** — auto-starts between sets
- **Bottom control bar** — X (end), elapsed timer, ⏸ (pause/resume)
- **Superset support** — alternating exercises in a superset group
- **Drop set support** — visual badges on drop set exercises

### 📋 Programs
- **Program list** — "My Programs" cards with color dots, tap to open
- **"+" FAB** — create new program (Name & Color → Days per week)
- **Day builder** — add exercises, configure sets/weight/reps
- **Superset toggle** — links exercises together
- **Drop set toggle** — marks exercises for drop sets
- **Drag to reorder** — ≡ handle on exercise cards
- **Swap exercise** — replace exercise while keeping set config
- **↑↓ arrows** — move exercises up/down
- **Color picker** — 8 preset colors for program identification
- **Caliber-style UI** — tab bar (Exercises | Overview | Notes), exercise cards with ExerciseIcon

### 🎯 Freestyle Workout
- Two-phase flow: pick exercises → launch real active workout screen
- Exercise picker with search + muscle group filters
- Set/rep stepper per exercise before starting

### 📊 Progress
- **1RM cards** — hero display per exercise with trend history
- **Personal records** — full PR list
- **Weekly volume** chart
- **Session history**

### 👥 Social (Groups)
- **Groups tab** — list of joined groups with last message preview
- **Invitations tab** — pending invites with Accept/Decline, red badge count
- **Group chat** — real-time messaging via Appwrite Realtime (WebSocket)
- **Workout sharing** — share completed workouts to selected groups
- **Create group** — name, description, color picker, auto-generates invite code
- **Members screen** — list with roles, invite code copy, user search + invite button
- **Join by code** — enter invite code to join a group

### 🏃 Cardio
- 8 activity types (Running, Cycling, Swimming, etc.)
- Duration timer (manual or live), distance, calories, heart rate

### 📏 Body Stats
- Weight, body fat %, 5 measurements, unit toggles
- Trend chart + history

### 📸 Progress Photos
- Grid gallery with pose filter (Front/Side/Back)
- Side-by-side comparison

---

## Design System

### Theme
- **Mode:** Dark only (light theme mirrors dark values)
- **Background:** `#0f0f0f`
- **Surface:** `rgba(255,255,255,0.04)`
- **Accent:** `#e8ff47` (lime green)
- **Text:** `#ffffff` (primary), `#888888` (secondary), `#555555` (muted)
- **Danger:** `#ff6b6b`
- **Info:** `#6bc5ff`

### Exercise Icons
Caliber-style anatomical muscle maps — full human body silhouette (front view) with muscle groups highlighted:
- **Primary muscles:** bright red, 85% opacity
- **Secondary muscles:** lighter red, 30% opacity
- 13 muscle group SVG paths: chest, back, lats, shoulders, traps, biceps, triceps, forearms, core, quads, hamstrings, glutes, calves
- All 55 exercises mapped to specific muscle groups

### Muscle Group Colors
| Group | Color |
|-------|-------|
| Chest | `#ff6b6b` |
| Back | `#6bc5ff` |
| Legs | `#7fff00` |
| Shoulders | `#ffaa47` |
| Arms | `#e8ff47` |
| Core | `#c77dff` |

---

## Commit History

| Commit | Description |
|--------|-------------|
| `9743f13` | Show exercises in workout summary + edit mode + group invitations |
| `d44e2ae` | Group invitations with tabs and user search |
| `2c4c435` | Real-time group chat via Appwrite Realtime |
| `9cef0ac` | Clean up unused weeks styles |
| `d61855f` | Freestyle → exercise picker + real active workout |
| `4d9f140` | Fix program day names not saving |
| `ab36144` | Fix Add Set button |
| `49213e5` | Bottom workout control bar (pause/resume/end) |
| `3bb92d9` | Inline day detail card on date tap |
| `d845666` | Calendar modal opacity fix |
| `5948f15` | Week navigator + month calendar picker |
| `df0f646` | Fix color attribute in Appwrite |
| `d385c88` | Fix Appwrite persistence |
| `3dac67e` | Fix program creation, clickable week/recent items |
| `f65dbe2` | Clickable week view + recent workouts |
| `ef83dab` | Draggable exercises, program list + FAB, color picker |
| `77b6b02` | Skip Appwrite for dev users |
| `77b95ba` | Anatomical muscle map exercise illustrations |
| `0f64cb0` | Caliber-inspired program + workout UI redesign |
| `542c606` | Strength score/balance, weekly calendar, activity picker, freestyle, cardio, body stats, photos |
| `4fd1307` | Program builder, superset/dropset, reorder/swap, 1RM tracking |
| `78acaa9` | Groups-based social with messaging |
| `50e8603` | Database ID fix + .env.example |
| `2e537c8` | Appwrite backend wiring, all screens, navigation |
| `e9eadb7` | Initial scaffold |

---

## License

Private — not open source.
