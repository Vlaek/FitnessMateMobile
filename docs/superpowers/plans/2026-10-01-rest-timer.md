# Android Rest Timer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in Android rest timer that starts after completing a set, exposes a stop action in the notification shade, and finishes with a notification.

**Architecture:** Persist the enabled flag and bounded duration in the existing preferences store. Encapsulate all Android notification behavior behind a focused `rest-timer-service`, register its background action once at application startup, and call the service only on an incomplete-to-complete set transition.

**Tech Stack:** Expo SDK 57, React Native, TypeScript, Zustand, `expo-notifications`, `expo-task-manager`, Jest, React Native Testing Library

---

## File structure

- Modify `package.json`, `package-lock.json`, and `app.json`: install and configure notification dependencies.
- Modify `src/features/settings/preferences-store.ts`: persist timer defaults, enabled state, and bounded duration.
- Modify `src/features/settings/preferences-store.test.ts`: verify defaults, updates, reset, and duration bounds.
- Create `src/features/rest-timer/rest-timer-service.ts`: own Android permissions, channel/category registration, notification scheduling, restart, and stop behavior.
- Create `src/features/rest-timer/rest-timer-service.test.ts`: verify platform guards and notification lifecycle.
- Create `src/features/rest-timer/register-rest-timer.ts`: register the background notification-response task once.
- Modify `src/app/_layout.tsx`: import startup registration.
- Modify `src/features/settings/settings-screen.tsx`: render and control the timer settings.
- Modify `src/features/settings/settings-screen.test.tsx`: verify permission-gated enabling and 30-second controls.
- Modify `src/features/workouts/active-workout-screen.tsx`: start the timer only when a set becomes completed.
- Create `src/features/workouts/active-workout-screen.test.tsx`: verify start, restart trigger, and no start on uncheck.
- Modify `src/shared/i18n/locales/en.ts` and `src/shared/i18n/locales/ru.ts`: add settings and notification copy.

### Task 1: Dependencies and persisted preferences

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `app.json`
- Modify: `src/features/settings/preferences-store.ts`
- Test: `src/features/settings/preferences-store.test.ts`

- [ ] **Step 1: Install SDK-compatible notification packages**

Run: `npx expo install expo-notifications expo-task-manager`

Expected: compatible SDK 57 versions appear in `package.json` and `package-lock.json`.

- [ ] **Step 2: Add the notification config plugin**

Add `"expo-notifications"` to `expo.plugins` in `app.json` so native Android builds contain the module.

- [ ] **Step 3: Write failing preference tests**

Add assertions that a new store exposes:

```ts
expect(store.getState()).toMatchObject({
  restTimerEnabled: false,
  restTimerDurationSeconds: 180,
});
```

Then exercise the wished-for API:

```ts
store.getState().setRestTimerEnabled(true);
store.getState().setRestTimerDurationSeconds(10);
expect(store.getState().restTimerEnabled).toBe(true);
expect(store.getState().restTimerDurationSeconds).toBe(30);
store.getState().setRestTimerDurationSeconds(900);
expect(store.getState().restTimerDurationSeconds).toBe(600);
store.getState().reset();
expect(store.getState()).toMatchObject({
  restTimerEnabled: false,
  restTimerDurationSeconds: 180,
});
```

- [ ] **Step 4: Run the test and verify RED**

Run: `npm test -- src/features/settings/preferences-store.test.ts`

Expected: FAIL because the timer preference fields and setters do not exist.

- [ ] **Step 5: Implement bounded persisted preferences**

Extend `TPreferencesState`, the initial state, setters, reset behavior, and `partialize`. Clamp duration with:

```ts
export const MIN_REST_TIMER_SECONDS = 30;
export const MAX_REST_TIMER_SECONDS = 600;
export const DEFAULT_REST_TIMER_SECONDS = 180;

const clampRestTimerDuration = (seconds: number) =>
  Math.min(MAX_REST_TIMER_SECONDS, Math.max(MIN_REST_TIMER_SECONDS, seconds));
```

- [ ] **Step 6: Run the test and verify GREEN**

Run: `npm test -- src/features/settings/preferences-store.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json app.json src/features/settings/preferences-store.ts src/features/settings/preferences-store.test.ts
git commit -m "feat: persist rest timer preferences"
```

### Task 2: Android notification timer service

**Files:**
- Create: `src/features/rest-timer/rest-timer-service.ts`
- Test: `src/features/rest-timer/rest-timer-service.test.ts`

- [ ] **Step 1: Write failing service tests**

Mock `react-native` Platform and `expo-notifications`. Specify these public methods:

```ts
await restTimerService.requestPermission();
await restTimerService.start(180, new Date('2026-10-01T12:00:00Z'));
await restTimerService.stop();
```

Assert that permission succeeds only when Android notification permission is granted; `start` cancels the prior scheduled notification, dismisses the prior active notification, creates the channel/category, immediately presents one notification with `restTimerActive` data and schedules a completion notification; `stop` cancels/dismisses the stored identifiers; and non-Android calls are safe no-ops.

- [ ] **Step 2: Run the service test and verify RED**

Run: `npm test -- src/features/rest-timer/rest-timer-service.test.ts`

Expected: FAIL because `rest-timer-service.ts` does not exist.

- [ ] **Step 3: Implement the minimal service**

Export stable identifiers and an object API:

```ts
export const REST_TIMER_CHANNEL_ID = 'rest-timer';
export const REST_TIMER_CATEGORY_ID = 'resttimer';
export const REST_TIMER_STOP_ACTION_ID = 'stop-rest-timer';

export const restTimerService = {
  requestPermission,
  start,
  stop,
};
```

Keep current notification identifiers in module state. `start` calls `stop`, registers an Android channel and action category, uses `scheduleNotificationAsync` with a `null` trigger for the immediately visible active notification, then schedules the completion notification for `durationSeconds`. Read localized notification copy from the existing `i18n` instance. Catch cleanup failures individually so stale state does not prevent a restart.

- [ ] **Step 4: Run the service test and verify GREEN**

Run: `npm test -- src/features/rest-timer/rest-timer-service.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/rest-timer/rest-timer-service.ts src/features/rest-timer/rest-timer-service.test.ts
git commit -m "feat: add Android rest timer notification service"
```

### Task 3: Background stop action

**Files:**
- Create: `src/features/rest-timer/register-rest-timer.ts`
- Create: `src/features/rest-timer/register-rest-timer.test.ts`
- Modify: `src/app/_layout.tsx`

- [ ] **Step 1: Write the failing registration tests**

Mock `expo-task-manager`, `expo-notifications`, and the service. Verify that module initialization defines and registers one task and that a payload with `actionIdentifier === REST_TIMER_STOP_ACTION_ID` calls `restTimerService.stop()`.

- [ ] **Step 2: Run the registration test and verify RED**

Run: `npm test -- src/features/rest-timer/register-rest-timer.test.ts`

Expected: FAIL because registration is missing.

- [ ] **Step 3: Implement registration and startup import**

At module scope call `TaskManager.defineTask(...)` once, guard Android registration with `Platform.OS`, and export `registerRestTimer()` to call `Notifications.registerTaskAsync`. Import the module from `src/app/_layout.tsx` and invoke registration without blocking render.

- [ ] **Step 4: Run the registration test and verify GREEN**

Run: `npm test -- src/features/rest-timer/register-rest-timer.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/rest-timer/register-rest-timer.ts src/features/rest-timer/register-rest-timer.test.ts src/app/_layout.tsx
git commit -m "feat: handle rest timer stop action"
```

### Task 4: Settings UI and translations

**Files:**
- Modify: `src/features/settings/settings-screen.tsx`
- Modify: `src/features/settings/settings-screen.test.tsx`
- Modify: `src/shared/i18n/locales/en.ts`
- Modify: `src/shared/i18n/locales/ru.ts`

- [ ] **Step 1: Write failing settings tests**

Mock `restTimerService.requestPermission`. Render settings with a reset store and assert the section shows `Rest timer`, `Off`, and `3:00`. Press `Enable`, resolve permission as false, and expect `restTimerEnabled` to stay false. Resolve true, press again, and expect true. Press `−30 sec` and `+30 sec` and assert the visible formatted duration and store value change without crossing 30 or 600.

- [ ] **Step 2: Run the settings test and verify RED**

Run: `npm test -- src/features/settings/settings-screen.test.tsx`

Expected: FAIL because the section and translations are absent.

- [ ] **Step 3: Implement the settings controls and copy**

Add translation keys for title, enabled/disabled states, enable/disable actions, duration controls, permission denial, active notification, stop action, and completion message. Add a focused section using existing `Pressable`/`Button` patterns. Format durations as `m:ss`; disable decrement/increment buttons at the bounds. Enabling awaits `requestPermission`; only persist true on success. Disabling persists false and calls `restTimerService.stop()`.

- [ ] **Step 4: Run the settings test and verify GREEN**

Run: `npm test -- src/features/settings/settings-screen.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/settings/settings-screen.tsx src/features/settings/settings-screen.test.tsx src/shared/i18n/locales/en.ts src/shared/i18n/locales/ru.ts
git commit -m "feat: configure rest timer in settings"
```

### Task 5: Active workout integration

**Files:**
- Modify: `src/features/workouts/active-workout-screen.tsx`
- Create: `src/features/workouts/active-workout-screen.test.tsx`

- [ ] **Step 1: Write failing workout interaction tests**

Mock `useActiveWorkout`, the preferences store, and `restTimerService.start`. Render one incomplete set, press its checkbox, and assert:

```ts
expect(restTimerService.start).toHaveBeenCalledWith(180);
```

Render the same set completed, press the checkbox, and assert `start` was not called. Repeat with the preference disabled and assert no call.

- [ ] **Step 2: Run the workout test and verify RED**

Run: `npm test -- src/features/workouts/active-workout-screen.test.tsx`

Expected: FAIL because completing a set does not invoke the timer service.

- [ ] **Step 3: Implement the completion transition hook**

Read `restTimerEnabled` and `restTimerDurationSeconds` from the preferences store. Replace the checkbox inline callback with a named handler that calculates the next completion value, updates the workout, and invokes `void restTimerService.start(restTimerDurationSeconds)` only when the previous value was false and the next value is true. Catch notification failure so the workout update remains successful.

- [ ] **Step 4: Run the workout test and verify GREEN**

Run: `npm test -- src/features/workouts/active-workout-screen.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/workouts/active-workout-screen.tsx src/features/workouts/active-workout-screen.test.tsx
git commit -m "feat: start rest timer after completed set"
```

### Task 6: Full verification and documentation alignment

**Files:**
- Modify if needed: `README.md`

- [ ] **Step 1: Document Android build behavior**

Add the optional Android rest timer to the feature list and state that notification testing requires a development or production build rather than Expo Go.

- [ ] **Step 2: Run focused tests**

Run: `npm test -- src/features/settings/preferences-store.test.ts src/features/rest-timer/rest-timer-service.test.ts src/features/rest-timer/register-rest-timer.test.ts src/features/settings/settings-screen.test.tsx src/features/workouts/active-workout-screen.test.tsx`

Expected: all suites PASS with no warnings.

- [ ] **Step 3: Run the complete project checks**

Run: `npm run check`

Expected: formatting, TypeScript, ESLint, and all Jest tests PASS.

- [ ] **Step 4: Validate Expo dependencies**

Run: `npx expo-doctor`

Expected: all checks pass.

- [ ] **Step 5: Inspect the final diff**

Run: `git diff --check` and `git status --short`

Expected: no whitespace errors; only intended feature files remain uncommitted.

- [ ] **Step 6: Commit final documentation or verification fixes**

```bash
git add README.md
git commit -m "docs: describe Android rest timer"
```
