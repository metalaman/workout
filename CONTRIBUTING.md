# Contributing to IronLog

Guide for developers and coding agents working on this codebase.

## Code Style

- **TypeScript** with strict mode (`tsconfig.json` has `"strict": true`)
- **Functional components** only — no class components
- **Zustand** for state — no Redux, no Context API for global state
- **StyleSheet.create** for styles — NativeWind/Tailwind is installed but most styles use StyleSheet
- **Inline styles** for one-off dynamic values (e.g., `{ backgroundColor: color }`)
- **Single quotes**, no semicolons (Expo default ESLint config)
- **Barrel exports** from `types/index.ts` — import types from `@/types` not `@/types/exercise`
- **Path aliases** via `@/` prefix — maps to project root (e.g., `@/stores/auth-store`, `@/lib/database`)

### Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `auth-store.ts`, `exercise-icon.tsx` |
| Components | PascalCase | `ExerciseIcon`, `StrengthScoreGauge` |
| Stores | `use{Name}Store` | `useAuthStore`, `useProgramStore` |
| Types | PascalCase | `WorkoutSession`, `ProgramExercise` |
| Constants | UPPER_SNAKE or PascalCase | `COLLECTION`, `Colors`, `FontSize` |
| Store actions | camelCase verbs | `loadPrograms`, `createNewProgram` |

---

## How to Add a New Screen

1. **Create the file** under `app/` in the correct directory:
   - Tab screen: `app/(tabs)/my-screen.tsx`
   - Modal: `app/my-modal.tsx`
   - Nested in existing group: `app/(tabs)/library/new-screen.tsx`

2. **Register in layout** if it's a new Stack screen:
   ```tsx
   // In the parent _layout.tsx
   <Stack.Screen name="new-screen" options={{ animation: 'slide_from_right' }} />
   ```

3. **If it's a new tab**, add to `app/(tabs)/_layout.tsx`:
   ```tsx
   <Tabs.Screen
     name="my-tab"
     options={{
       tabBarIcon: ({ focused }) => <TabIcon icon={<MyIcon />} label="My Tab" focused={focused} />,
     }}
   />
   ```

4. **Navigate to it** from other screens:
   ```tsx
   import { useRouter, Href } from 'expo-router'
   const router = useRouter()
   router.push('/my-screen' as Href)          // Push onto stack
   router.replace('/my-screen' as Href)       // Replace current screen
   router.navigate('/(tabs)/my-tab' as Href)  // Switch tab
   ```

5. **Standard screen template:**
   ```tsx
   import { View, Text, StyleSheet } from 'react-native'
   import { SafeAreaView } from 'react-native-safe-area-context'
   import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme'

   export default function MyScreen() {
     return (
       <SafeAreaView style={styles.container}>
         <Text style={styles.title}>My Screen</Text>
       </SafeAreaView>
     )
   }

   const styles = StyleSheet.create({
     container: { flex: 1, backgroundColor: Colors.dark.background },
     title: { color: Colors.dark.text, fontSize: FontSize.title, fontWeight: FontWeight.bold },
   })
   ```

---

## How to Add a New Appwrite Collection

1. **Create the collection** via Appwrite console or API:
   ```bash
   curl -X POST "https://nyc.cloud.appwrite.io/v1/databases/698dd75900395a2e605e/collections" \
     -H "Content-Type: application/json" \
     -H "X-Appwrite-Project: 698d5a490007a7ec0e2e" \
     -H "X-Appwrite-Key: YOUR_API_KEY" \
     -d '{"collectionId":"my_collection","name":"my_collection","permissions":["read(\"any\")","create(\"users\")","update(\"users\")","delete(\"users\")"]}'
   ```

2. **Add attributes** (string, integer, float, boolean, etc.)

3. **Add the collection ID** to `lib/appwrite.ts`:
   ```typescript
   export const COLLECTION = {
     // ... existing
     MY_COLLECTION: 'my_collection',
   } as const
   ```

4. **Add the TypeScript interface** in `types/`:
   ```typescript
   export interface MyDocument {
     $id: string
     userId: string
     // ... your fields
   }
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

6. **Create a Zustand store** in `stores/my-store.ts`:
   ```typescript
   import { create } from 'zustand'
   import type { MyDocument } from '@/types'
   import * as db from '@/lib/database'

   interface MyState {
     items: MyDocument[]
     isLoading: boolean
     load: (userId: string) => Promise<void>
   }

   export const useMyStore = create<MyState>((set) => ({
     items: [],
     isLoading: false,
     load: async (userId) => {
       set({ isLoading: true })
       try {
         const items = await db.listMyDocuments(userId)
         set({ items, isLoading: false })
       } catch {
         set({ isLoading: false })
       }
     },
   }))
   ```

---

## How to Add Exercises to the Library

1. Open `constants/exercises.ts`
2. Add to the `SEED_EXERCISES` array:
   ```typescript
   {
     name: 'My Exercise',
     muscleGroup: 'Chest',     // Must be: Chest | Back | Legs | Shoulders | Arms | Core
     secondaryMuscles: ['Triceps'],
     equipment: 'Barbell',     // Must be: Barbell | Dumbbell | Cable | Machine | Bodyweight | Bands
     difficulty: 'Intermediate', // Must be: Beginner | Intermediate | Advanced
     icon: '🏋️',
     instructions: 'Step by step instructions here.',
   }
   ```

3. **Add the muscle mapping** in `components/exercise-icon.tsx`:
   ```typescript
   // In EXERCISE_MUSCLES map (normalize the name — lowercase, no special chars)
   myexercise: { primary: ['chest'], secondary: ['triceps', 'shoulders'] },
   ```
   Valid muscle keys: `chest`, `back`, `lats`, `shoulders`, `traps`, `biceps`, `triceps`, `forearms`, `core`, `quads`, `hamstrings`, `glutes`, `calves`, `hipflexors`

4. **Add to the default program** (optional) in `stores/program-store.ts` under `DEFAULT_DAYS`.

---

## How to Modify the Theme

Edit `constants/theme.ts`. All screens import from this file.

**To change the accent color:**
```typescript
// In Colors.dark (and Colors.light to match):
accent: '#your_color',
accentDark: '#darker_variant',
accentSurface: 'rgba(r,g,b,0.06)',
accentSurfaceActive: 'rgba(r,g,b,0.12)',
accentBorder: 'rgba(r,g,b,0.15)',
accentBorderStrong: 'rgba(r,g,b,0.4)',
textOnAccent: '#dark_text_for_contrast',  // Usually dark for light accents
```

**To adjust spacing/sizing:** Change values in `Spacing`, `FontSize`, `BorderRadius`, `FontWeight`.

---

## Git Workflow

- **Branch:** All work happens on `main` (no feature branches currently)
- **Commit messages:** `feat:`, `fix:`, or plain description
- **Push command:**
  ```bash
  GIT_SSH_COMMAND="ssh -i ~/workspace/id_ed25519_github -o StrictHostKeyChecking=no" git push
  ```

---

## Common Pitfalls

### 1. Appwrite Rejects Unknown Fields

If you add a field to a TypeScript type but don't add the corresponding attribute to the Appwrite collection, the API will reject the entire document creation/update with an error like `"Unknown attribute: myField"`.

**Fix:** Always add the attribute to Appwrite first, then use it in code.

### 2. JSON Serialization for `program_days.exercises`

The `exercises` field in `program_days` is a **string** attribute in Appwrite, not an array. The `database.ts` functions handle serialization:

```typescript
// Writing: JSON.stringify(exercises)
// Reading: JSON.parse(exercises)
```

If you bypass `database.ts` and write directly via Appwrite SDK, you must serialize manually.

### 3. Exercises Data Lost After `endWorkout()`

The `workout-store.ts` `endWorkout()` function resets **all** state including `exercises`. If you need exercises data for the summary screen, capture it BEFORE calling `endWorkout()`:

```typescript
const completedExercises = [...exercises]  // BEFORE
const { totalVolume, duration } = endWorkout()  // This clears everything
setLastCompleted(session, completedExercises)  // Pass to session store
```

### 4. Dev Mode Checks

Dev/local users bypass Appwrite. Check for this pattern:
```typescript
const isLocal = userId === 'dev' || userId.startsWith('local') || program.$id.startsWith('local')
```

If you add new Appwrite calls, add this guard or they'll fail for dev users.

### 5. `as unknown as Type` Pattern

All Appwrite document responses are cast through `as unknown as Type` because Appwrite SDK returns `Models.Document` which doesn't match our types. This is expected and safe:

```typescript
const doc = await databases.getDocument(...)
return doc as unknown as MyType
```

### 6. Builder vs Active State in Program Store

`useProgramStore` has **two parallel arrays**: `days` (active view) and `builderDays` (edit mode). When modifying exercises in the builder, BOTH must be updated:

```typescript
set((state) => {
  const builderDays = [...state.builderDays]
  // ... modify builderDays[dayIndex] ...
  const days = [...state.days]
  const mainIdx = days.findIndex((d) => d.$id === builderDays[dayIndex]?.$id)
  if (mainIdx >= 0) {
    days[mainIdx] = { ...builderDays[dayIndex] }  // Sync to main array
  }
  return { builderDays, days }
})
```

### 7. Appwrite Realtime Requires Auth

Appwrite Realtime subscriptions (`client.subscribe(...)`) only work for authenticated users. They will silently fail for dev/skipAuth users. This is fine — dev users just won't get real-time updates.

### 8. Tab Bar Label Overflow

Tab labels must be short (max ~6 chars) and use `numberOfLines={1}` to prevent wrapping. The `_layout.tsx` tab bar uses custom `TabIcon` components with 9px font size.

### 9. Safe Directory for Git

If you get `fatal: detected dubious ownership in repository`, run:
```bash
git config --global --add safe.directory /home/hatch/workspace/workout
```

### 10. SSH Key for GitHub

```bash
GIT_SSH_COMMAND="ssh -i ~/workspace/id_ed25519_github -o StrictHostKeyChecking=no" git clone/push/pull
```
