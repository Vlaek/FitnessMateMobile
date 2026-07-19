# FitnessMate Mobile — Design Specification

Date: 2026-07-20
Status: ready for user review

## 1. Product goal

FitnessMate Mobile is a fully offline workout tracker for Android and iOS. It adapts the useful concepts from FitnessMateWeb to a phone-first workflow without requiring Telegram, an account, a backend, or an internet connection.

The first release lets a user maintain flat workout programs, perform a workout set by set, keep and edit history, view basic progress analytics, share an individual workout through the operating-system share sheet, back up selected data to a file, restore data from a file, and clear local data.

## 2. Scope

### Included

- Android and iOS from one React Native codebase.
- Built-in exercise catalog plus custom exercises.
- Flat list of independent workout programs, matching the conceptual model in FitnessMateWeb.
- Planned exercises and individual planned sets in each program.
- Active workout with individual actual sets: weight, repetitions, completion state, and order.
- Automatic draft persistence and recovery after the app is closed or interrupted.
- Completed workout history with view, edit, delete, and system sharing.
- Basic analytics: workout count, weekly volume, exercise weight/volume trend, and personal records.
- Russian and English UI.
- Kilograms and pounds, selectable in settings.
- Light and dark themes, following the system by default.
- Selective backup of programs, history, or all data.
- Import with merge or replace semantics.
- Selective clearing of programs or history and a full local-data reset.
- Safe-area and keyboard-aware layouts on Android and iOS.

### Excluded from the first release

- Accounts, backend APIs, cloud synchronization, and telemetry that requires a network.
- Telegram-specific configuration or sending.
- Rest timers and timer notifications.
- Body weight, body-fat, muscle-mass, or other body-measurement tracking.
- Calendar scheduling or multi-day program hierarchy.
- Photos and random images attached to workouts.
- German localization.
- Web support as a release target.

## 3. Technology and architecture

Use the latest mutually compatible stable versions available at implementation time:

- Expo and React Native with TypeScript.
- Expo Router for file-based routing, tab navigation, stacks, and modal routes.
- `expo-sqlite` as the authoritative persistent store.
- Zustand only for transient UI state, current selections, filters, and an in-memory mirror of the active workout.
- Zod for backup-file and boundary validation.
- Expo file/document/sharing APIs for import, export, and system sharing.
- `react-native-safe-area-context` for system insets.
- An i18n layer for Russian and English resources.

The project is organized by responsibility:

- `src/app/`: routes and navigation composition.
- `src/features/`: programs, workout session, history, progress, backup, and settings.
- `src/domain/`: models, calculations, validation rules, unit conversion, and record detection.
- `src/database/`: schema, migrations, transactions, repositories, and seed data.
- `src/shared/`: reusable UI, theme tokens, localization, safe-area layouts, and utilities.

Route components remain thin. They compose feature screens and do not contain SQL or analytics logic. Features depend on repository interfaces rather than issuing database queries directly. Domain calculations remain pure and independently testable.

SQLite uses foreign keys, versioned migrations, transactions for multi-record writes, parameterized statements for user data, and WAL mode when supported by the selected Expo SQLite version.

## 4. Navigation and screens

Use the approved navigation option B. The bottom navigation contains five destinations:

1. Home
2. Programs
3. A visually prominent central Start action
4. History
5. Progress

Settings open from a top-right action rather than occupying a sixth tab.

### Home

- Last completed workout summary.
- Current-week workout count and volume summary.
- Resume-draft card when a draft exists.
- Shortcuts to start a workout and create a program.
- Useful empty states for a new installation.

### Programs

- Ordered list of independent programs.
- Create, edit, duplicate, reorder, and delete.
- Program editor with name, optional description, exercises, and planned individual sets.
- Exercise selection from the built-in and custom catalog.

### Start and active workout

- Start from a program or begin an empty workout.
- Create a draft immediately before navigating to the active session.
- Show exercises as phone-friendly cards rather than a desktop table.
- Each set has weight, repetitions, completion toggle, and ordering.
- Add, duplicate, reorder, or remove exercises and sets.
- Autosave every meaningful edit using a short debounce and flush pending changes when the app backgrounds.
- Resume the sole active draft after interruption.
- Finish converts the draft to a completed workout after confirmation.
- Discard requires explicit confirmation.

Only one active draft is allowed in the first release. Starting another workout while a draft exists offers Resume or Discard and start new.

### History

- Reverse-chronological completed-workout list.
- Search by workout or exercise name and filter by date range.
- Detail screen with totals and set results.
- Edit through a transaction, delete after confirmation, and share a localized text summary through the system share sheet.

### Progress

- Total completed workouts.
- Current-week volume and navigation across earlier weeks.
- Exercise selector with weight and volume trend.
- Personal records for maximum lifted weight, maximum set volume, and maximum workout volume for the selected exercise.
- Empty and insufficient-data states instead of misleading zero-value charts.

### Settings

- Language: Russian or English.
- Units: kilograms or pounds.
- Theme: system, light, or dark.
- Export and import.
- Clear programs, clear history, or clear all local user data.
- Destructive actions use explicit confirmation and describe what is retained.

## 5. System UI, safe areas, and accessibility

The app must never place interactive content beneath the status bar, display cutout, Dynamic Island, Android navigation buttons, or system gesture indicator.

- Mount one safe-area provider at the app root.
- Navigation containers handle their own tab-bar insets.
- Full-screen and modal screens consume top and bottom insets explicitly when the navigator does not.
- Sticky action bars include the bottom inset rather than adding a fixed magic-number padding.
- Scroll views use inset-aware content padding so their last control remains reachable.
- Forms use keyboard-avoiding behavior appropriate to each platform.
- Test representative devices with notches, gesture navigation, and three-button Android navigation.

Controls meet practical touch-target sizes, expose accessible labels, do not rely on color alone, and remain readable with larger system text. Light and dark themes use semantic design tokens and accessible contrast.

## 6. Data model

All durable entities use UUIDs. Times are stored as ISO timestamps in UTC; date grouping is calculated in the user's local time zone.

Core tables:

- `exercises`: built-in catalog entries and user-created exercises.
- `programs`: program metadata and sort order.
- `program_exercises`: ordered exercise references within a program.
- `program_sets`: ordered planned weight and repetitions for a program exercise.
- `workouts`: draft or completed session metadata, optional source-program reference, name snapshot, start time, completion time, and update time.
- `workout_exercises`: ordered exercise snapshots within a workout.
- `workout_sets`: ordered actual weight, repetitions, and completion state.
- `settings`: local preferences and seed/schema bookkeeping where not better represented by database metadata.

Workout history keeps snapshots of user-visible exercise and workout names. Editing or deleting a program or custom exercise cannot rewrite previous history.

Weights are stored canonically in kilograms as decimal values. Pounds are converted at the input/output boundary. Volume is calculated from completed sets only as `weightKg * repetitions`; total workout volume sums all completed-set volumes. Unit conversion never rewrites stored history.

Personal records are derived from completed workouts and are not separately authoritative:

- maximum weight in a completed set;
- maximum completed-set volume;
- maximum per-workout volume for an exercise.

Deleting a referenced custom exercise is prevented while it is used by a program. Historical snapshots do not prevent catalog deletion.

## 7. Data flow and consistency

### Starting from a program

1. Validate that no other draft exists.
2. Create the workout and copy the program's ordered exercises and planned sets in one transaction.
3. Navigate only after the transaction succeeds.
4. Mirror the new draft in transient state for responsive editing.

### Autosave

- UI edits update transient state immediately.
- A debounced persistence command writes changed rows transactionally.
- App backgrounding and explicit navigation attempt to flush pending writes.
- Returning to the screen reloads the authoritative draft and reconciles transient state.

### Completion

1. Validate the workout name and at least one completed set.
2. Flush pending changes.
3. Set status and completion timestamp in a transaction.
4. Refresh home, history, and progress queries.

Analytics read only completed workouts. Edits to completed history automatically affect derived totals and records.

## 8. Import, export, sharing, and deletion

### Backup format

Export one human-readable, versioned JSON file with:

- format identifier;
- schema version;
- export timestamp;
- originating app version;
- selected sections;
- canonical units metadata;
- programs and required custom exercise dependencies when Programs is selected;
- completed workouts when History is selected;
- preferences and all custom exercises when All data is selected.

Draft workouts are not exported. Built-in exercises are referenced by stable built-in keys rather than duplicated as authoritative catalog data.

### Export

The user selects Programs, History, or All data. The app builds a consistent snapshot, validates it against the export schema, writes it to a temporary file, opens the system share/save sheet, and later removes disposable temporary files when safe.

### Import

1. Pick a JSON file through the system document picker.
2. Read without changing the database.
3. Validate format, supported schema version, types, references, numeric ranges, and duplicate IDs.
4. Present a summary and offer Merge or Replace for the selected sections.
5. Apply the full import in one transaction.
6. Show added, replaced, skipped, and conflicting record counts.

Merge adds unknown UUIDs, skips identical records, and keeps the local version when the same UUID has different content; the result reports those conflicts. Replace deletes only the imported sections before inserting the validated data. A failed import rolls back completely.

Future backup schema versions are rejected with a clear message. Older supported versions pass through explicit backup migrations before validation against the current schema.

### Sharing one workout

Generate a localized plain-text summary from a completed workout and open the operating-system share sheet. There is no Telegram token, chat ID, or Telegram-specific code.

### Clearing data

- Clear Programs removes programs and program membership, but preserves history and the built-in catalog.
- Clear History removes completed workouts, but does not silently discard an active draft.
- Clear All removes all user data, drafts, preferences, and custom exercises, then reseeds the built-in catalog and restores system-derived default settings.

Every destructive operation requires confirmation and runs transactionally.

## 9. Error handling

- Database startup runs migrations before showing the main tabs. A migration failure shows a recoverable blocking screen with retry and diagnostic copy actions; it does not continue against a partial schema.
- Repository failures leave the current screen intact, preserve unsaved transient input when possible, and show a localized actionable message.
- Import validation errors never mutate the database and identify the unsupported or malformed part without exposing raw stack traces.
- Export failures clean up partial temporary files and offer retry.
- Empty states are first-class UI states on Home, Programs, History, and Progress.
- Destructive and completion actions prevent double submission.
- Unexpected rendering errors are caught at route or feature boundaries with retry/navigation options.

No normal feature depends on network availability, and offline mode is not presented as an error state.

## 10. Testing and verification

### Unit tests

- Weight conversion and display rounding.
- Volume and personal-record calculations.
- Backup validation and migration.
- Merge conflict and duplicate behavior.
- Workout completion validation.
- Local-date grouping around time-zone and day boundaries.

### Database integration tests

- Every schema migration from an empty and previous-version database.
- Program creation, duplication, reorder, and deletion rules.
- Draft creation, autosave persistence, resume, completion, and discard.
- Transaction rollback for failed import, replace, and history edits.
- Snapshot independence after editing catalog or program data.

### Component and navigation tests

- Empty and populated states.
- Program editing and active set entry.
- Existing-draft Resume/Discard gate.
- Destructive confirmations.
- Language, unit, and theme switching.
- Keyboard interaction and accessible labels.

### Device verification

- Android and iOS release-like builds.
- Cold start and app termination while a draft is active.
- Import/export using native pickers and share sheets.
- Safe areas on notched iPhones, Android gesture navigation, and Android three-button navigation.
- Light/dark/system themes and larger text sizes.

The implementation is complete only when automated checks pass and the high-risk device workflows above have been exercised.

## 11. Delivery strategy

Implement in vertical increments that keep the app runnable:

1. Expo shell, navigation, theme, localization, safe areas, and database bootstrap.
2. Exercise catalog and program management.
3. Active workout draft, autosave, resume, and completion.
4. History management and system sharing.
5. Analytics and personal records.
6. Backup, restore, selective clearing, and final cross-platform verification.

FitnessMateWeb remains unchanged. Reusable business concepts may be translated, but web UI components and browser-local storage are not imported into the mobile runtime.
