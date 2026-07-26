# Telegram Workout Reports Design

## Goal

Add a report builder for one or more completed workouts. A user can select workouts
from History, add an optional report title and description, preview the generated
text, and either send it directly through a configured Telegram bot or open the
native share sheet.

The report is not limited to a calendar week or rolling seven-day period. It
contains any completed workouts explicitly selected by the user.

## User Experience

### Selecting workouts

The History screen gains a `Create report` action. Activating it switches the list
into multi-select mode:

- tapping a workout selects or deselects it;
- each selected card displays its selection number;
- selection numbers make the chosen order visible;
- `Continue` is enabled after at least one workout is selected;
- `Cancel` exits selection mode and clears the draft selection.

The order in which workouts are selected is retained as report draft data.

The completed-workout detail screen replaces its current generic `Share` action
with `Create report`. This opens the same report builder with that workout already
selected.

### Report builder

The report builder is a dedicated route shared by the single-workout and
multi-workout flows. It contains:

- an optional single-line `Title` field;
- an optional multiline `Description` field;
- a `Sorting` choice with `Selection order` as the default and `By date` as the
  alternative;
- a live text preview;
- a character counter and Telegram length warning;
- `Send to Telegram`, `Share`, and `Go back` actions.

`By date` sorts workouts from the earliest start time to the latest. If two
workouts have the same start time, their selection order is the stable
tie-breaker. Switching sorting modes does not mutate the underlying selection
order.

The draft is screen-local and is discarded when the user leaves the builder. It
is not restored after an application restart.

### Telegram settings

Settings gains a Telegram section with:

- a bot token field with show/hide control;
- a Chat ID field;
- save and remove/reset actions;
- a configured/unconfigured status.

The bot token is stored with `expo-secure-store`. The Chat ID may be stored in the
existing local preferences storage. Clearing application data also clears both
Telegram values.

If direct sending is requested while Telegram is not fully configured, the app
shows an explanation with an action to open Settings.

## Report Format

The report generator is a pure domain utility. The same plain-text result is used
by the Telegram service, native share sheet, preview, character counter, and
tests.

The output is assembled in this order:

1. non-empty report title;
2. non-empty report description;
3. selected workouts in the active sorting mode.

Empty title or description fields are omitted completely, including their
separator lines. Workouts are separated by one blank line.

Each workout contains:

1. its stored workout name;
2. its exercise-set groups, numbered from 1 for that workout;
3. its total volume as `Total output: 3 990 kg`, localized through i18n.

Only completed sets are included. Within each workout, exercises retain their
stored order. Sets are grouped within an exercise by exact equality of both
repetition count and canonical weight. Groups retain the order in which their
first matching set appeared.

For example, sets `10 × 80`, `10 × 80`, `8 × 80`, and `10 × 80` become:

```text
1. Bench press - 3 × 10 × 80 kg
2. Bench press - 1 × 8 × 80 kg
```

A zero-weight/bodyweight group omits the weight component:

```text
3. Hyperextension - 3 × 10
```

Weights and total volume are converted from canonical kilograms into the user's
selected unit. Displayed values use the existing unit formatting rules. Large
totals use locale-aware thousands separators. Russian and English labels come
from the existing i18n system.

## Telegram Delivery

Direct delivery calls the Telegram Bot API `sendMessage` endpoint over HTTPS. The
request sends plain text and does not enable an HTML or Markdown parse mode. This
prevents user-entered workout names, titles, and descriptions from breaking the
request through unescaped markup.

Telegram text messages have a 4096-character maximum. When the generated report
exceeds that length:

- a visible warning explains the limit;
- direct Telegram delivery is disabled;
- the report is never silently truncated or split;
- native `Share` remains available, while the warning remains visible because a
  user may still choose Telegram as the share target.

While a direct send is in progress, repeated submissions are blocked. A
successful response shows confirmation. Network failure, invalid credentials,
invalid Chat ID, Telegram API rejection, and unavailable secure storage produce
localized user-facing errors. Bot tokens are never included in logs or displayed
error details.

The existing native share action uses React Native's share sheet with the exact
preview text.

## Architecture

### Report generator

A focused report module accepts:

- fully loaded workouts;
- the original selection order;
- sort mode;
- optional title and description;
- display weight unit;
- localized labels/formatting dependencies.

It returns deterministic plain text. Grouping, formatting, and sorting remain
independent of React, navigation, storage, and network calls.

### Workout loading

The workout repository gains a batch-loading operation for completed workouts.
The report screen supplies selected IDs and receives full workouts with exercises
and sets. Missing or no-longer-completed workouts produce an explicit loading
error rather than a partial, misleading report.

Selected IDs are transferred to the report route through a small in-memory draft
store so the URL does not contain a potentially long serialized list. The store
is cleared after consumption or cancellation and is not persisted.

### Telegram credentials

A dedicated Telegram settings module owns credential loading, saving, reset, and
configured-state calculation. The secure token and ordinary Chat ID are exposed
to UI and delivery code through a narrow API. The existing general preferences
store does not persist the token.

### Telegram service

The service accepts message text and credentials, performs the Bot API request,
validates both HTTP and Telegram response payloads, and returns typed success or
failure data suitable for localization by the UI.

### Screens

History owns only selection-mode interaction and creating the draft. The report
builder owns draft fields, sort choice, preview, limit state, and delivery
actions. Settings owns credential editing. The workout detail screen only starts
a single-workout report draft.

## Error and Edge-Case Handling

- No selected workout: `Continue` remains disabled.
- Workout deleted between selection and loading: show a loading error and allow
  the user to return to History.
- Workout with no completed sets: keep the workout section and show a localized
  no-completed-sets line with zero total volume.
- Duplicate selected ID: normalize to its first occurrence.
- Empty or whitespace-only title/description: treat as absent.
- Telegram not configured: offer navigation to Settings.
- Report over 4096 characters: warn and disable only direct Telegram sending.
- Direct send already running: ignore repeated submission.
- Share sheet dismissed: do not show an error.

## Testing

Unit tests cover:

- grouping by repetitions and weight;
- non-adjacent identical sets combining into one group;
- group order based on first occurrence;
- exercise and workout boundaries;
- zero-weight formatting;
- completed-set filtering;
- optional title and description;
- kilograms and pounds;
- selection-order and stable date sorting;
- localized totals and whitespace;
- the 4096-character boundary;
- Telegram service success, transport failure, and API rejection;
- secure credential save, load, configured state, and reset;
- batch workout loading and missing-workout behavior.

Component tests cover:

- entering, changing, and cancelling History selection mode;
- visible selection numbering;
- single-workout report entry;
- live preview updates;
- sorting changes;
- over-limit warning and direct-send disabled state;
- unconfigured Telegram navigation;
- in-progress and successful send states;
- native share invocation with the preview text;
- Telegram settings save, visibility, and reset controls.

The final verification runs formatting, TypeScript, ESLint, Jest, and Expo Doctor.
No device or browser launch is required unless the user later requests it.

## Targeted Regression Correction

The implementation also restores two user-facing strings accidentally changed by
the earlier type-prefix migration:

- default workout name `TWorkout` becomes `Workout`;
- error text `TProgram not found or empty` becomes `Program not found or empty`.

Regression tests assert the restored values. No broader unrelated refactoring is
included.
