# Type Naming and Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Переименовать все проектные интерфейсы и типы с префиксами `I`/`T` и автоматически поддерживать правила пустых строк.

**Architecture:** TypeScript-объявления и все их ссылки переименовываются в пределах проекта без изменения runtime-поведения. ESLint становится источником истины для префиксов и расположения пустых строк, а Prettier продолжает отвечать за механическое форматирование.

**Tech Stack:** TypeScript 6, ESLint 9 flat config, `@typescript-eslint`, `@stylistic/eslint-plugin`, Prettier 3.

---

### Task 1: Добавить проверяемые правила ESLint

**Files:**
- Modify: `eslint.config.js`

- [ ] **Step 1: Добавить правила**

Добавить в `rules`:

```js
'@typescript-eslint/naming-convention': [
  'error',
  {
    selector: 'interface',
    format: ['PascalCase'],
    custom: { regex: '^I[A-Z]', match: true },
  },
  {
    selector: 'typeAlias',
    format: ['PascalCase'],
    custom: { regex: '^T[A-Z]', match: true },
  },
],
```

Начало `@stylistic/padding-line-between-statements` привести к виду:

```js
[
  'error',
  { blankLine: 'never', prev: 'import', next: 'import' },
  {
    blankLine: 'always',
    prev: ['type', 'interface'],
    next: ['type', 'interface'],
  },
  { blankLine: 'always', prev: '*', next: [...controlFlow, 'return'] },
  { blankLine: 'always', prev: controlFlow, next: '*' },
],
```

- [ ] **Step 2: Подтвердить красную проверку**

Run:

```powershell
npm.cmd run lint
```

Expected: FAIL на существующих именах без `I`/`T` и пустых строках между импортами.

- [ ] **Step 3: Зафиксировать правила**

```powershell
git add eslint.config.js
git commit -m "chore: enforce type naming and spacing"
```

### Task 2: Переименовать объявления и ссылки

**Files:**
- Modify: `src/**/*.ts`
- Modify: `src/**/*.tsx`

- [ ] **Step 1: Выполнить механическое переименование**

Применить следующие переименования ко всем объявлениям, импортам и ссылкам:

```text
src/test/fake-database.ts
  RecordedQuery -> TRecordedQuery

src/domain/workouts/types.ts
  WorkoutSet -> TWorkoutSet
  WorkoutExercise -> TWorkoutExercise
  Workout -> TWorkout
  WorkoutSummary -> TWorkoutSummary

src/domain/units/weight.ts
  WeightUnit -> TWeightUnit

src/domain/programs/types.ts
  ProgramSetInput -> TProgramSetInput
  ProgramExerciseInput -> TProgramExerciseInput
  ProgramInput -> TProgramInput
  Program -> TProgram
  ProgramSummary -> TProgramSummary

src/database/types.ts
  SqlValue -> TSqlValue
  SqlParams -> TSqlParams
  SqlRunResult -> TSqlRunResult
  DatabaseAdapter -> IDatabaseAdapter

src/features/analytics/analytics.ts
  CompletedSetRow -> TCompletedSetRow
  ExerciseRecord -> TExerciseRecord
  Analytics -> TAnalytics

src/database/seed/built-in-exercises.ts
  BuiltInExerciseSeed -> TBuiltInExerciseSeed

src/shared/ui/sortable-list.tsx
  SortableDragGesture -> TSortableDragGesture
  Props -> TProps

src/features/backup/backup-schema.ts
  FitnessMateBackup -> TFitnessMateBackup

src/domain/exercises/types.ts
  MuscleGroup -> TMuscleGroup
  Exercise -> TExercise

src/features/backup/backup-service.ts
  Sections -> TSections

src/shared/ui/screen.tsx
  Props -> TProps

src/shared/providers/app-providers.tsx
  BootstrapState -> TBootstrapState

src/shared/ui/numeric-field.tsx
  Props -> TProps

src/database/repositories/exercise-repository.ts
  ExerciseRow -> TExerciseRow
  RepositoryDependencies -> TRepositoryDependencies
  ExerciseRepository -> IExerciseRepository

src/shared/ui/button.tsx
  Props -> TProps

src/database/repositories/workout-repository.ts
  Dependencies -> TDependencies
  WorkoutRow -> TWorkoutRow
  ExerciseRow -> TExerciseRow
  SetRow -> TSetRow
  ProgramTemplateRow -> TProgramTemplateRow
  WorkoutRepository -> IWorkoutRepository

src/shared/lib/reorder.ts
  ItemLayout -> TItemLayout

src/database/repositories/program-repository.ts
  ProgramRow -> TProgramRow
  ProgramExerciseRow -> TProgramExerciseRow
  ProgramSetRow -> TProgramSetRow
  Dependencies -> TDependencies
  ProgramRepository -> IProgramRepository

src/features/programs/editor/program-editor-state.ts
  ProgramEditorDraft -> TProgramEditorDraft

src/features/settings/preferences-store.ts
  AppLanguage -> TAppLanguage
  ThemeMode -> TThemeMode
  DeviceLocale -> TDeviceLocale
  PreferencesState -> TPreferencesState

src/shared/i18n/locales/en.ts
  TranslationShape -> TTranslationShape

src/shared/theme/colors.ts
  AppColors -> TAppColors
```

- [ ] **Step 2: Применить исправляемые правила пробелов**

Run:

```powershell
npm.cmd run fix
```

Expected: ESLint удаляет пустые строки между импортами, добавляет строки между
соседними типами/интерфейсами, затем Prettier форматирует файлы.

- [ ] **Step 3: Проверить отсутствие старых объявлений**

Run:

```powershell
rg -n "^(export\s+)?type\s+(?!T[A-Z])|^(export\s+)?interface\s+(?!I[A-Z])" src --pcre2 -g "*.ts" -g "*.tsx"
rg -n -U "^import[^\r\n]*;\r?\n\r?\nimport" src -g "*.ts" -g "*.tsx"
```

Expected: обе команды не находят совпадений.

- [ ] **Step 4: Зафиксировать переименование**

```powershell
git add src
git commit -m "refactor: prefix interfaces and types"
```

Файл `TODOS.md` не добавлять.

### Task 3: Полная проверка

**Files:**
- No production file changes expected.

- [ ] **Step 1: Запустить проектные проверки**

Run:

```powershell
npm.cmd run check
npx.cmd --cache .artifacts\npm-cache expo-doctor
git diff --check
```

Expected: форматирование, TypeScript, ESLint и 60 тестов проходят; Expo Doctor
возвращает 20/20; Git не сообщает ошибок пробелов.

- [ ] **Step 2: Проверить состояние Git**

Run:

```powershell
git status --short
```

Expected: только `?? TODOS.md`.

- [ ] **Step 3: Отправить ветку**

Run:

```powershell
git push -u origin feature/type-naming-style
```

Expected: ветка опубликована без изменения `main`.
