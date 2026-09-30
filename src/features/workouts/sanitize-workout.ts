import type { TWorkout } from '@/domain/workouts/types';

export function sanitizeWorkout(workout: TWorkout): TWorkout | null {
  const exercises = workout.exercises
    .map((exercise) => ({
      ...exercise,
      sets: exercise.sets.filter(
        (set) =>
          Number.isFinite(set.weightKg) &&
          set.weightKg >= 0 &&
          Number.isFinite(set.repetitions) &&
          set.repetitions >= 1,
      ),
    }))
    .filter((exercise) => exercise.sets.length > 0);

  return exercises.length > 0 ? { ...workout, exercises } : null;
}
