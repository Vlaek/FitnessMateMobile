# Telegram Workout Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable report screen for one or more selected completed workouts, with grouped sets, direct Telegram Bot API delivery, and native sharing.

**Architecture:** Keep report formatting, transient selection, credential storage, and Telegram transport in separate focused modules. History and workout detail only create an in-memory report draft; the report route loads full workouts and owns preview/delivery state; Settings owns secure credentials.

**Tech Stack:** Expo 57, Expo Router, React Native, TypeScript, Zustand, expo-secure-store, expo-sqlite KV storage, i18next, Jest, Testing Library.

---

## File Map

Create:

- `src/features/reports/report-generator.ts` — deterministic grouping, sorting, and text formatting.
- `src/features/reports/report-generator.test.ts` — report-format unit coverage.
- `src/features/reports/report-draft-store.ts` — non-persisted selected workout IDs.
- `src/features/reports/report-draft-store.test.ts` — order and duplicate normalization.
- `src/features/reports/telegram-credentials.ts` — secure token and local Chat ID repository.
- `src/features/reports/telegram-credentials.test.ts` — credential persistence tests.
- `src/features/reports/telegram-service.ts` — Telegram Bot API transport.
- `src/features/reports/telegram-service.test.ts` — transport response tests.
- `src/features/reports/report-screen.tsx` — fields, sort choice, preview, limit, and delivery.
- `src/features/reports/report-screen.test.tsx` — report screen interactions.
- `src/app/reports/new.tsx` — Expo Router entry.
- `src/app/(tabs)/history.test.tsx` — History multi-select coverage.

Modify:

- `package.json` and `package-lock.json` — add the SDK-compatible secure-store package.
- `src/database/repositories/workout-repository.ts` — batch completed-workout loading and two text regressions.
- `src/database/repositories/workout-repository.test.ts` — repository and regression tests.
- `src/app/(tabs)/history.tsx` — report selection mode.
- `src/features/history/workout-detail-screen.tsx` — start a one-workout report.
- `src/features/history/workout-detail-screen.test.tsx` — route integration assertion.
- `src/features/settings/settings-screen.tsx` — Telegram credential controls and reset integration.
- `src/features/settings/settings-screen.test.tsx` — settings behavior.
- `src/features/backup/backup-service.ts` — clear Telegram credentials with all app data.
- `src/features/backup/backup-service.test.ts` — clear-data dependency test.
- `src/shared/i18n/locales/en.ts` and `src/shared/i18n/locales/ru.ts` — localized UI/report strings.
- `src/app/_layout.tsx` — register the report route.

### Task 1: Install secure credential storage

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Add the Expo SDK-compatible dependency**

Run:

```powershell
npx.cmd expo install expo-secure-store
```

Expected: `expo-secure-store` is added at the version selected by Expo SDK 57.

- [ ] **Step 2: Verify dependency compatibility**

Run:

```powershell
npx.cmd expo-doctor
```

Expected: all checks pass.

- [ ] **Step 3: Commit**

```powershell
git add package.json package-lock.json
git commit -m "build: add secure Telegram credential storage"
```

### Task 2: Implement deterministic report generation

**Files:**

- Create: `src/features/reports/report-generator.test.ts`
- Create: `src/features/reports/report-generator.ts`

- [ ] **Step 1: Write failing grouping and formatting tests**

Create fixtures with completed, incomplete, repeated, non-adjacent, different-weight,
and zero-weight sets. Assert complete output, including reset numbering:

```ts
expect(
  generateWorkoutReport({
    workouts: [workout],
    selectionOrder: ['workout-1'],
    sortMode: 'selection',
    title: 'Weekly title',
    description: '',
    weightUnit: 'kg',
    locale: 'en-US',
    labels,
  }),
).toBe(
  [
    'Weekly title',
    '',
    'NewMeta - Back focus',
    '',
    '1. Bench press - 3 × 10 × 80 kg',
    '2. Bench press - 1 × 8 × 80 kg',
    '3. Hyperextension - 3 × 10',
    '',
    'Total output: 3,040 kg',
  ].join('\n'),
);
```

Add separate tests for `lb`, whitespace-only metadata, incomplete sets, no completed
sets, stable date sorting, and the exact 4096-character boundary helper.

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm.cmd test -- --runTestsByPath src/features/reports/report-generator.test.ts
```

Expected: FAIL because `report-generator` does not exist.

- [ ] **Step 3: Implement the report model and generator**

Define:

```ts
export type TReportSortMode = 'selection' | 'date';

export interface IReportLabels {
  totalOutput: string;
  noCompletedSets: string;
  unit: string;
  exerciseName: (key: string) => string;
}

export interface IGenerateWorkoutReportOptions {
  workouts: TWorkout[];
  selectionOrder: string[];
  sortMode: TReportSortMode;
  title: string;
  description: string;
  weightUnit: TWeightUnit;
  locale: string;
  labels: IReportLabels;
}

export const TELEGRAM_MESSAGE_LIMIT = 4096;
export const isTelegramMessageTooLong = (text: string) =>
  text.length > TELEGRAM_MESSAGE_LIMIT;
```

Implement exact `(repetitions, weightKg)` grouping per exercise using a `Map`, only
completed sets, first-seen group order, `fromCanonicalKg`, locale-aware number
formatting, stable selection/date sorting, and trimming of optional metadata.

- [ ] **Step 4: Run the focused test**

Run:

```powershell
npm.cmd test -- --runTestsByPath src/features/reports/report-generator.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/reports/report-generator.ts src/features/reports/report-generator.test.ts
git commit -m "feat: generate grouped workout reports"
```

### Task 3: Add transient report drafts

**Files:**

- Create: `src/features/reports/report-draft-store.test.ts`
- Create: `src/features/reports/report-draft-store.ts`

- [ ] **Step 1: Write a failing store test**

```ts
const store = createReportDraftStore();
store.getState().setWorkoutIds(['w2', 'w1', 'w2']);
expect(store.getState().workoutIds).toEqual(['w2', 'w1']);
store.getState().clear();
expect(store.getState().workoutIds).toEqual([]);
```

- [ ] **Step 2: Verify failure**

Run:

```powershell
npm.cmd test -- --runTestsByPath src/features/reports/report-draft-store.test.ts
```

Expected: FAIL because the store does not exist.

- [ ] **Step 3: Implement the non-persisted Zustand store**

```ts
export interface IReportDraftState {
  workoutIds: string[];
  setWorkoutIds: (ids: string[]) => void;
  clear: () => void;
}
```

Use `createStore` from `zustand/vanilla`, expose the store plus a selector hook with
`useStore`, and normalize duplicate IDs to their first occurrence. Do not use
persist middleware.

- [ ] **Step 4: Run and commit**

```powershell
npm.cmd test -- --runTestsByPath src/features/reports/report-draft-store.test.ts
git add src/features/reports/report-draft-store.ts src/features/reports/report-draft-store.test.ts
git commit -m "feat: add transient workout report drafts"
```

Expected: PASS, then one focused commit.

### Task 4: Load complete workouts and fix user-facing regressions

**Files:**

- Modify: `src/database/repositories/workout-repository.test.ts`
- Modify: `src/database/repositories/workout-repository.ts`

- [ ] **Step 1: Write failing repository tests**

Add tests proving:

```ts
await expect(repository.startEmpty('   ')).resolves.toMatchObject({ name: 'Workout' });
await expect(repository.startFromProgram('missing')).rejects.toThrow(
  'Program not found or empty',
);
```

Test `getCompletedByIds(['w2', 'w1', 'w2'])` returns exactly `w2`, then `w1`, and
throws `Completed workout not found: w1` when a requested record is missing,
draft, or has a null `completedAt`.

- [ ] **Step 2: Verify failure**

Run:

```powershell
npm.cmd test -- --runTestsByPath src/database/repositories/workout-repository.test.ts
```

Expected: FAIL on the prefixed strings and missing batch method.

- [ ] **Step 3: Implement the minimal repository change**

Extend `IWorkoutRepository` with:

```ts
getCompletedByIds(ids: string[]): Promise<TWorkout[]>;
```

Normalize IDs, call `getById` in requested order, validate
`workout?.status === 'completed' && workout.completedAt`, and throw the explicit
error for invalid entries. Restore the two strings without unrelated changes.

- [ ] **Step 4: Run and commit**

```powershell
npm.cmd test -- --runTestsByPath src/database/repositories/workout-repository.test.ts
git add src/database/repositories/workout-repository.ts src/database/repositories/workout-repository.test.ts
git commit -m "feat: load completed workouts for reports"
```

Expected: PASS, then one focused commit.

### Task 5: Store Telegram credentials securely

**Files:**

- Create: `src/features/reports/telegram-credentials.test.ts`
- Create: `src/features/reports/telegram-credentials.ts`

- [ ] **Step 1: Write failing storage-contract tests**

Use injected async adapters and assert:

```ts
await repository.save({ token: ' bot-token ', chatId: ' -1001 ' });
await expect(repository.load()).resolves.toEqual({
  token: 'bot-token',
  chatId: '-1001',
});
expect(await repository.isConfigured()).toBe(true);
await repository.clear();
expect(await repository.isConfigured()).toBe(false);
```

Also assert that either blank value makes `isConfigured()` false.

- [ ] **Step 2: Verify failure**

Run:

```powershell
npm.cmd test -- --runTestsByPath src/features/reports/telegram-credentials.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the credential repository**

Define:

```ts
export interface ITelegramCredentials {
  token: string;
  chatId: string;
}

export interface IAsyncKeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
```

Create `TelegramCredentialsRepository` with injected secure and ordinary storage.
The production instance adapts `expo-secure-store` for the token and
`expo-sqlite/kv-store` for the Chat ID. Never persist the token in Zustand or
SQLite KV storage.

- [ ] **Step 4: Run and commit**

```powershell
npm.cmd test -- --runTestsByPath src/features/reports/telegram-credentials.test.ts
git add src/features/reports/telegram-credentials.ts src/features/reports/telegram-credentials.test.ts
git commit -m "feat: store Telegram credentials securely"
```

Expected: PASS, then one focused commit.

### Task 6: Implement Telegram Bot API transport

**Files:**

- Create: `src/features/reports/telegram-service.test.ts`
- Create: `src/features/reports/telegram-service.ts`

- [ ] **Step 1: Write failing transport tests**

Inject a `fetch` function and assert the service sends:

```ts
expect(fetchMock).toHaveBeenCalledWith(
  'https://api.telegram.org/botsecret/sendMessage',
  expect.objectContaining({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: '-1001', text: 'report' }),
  }),
);
```

Cover `{ ok: true }`, HTTP failure, Telegram `{ ok: false, description }`, invalid
JSON, and network rejection. Assert the token is absent from returned error text.

- [ ] **Step 2: Verify failure**

Run:

```powershell
npm.cmd test -- --runTestsByPath src/features/reports/telegram-service.test.ts
```

Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement typed delivery**

Define:

```ts
export type TTelegramSendResult =
  | { ok: true }
  | { ok: false; reason: 'network' | 'rejected' | 'invalid-response'; message?: string };

export async function sendTelegramMessage(
  credentials: ITelegramCredentials,
  text: string,
  fetcher: typeof fetch = fetch,
): Promise<TTelegramSendResult>;
```

Do not send `parse_mode`. Validate `response.ok`, JSON shape, and Telegram's `ok`
field. Map thrown errors to `network` without logging credentials.

- [ ] **Step 4: Run and commit**

```powershell
npm.cmd test -- --runTestsByPath src/features/reports/telegram-service.test.ts
git add src/features/reports/telegram-service.ts src/features/reports/telegram-service.test.ts
git commit -m "feat: send reports through Telegram bot"
```

Expected: PASS, then one focused commit.

### Task 7: Build and route the report screen

**Files:**

- Create: `src/features/reports/report-screen.test.tsx`
- Create: `src/features/reports/report-screen.tsx`
- Create: `src/app/reports/new.tsx`
- Modify: `src/app/_layout.tsx`
- Modify: `src/shared/i18n/locales/en.ts`
- Modify: `src/shared/i18n/locales/ru.ts`

- [ ] **Step 1: Write failing report-screen tests**

Mock the repository, credential repository, Telegram service, and `Share.share`.
Assert that the screen:

- loads IDs from the draft store;
- renders optional title and multiline description fields;
- updates preview text live;
- defaults to selection order and switches to date order;
- shows the character count;
- warns and disables direct send above 4096 characters;
- keeps native Share enabled above the limit;
- routes to Settings when credentials are absent;
- blocks a second send while the first is pending;
- shows success and mapped failure alerts;
- clears the draft on explicit back/cancel.

Representative interaction:

```ts
fireEvent.changeText(view.getByLabelText('Title'), 'Weekly title');
fireEvent.press(view.getByText('By date'));
expect(view.getByTestId('report-preview')).toHaveTextContent('Weekly title');
fireEvent.press(view.getByText('Share'));
expect(Share.share).toHaveBeenCalledWith({
  title: 'Weekly title',
  message: expect.stringContaining('Weekly title'),
});
```

- [ ] **Step 2: Verify failure**

Run:

```powershell
npm.cmd test -- --runTestsByPath src/features/reports/report-screen.test.tsx
```

Expected: FAIL because the screen and route do not exist.

- [ ] **Step 3: Implement the screen**

Use `Screen scroll keyboardAware`, `TextField`, `Button`, and existing theme
patterns. Keep `title`, `description`, `sortMode`, `loading`, `sending`, and
load/send errors as screen-local state. Generate one `reportText` with `useMemo`
and use it for preview, count, Telegram, and Share.

Call `workoutRepository.getCompletedByIds(workoutIds)`. If the draft is empty or
loading fails, show `ErrorScreen` with a return action. Preserve the draft while
navigating to Settings so the user can return and send; clear it only when the
report flow is explicitly exited.

- [ ] **Step 4: Add the route and translations**

`src/app/reports/new.tsx` renders `<ReportScreen />`. Register
`reports/new` as a modal Stack route. Add matching `reports` and Telegram settings
translation keys to both locales, including labels, warnings, success, transport
errors, no-completed-sets, and total output.

- [ ] **Step 5: Run and commit**

```powershell
npm.cmd test -- --runTestsByPath src/features/reports/report-screen.test.tsx
git add src/features/reports/report-screen.tsx src/features/reports/report-screen.test.tsx src/app/reports/new.tsx src/app/_layout.tsx src/shared/i18n/locales/en.ts src/shared/i18n/locales/ru.ts
git commit -m "feat: add workout report builder"
```

Expected: PASS, then one focused commit.

### Task 8: Add History selection and single-workout entry

**Files:**

- Create: `src/app/(tabs)/history.test.tsx`
- Modify: `src/app/(tabs)/history.tsx`
- Modify: `src/features/history/workout-detail-screen.test.tsx`
- Modify: `src/features/history/workout-detail-screen.tsx`

- [ ] **Step 1: Write failing History selection tests**

Mock completed summaries and Expo Router. Assert:

- `Create report` enables selection mode;
- taps produce visible `1` and `2` selection badges;
- deselecting renumbers remaining cards;
- `Continue` is disabled with no selection;
- `Continue` writes ordered IDs and opens `/reports/new`;
- `Cancel` clears selection and returns to normal navigation behavior.

- [ ] **Step 2: Write the failing detail-entry test**

Press `Create report` in `WorkoutDetailScreen` and assert:

```ts
expect(reportDraftStore.getState().workoutIds).toEqual(['workout-1']);
expect(router.push).toHaveBeenCalledWith('/reports/new');
```

Assert the previous generic `Share` button is absent.

- [ ] **Step 3: Verify both tests fail**

Run:

```powershell
npm.cmd test -- --runTestsByPath "src/app/(tabs)/history.test.tsx" src/features/history/workout-detail-screen.test.tsx
```

Expected: FAIL because report entry actions are missing.

- [ ] **Step 4: Implement History selection**

Add local `selectionMode` and ordered `selectedIds`. In selection mode, card presses
toggle IDs instead of routing. Display a numbered badge from
`selectedIds.indexOf(item.id) + 1`. On continue, set the draft store and push the
report route.

- [ ] **Step 5: Implement detail entry**

Remove the local `Share` formatter and React Native Share import. Replace the
button with `Create report`, set `['workoutId']` in the draft store, and push
`/reports/new`.

- [ ] **Step 6: Run and commit**

```powershell
npm.cmd test -- --runTestsByPath "src/app/(tabs)/history.test.tsx" src/features/history/workout-detail-screen.test.tsx
git add "src/app/(tabs)/history.tsx" "src/app/(tabs)/history.test.tsx" src/features/history/workout-detail-screen.tsx src/features/history/workout-detail-screen.test.tsx
git commit -m "feat: select workouts for reports"
```

Expected: PASS, then one focused commit.

### Task 9: Add Telegram settings and clear-data integration

**Files:**

- Modify: `src/features/settings/settings-screen.test.tsx`
- Modify: `src/features/settings/settings-screen.tsx`
- Modify: `src/features/backup/backup-service.test.ts`
- Modify: `src/features/backup/backup-service.ts`

- [ ] **Step 1: Write failing Settings tests**

Mock the credential repository. Assert that Settings loads saved values, masks the
token by default, toggles visibility, saves trimmed values, reports configured
state, and clears both fields after reset.

```ts
expect(view.getByLabelText('Bot token').props.secureTextEntry).toBe(true);
fireEvent.changeText(view.getByLabelText('Bot token'), ' secret ');
fireEvent.changeText(view.getByLabelText('Chat ID'), ' -1001 ');
fireEvent.press(view.getByText('Save Telegram settings'));
expect(telegramCredentials.save).toHaveBeenCalledWith({
  token: 'secret',
  chatId: '-1001',
});
```

- [ ] **Step 2: Write the failing clear-data test**

Refactor `clearAllData` to accept a credential-clear dependency in tests, then
assert it runs after the database transaction:

```ts
await clearAllData(db, clearTelegram);
expect(clearTelegram).toHaveBeenCalledTimes(1);
```

- [ ] **Step 3: Verify failure**

Run:

```powershell
npm.cmd test -- --runTestsByPath src/features/settings/settings-screen.test.tsx src/features/backup/backup-service.test.ts
```

Expected: FAIL because Telegram settings and credential clearing are absent.

- [ ] **Step 4: Implement Settings controls**

Add a spaced Telegram section using `TextField` for token and Chat ID, a
show/hide Pressable, configured status, save button, and reset button. Load
credentials on mount, keep edits local until saved, disable submission while
saving, and map storage failures to localized alerts.

- [ ] **Step 5: Clear credentials with all data**

Give `clearAllData` a default second dependency:

```ts
export async function clearAllData(
  db: IDatabaseAdapter = database,
  clearTelegram: () => Promise<void> = () => telegramCredentials.clear(),
): Promise<void>
```

Run `clearTelegram()` after the successful database transaction. Settings' clear
action continues to reset preferences after `clearAllData` resolves.

- [ ] **Step 6: Run and commit**

```powershell
npm.cmd test -- --runTestsByPath src/features/settings/settings-screen.test.tsx src/features/backup/backup-service.test.ts
git add src/features/settings/settings-screen.tsx src/features/settings/settings-screen.test.tsx src/features/backup/backup-service.ts src/features/backup/backup-service.test.ts
git commit -m "feat: configure Telegram workout reports"
```

Expected: PASS, then one focused commit.

### Task 10: Verify the complete feature

**Files:**

- Verify all files changed by Tasks 1–9.

- [ ] **Step 1: Run report and integration tests together**

Run:

```powershell
npm.cmd test -- --runTestsByPath src/features/reports/report-generator.test.ts src/features/reports/report-draft-store.test.ts src/features/reports/telegram-credentials.test.ts src/features/reports/telegram-service.test.ts src/features/reports/report-screen.test.tsx "src/app/(tabs)/history.test.tsx" src/features/history/workout-detail-screen.test.tsx src/features/settings/settings-screen.test.tsx src/features/backup/backup-service.test.ts src/database/repositories/workout-repository.test.ts
```

Expected: all focused suites pass.

- [ ] **Step 2: Run the full repository check**

Run:

```powershell
npm.cmd run check
```

Expected: Prettier, TypeScript, ESLint, and all Jest suites pass.

- [ ] **Step 3: Run Expo Doctor**

Run:

```powershell
npx.cmd expo-doctor
```

Expected: all checks pass.

- [ ] **Step 4: Inspect the final diff**

Run:

```powershell
git diff --check
git status --short
git log --oneline -12
```

Expected: no whitespace errors; only the user-owned untracked `TODOS.md` remains
outside committed work; no push has occurred.

If a verification command fails, return to the task that owns the failing
behavior, correct that task's named files, rerun its focused test, and repeat this
verification task from Step 1.
