# Contributing to IronLog

Guide for developers working on this codebase. Read this before making changes.

## Code Conventions

### General

- **TypeScript everywhere** — no `.js` files, strict types preferred
- **Functional components** — no class components
- **Zustand for state** — no React Context, no Redux
- **Appwrite as backend** — no REST APIs, no Firebase
- **File-based routing** — Expo Router, not React Navigation directly
- **Imports use `@/`** — path alias for project root (e.g., `@/stores/auth-store`)
- **`as const`** — theme tokens, collection IDs use `as const` for literal types

### Naming

- Files: `kebab-case.ts` / `kebab-case.tsx`
- Components: `PascalCase` (function name), `kebab-case` (file name)
- Stores: `use<Name>Store` (e.g., `useWorkoutStore`)
- Types: `PascalCase` interfaces (e.g., `WorkoutSession`)
- Database functions: `verbNoun` (e.g., `createProgram`, `listProgramDays`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `DATABASE_ID`, `SEED_EXERCISES`)

### Styling

- **StyleSheet.create()** for all styles — no inline style objects
- **Theme tokens** — always use `Colors.dark.*`, `Spacing.*`, `FontSize.*`, etc. from `constants/theme.ts`
- **No Tailwind/NativeWind in screens** — despite being installed, screens use StyleSheet exclusively
- **Dark mode only** — `Colors.light` and `Colors.dark` are identical

### State Management

- One Zustand store per domain
- Stores don't import other stores — screens coordinate
- Async actions call `database.ts` functions, never Appwrite directly
- Optimistic updates: update local state immediately, then sync to Appwrite
- Fallback to `local-*` IDs when Appwrite fails

---

## How to Add a New Screen

1. **Create the file** in the appropriate `app/` directory:
   - Tab screen: `app/(tabs)/my-screen.tsx`
   - Stack screen within a tab: `app/(tabs)/my-section/my-screen.tsx`
   - Modal/standalone: `app/my-screen.tsx`

2. **Add a layout** if creating a new group:
   ```typescript
   // app/(tabs)/my-section/_layout.tsx
   import { Stack } from 'expo-router'
   import { Colors } from '@/constants/theme'

   export default function MyLayout() {
     return (
       <Stack screenOptions={{
         headerShown: false,
         contentStyle: { backgroundColor: Colors.dark.background }
       }}>
         <Stack.Screen name="index" />
       </Stack>
     )
   }
   ```

3. **Register in parent layout** if it's a new tab:
   ```typescript
   // app/(tabs)/_layout.tsx
   <Tabs.Screen
     name="my-section"
     options={{
       lazy: true,
       tabBarIcon: ({ focused }) => <TabIcon icon={<MyIcon />} label="My Tab" focused={focused} />,
     }}
   />
   ```

4. **Screen template:**
   ```typescript
   import { View, Text, StyleSheet } from 'react-native'
   import { SafeAreaView } from 'react-native-safe-area-context'
   import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme'

   export default function MyScreen() {
     return (
       <SafeAreaView style={styles.container}>
         <Text style={styles.title}>My Screen</Text>
       </SafeAreaView>
     )
   }

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: Colors.dark.background,
       paddingHorizontal: Spacing.xxl,
     },
     title: {
       color: Colors.dark.text,
       fontSize: FontSize.title,
       fontWeight: FontWeight.bold,
     },
   })
   ```

---

## How to Add a New Appwrite Collection

1. **Create the collection** in your Appwrite console under database `698dd75900395a2e605e`

2. **Add the collection ID** to `lib/appwrite.ts`:
   ```typescript
   export const COLLECTION = {
     ...existing,
     MY_COLLECTION: 'my_collection',
   } as const
   ```

3. **Define the TypeScript interface** in `types/`:
   ```typescript
   // types/my-type.ts
   export interface MyDocument {
     $id: string
     userId: string
     name: string
     // ... fields matching Appwrite schema
   }
   ```

4. **Re-export from `types/index.ts`:**
   ```typescript
   export * from './my-type'
   ```

5. **Add CRUD functions** to `lib/database.ts`:
   ```typescript
   export async function listMyDocuments(userId: string): Promise<MyDocument[]> {
     const res = await databases.listDocuments(DATABASE_ID, COLLECTION.MY_COLLECTION, [
       Query.equal('userId', userId),
       Query.orderDesc('$createdAt'),
     ])
     return res.documents as unknown as MyDocument[]
   }
   ```

6. **Create a Zustand store** if needed:
   ```typescript
   // stores/my-store.ts
   import { create } from 'zustand'
   import type { MyDocument } from '@/types'
   import * as db from '@/lib/database'

   interface MyState {
     items: MyDocument[]
     isLoading: boolean
     load: (userId: string) => Promise<void>
     add: (data: Omit<MyDocument, '$id'>) => Promise<void>
   }

   export const useMyStore = create<MyState>((set) => ({
     items: [],
     isLoading: false,
     load: async (userId) => { /* ... */ },
     add: async (data) => { /* ... */ },
   }))
   ```

---

## How to Add Exercises to the Library

### Static Exercise List

The `ExerciseIcon` component in `components/exercise-icon.tsx` has two important maps:

1. **`EXERCISE_MUSCLES`** — Maps exercise name (lowercase, no special chars) to primary/secondary muscles:
   ```typescript
   benchpress: { primary: ['chest'], secondary: ['triceps', 'shoulders'] },
   ```

2. **`EXERCISES`** — String array of all exercise display names for pickers:
   ```typescript
   'Bench Press', 'Incline Bench Press', ...
   ```

To add a new exercise:

1. Add to `EXERCISE_MUSCLES` with the key being the name with no spaces/special chars:
   ```typescript
   pendlayrow: { primary: ['back', 'lats'], secondary: ['biceps', 'forearms', 'traps'] },
   ```

2. Add the display name to the `EXERCISES` array.

3. Optionally add to `SEED_EXERCISES` in `constants/exercises.ts` if you want full metadata (difficulty, equipment, instructions).

### Muscle SVG Paths

If you need new muscle regions, add paths to `MUSCLE_PATHS` in `exercise-icon.tsx`. Paths use viewBox `0 0 100 200` (front-facing body diagram).

---

## How to Modify the Theme

Edit `constants/theme.ts`. All screens import tokens from here.

**To change the accent color:**
```typescript
// constants/theme.ts
accent: '#e8ff47',       // Change this
accentDark: '#a8e000',   // And this (darker variant)
```

**To add a new color:**
```typescript
export const Colors = {
  dark: {
    ...existing,
    myNewColor: '#ff00ff',
  },
  // Mirror in light: (they're identical)
  light: {
    ...existing,
    myNewColor: '#ff00ff',
  },
}
```

**To add a new spacing value:**
```typescript
export const Spacing = {
  ...existing,
  custom: 48,
} as const
```

---

## Git Workflow

```bash
# Push using the SSH key
GIT_SSH_COMMAND="ssh -i ~/workspace/id_ed25519_github -o StrictHostKeyChecking=no" git push
```

Commit messages follow conventional format:
- `feat: description` — new features
- `fix: description` — bug fixes
- `refactor: description` — code restructuring
- `docs: description` — documentation

---

## Common Pitfalls

### 1. Appwrite Rejects Unknown Fields

If you pass a field that doesn't exist in the Appwrite collection schema, you'll get a 400 error. Always check that your `createDocument()` data matches the schema exactly. Strip extra fields before sending.

### 2. Exercises Must Be JSON-Serialized

The `program_days` collection stores exercises as a **string**, not an array. `database.ts` handles this automatically, but if you bypass it, you must:
```typescript
// Writing:
exercises: JSON.stringify(exercisesArray)
// Reading:
exercises = JSON.parse(exercisesString)
```

### 3. Exercise Data Lost After `endWorkout()`

`useWorkoutStore.endWorkout()` resets ALL state including `exercises`. If you need exercise data after ending (e.g., for the summary screen), capture it BEFORE calling `endWorkout()`:
```typescript
const completedExercises = [...exercises]  // SAVE FIRST
const stats = endWorkout()                 // exercises is now []
setLastCompleted(session, completedExercises)
```

### 4. Dev Mode Skips Appwrite

When `userId === 'dev'` or IDs start with `local-`, the program store skips Appwrite calls. This is intentional for development but means dev changes won't persist across app restarts.

### 5. Denormalized Fields Get Stale

Fields like `GroupMember.displayName` are copied from the user profile at join time. If a user changes their name, existing group memberships keep the old name. No sync mechanism exists yet.

### 6. `listUserGroups()` is N+1

It first queries all `group_members` for the user, then fetches each group individually. This is O(N) Appwrite calls. For users in many groups, this could be slow.

### 7. Member Count Can Drift

`groups.memberCount` is updated manually on join/leave. If an operation fails mid-way (e.g., member doc deleted but count not decremented), the count drifts. No reconciliation exists.

### 8. TypeScript Casting

All Appwrite document returns use `as unknown as T`. This means TypeScript won't catch mismatches between your interface and the actual Appwrite schema. Test thoroughly after schema changes.

### 9. No Error Toasts

Most store actions catch errors silently (`catch { }`). The user gets no feedback when Appwrite calls fail. Consider adding error state or toast notifications.

### 10. Tab Lazy Loading

All tabs use `lazy: true`. This means the first navigation to a tab triggers its initial data load. If the user has slow internet, they'll see a blank/loading state briefly.

### 11. Realtime Subscription Scope

The Appwrite Realtime subscription in group chat listens to ALL documents in the `group_messages` collection. It filters by `groupId` client-side. In a production app with many groups, this could be noisy. Appwrite doesn't support per-document subscriptions.

### 12. MMKV Installed but Not Used

`react-native-mmkv` is in dependencies but not imported anywhere. It was likely intended for local caching or persistence but hasn't been implemented.

### 13. NativeWind Installed but Not Used

`nativewind` and `tailwindcss` are in dependencies, but all screens use `StyleSheet.create()`. No `className` props are used.

---

## Directory Conventions

| Directory | Purpose | Who manages it |
|-----------|---------|---------------|
| `app/` | Screens (file-based routes) | Expo Router |
| `stores/` | Zustand stores | One per domain |
| `lib/` | Core utilities + Appwrite ops | Shared code |
| `types/` | TypeScript interfaces | One per domain |
| `constants/` | Theme tokens + seed data | Rarely changes |
| `components/` | Reusable UI components | Shared |
| `components/ui/` | Generic primitives | Very generic |
| `assets/` | Images, fonts, splash | Static |

---

## Testing

No test framework is configured. Consider adding:
- **Jest** for unit tests (utils, store logic)
- **React Native Testing Library** for component tests
- **Detox** for E2E tests
