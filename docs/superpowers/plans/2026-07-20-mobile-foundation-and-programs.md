# FitnessMate Mobile Foundation and Programs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable offline Expo app for Android and iOS with safe-area-aware navigation, themes, Russian/English localization, SQLite bootstrap, an exercise catalog, and complete local workout-program management.

**Architecture:** Expo Router owns navigation while feature code lives under `src/features`. SQLite is accessed only through focused repositories under `src/database`; pure domain validation and unit conversion live under `src/domain`. Zustand is limited to preferences and transient editor state, and route files remain thin composition layers.

**Tech Stack:** Expo, React Native, TypeScript, Expo Router, expo-sqlite, expo-localization, react-native-safe-area-context, Zustand, Zod, i18next/react-i18next, Jest Expo, React Native Testing Library

---

## Scope boundary

This is the first independently testable increment of the approved design in `docs/superpowers/specs/2026-07-20-fitnessmate-mobile-design.md`. It delivers the application shell and program-management vertical slice. Active workout drafts, completed history, analytics, backup/import, sharing, and destructive data clearing remain outside this increment and receive their own implementation plans after this one passes its checks.

## Planned file map

- `src/app/_layout.tsx`: root providers, database readiness, and root stack.
- `src/app/(tabs)/_layout.tsx`: approved five-item bottom navigation with central Start treatment.
- `src/app/(tabs)/index.tsx`: Home route composition.
- `src/app/(tabs)/programs.tsx`: Programs route composition.
- `src/app/(tabs)/start.tsx`: first-increment Start screen with program selection entry and an explicit scope message.
- `src/app/(tabs)/history.tsx`: explicit not-yet-populated history empty state.
- `src/app/(tabs)/progress.tsx`: explicit not-yet-populated progress empty state.
- `src/app/programs/new.tsx` and `src/app/programs/[programId].tsx`: program editor routes.
- `src/app/settings.tsx`: language, units, and theme settings.
- `src/shared/i18n/index.ts`: i18n initialization and device-language default.
- `src/shared/i18n/locales/{ru,en}.ts`: typed translation resources.
- `src/shared/theme/*`: semantic colors, theme selection, and theme hook.
- `src/shared/ui/*`: focused reusable screen, button, input, and empty-state primitives.
- `src/domain/exercises/types.ts`: exercise domain types.
- `src/domain/programs/types.ts`: program aggregate types.
- `src/domain/programs/program-schema.ts`: Zod validation for program editing.
- `src/domain/units/weight.ts`: canonical kg/lb conversion and rounding.
- `src/database/client.ts`: SQLite connection configuration.
- `src/database/migrations.ts`: schema version and transactional migration runner.
- `src/database/bootstrap.ts`: migration plus built-in catalog seeding.
- `src/database/repositories/exercise-repository.ts`: exercise reads and custom-exercise writes.
- `src/database/repositories/program-repository.ts`: transactional program aggregate CRUD and ordering.
- `src/database/seed/built-in-exercises.ts`: stable-key bilingual exercise seed metadata.
- `src/features/programs/*`: program list and editor UI/controller hooks.
- `src/features/settings/preferences-store.ts`: persisted language, unit, and theme preferences.
- `src/test/*`: Jest setup and database/repository fakes used by unit tests.

### Task 1: Scaffold the Expo application and lock the development commands

**Files:**
- Create from Expo template: `app.json`, `package.json`, `tsconfig.json`, `eslint.config.js`, `src/app/*`, `assets/*`
- Create: `.gitignore`
- Modify: `package.json`
- Modify: `tsconfig.json`

- [ ] **Step 1: Generate a current stable Expo Router scaffold outside the non-empty repository**

Run from `C:\Users\Vlad\Desktop\Projects\FitnessMateWorkspace\FitnessMateMobile`:

```powershell
npx.cmd create-expo-app@latest ..\FitnessMateMobileScaffold --template default --no-install --yes
```

Expected: `..\FitnessMateMobileScaffold` contains the current Expo Router default template and does not contain `node_modules`.

- [ ] **Step 2: Copy only the scaffold-owned application files into this repository**

Copy `app.json`, `package.json`, `tsconfig.json`, `eslint.config.js`, `expo-env.d.ts`, `assets`, `scripts`, and the generated `src` directory. Do not copy a generated `.git` directory. Verify `docs/` and the existing repository metadata remain unchanged, then remove the verified temporary scaffold directory.

Expected: `git status --short` shows Expo application files plus the untracked visual-companion directory; the design and plan documents remain present.

- [ ] **Step 3: Replace `.gitignore` with project-specific exclusions**

```gitignore
node_modules/
.expo/
dist/
web-build/
coverage/
*.log
.DS_Store
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
.superpowers/
android/
ios/
```

Expected: the visual companion under `.superpowers/` disappears from `git status` without being deleted.

- [ ] **Step 4: Install runtime dependencies with Expo-compatible native versions**

```powershell
npx.cmd expo install expo-sqlite expo-localization expo-file-system expo-document-picker expo-sharing expo-crypto react-native-safe-area-context react-native-screens expo-status-bar
npm.cmd install zustand zod i18next react-i18next
```

Expected: installation succeeds without incompatible Expo package warnings.

- [ ] **Step 5: Install the test toolchain and define scripts**

```powershell
npm.cmd install --save-dev jest-expo @testing-library/react-native @types/jest
```

Set the following scripts and Jest configuration in `package.json` while preserving scaffold dependencies:

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "lint": "expo lint",
    "typecheck": "tsc --noEmit",
    "test": "jest --runInBand",
    "check": "npm run lint && npm run typecheck && npm run test"
  },
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterEnv": ["<rootDir>/src/test/setup.ts"],
    "testPathIgnorePatterns": ["/node_modules/", "/.expo/"]
  }
}
```

- [ ] **Step 6: Add the `@/*` source alias**

Ensure `tsconfig.json` extends the generated Expo config and contains:

```json
{
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 7: Run baseline checks**

Run: `npm.cmd run lint` and `npm.cmd run typecheck`

Expected: both exit 0 on the generated scaffold before feature code is introduced.

- [ ] **Step 8: Commit the scaffold**

```powershell
git add .gitignore app.json package.json package-lock.json tsconfig.json eslint.config.js expo-env.d.ts assets scripts src
git commit -m "chore: scaffold Expo mobile app"
```

### Task 2: Add the test harness and pure weight conversion

**Files:**
- Create: `src/test/setup.ts`
- Create: `src/domain/units/weight.ts`
- Test: `src/domain/units/weight.test.ts`

- [ ] **Step 1: Create the Jest setup file**

```ts
import '@testing-library/react-native/extend-expect';
```

- [ ] **Step 2: Write failing conversion tests**

```ts
import { fromCanonicalKg, toCanonicalKg } from './weight';

describe('weight conversion', () => {
  it('keeps kilograms canonical', () => {
    expect(toCanonicalKg(82.5, 'kg')).toBe(82.5);
    expect(fromCanonicalKg(82.5, 'kg')).toBe(82.5);
  });

  it('round-trips pounds without accumulating display noise', () => {
    const kilograms = toCanonicalKg(225, 'lb');
    expect(kilograms).toBeCloseTo(102.058, 3);
    expect(fromCanonicalKg(kilograms, 'lb')).toBe(225);
  });

  it('rejects negative and non-finite input', () => {
    expect(() => toCanonicalKg(-1, 'kg')).toThrow('Weight must be a finite non-negative number');
    expect(() => toCanonicalKg(Number.NaN, 'lb')).toThrow(
      'Weight must be a finite non-negative number',
    );
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm.cmd test -- src/domain/units/weight.test.ts`

Expected: FAIL because `./weight` does not exist.

- [ ] **Step 4: Implement canonical conversion**

```ts
export type WeightUnit = 'kg' | 'lb';

const POUNDS_PER_KILOGRAM = 2.2046226218;

function assertWeight(value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Weight must be a finite non-negative number');
  }
}

export function toCanonicalKg(value: number, unit: WeightUnit): number {
  assertWeight(value);
  return unit === 'kg' ? value : value / POUNDS_PER_KILOGRAM;
}

export function fromCanonicalKg(valueKg: number, unit: WeightUnit): number {
  assertWeight(valueKg);
  const displayed = unit === 'kg' ? valueKg : valueKg * POUNDS_PER_KILOGRAM;
  return Math.round(displayed * 100) / 100;
}
```

- [ ] **Step 5: Run the focused and full tests**

Run: `npm.cmd test -- src/domain/units/weight.test.ts` then `npm.cmd test`

Expected: PASS for three conversion tests and no other failures.

- [ ] **Step 6: Commit**

```powershell
git add src/test/setup.ts src/domain/units/weight.ts src/domain/units/weight.test.ts
git commit -m "test: add canonical weight conversion"
```

### Task 3: Define and validate the program aggregate

**Files:**
- Create: `src/domain/exercises/types.ts`
- Create: `src/domain/programs/types.ts`
- Create: `src/domain/programs/program-schema.ts`
- Test: `src/domain/programs/program-schema.test.ts`

- [ ] **Step 1: Define the expected validation behavior in a failing test**

```ts
import { parseProgramInput } from './program-schema';

const validProgram = {
  name: 'Upper body',
  description: 'Monday session',
  exercises: [
    {
      exerciseId: '11111111-1111-4111-8111-111111111111',
      sets: [{ weightKg: 60, repetitions: 8 }],
    },
  ],
};

describe('parseProgramInput', () => {
  it('normalizes valid input', () => {
    expect(parseProgramInput(validProgram)).toEqual(validProgram);
  });

  it('requires a name and at least one exercise with one set', () => {
    expect(() => parseProgramInput({ ...validProgram, name: '  ' })).toThrow();
    expect(() => parseProgramInput({ ...validProgram, exercises: [] })).toThrow();
    expect(() =>
      parseProgramInput({
        ...validProgram,
        exercises: [{ ...validProgram.exercises[0], sets: [] }],
      }),
    ).toThrow();
  });

  it('rejects negative weight and repetitions below one', () => {
    expect(() =>
      parseProgramInput({
        ...validProgram,
        exercises: [
          {
            ...validProgram.exercises[0],
            sets: [{ weightKg: -1, repetitions: 0 }],
          },
        ],
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm.cmd test -- src/domain/programs/program-schema.test.ts`

Expected: FAIL because the schema module does not exist.

- [ ] **Step 3: Add focused domain types**

```ts
// src/domain/exercises/types.ts
export type Exercise = {
  id: string;
  builtInKey: string | null;
  customName: string | null;
  muscleGroup: string;
  isCustom: boolean;
};

// src/domain/programs/types.ts
export type ProgramSetInput = { weightKg: number; repetitions: number };
export type ProgramExerciseInput = { exerciseId: string; sets: ProgramSetInput[] };
export type ProgramInput = {
  name: string;
  description: string;
  exercises: ProgramExerciseInput[];
};

export type Program = ProgramInput & {
  id: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};
```

- [ ] **Step 4: Implement the Zod boundary schema**

```ts
import { z } from 'zod';
import type { ProgramInput } from './types';

const programSetSchema = z.object({
  weightKg: z.number().finite().min(0),
  repetitions: z.number().int().min(1).max(1000),
});

const programExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  sets: z.array(programSetSchema).min(1),
});

const programInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000),
  exercises: z.array(programExerciseSchema).min(1),
});

export function parseProgramInput(input: unknown): ProgramInput {
  return programInputSchema.parse(input);
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npm.cmd test -- src/domain/programs/program-schema.test.ts` and `npm.cmd run typecheck`

Expected: all three schema tests pass and TypeScript exits 0.

- [ ] **Step 6: Commit**

```powershell
git add src/domain/exercises src/domain/programs
git commit -m "feat: define program domain model"
```

### Task 4: Bootstrap the SQLite schema and built-in exercise catalog

**Files:**
- Create: `src/database/types.ts`
- Create: `src/database/client.ts`
- Create: `src/database/migrations.ts`
- Create: `src/database/bootstrap.ts`
- Create: `src/database/seed/built-in-exercises.ts`
- Test: `src/database/migrations.test.ts`
- Test: `src/database/bootstrap.test.ts`
- Create: `src/test/fake-database.ts`

- [ ] **Step 1: Write failing migration-runner tests against a minimal database interface**

```ts
import { migrateDatabase } from './migrations';
import { FakeDatabase } from '@/test/fake-database';

describe('migrateDatabase', () => {
  it('enables foreign keys and applies version one exactly once', async () => {
    const db = new FakeDatabase(0);
    await migrateDatabase(db);

    expect(db.executedSql.join('\n')).toContain('PRAGMA foreign_keys = ON');
    expect(db.executedSql.join('\n')).toContain('CREATE TABLE IF NOT EXISTS exercises');
    expect(db.userVersion).toBe(1);

    const countAfterFirstRun = db.executedSql.length;
    await migrateDatabase(db);
    expect(db.executedSql).toHaveLength(countAfterFirstRun + 2);
  });
});
```

- [ ] **Step 2: Run the migration test to verify it fails**

Run: `npm.cmd test -- src/database/migrations.test.ts`

Expected: FAIL because the migration and fake database modules do not exist.

- [ ] **Step 3: Define the adapter interface and deterministic fake**

```ts
// src/database/types.ts
export type SqlParams = (string | number | null)[];

export interface DatabaseAdapter {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: SqlParams): Promise<{ changes: number; lastInsertRowId: number }>;
  getFirstAsync<T>(sql: string, params?: SqlParams): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: SqlParams): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

// src/test/fake-database.ts
import type { DatabaseAdapter, SqlParams } from '@/database/types';

export class FakeDatabase implements DatabaseAdapter {
  executedSql: string[] = [];
  userVersion: number;

  constructor(userVersion: number) {
    this.userVersion = userVersion;
  }

  async execAsync(sql: string): Promise<void> {
    this.executedSql.push(sql);
    const match = sql.match(/PRAGMA user_version = (\d+)/);
    if (match?.[1]) this.userVersion = Number(match[1]);
  }

  async runAsync(sql: string, _params: SqlParams = []) {
    this.executedSql.push(sql);
    return { changes: 1, lastInsertRowId: 1 };
  }

  async getFirstAsync<T>(sql: string): Promise<T | null> {
    this.executedSql.push(sql);
    if (sql.includes('PRAGMA user_version')) return { user_version: this.userVersion } as T;
    return null;
  }

  async getAllAsync<T>(): Promise<T[]> {
    return [];
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    await task();
  }
}
```

- [ ] **Step 4: Implement migration version one**

`migrateDatabase` must always enable foreign keys, read `PRAGMA user_version`, and apply the following schema in one transaction when the version is zero:

```sql
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY NOT NULL,
  built_in_key TEXT UNIQUE,
  custom_name TEXT,
  muscle_group TEXT NOT NULL,
  is_custom INTEGER NOT NULL CHECK (is_custom IN (0, 1)),
  created_at TEXT NOT NULL,
  CHECK (
    (is_custom = 0 AND built_in_key IS NOT NULL AND custom_name IS NULL) OR
    (is_custom = 1 AND built_in_key IS NULL AND custom_name IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS program_exercises (
  id TEXT PRIMARY KEY NOT NULL,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS program_sets (
  id TEXT PRIMARY KEY NOT NULL,
  program_exercise_id TEXT NOT NULL REFERENCES program_exercises(id) ON DELETE CASCADE,
  weight_kg REAL NOT NULL CHECK (weight_kg >= 0),
  repetitions INTEGER NOT NULL CHECK (repetitions >= 1),
  sort_order INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_program_exercises_program
ON program_exercises(program_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_program_sets_exercise
ON program_sets(program_exercise_id, sort_order);
```

After the schema succeeds, execute `PRAGMA user_version = 1`. Reject database versions greater than one with `Unsupported database version`.

- [ ] **Step 5: Implement the Expo SQLite adapter**

```ts
import * as SQLite from 'expo-sqlite';
import type { DatabaseAdapter, SqlParams } from './types';

const nativeDb = SQLite.openDatabaseSync('fitnessmate.db', { enableChangeListener: true });

export const database: DatabaseAdapter = {
  execAsync: (sql) => nativeDb.execAsync(sql),
  runAsync: (sql, params: SqlParams = []) => nativeDb.runAsync(sql, params),
  getFirstAsync: (sql, params: SqlParams = []) => nativeDb.getFirstAsync(sql, params),
  getAllAsync: (sql, params: SqlParams = []) => nativeDb.getAllAsync(sql, params),
  withTransactionAsync: (task) => nativeDb.withTransactionAsync(task),
};
```

- [ ] **Step 6: Add stable built-in seed records and a failing idempotency test**

Seed at least these stable entries with fixed UUIDs and translation keys: barbell bench press/chest, squat/legs, deadlift/back, overhead press/shoulders, barbell row/back, pull-up/back, biceps curl/arms, triceps extension/arms, leg press/legs, and calf raise/legs.

The test calls `bootstrapDatabase` twice and asserts that the repository seed command uses `INSERT OR IGNORE`, all fixed IDs remain identical, and ten built-in keys are attempted on both runs without custom-name values.

- [ ] **Step 7: Implement bootstrap**

```ts
export async function bootstrapDatabase(db: DatabaseAdapter = database): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await migrateDatabase(db);
  await db.withTransactionAsync(async () => {
    for (const exercise of BUILT_IN_EXERCISES) {
      await db.runAsync(
        `INSERT OR IGNORE INTO exercises
         (id, built_in_key, custom_name, muscle_group, is_custom, created_at)
         VALUES (?, ?, NULL, ?, 0, ?)`,
        [exercise.id, exercise.builtInKey, exercise.muscleGroup, exercise.createdAt],
      );
    }
  });
}
```

- [ ] **Step 8: Run focused tests and checks**

Run: `npm.cmd test -- src/database/migrations.test.ts src/database/bootstrap.test.ts`, `npm.cmd run typecheck`, and `npm.cmd run lint`.

Expected: migration and seed tests pass; typecheck and lint exit 0.

- [ ] **Step 9: Commit**

```powershell
git add src/database src/test/fake-database.ts
git commit -m "feat: bootstrap local workout database"
```

### Task 5: Implement exercise and program repositories transactionally

**Files:**
- Create: `src/database/repositories/exercise-repository.ts`
- Create: `src/database/repositories/program-repository.ts`
- Test: `src/database/repositories/exercise-repository.test.ts`
- Test: `src/database/repositories/program-repository.test.ts`
- Modify: `src/test/fake-database.ts`

- [ ] **Step 1: Write failing exercise-repository contract tests**

Test these exact behaviors with a recording fake adapter:

```ts
it('creates a trimmed custom exercise with a UUID and timestamp', async () => {
  const created = await repository.createCustom({ name: '  Cable fly  ', muscleGroup: 'chest' });
  expect(created.customName).toBe('Cable fly');
  expect(created.isCustom).toBe(true);
  expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
});

it('rejects an empty custom name', async () => {
  await expect(repository.createCustom({ name: ' ', muscleGroup: 'chest' })).rejects.toThrow(
    'Exercise name is required',
  );
});
```

Also assert `listAll()` sorts built-ins by `built_in_key` and customs by case-insensitive `custom_name`, returning both groups.

- [ ] **Step 2: Run the exercise tests to verify failure**

Run: `npm.cmd test -- src/database/repositories/exercise-repository.test.ts`

Expected: FAIL because the repository does not exist.

- [ ] **Step 3: Implement `ExerciseRepository`**

Expose only:

```ts
export interface ExerciseRepository {
  listAll(): Promise<Exercise[]>;
  createCustom(input: { name: string; muscleGroup: string }): Promise<Exercise>;
  deleteCustom(id: string): Promise<void>;
}
```

Use `Crypto.randomUUID()` from `expo-crypto`, parameterized SQL, and map SQLite `0 | 1` to boolean. `deleteCustom` must issue a custom-only delete (`WHERE id = ? AND is_custom = 1`) so built-in records cannot be removed.

- [ ] **Step 4: Write failing program aggregate tests**

Cover:

- `create(input)` inserts program, ordered program exercises, and ordered sets in one transaction.
- a failed child insert rejects the call and leaves the fake transaction uncommitted.
- `getById(id)` returns one nested aggregate in stable order.
- `update(id, input)` changes metadata and replaces child rows transactionally without changing the program UUID or creation time.
- `duplicate(id)` creates a new UUID, appends `Copy` to the source name, and inserts after the current maximum sort order.
- `reorder(ids)` rejects missing/duplicate IDs and assigns contiguous zero-based order.
- `delete(id)` relies on cascading child deletion.

Use one concrete fixture containing bench press with two sets and barbell row with one set.

- [ ] **Step 5: Run the program tests to verify failure**

Run: `npm.cmd test -- src/database/repositories/program-repository.test.ts`

Expected: FAIL because the repository does not exist.

- [ ] **Step 6: Implement the repository interface**

```ts
export interface ProgramRepository {
  list(): Promise<ProgramSummary[]>;
  getById(id: string): Promise<Program | null>;
  create(input: ProgramInput): Promise<Program>;
  update(id: string, input: ProgramInput): Promise<Program>;
  duplicate(id: string): Promise<Program>;
  reorder(orderedIds: string[]): Promise<void>;
  delete(id: string): Promise<void>;
}
```

Call `parseProgramInput` before opening a write transaction. Generate every aggregate UUID before the transaction, use ISO timestamps from an injected clock, and never expose row-shaped objects to feature code. Implement `getById` with three ordered parameterized queries and assemble children by `program_exercise_id`.

- [ ] **Step 7: Run repository tests and all static checks**

Run: `npm.cmd test -- src/database/repositories`, `npm.cmd run typecheck`, and `npm.cmd run lint`.

Expected: all repository tests pass; static checks exit 0.

- [ ] **Step 8: Commit**

```powershell
git add src/database/repositories src/test/fake-database.ts
git commit -m "feat: add exercise and program repositories"
```

### Task 6: Add preferences, localization, themes, and safe-area root providers

**Files:**
- Create: `src/features/settings/preferences-store.ts`
- Create: `src/shared/i18n/index.ts`
- Create: `src/shared/i18n/locales/en.ts`
- Create: `src/shared/i18n/locales/ru.ts`
- Create: `src/shared/theme/colors.ts`
- Create: `src/shared/theme/use-app-theme.ts`
- Create: `src/shared/providers/app-providers.tsx`
- Create: `src/shared/ui/loading-screen.tsx`
- Create: `src/shared/ui/error-screen.tsx`
- Modify: `src/app/_layout.tsx`
- Test: `src/features/settings/preferences-store.test.ts`
- Test: `src/shared/providers/app-providers.test.tsx`

- [ ] **Step 1: Write failing preference-store tests**

```ts
describe('preferences store', () => {
  beforeEach(() => usePreferencesStore.getState().reset());

  it('defaults to system theme, device-supported language, and locale measurement system', () => {
    const state = usePreferencesStore.getState();
    expect(state.themeMode).toBe('system');
    expect(['ru', 'en']).toContain(state.language);
    expect(['kg', 'lb']).toContain(state.weightUnit);
  });

  it('updates each preference independently', () => {
    usePreferencesStore.getState().setLanguage('en');
    usePreferencesStore.getState().setWeightUnit('lb');
    usePreferencesStore.getState().setThemeMode('dark');
    expect(usePreferencesStore.getState()).toMatchObject({
      language: 'en',
      weightUnit: 'lb',
      themeMode: 'dark',
    });
  });
});
```

- [ ] **Step 2: Run the preference tests to verify failure**

Run: `npm.cmd test -- src/features/settings/preferences-store.test.ts`

Expected: FAIL because the store does not exist.

- [ ] **Step 3: Implement persisted preferences**

Use Zustand `persist` with `expo-sqlite/kv-store`. Types are exact unions:

```ts
import type { WeightUnit } from '@/domain/units/weight';

export type AppLanguage = 'ru' | 'en';
export type ThemeMode = 'system' | 'light' | 'dark';

export type PersistedPreferences = {
  language: AppLanguage;
  themeMode: ThemeMode;
  weightUnit: WeightUnit;
};
```

Derive initial language and unit from `expo-localization`, falling back to Russian and kilograms. Persist only `language`, `themeMode`, and `weightUnit`; actions and hydration flags are not serialized.

- [ ] **Step 4: Add complete first-increment translation resources**

Both locale files must define matching keys for navigation (`home`, `programs`, `start`, `history`, `progress`), settings, common actions, empty states, exercise catalog names, muscle groups, program editor labels, validation errors, database loading, and database failure. Export a shared `resources` object so missing English/Russian keys fail TypeScript.

- [ ] **Step 5: Implement semantic theme colors**

Define matching light/dark tokens for `background`, `surface`, `surfaceElevated`, `text`, `textMuted`, `border`, `primary`, `primaryText`, `danger`, `dangerText`, and `tabInactive`. `useAppTheme` resolves the persisted `system | light | dark` preference against `useColorScheme()`.

- [ ] **Step 6: Write failing provider states test**

Mock `bootstrapDatabase` and assert:

- a loading screen is shown before the promise settles;
- children render after success;
- a localized retry screen renders after rejection;
- pressing Retry invokes bootstrap again.

- [ ] **Step 7: Implement root providers and layout**

`AppProviders` wraps `SafeAreaProvider`, initializes i18n from the current preference, runs database bootstrap exactly once per attempt, and exposes loading/error states. `src/app/_layout.tsx` renders:

```tsx
export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="programs/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="programs/[programId]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
    </AppProviders>
  );
}
```

- [ ] **Step 8: Run tests and checks**

Run: `npm.cmd test -- src/features/settings src/shared/providers`, `npm.cmd run typecheck`, and `npm.cmd run lint`.

Expected: preference and provider tests pass; static checks exit 0.

- [ ] **Step 9: Commit**

```powershell
git add src/features/settings src/shared src/app/_layout.tsx
git commit -m "feat: add localized theme and app providers"
```

### Task 7: Build the approved safe-area-aware tab shell

**Files:**
- Create: `src/app/(tabs)/_layout.tsx`
- Create: `src/app/(tabs)/index.tsx`
- Create: `src/app/(tabs)/programs.tsx`
- Create: `src/app/(tabs)/start.tsx`
- Create: `src/app/(tabs)/history.tsx`
- Create: `src/app/(tabs)/progress.tsx`
- Create: `src/shared/ui/screen.tsx`
- Create: `src/shared/ui/empty-state.tsx`
- Create: `src/shared/ui/app-header.tsx`
- Test: `src/shared/ui/screen.test.tsx`
- Test: `src/app/(tabs)/_layout.test.tsx`

- [ ] **Step 1: Write a failing inset behavior test**

Mock safe-area insets `{ top: 44, right: 0, bottom: 34, left: 0 }`, render `Screen`, and assert its outer content applies the top inset while tab-owned screens can pass `bottomInset="tabBar"` to avoid double-applying the bottom inset. Render a scroll screen and assert its content container includes at least 34 points of bottom padding beyond its normal spacing.

- [ ] **Step 2: Run the focused test to verify failure**

Run: `npm.cmd test -- src/shared/ui/screen.test.tsx`

Expected: FAIL because `Screen` does not exist.

- [ ] **Step 3: Implement reusable inset-aware primitives**

`Screen` accepts `scroll?: boolean`, `bottomInset?: 'safeArea' | 'tabBar'`, and children. Use `useSafeAreaInsets`; never use fixed top/bottom device padding. `AppHeader` renders a title and optional settings action with a minimum 44x44 touch target. `EmptyState` accepts title, body, and optional action.

- [ ] **Step 4: Write the approved navigation structure test**

Mock Expo Router tabs and assert exact route names in this order: `index`, `programs`, `start`, `history`, `progress`. Assert the Start tab uses the primary color and a larger circular icon container, while Settings is absent from tab routes.

- [ ] **Step 5: Implement the five tabs and thin initial routes**

Use the approved option B. The Start tab is visually prominent but remains a normal accessible tab destination, not an absolutely positioned overlay that can collide with the system gesture area. Calculate tab-bar height/padding with `useSafeAreaInsets().bottom`.

Home, History, and Progress render localized, honest empty states. Start renders a choice to select an existing program or create one; it must not pretend an active workout can be completed in this increment. Programs delegates to `ProgramsScreen` added in Task 8.

- [ ] **Step 6: Run tests and checks**

Run: `npm.cmd test -- src/shared/ui/screen.test.tsx "src/app/(tabs)/_layout.test.tsx"`, `npm.cmd run typecheck`, and `npm.cmd run lint`.

Expected: safe-area and route-order tests pass; static checks exit 0.

- [ ] **Step 7: Commit**

```powershell
git add "src/app/(tabs)" src/shared/ui
git commit -m "feat: add safe-area tab navigation"
```

### Task 8: Build exercise selection and program list/editor flows

**Files:**
- Create: `src/features/programs/programs-screen.tsx`
- Create: `src/features/programs/program-card.tsx`
- Create: `src/features/programs/use-programs.ts`
- Create: `src/features/programs/editor/program-editor-screen.tsx`
- Create: `src/features/programs/editor/use-program-editor.ts`
- Create: `src/features/programs/editor/exercise-picker.tsx`
- Create: `src/features/programs/editor/exercise-editor-card.tsx`
- Create: `src/features/programs/editor/set-row.tsx`
- Create: `src/shared/ui/button.tsx`
- Create: `src/shared/ui/text-field.tsx`
- Modify: `src/app/(tabs)/programs.tsx`
- Create: `src/app/programs/new.tsx`
- Create: `src/app/programs/[programId].tsx`
- Test: `src/features/programs/programs-screen.test.tsx`
- Test: `src/features/programs/editor/program-editor-screen.test.tsx`

- [ ] **Step 1: Write failing program-list behavior tests**

With a mocked repository, cover:

- loading indicator while `list()` is pending;
- localized empty state and Create action when the list is empty;
- cards render in repository order with exercise/set counts;
- tapping a card opens `/programs/{id}`;
- Duplicate calls `duplicate`, refreshes, and displays the copied program;
- Delete requires confirmation before `delete` and refresh;
- Move up/down actions call `reorder` with the exact new UUID order and remain accessible without drag gestures;
- repository rejection renders a retry action without clearing already rendered data.

- [ ] **Step 2: Run the list tests to verify failure**

Run: `npm.cmd test -- src/features/programs/programs-screen.test.tsx`

Expected: FAIL because the programs feature does not exist.

- [ ] **Step 3: Implement the list controller and screen**

`usePrograms` owns `items`, `isLoading`, `error`, `refresh`, `duplicate`, `remove`, and `reorder`. It calls repository methods and never exposes SQL. `ProgramsScreen` renders through `Screen`, uses an inset-aware header, and keeps destructive confirmation in the feature UI.

- [ ] **Step 4: Write failing editor tests**

Cover one full concrete flow:

1. Enter name `Upper body`.
2. Open exercise picker.
3. Search and select built-in bench press.
4. Set first set to `60 kg x 8`.
5. Duplicate the set and change the second set to `65 kg x 6`.
6. Add barbell row and one `50 kg x 10` set.
7. Save.

Assert `repository.create` receives canonical kilogram values and the exact exercise order. Also test editing an existing program calls `update`, empty name blocks save with localized validation, removing the last set is blocked, and switching display units to pounds converts UI values without rewriting canonical values until save.

Add a custom-exercise flow to the same test: search for `Cable fly`, choose Create custom exercise, select muscle group Chest, save it through `ExerciseRepository.createCustom`, and assert the returned exercise is immediately selected in the program draft.

- [ ] **Step 5: Run the editor tests to verify failure**

Run: `npm.cmd test -- src/features/programs/editor/program-editor-screen.test.tsx`

Expected: FAIL because editor components do not exist.

- [ ] **Step 6: Implement the editor state hook**

The hook stores a `ProgramInput`-shaped draft in component state, plus loading and saving flags. It exposes named operations: `setMetadata`, `addExercise`, `removeExercise`, `moveExercise`, `addSet`, `duplicateSet`, `updateSet`, `removeSet`, and `save`. `save` converts displayed weight to canonical kg, calls `parseProgramInput`, prevents concurrent submission, invokes `create` or `update`, and navigates back only after success.

- [ ] **Step 7: Implement phone-first editor components**

Use exercise cards and set rows rather than a table. Every exercise/set action has an accessible label. The exercise picker searches localized built-in names and custom names and exposes an inline Create action when no exact match exists. Its custom form requires a trimmed name and one muscle group, calls `ExerciseRepository.createCustom`, refreshes the catalog, and returns the created exercise to the editor. Inputs use decimal keyboard for weight and numeric keyboard for repetitions. The persistent Save bar adds the current bottom safe-area inset and moves above the keyboard.

- [ ] **Step 8: Wire create and edit routes**

`new.tsx` renders `ProgramEditorScreen` without an ID. `[programId].tsx` reads the typed route parameter and loads the aggregate before rendering the editor. Missing IDs render a localized not-found state with Close, not a blank screen.

- [ ] **Step 9: Run feature tests and all checks**

Run: `npm.cmd test -- src/features/programs`, then `npm.cmd run check`.

Expected: all list/editor tests pass and the combined lint, typecheck, and test command exits 0.

- [ ] **Step 10: Commit**

```powershell
git add src/features/programs src/shared/ui src/app/programs "src/app/(tabs)/programs.tsx"
git commit -m "feat: add offline workout program management"
```

### Task 9: Add settings UI and verify the first vertical increment on devices

**Files:**
- Create: `src/features/settings/settings-screen.tsx`
- Create: `src/app/settings.tsx`
- Test: `src/features/settings/settings-screen.test.tsx`
- Modify: `README.md`

- [ ] **Step 1: Write failing settings-screen tests**

Render each preference value and assert:

- language changes immediately call `setLanguage` and update visible translated labels;
- unit change calls `setWeightUnit` without modifying repository data;
- theme offers System, Light, and Dark and calls `setThemeMode`;
- backup and destructive-data sections are absent from this increment rather than showing non-functional controls;
- Close navigates back.

- [ ] **Step 2: Run the test to verify failure**

Run: `npm.cmd test -- src/features/settings/settings-screen.test.tsx`

Expected: FAIL because the screen does not exist.

- [ ] **Step 3: Implement settings and route**

Use the shared `Screen` and `AppHeader`, native-accessible segmented choices or radio rows, and semantic theme colors. The screen contains exactly Language, Weight unit, and Theme sections in this increment.

- [ ] **Step 4: Document exact development and verification commands**

Replace scaffold README content with:

````md
# FitnessMate Mobile

Offline Android and iOS workout tracking built with Expo and React Native.

## Development

```powershell
npm.cmd install
npm.cmd start
```

## Checks

```powershell
npm.cmd run check
npx.cmd expo-doctor
```

## Device verification

Verify Android and iOS with gesture navigation, an Android three-button navigation device, a notched iPhone, light/dark/system themes, Russian/English, kg/lb, and the on-screen keyboard open in the program editor.
````

- [ ] **Step 5: Run automated release checks**

Run: `npm.cmd run check` and `npx.cmd expo-doctor`

Expected: lint, TypeScript, Jest, and Expo Doctor all exit 0 with no actionable compatibility findings.

- [ ] **Step 6: Run an Android smoke test**

Start the app using `npm.cmd run android` on an emulator or connected device. Verify database bootstrap, all five tabs, safe top/bottom spacing, program create/edit/duplicate/delete/reorder, Russian/English, kg/lb conversion, light/dark/system themes, app restart persistence, and keyboard avoidance.

Expected: all flows work offline and no control appears beneath the status or navigation bars.

- [ ] **Step 7: Run an iOS smoke test when a macOS/iOS build environment is available**

Run `npm run ios` on macOS or create an Expo development build for a physical iPhone. Repeat the Android smoke matrix, specifically checking a notched device and the home indicator.

Expected: behavior and persisted data semantics match Android. If an iOS environment is unavailable during this increment, record the unverified device matrix explicitly in the handoff rather than claiming cross-platform verification.

- [ ] **Step 8: Commit**

```powershell
git add src/features/settings src/app/settings.tsx README.md
git commit -m "feat: add mobile preferences settings"
```

- [ ] **Step 9: Review the diff and repository state**

Run: `git diff main~9..HEAD --check` and `git status --short`

Expected: no whitespace errors; working tree is clean; `.superpowers/` is ignored.
