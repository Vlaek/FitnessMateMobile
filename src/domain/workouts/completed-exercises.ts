import type { TWorkoutExercise } from './types';

export function getCompletedExercises(exercises: TWorkoutExercise[]): TWorkoutExercise[] {
  return exercises
    .map((exercise) => ({
      ...exercise,
      sets: exercise.sets.filter((set) => set.isCompleted),
    }))
    .filter((exercise) => exercise.sets.length > 0);
}
