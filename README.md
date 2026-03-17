# IronLog 🏋️

A full-featured workout tracking app built with React Native (Expo) and Appwrite. Dark theme, anatomical muscle maps, real-time group chat, and comprehensive training program management.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React Native | 0.81.5 |
| Platform | Expo (SDK 54) | ~54.0.33 |
| Router | Expo Router | ~6.0.23 |
| Backend | Appwrite (react-native-appwrite) | ^0.20.0 |
| State | Zustand | ^5.0.11 |
| Forms | React Hook Form + Zod | ^7.71.1 / ^4.3.6 |
| SVG | react-native-svg | 15.12.1 |
| Charts | Victory Native | ^41.20.2 |
| Animations | react-native-reanimated | ~4.1.1 |
| Haptics | expo-haptics | ~15.0.8 |
| Gradients | expo-linear-gradient | ~15.0.8 |
| Storage | react-native-mmkv | ^4.1.2 |
| Secure Storage | expo-secure-store | ~15.0.8 |
| TypeScript | ~5.9.2 | |

## Features

### Workout Tracking
- **Strength workouts** — Follow a program day or freestyle (pick your own exercises)
- **Active workout screen** — Track/Overview/History/Notes tabs, per-set weight/reps input, set completion toggles
- **Bottom control bar** — Timer (pause/resume), end workout button
- **Freestyle mode** — Exercise picker → configure sets/reps → launches same active workout screen
- **Cardio logging** — Running, cycling, swimming, walking, rowing, elliptical, HIIT, other
- **Workout summary** — Post-workout review showing exercises performed, volumes, PRs, duration
- **PR detection** — Automatic personal record tracking using Epley 1RM formula

### Program Builder
- **Create programs** — Name, color, days per week
- **Day editor** — Add exercises from 67-exercise library, configure sets/reps/weight
- **Exercise management** — Reorder (move up/down), swap exercises, remove, add
- **Superset support** — Link adjacent exercises into superset groups
- **Drop set tagging** — Mark sets as drop sets
- **Multi-program support** — Create and switch between programs
- **Program picker** — When starting a strength workout: pick program → pick day

### Exercise Library
- **67 exercises** covering 6 muscle groups (Chest, Back, Legs, Shoulders, Arms, Core)
- **Anatomical muscle map icons** — SVG body diagrams highlighting primary/secondary muscles
- **Filterable** — By muscle group, equipment type, difficulty level, text search
- **Detail view** — Instructions, difficulty, equipment, muscle targeting

### Social / Groups
- **Create groups** — Name, description, auto-generated 6-char invite code
- **Join groups** — Via invite code or direct invitation
- **Real-time group chat** — Appwrite Realtime WebSocket subscription (instant messages)
- **Workout sharing** — Share completed workouts to groups
- **Member management** — Admin can remove members, invite users by name search
- **Group invitations** — Send/accept/decline invitations, Groups/Invitations tabs

### Progress Tracking
- **Weekly calendar view** — Dot indicators for workout days, week navigation with month picker
- **Strength Score** — Composite gauge based on compound lift 1RMs (Beginner → Elite)
- **Strength Balance** — Push/Pull/Legs/Core radar chart
- **Personal Records** — Per-exercise PR tracking with 1RM estimates
- **Body stats** — Weight, body fat %, chest/waist/hips/arms/thighs measurements
- **Progress photos** — Front/Side/Back pose categories
- **Workout history** — Full session list with volume/duration/exercise details

### User System
- **Email/password auth** via Appwrite
- **User profiles** — Display name, avatar color, streak count, weekly goal
- **Dev mode** — `skipAuth()` for local development without Appwrite
- **Streak tracking** — Consecutive weeks with workouts

## Project Structure

```
IronLog/
├── app/                          # Expo Router screens (file-based routing)
│   ├── _layout.tsx               # Root layout — AuthGate + Stack navigator
│   ├── profile.tsx               # User profile screen
│   ├── (auth)/                   # Auth group (login/register)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                   # Main tab navigator
│   │   ├── _layout.tsx           # Tab bar config (Home/Library/Plan/Stats/Groups)
│   │   ├── index.tsx             # Home screen (1326 lines — main dashboard)
│   │   ├── progress.tsx          # Stats & progress overview
│   │   ├── library/              # Exercise library
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx         # Exercise list with search/filters
│   │   │   ├── [id].tsx          # Exercise detail
│   │   │   └── filters.tsx       # Filter modal
│   │   ├── program/              # Program builder
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx         # Program overview (754 lines)
│   │   │   ├── create.tsx        # Create new program flow
│   │   │   ├── edit-day.tsx      # Day editor with exercise list
│   │   │   └── pick-exercise.tsx # Exercise picker modal
│   │   └── social/               # Social/Groups
│   │       ├── _layout.tsx
│   │       ├── index.tsx         # Groups list + Invitations tab
│   │       ├── [groupId].tsx     # Group chat (real-time)
│   │       ├── create.tsx        # Create/join group
│   │       └── members.tsx       # Member list + invite users
│   ├── workout/                  # Workout flow (stack screens)
│   │   ├── _layout.tsx
│   │   ├── active.tsx            # Active workout tracker (840 lines)
│   │   ├── freestyle.tsx         # Freestyle exercise picker
│   │   ├── summary.tsx           # Post-workout summary
│   │   ├── detail.tsx            # Past workout detail view
│   │   └── cardio.tsx            # Cardio session logger
│   └── stats/                    # Extended stats screens
│       ├── _layout.tsx
│       ├── body.tsx              # Body measurements
│       └── photos.tsx            # Progress photos
├── stores/                       # Zustand state management
│   ├── auth-store.ts             # Auth state + user profile
│   ├── workout-store.ts          # Active workout state
│   ├── program-store.ts          # Programs + builder state
│   ├── session-store.ts          # Workout history + PRs
│   ├── social-store.ts           # Groups, messages, invitations
│   ├── body-store.ts             # Body measurements
│   ├── cardio-store.ts           # Cardio sessions
│   ├── filter-store.ts           # Exercise library filters
│   └── photo-store.ts            # Progress photos
├── lib/                          # Core utilities
│   ├── appwrite.ts               # Appwrite client, DATABASE_ID, COLLECTION constants
│   ├── auth.ts                   # Auth functions (login, register, logout)
│   ├── database.ts               # All Appwrite CRUD operations (~40 functions)
│   └── utils.ts                  # Pure helpers (1RM calc, formatting, date utils)
├── types/                        # TypeScript interfaces
│   ├── exercise.ts               # Exercise, MuscleGroup, Equipment, Difficulty
│   ├── program.ts                # Program, ProgramDay, ProgramExercise, ProgramSet
│   ├── workout.ts                # WorkoutSession, WorkoutSet, ActiveWorkoutExercise/Set
│   ├── social.ts                 # Group, GroupMember, GroupMessage, GroupInvitation, etc.
│   ├── user.ts                   # UserProfile, PersonalRecord, BodyStat, CardioSession, ProgressPhoto
│   └── index.ts                  # Barrel re-exports
├── constants/
│   ├── theme.ts                  # Colors, Spacing, BorderRadius, FontSize, FontWeight, Fonts
│   └── exercises.ts              # SEED_EXERCISES constant (35 exercises with full metadata)
├── components/
│   ├── exercise-icon.tsx          # Anatomical SVG muscle map component
│   ├── strength-gauges.tsx        # StrengthScoreGauge + StrengthBalanceGauge SVGs
│   ├── haptic-tab.tsx             # Tab button with haptic feedback
│   └── ui/                        # Generic UI primitives
│       ├── button.tsx
│       ├── card.tsx
│       ├── chip.tsx
│       ├── collapsible.tsx
│       ├── input.tsx
│       └── icon-symbol.tsx
├── .env.example                   # Required env vars template
├── app.json                       # Expo config (bundle ID, splash screen, etc.)
├── package.json                   # Dependencies
└── tsconfig.json                  # TypeScript config with @/ path alias
```

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI (`npx expo`)
- An Appwrite instance (Cloud or self-hosted)
- iOS Simulator / Android Emulator / Physical device with Expo Go

### 1. Clone and Install

```bash
git clone <repo-url>
cd IronLog
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://your-instance.cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
```

### 3. Set Up Appwrite Backend

Create a database in your Appwrite project, then create all 15 collections listed below.

### 4. Run

```bash
npx expo start
```

Press `i` for iOS, `a` for Android, or scan QR with Expo Go.

### Dev Mode

The app has a `skipAuth()` function in the auth store that creates a fake "dev" user. This bypasses Appwrite entirely for UI development. Local IDs are prefixed with `local-`.

---

## Appwrite Backend

### Database

- **Database ID:** `698dd75900395a2e605e`
- **Endpoint:** Set via `EXPO_PUBLIC_APPWRITE_ENDPOINT`
- **Project ID:** Set via `EXPO_PUBLIC_APPWRITE_PROJECT_ID`

### Collections (15)

All collections use the constant names from `lib/appwrite.ts → COLLECTION`.

---

#### `exercises`
Exercise library. Can be populated from `SEED_EXERCISES` in `constants/exercises.ts`.

| Field | Type | Notes |
|-------|------|-------|
| name | string (100) | Exercise name |
| muscleGroup | string (50) | Primary: Chest, Back, Legs, Shoulders, Arms, Core |
| secondaryMuscles | string[] (100 each) | Array of secondary muscle names |
| equipment | string (50) | Barbell, Dumbbell, Cable, Machine, Bodyweight, Bands |
| difficulty | string (50) | Beginner, Intermediate, Advanced |
| icon | string (10) | Legacy emoji, replaced by ExerciseIcon SVG |
| instructions | string (2000) | Step-by-step guide |

---

#### `programs`
User-created workout programs.

| Field | Type | Notes |
|-------|------|-------|
| userId | string (50) | Owner |
| name | string (100) | Program name |
| daysPerWeek | integer | 1–7 |
| currentWeek | integer | Current cycle week |
| totalWeeks | integer | 0 = indefinite |
| color | string (20) | Hex color for UI |

---

#### `program_days`
Individual days within a program.

| Field | Type | Notes |
|-------|------|-------|
| programId | string (50) | Parent program |
| userId | string (50) | Owner |
| name | string (100) | Day name (e.g., "Push A") |
| order | integer | Display order (0-indexed) |
| exercises | string (50000) | ⚠️ **JSON string** of `ProgramExercise[]` — serialized/deserialized by database.ts |

---

#### `workout_sessions`
Completed or in-progress workout sessions.

| Field | Type | Notes |
|-------|------|-------|
| userId | string (50) | User |
| programDayId | string (50) | Which program day |
| programDayName | string (100) | Day name (denormalized) |
| startedAt | string (50) | ISO timestamp |
| completedAt | string (50) | ISO timestamp, null if in-progress |
| totalVolume | integer | Sum of weight × reps |
| duration | integer | Seconds |
| notes | string (2000) | User notes |

---

#### `workout_sets`
Individual sets within a session.

| Field | Type | Notes |
|-------|------|-------|
| sessionId | string (50) | Parent session |
| userId | string (50) | User |
| exerciseId | string (50) | Exercise reference |
| setNumber | integer | 1-indexed within exercise |
| weight | float | Weight in lbs |
| reps | integer | Reps completed |
| isCompleted | boolean | Whether fully completed |
| rpe | float | Rate of Perceived Exertion (1–10), optional |

---

#### `personal_records`
Per-exercise best lifts. One record per user per exercise — updated when beaten.

| Field | Type | Notes |
|-------|------|-------|
| userId | string (50) | User |
| exerciseId | string (50) | Exercise |
| exerciseName | string (100) | Denormalized name |
| weight | float | PR weight |
| reps | integer | PR reps |
| estimated1RM | float | Epley formula: weight × (1 + reps/30) |
| achievedAt | string (50) | ISO timestamp |

---

#### `user_profiles`
One profile per user, created during registration.

| Field | Type | Notes |
|-------|------|-------|
| userId | string (50) | Appwrite Auth user ID |
| displayName | string (100) | Display name |
| avatarColor | string (20) | Hex color for avatar circle |
| streakCount | integer | Consecutive workout weeks |
| lastWorkoutDate | string (50) | ISO timestamp, nullable |
| weeklyGoal | integer | Target days per week |

**Indexes:** Fulltext on `displayName` (for user search in invitations)

---

#### `social_posts`
Global social feed (less used than group chat).

| Field | Type | Notes |
|-------|------|-------|
| userId | string (50) | Author |
| userName | string (100) | Author name |
| avatarColor | string (20) | Author avatar color |
| sessionId | string (50) | Related workout, nullable |
| text | string (2000) | Post content |
| stats | string (2000) | Workout stats summary |
| isPR | boolean | PR celebration post |
| likes | integer | Like count |
| likedBy | string[] (50 each) | Array of user IDs |

---

#### `groups`
Social groups.

| Field | Type | Notes |
|-------|------|-------|
| name | string (100) | Group name |
| description | string (500) | Optional description |
| createdBy | string (50) | Creator user ID |
| avatarColor | string (20) | Group color |
| memberCount | integer | Denormalized count |
| inviteCode | string (10) | 6-char alphanumeric code |

---

#### `group_members`
Group membership records.

| Field | Type | Notes |
|-------|------|-------|
| groupId | string (50) | Group |
| userId | string (50) | Member |
| displayName | string (100) | Denormalized name |
| avatarColor | string (20) | Denormalized color |
| role | string (20) | `admin` or `member` |
| joinedAt | string (50) | ISO timestamp |

---

#### `group_messages`
Group chat messages. **Real-time delivery** via Appwrite Realtime subscription.

| Field | Type | Notes |
|-------|------|-------|
| groupId | string (50) | Group |
| userId | string (50) | Sender |
| userName | string (100) | Sender name |
| avatarColor | string (20) | Sender color |
| text | string (5000) | Message content |
| type | string (20) | `message` or `workout_share` |
| workoutData | string (5000) | JSON `WorkoutShareData`, nullable |

---

#### `group_invitations`
Invitation system for groups.

| Field | Type | Notes |
|-------|------|-------|
| groupId | string (50) | Target group |
| groupName | string (100) | Denormalized |
| groupColor | string (20) | Denormalized |
| invitedBy | string (50) | Inviter user ID |
| inviterName | string (100) | Inviter name |
| invitedUserId | string (50) | Invitee user ID |
| status | string (20) | `pending`, `accepted`, `declined` |

---

#### `body_stats`
Body measurement records.

| Field | Type | Notes |
|-------|------|-------|
| userId | string (50) | User |
| bodyWeight | float | Nullable |
| bodyFat | float | Percentage, nullable |
| chest | float | Nullable |
| waist | float | Nullable |
| hips | float | Nullable |
| arms | float | Nullable |
| thighs | float | Nullable |
| unit | string (10) | `lbs`/`in` or `kg`/`cm` |
| recordedAt | string (50) | ISO timestamp |
| notes | string (1000) | Nullable |

---

#### `cardio_sessions`
Cardio activity logs.

| Field | Type | Notes |
|-------|------|-------|
| userId | string (50) | User |
| type | string (50) | Running, Cycling, Swimming, Walking, Rowing, Elliptical, HIIT, Other |
| durationMinutes | integer | Duration |
| distance | float | Nullable |
| distanceUnit | string (10) | `mi` or `km` |
| calories | integer | Nullable |
| avgHeartRate | integer | Nullable |
| startedAt | string (50) | ISO timestamp |
| notes | string (1000) | Nullable |

---

#### `progress_photos`
Progress photo entries.

| Field | Type | Notes |
|-------|------|-------|
| userId | string (50) | User |
| photoUrl | string (500) | Photo URI |
| pose | string (20) | Front, Side, Back |
| bodyWeight | float | Nullable |
| takenAt | string (50) | ISO timestamp |
| notes | string (1000) | Nullable |

---

### Storage Buckets

| Bucket | ID | Purpose |
|--------|-----|---------|
| Progress Photos | `progress_photos` | Stores uploaded progress photos |

---

## Design System

The app uses a **dark-only theme** (light mode has identical values).

### Colors (`constants/theme.ts`)

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#0f0f0f` | Screen backgrounds |
| `surface` | `rgba(255,255,255,0.04)` | Card backgrounds |
| `surfaceLight` | `rgba(255,255,255,0.06)` | Slightly elevated surfaces |
| `accent` | `#e8ff47` | Primary accent (neon yellow-green) |
| `accentDark` | `#a8e000` | Darker accent variant |
| `accentGreen` | `#7fff00` | Secondary green accent |
| `text` | `#ffffff` | Primary text |
| `textSecondary` | `#888888` | Secondary text |
| `textMuted` | `#555555` | Muted/disabled text |
| `danger` | `#ff6b6b` | Error/destructive actions |
| `info` | `#6bc5ff` | Informational elements |
| `border` | `rgba(255,255,255,0.06)` | Subtle borders |

### Muscle Group Colors

| Group | Color |
|-------|-------|
| Chest | `#ff6b6b` (red) |
| Back | `#6bc5ff` (blue) |
| Legs | `#7fff00` (green) |
| Shoulders | `#ffaa47` (orange) |
| Arms | `#e8ff47` (yellow) |
| Core | `#c77dff` (purple) |

### Spacing Scale

`xs: 4, sm: 6, md: 8, lg: 12, xl: 16, xxl: 20, xxxl: 24, xxxxl: 32`

### Font Sizes

`xs: 8, sm: 10, md: 11, base: 12, lg: 13, xl: 14, xxl: 16, title: 20, hero: 26`

### Border Radius

`sm: 8, md: 10, lg: 12, xl: 14, xxl: 16, pill: 20, full: 9999`

---

## App Configuration

```json
{
  "name": "IronLog",
  "slug": "IronLog",
  "scheme": "ironlog",
  "bundleIdentifier": "com.aman.ironlogapp",
  "orientation": "portrait",
  "newArchEnabled": true,
  "experiments": {
    "typedRoutes": true,
    "reactCompiler": true
  }
}
```

## License

Private project.
