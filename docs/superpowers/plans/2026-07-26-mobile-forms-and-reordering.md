# Mobile Forms and Reordering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve program and workout editing, add long-press reordering, fix keyboard avoidance, and standardize spacing and back actions.

**Architecture:** Add a reusable sortable-list primitive backed by Gesture Handler and Reanimated, plus a reusable numeric text-state helper that allows transient empty input. Keep program reordering optimistic at the feature-hook boundary, keep editor reordering local until save, and make the shared `Screen` responsible for keyboard-safe scrolling.

**Tech Stack:** Expo 57, React Native 0.86, Expo Router, React Native Gesture Handler, Reanimated 4, TypeScript, Jest, React Native Testing Library.

---

## File map

- Create `src/shared/lib/reorder.ts`: pure array and drag-target helpers.
- Create `src/shared/lib/reorder.test.ts`: deterministic reorder tests.
- Create `src/shared/ui/sortable-list.tsx`: reusable long-press vertical drag list.
- Create `src/shared/ui/numeric-field.tsx`: text-preserving numeric input.
- Create `src/shared/ui/numeric-field.test.tsx`: empty/comma/clamping tests.
- Modify `src/shared/ui/screen.tsx`: keyboard-safe scroll behavior.
- Modify `src/shared/ui/screen.test.tsx`: keyboard behavior regression tests.
- Modify `src/app/_layout.tsx`: gesture root wrapper.
- Modify `app.json`: Android resize behavior.
- Modify `src/features/programs/use-programs.ts`: optimistic reorder by full ordered array.
- Create `src/features/programs/use-programs.test.tsx`: persistence and rollback tests.
- Modify `src/features/programs/program-card.tsx`: edit action and top-right delete cross.
- Modify `src/features/programs/programs-screen.tsx`: sortable list integration.
- Create `src/features/programs/program-card.test.tsx`: removed actions and delete accessibility.
- Modify `src/features/programs/editor/program-editor-state.ts`: reorder and zero normalization.
- Modify `src/features/programs/editor/program-editor-state.test.ts`: zero and reorder tests.
- Modify `src/features/programs/editor/program-editor-screen.tsx`: spacing, crosses, sortable exercises, bottom back action, numeric field.
- Create `src/features/programs/editor/program-editor-screen.test.tsx`: editor action regression tests.
- Modify `src/features/settings/settings-screen.tsx`: spacing and bottom back action.
- Create `src/features/settings/settings-screen.test.tsx`: settings layout action tests.
- Modify `src/features/history/workout-detail-screen.tsx`: view/edit modes and spacing.
- Create `src/features/history/workout-detail-screen.test.tsx`: history mode tests.
- Modify `src/shared/i18n/locales/en.ts`: back and drag accessibility strings.
- Modify `src/shared/i18n/locales/ru.ts`: matching Russian strings.
- Modify `src/domain/programs/program-schema.ts`: allow normalized zero repetitions.
- Modify `src/domain/programs/program-schema.test.ts`: zero-repetition regression.

### Task 1: Pure reorder behavior

**Files:**
- Create: `src/shared/lib/reorder.ts`
- Create: `src/shared/lib/reorder.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { moveItem, targetIndexForDrag } from './reorder';

describe('reorder helpers', () => {
  it('moves an item to an arbitrary destination', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('keeps the original reference for an invalid destination', () => {
    const values = ['a', 'b'];
    expect(moveItem(values, 0, 3)).toBe(values);
  });

  it('uses measured card centers to resolve a variable-height drag', () => {
    const layouts = [
      { y: 0, height: 80 },
      { y: 92, height: 140 },
      { y: 244, height: 90 },
    ];
    expect(targetIndexForDrag(0, 220, layouts)).toBe(1);
    expect(targetIndexForDrag(0, 300, layouts)).toBe(2);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/shared/lib/reorder.test.ts`

Expected: FAIL because `./reorder` does not exist.

- [ ] **Step 3: Implement the helpers**

```ts
export type ItemLayout = { y: number; height: number };

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] | readonly T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item === undefined) return items;
  next.splice(to, 0, item);
  return next;
}

export function targetIndexForDrag(from: number, translatedCenterY: number, layouts: ItemLayout[]): number {
  if (!layouts[from]) return from;
  let target = from;
  for (const [index, layout] of layouts.entries()) {
    if (translatedCenterY >= layout.y + layout.height / 2) target = index;
  }
  return Math.max(0, Math.min(layouts.length - 1, target));
}
```

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm test -- src/shared/lib/reorder.test.ts`

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/shared/lib/reorder.ts src/shared/lib/reorder.test.ts
git commit -m "feat: add reusable reorder helpers"
```

### Task 2: Sortable list primitive

**Files:**
- Create: `src/shared/ui/sortable-list.tsx`
- Modify: `src/app/_layout.tsx`

- [ ] **Step 1: Extend reorder tests with drag clamping**

```ts
it('clamps a drag before the first and after the last card', () => {
  const layouts = [{ y: 0, height: 60 }, { y: 72, height: 60 }];
  expect(targetIndexForDrag(1, -100, layouts)).toBe(0);
  expect(targetIndexForDrag(0, 500, layouts)).toBe(1);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/shared/lib/reorder.test.ts`

Expected: FAIL because a center above every item currently resolves to the source index.

- [ ] **Step 3: Correct target clamping and add the UI primitive**

Update `targetIndexForDrag` to initialize `target` to `0`, then create:

```tsx
import { useRef } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { targetIndexForDrag, type ItemLayout } from '@/shared/lib/reorder';

type Props<T> = {
  data: readonly T[];
  keyExtractor: (item: T) => string;
  onReorder: (from: number, to: number) => void;
  renderItem: (item: T, index: number, dragProps: { testID: string }) => React.ReactNode;
  gap?: number;
};

export function SortableList<T>({ data, keyExtractor, onReorder, renderItem, gap = 14 }: Props<T>) {
  const layouts = useRef<ItemLayout[]>([]);
  return (
    <View style={{ gap }}>
      {data.map((item, index) => (
        <SortableRow
          key={keyExtractor(item)}
          index={index}
          layouts={layouts.current}
          onLayout={(layout) => { layouts.current[index] = layout; }}
          onDrop={(translationY) => {
            const layout = layouts.current[index];
            if (!layout) return;
            onReorder(index, targetIndexForDrag(index, layout.y + layout.height / 2 + translationY, layouts.current));
          }}
        >
          {renderItem(item, index, { testID: `sortable-item-${index}` })}
        </SortableRow>
      ))}
    </View>
  );
}

function SortableRow({ index, layouts, onLayout, onDrop, children }: {
  index: number;
  layouts: ItemLayout[];
  onLayout: (layout: ItemLayout) => void;
  onDrop: (translationY: number) => void;
  children: React.ReactNode;
}) {
  const translateY = useSharedValue(0);
  const active = useSharedValue(false);
  const finish = (value: number) => onDrop(value);
  const gesture = Gesture.Pan()
    .activateAfterLongPress(350)
    .onStart(() => { active.value = true; })
    .onUpdate((event) => { translateY.value = event.translationY; })
    .onFinalize(() => {
      runOnJS(finish)(translateY.value);
      translateY.value = withSpring(0);
      active.value = false;
    });
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    zIndex: active.value ? 10 : 0,
    opacity: active.value ? 0.94 : 1,
  }));
  const measure = (event: LayoutChangeEvent) => onLayout(event.nativeEvent.layout);
  return <GestureDetector gesture={gesture}><Animated.View onLayout={measure} style={[styles.row, style]}>{children}</Animated.View></GestureDetector>;
}

const styles = StyleSheet.create({ row: { position: 'relative' } });
```

Wrap `AppProviders` content in `GestureHandlerRootView` with `{ flex: 1 }` in
`src/app/_layout.tsx`.

- [ ] **Step 4: Run focused tests and typecheck**

Run: `npm test -- src/shared/lib/reorder.test.ts`

Run: `npm run typecheck`

Expected: tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit**

```powershell
git add src/shared/lib/reorder.ts src/shared/lib/reorder.test.ts src/shared/ui/sortable-list.tsx src/app/_layout.tsx
git commit -m "feat: add long press sortable list"
```

### Task 3: Program list actions and optimistic persistence

**Files:**
- Modify: `src/features/programs/use-programs.ts`
- Create: `src/features/programs/use-programs.test.tsx`
- Modify: `src/features/programs/program-card.tsx`
- Create: `src/features/programs/program-card.test.tsx`
- Modify: `src/features/programs/programs-screen.tsx`

- [ ] **Step 1: Write failing hook and card tests**

```tsx
it('persists the full order and rolls back when persistence fails', async () => {
  const repository = createProgramRepository({ reorder: jest.fn().mockRejectedValue(new Error('offline')) });
  const { result } = renderHook(() => usePrograms(repository));
  await waitFor(() => expect(result.current.items).toHaveLength(3));
  await act(() => result.current.reorder(0, 2));
  expect(repository.reorder).toHaveBeenCalledWith(['b', 'c', 'a']);
  await waitFor(() => expect(result.current.items.map((item) => item.id)).toEqual(['a', 'b', 'c']));
});

it('shows Edit and a top-right accessible delete action without legacy actions', () => {
  const view = render(<ProgramCard program={program} onOpen={jest.fn()} onDelete={jest.fn()} />);
  expect(view.getByText('Edit')).toBeTruthy();
  expect(view.getByLabelText('Delete program')).toBeTruthy();
  expect(view.queryByText('Duplicate')).toBeNull();
  expect(view.queryByText('Move up')).toBeNull();
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- src/features/programs/use-programs.test.tsx src/features/programs/program-card.test.tsx`

Expected: FAIL because `reorder` and the simplified card API do not exist.

- [ ] **Step 3: Implement the new feature API**

Replace `move` and `duplicate` exposure in `usePrograms` with:

```ts
const reorder = useCallback(async (from: number, to: number) => {
  const previous = items;
  const reordered = moveItem(items, from, to);
  if (reordered === items) return;
  const next = [...reordered];
  setItems(next);
  try {
    await repository.reorder(next.map((program) => program.id));
    setError(null);
  } catch (reason) {
    setItems(previous);
    setError(reason instanceof Error ? reason.message : 'Failed to reorder');
  }
}, [items, repository]);
```

Make `ProgramCard` accept only `program`, `onOpen`, and `onDelete`. Render an
absolute top-right `Pressable` with `accessibilityLabel={t('programs.remove')}`,
and render one secondary button labelled `common.edit`.

Use `SortableList` inside the existing `FlatList` header/body arrangement in
`ProgramsScreen`, calling `reorder(from, to)`. Keep the existing deletion alert.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- src/features/programs/use-programs.test.tsx src/features/programs/program-card.test.tsx`

Expected: all focused tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/programs
git commit -m "feat: simplify and reorder program cards"
```

### Task 4: Empty-friendly numeric input and schema normalization

**Files:**
- Create: `src/shared/ui/numeric-field.tsx`
- Create: `src/shared/ui/numeric-field.test.tsx`
- Modify: `src/domain/programs/program-schema.ts`
- Modify: `src/domain/programs/program-schema.test.ts`

- [ ] **Step 1: Write failing tests**

```tsx
it('allows an empty visible value and emits zero on blur', () => {
  const onValueChange = jest.fn();
  const view = render(<NumericField label="Weight" value={12} onValueChange={onValueChange} />);
  fireEvent.changeText(view.getByLabelText('Weight'), '');
  expect(view.getByLabelText('Weight').props.value).toBe('');
  fireEvent(view.getByLabelText('Weight'), 'blur');
  expect(onValueChange).toHaveBeenLastCalledWith(0);
});

it('accepts a decimal comma', () => {
  const onValueChange = jest.fn();
  const view = render(<NumericField label="Weight" value={0} onValueChange={onValueChange} />);
  fireEvent.changeText(view.getByLabelText('Weight'), '12,5');
  expect(onValueChange).toHaveBeenLastCalledWith(12.5);
});

it('accepts zero repetitions after empty input is normalized', () => {
  expect(parseProgramInput(programWith({ repetitions: 0 })).exercises[0]!.sets[0]!.repetitions).toBe(0);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- src/shared/ui/numeric-field.test.tsx src/domain/programs/program-schema.test.ts`

Expected: FAIL because `NumericField` is missing and repetitions require at least 1.

- [ ] **Step 3: Implement numeric text state**

```tsx
export function NumericField({ label, value, onValueChange, integer = false }: {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  integer?: boolean;
}) {
  const [text, setText] = useState(formatNumber(value));
  useEffect(() => setText(formatNumber(value)), [value]);
  const change = (next: string) => {
    const sanitized = next.replace(',', '.').replace(integer ? /[^0-9]/g : /[^0-9.]/g, '');
    setText(next);
    if (sanitized === '') return;
    const parsed = integer ? Number.parseInt(sanitized, 10) : Number(sanitized);
    if (Number.isFinite(parsed)) onValueChange(Math.max(0, parsed));
  };
  const blur = () => {
    if (text.trim() === '') onValueChange(0);
  };
  return <TextField label={label} value={text} keyboardType={integer ? 'number-pad' : 'decimal-pad'} onChangeText={change} onBlur={blur} />;
}
```

Change repetitions validation to `z.number().int().min(0).max(1000)`.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- src/shared/ui/numeric-field.test.tsx src/domain/programs/program-schema.test.ts`

Expected: all focused tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/shared/ui/numeric-field.tsx src/shared/ui/numeric-field.test.tsx src/domain/programs/program-schema.ts src/domain/programs/program-schema.test.ts
git commit -m "feat: allow empty numeric form input"
```

### Task 5: Keyboard-safe screens

**Files:**
- Modify: `src/shared/ui/screen.tsx`
- Modify: `src/shared/ui/screen.test.tsx`
- Modify: `app.json`

- [ ] **Step 1: Write a failing screen test**

```tsx
it('adds keyboard dismissal and bottom scroll room to keyboard-aware forms', () => {
  const view = render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Screen scroll keyboardAware><Text>Form</Text></Screen>
    </SafeAreaProvider>,
  );
  const scroll = view.UNSAFE_getByType(ScrollView);
  expect(scroll.props.keyboardDismissMode).toBe('interactive');
  expect(scroll.props.automaticallyAdjustKeyboardInsets).toBe(true);
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `npm test -- src/shared/ui/screen.test.tsx`

Expected: FAIL because the ScrollView lacks both properties.

- [ ] **Step 3: Implement shared keyboard behavior**

Set `keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}`,
`automaticallyAdjustKeyboardInsets={keyboardAware && Platform.OS === 'ios'}`,
and a keyboard-aware content bottom padding of 120. Preserve
`keyboardShouldPersistTaps="handled"`.

Add this Android configuration to `app.json`:

```json
"softwareKeyboardLayoutMode": "resize"
```

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- src/shared/ui/screen.test.tsx`

Run: `npm run typecheck`

Expected: tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit**

```powershell
git add src/shared/ui/screen.tsx src/shared/ui/screen.test.tsx app.json
git commit -m "fix: keep form fields above the keyboard"
```

### Task 6: Settings spacing and bottom navigation

**Files:**
- Modify: `src/features/settings/settings-screen.tsx`
- Create: `src/features/settings/settings-screen.test.tsx`
- Modify: `src/shared/i18n/locales/en.ts`
- Modify: `src/shared/i18n/locales/ru.ts`

- [ ] **Step 1: Write the failing screen test**

```tsx
it('uses a bottom back action and separates data actions', () => {
  const view = render(<SettingsScreen />);
  expect(view.queryByText('Close')).toBeNull();
  expect(view.getByText('Go back')).toBeTruthy();
  expect(view.getByTestId('settings-data-actions')).toHaveStyle({ gap: 12 });
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `npm test -- src/features/settings/settings-screen.test.tsx`

Expected: FAIL because `Go back` and the grouped data actions do not exist.

- [ ] **Step 3: Implement the layout**

Add `common.goBack` (`Go back` / `Вернуться назад`). Remove the header close
button. Wrap the page blocks in a `styles.content` view with `gap: 24`; wrap the
three data buttons in `testID="settings-data-actions"` with `gap: 12`; give the
data section title `marginTop: 8` and `marginBottom: 4`; add a full-width ghost
back button as the final child.

- [ ] **Step 4: Run test and verify GREEN**

Run: `npm test -- src/features/settings/settings-screen.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/settings/settings-screen.tsx src/features/settings/settings-screen.test.tsx src/shared/i18n/locales/en.ts src/shared/i18n/locales/ru.ts
git commit -m "fix: improve settings spacing and navigation"
```

### Task 7: Workout history view and edit modes

**Files:**
- Modify: `src/features/history/workout-detail-screen.tsx`
- Create: `src/features/history/workout-detail-screen.test.tsx`

- [ ] **Step 1: Write failing mode tests**

```tsx
it('opens completed workouts in read-only mode', async () => {
  const view = render(<WorkoutDetailScreen workoutId="workout-1" />);
  await view.findByText('Bench day');
  expect(view.queryByLabelText('Weight (kg)')).toBeNull();
  expect(view.getByText('Edit')).toBeTruthy();
  expect(view.queryByText('Save')).toBeNull();
  expect(view.getByText('Go back')).toBeTruthy();
});

it('shows editable fields and save only after Edit is pressed', async () => {
  const view = render(<WorkoutDetailScreen workoutId="workout-1" />);
  fireEvent.press(await view.findByText('Edit'));
  expect(view.getByLabelText('Weight (kg)')).toBeTruthy();
  expect(view.getByText('Save')).toBeTruthy();
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- src/features/history/workout-detail-screen.test.tsx`

Expected: FAIL because the screen currently renders fields and Save immediately.

- [ ] **Step 3: Implement read-only and edit drafts**

Keep immutable `workout` state and separate `draft` plus `isEditing`. Render set
values in `styles.valueRow` when `isEditing` is false. On Edit, deep-clone the
workout into `draft`. In edit mode use `NumericField`; Save writes `draft`,
refreshes `workout`, clears the draft, and returns to view mode. Use content
containers with `gap: 20`, cards with `gap: 14`, and set rows with `gap: 12`.
Replace close label with `common.goBack`; keep share and delete.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- src/features/history/workout-detail-screen.test.tsx`

Expected: both mode tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/history
git commit -m "feat: add read and edit modes to workout history"
```

### Task 8: Program editor spacing, sorting, crosses, and numeric input

**Files:**
- Modify: `src/features/programs/editor/program-editor-state.ts`
- Modify: `src/features/programs/editor/program-editor-state.test.ts`
- Modify: `src/features/programs/editor/program-editor-screen.tsx`
- Create: `src/features/programs/editor/program-editor-screen.test.tsx`

- [ ] **Step 1: Write failing state and screen tests**

```ts
it('moves an exercise to a drag destination', () => {
  expect(moveExercise(draft, 0, 2).exercises.map((item) => item.exerciseId)).toEqual(['b', 'c', 'a']);
});
```

```tsx
it('uses crosses, drag cards and a bottom back action', async () => {
  const view = render(<ProgramEditorScreen programId="program-1" />);
  await view.findByText('Edit');
  expect(view.queryByText('Cancel')).toBeNull();
  expect(view.queryByText('↑')).toBeNull();
  expect(view.getAllByLabelText('Remove exercise')).toHaveLength(2);
  expect(view.getByText('Go back')).toBeTruthy();
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- src/features/programs/editor/program-editor-state.test.ts src/features/programs/editor/program-editor-screen.test.tsx`

Expected: screen test FAIL because legacy controls are still rendered.

- [ ] **Step 3: Implement the editor layout**

Use `SortableList` around exercise cards and call
`setDraft(moveExercise(draft, from, to))`. Replace arrow/delete rows with an
absolute top-right cross having `accessibilityLabel={t('editor.removeExercise')}`.
Use `NumericField` for weight and repetitions. Remove the top Cancel pressable,
place the title in a standalone header, wrap all major sections in a container
with `gap: 20`, and add `common.goBack` after Save as the final full-width action.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- src/features/programs/editor/program-editor-state.test.ts src/features/programs/editor/program-editor-screen.test.tsx`

Expected: focused tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/programs/editor
git commit -m "feat: improve program editor interactions"
```

### Task 9: Integration verification

**Files:**
- No planned source changes; if a verification command fails, return to the task
  that owns the failing file and repeat its RED/GREEN cycle before continuing.

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`

Expected: all Jest suites PASS with 0 failures.

- [ ] **Step 2: Run static validation**

Run: `npm run lint`

Expected: ESLint exits 0.

Run: `npm run typecheck`

Expected: TypeScript exits 0.

- [ ] **Step 3: Run Expo project diagnostics and export build**

Run: `npx expo-doctor`

Expected: all checks pass.

Run: `npx expo export --platform android --output-dir .artifacts/verification-export`

Expected: Android JavaScript bundle export completes successfully.

- [ ] **Step 4: Review the requirement checklist**

Confirm in the diff:

- program cards contain Edit and a delete cross, with no duplicate/arrows;
- program and exercise drag use long press on the card body;
- settings and editors end with Go back;
- history begins read-only and exposes Edit;
- numeric fields may be blank and save as zero;
- Android resize and iOS keyboard avoidance are configured;
- spacing groups are present on settings, history, and program editor.

- [ ] **Step 5: Commit any verification fixes**

```powershell
git add app.json src
git commit -m "test: verify mobile form improvements"
```
