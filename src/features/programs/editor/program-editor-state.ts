import type { ProgramInput, ProgramSetInput } from '@/domain/programs/types';

export type ProgramEditorDraft = ProgramInput;

export const EMPTY_PROGRAM: ProgramEditorDraft = { name: '', description: '', exercises: [] };

export function addExercise(draft: ProgramEditorDraft, exerciseId: string): ProgramEditorDraft {
  return {
    ...draft,
    exercises: [...draft.exercises, { exerciseId, sets: [{ weightKg: 0, repetitions: 10 }] }],
  };
}

export function removeExercise(draft: ProgramEditorDraft, index: number): ProgramEditorDraft {
  return { ...draft, exercises: draft.exercises.filter((_, itemIndex) => itemIndex !== index) };
}

export function moveExercise(draft: ProgramEditorDraft, from: number, to: number): ProgramEditorDraft {
  if (to < 0 || to >= draft.exercises.length || from === to) return draft;
  const exercises = [...draft.exercises];
  const [moved] = exercises.splice(from, 1);
  if (!moved) return draft;
  exercises.splice(to, 0, moved);
  return { ...draft, exercises };
}

export function updateSet(
  draft: ProgramEditorDraft,
  exerciseIndex: number,
  setIndex: number,
  value: ProgramSetInput,
): ProgramEditorDraft {
  return changeSets(draft, exerciseIndex, (sets) =>
    sets.map((set, index) => (index === setIndex ? value : set)),
  );
}

export function addSet(draft: ProgramEditorDraft, exerciseIndex: number): ProgramEditorDraft {
  return changeSets(draft, exerciseIndex, (sets) => [
    ...sets,
    { ...(sets.at(-1) ?? { weightKg: 0, repetitions: 10 }) },
  ]);
}

export function duplicateSet(
  draft: ProgramEditorDraft,
  exerciseIndex: number,
  setIndex: number,
): ProgramEditorDraft {
  return changeSets(draft, exerciseIndex, (sets) => {
    const source = sets[setIndex];
    if (!source) return sets;
    const next = [...sets];
    next.splice(setIndex + 1, 0, { ...source });
    return next;
  });
}

export function removeSet(
  draft: ProgramEditorDraft,
  exerciseIndex: number,
  setIndex: number,
): ProgramEditorDraft {
  const exercise = draft.exercises[exerciseIndex];
  if (!exercise || exercise.sets.length <= 1) return draft;
  return changeSets(draft, exerciseIndex, (sets) => sets.filter((_, index) => index !== setIndex));
}

function changeSets(
  draft: ProgramEditorDraft,
  exerciseIndex: number,
  transform: (sets: ProgramSetInput[]) => ProgramSetInput[],
): ProgramEditorDraft {
  return {
    ...draft,
    exercises: draft.exercises.map((exercise, index) =>
      index === exerciseIndex ? { ...exercise, sets: transform(exercise.sets) } : exercise,
    ),
  };
}
