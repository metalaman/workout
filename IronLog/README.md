# IronLog — Workout Tracker

A mobile-first workout tracking app built with React Native (Expo 54), TypeScript, and Appwrite.

## Tech Stack

- **Framework:** React Native + Expo SDK 54
- **Language:** TypeScript
- **Styling:** NativeWind + custom theme tokens
- **State:** Zustand (10 stores)
- **Backend:** Appwrite Cloud (NYC region)
- **Charts:** Victory Native
- **Navigation:** Expo Router v6 (file-based)

## Quick Start

```bash
cd IronLog
npm install
cp .env.example .env  # Add your Appwrite credentials
npx expo start
```

Scan the QR code with Expo Go on your phone. For remote access (off-network), use `npx expo start --tunnel`.

## Project Structure

```
IronLog/
├── app/                    # Screens (file-based routing)
│   ├── (auth)/             # Login, register
│   ├── (tabs)/             # Tab navigator (Home, Plans, Nutrition, Groups, Profile)
│   │   ├── index.tsx       # Home dashboard
│   │   ├── program/        # Program builder
│   │   ├── nutrition/      # Nutrition tracking
│   │   ├── social/         # Group chat + invitations
│   │   ├── library/        # Exercise library
│   │   └── profile/        # Profile + settings
│   ├── workout/            # Active workout, freestyle, summary, detail
│   └── stats/              # Body stats, progress photos
├── components/
│   ├── home/               # Home screen sub-components (MetricsCard, etc.)
│   ├── nutrition/          # Nutrition-specific components
│   ├── ui/                 # Shared primitives (LoadingScreen, EmptyState, SectionHeader)
│   ├── exercise-icon.tsx   # Anatomical SVG muscle diagrams
│   └── strength-gauges.tsx # Arc gauge + balance chart
├── lib/
│   ├── appwrite.ts         # Appwrite client + collection IDs
│   ├── auth.ts             # Auth helpers
│   ├── db/                 # Database operations (modularized)
│   │   ├── programs.ts     # Program & day CRUD
│   │   ├── workouts.ts     # Session & set CRUD
│   │   ├── records.ts      # Personal records
│   │   ├── social.ts       # Groups, messages, invitations
│   │   ├── profile.ts      # User profile & streak
│   │   ├── body.ts         # Body stats, cardio, photos
│   │   ├── nutrition.ts    # Nutrition profiles & food logs
│   │   ├── exercises.ts    # Custom exercise CRUD
│   │   └── index.ts        # Barrel re-export
│   ├── database.ts         # Backward-compat barrel (re-exports from db/)
│   ├── utils.ts            # Shared utilities (formatting, calculations)
│   └── nutrition-utils.ts  # Nutrition-specific helpers
├── stores/                 # Zustand state stores
│   ├── auth-store.ts
│   ├── workout-store.ts
│   ├── program-store.ts
│   ├── session-store.ts
│   ├── social-store.ts
│   ├── nutrition-store.ts
│   ├── body-store.ts
│   ├── cardio-store.ts
│   ├── photo-store.ts
│   ├── filter-store.ts
│   └── index.ts            # Barrel re-export
├── constants/
│   ├── theme.ts            # Colors, fonts, spacing, radii
│   ├── exercises.ts        # Stock exercise database
│   └── food-database.ts    # Food nutrition data
└── types/                  # TypeScript interfaces
```

## Appwrite Collections (15)

| Collection | Purpose |
|---|---|
| exercises | Stock + custom exercises |
| programs | User training programs |
| program_days | Days within programs (exercises stored as JSON string) |
| workout_sessions | Completed workout metadata |
| workout_sets | Individual sets (weight, reps, exercise) |
| personal_records | PR tracking per exercise |
| social_posts | Shared workout posts |
| user_profiles | Display name, avatar, streak |
| groups | Social groups |
| group_members | Group membership |
| group_messages | Real-time chat messages (Appwrite Realtime WebSocket) |
| group_invitations | Group invite system |
| body_stats | Weight, body fat, measurements |
| cardio_sessions | Cardio workout logs |
| progress_photos | Progress photo references |

## Key Features

- **Program Builder** — create multi-day programs with exercises, supersets, dropsets
- **Active Workout** — real-time set tracking with weight/reps, rest timer, 1RM % badge
- **Freestyle Mode** — pick exercises ad-hoc, hands off to active workout screen
- **Nutrition Tracking** — food logging, calorie/macro targets, onboarding wizard
- **Group Chat** — real-time messaging (Appwrite Realtime), image uploads, GIF search (Tenor), fitness stickers
- **Exercise Library** — 67+ exercises with anatomical SVG muscle diagrams, custom exercise creation
- **Strength Metrics** — composite score gauge, push/pull/legs/core balance chart
- **PR Tracking** — automatic personal record detection on workout completion

## Docs

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Deep technical reference (routing, stores, data flow, real-time, auth)
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Developer guide (code conventions, how-to recipes, pitfalls)

## Dev Account

For testing: `hatch-bot@test.com` / `TestPass123!`
