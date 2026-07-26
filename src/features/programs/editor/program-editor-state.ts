import type { TProgramInput, TProgramSetInput } from '@/domain/programs/types';

export type TProgramEditorDraft = TProgramInput;

export const EMPTY_PROGRAM: TProgramEditorDraft = { name: '', description: '', exercises: [] };

export function addExercise(draft: TProgramEditorDraft, exerciseId: string): TProgramEditorDraft {
  return {
    ...draft,
    exercises: [...draft.exercises, { exerciseId, sets: [{ weightKg: 0, repetitions: 10 }] }],
  };
}

export function removeExercise(draft: TProgramEditorDraft, index: number): TProgramEditorDraft {
  return { ...draft, exercises: draft.exercises.filter((_, itemIndex) => itemIndex !== index) };
}

export function moveExercise(
  draft: TProgramEditorDraft,
  from: number,
  to: number,
): TProgramEditorDraft {
  if (to < 0 || to >= draft.exercises.length || from === to) {
    return draft;
  }

  const exercises = [...draft.exercises];
  const [moved] = exercises.splice(from, 1);

  if (!moved) {
    return draft;
  }

  exercises.splice(to, 0, moved);

  return { ...draft, exercises };
}

export function updateSet(
  draft: TProgramEditorDraft,
  exerciseIndex: number,
  setIndex: number,
  value: TProgramSetInput,
): TProgramEditorDraft {
  return changeSets(draft, exerciseIndex, (sets) =>
    sets.map((set, index) => (index === setIndex ? value : set)),
  );
}

export function addSet(draft: TProgramEditorDraft, exerciseIndex: number): TProgramEditorDraft {
  return changeSets(draft, exerciseIndex, (sets) => [
    ...sets,
    { ...(sets.at(-1) ?? { weightKg: 0, repetitions: 10 }) },
  ]);
}

export function duplicateSet(
  draft: TProgramEditorDraft,
  exerciseIndex: number,
  setIndex: number,
): TProgramEditorDraft {
  return changeSets(draft, exerciseIndex, (sets) => {
    const source = sets[setIndex];

    if (!source) {
      return sets;
    }

    const next = [...sets];
    next.splice(setIndex + 1, 0, { ...source });

    return next;
  });
}

export function removeSet(
  draft: TProgramEditorDraft,
  exerciseIndex: number,
  setIndex: number,
): TProgramEditorDraft {
  const exercise = draft.exercises[exerciseIndex];

  if (!exercise || exercise.sets.length <= 1) {
    return draft;
  }

  return changeSets(draft, exerciseIndex, (sets) => sets.filter((_, index) => index !== setIndex));
}

function changeSets(
  draft: TProgramEditorDraft,
  exerciseIndex: number,
  transform: (sets: TProgramSetInput[]) => TProgramSetInput[],
): TProgramEditorDraft {
  return {
    ...draft,
    exercises: draft.exercises.map((exercise, index) =>
      index === exerciseIndex ? { ...exercise, sets: transform(exercise.sets) } : exercise,
    ),
  };
}
