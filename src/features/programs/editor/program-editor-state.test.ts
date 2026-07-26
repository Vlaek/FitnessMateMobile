import {
  addExercise,
  addSet,
  duplicateSet,
  moveExercise,
  removeSet,
  updateSet,
  type TProgramEditorDraft,
} from './program-editor-state';

const empty: TProgramEditorDraft = { name: '', description: '', exercises: [] };

describe('program editor state', () => {
  it('adds an exercise with one default set', () => {
    expect(addExercise(empty, 'exercise-1').exercises).toEqual([
      { exerciseId: 'exercise-1', sets: [{ weightKg: 0, repetitions: 10 }] },
    ]);
  });

  it('updates, duplicates, and adds sets immutably', () => {
    let draft = addExercise(empty, 'exercise-1');
    draft = updateSet(draft, 0, 0, { weightKg: 60, repetitions: 8 });
    draft = duplicateSet(draft, 0, 0);
    draft = addSet(draft, 0);
    expect(draft.exercises[0]?.sets).toEqual([
      { weightKg: 60, repetitions: 8 },
      { weightKg: 60, repetitions: 8 },
      { weightKg: 60, repetitions: 8 },
    ]);
  });

  it('does not remove the last set', () => {
    const draft = addExercise(empty, 'exercise-1');
    expect(removeSet(draft, 0, 0)).toBe(draft);
  });

  it('moves an exercise to an arbitrary drag destination', () => {
    const draft: TProgramEditorDraft = {
      ...empty,
      exercises: ['a', 'b', 'c'].map((exerciseId) => ({
        exerciseId,
        sets: [{ weightKg: 0, repetitions: 0 }],
      })),
    };

    expect(moveExercise(draft, 0, 2).exercises.map((item) => item.exerciseId)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });
});
