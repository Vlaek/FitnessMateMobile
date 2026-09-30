import type { TWorkout } from '@/domain/workouts/types';
import { sanitizeWorkout } from './sanitize-workout';

const workout: TWorkout = {
  id: 'workout',
  sourceProgramId: null,
  name: 'Workout',
  status: 'draft',
  startedAt: '2026-01-01T00:00:00.000Z',
  completedAt: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
  exercises: [
    {
      id: 'exercise-1',
      sourceExerciseId: null,
      exerciseName: 'Bench press',
      muscleGroup: 'chest',
      sets: [
        { id: 'valid', weightKg: 80, repetitions: 8, isCompleted: true },
        { id: 'invalid-repetitions', weightKg: 80, repetitions: 0, isCompleted: true },
      ],
    },
    {
      id: 'exercise-2',
      sourceExerciseId: null,
      exerciseName: 'Squat',
      muscleGroup: 'legs',
      sets: [{ id: 'invalid-weight', weightKg: -1, repetitions: 5, isCompleted: true }],
    },
  ],
};

describe('sanitizeWorkout', () => {
  it('removes invalid sets and exercises left without sets', () => {
    expect(sanitizeWorkout(workout)?.exercises).toEqual([
      { ...workout.exercises[0], sets: [workout.exercises[0]!.sets[0]] },
    ]);
  });

  it('returns null when every exercise is invalid', () => {
    expect(sanitizeWorkout({ ...workout, exercises: [workout.exercises[1]!] })).toBeNull();
  });
});
