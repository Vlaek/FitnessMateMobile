import type { TMuscleGroup } from '@/domain/exercises/types';

export type TBuiltInExerciseSeed = {
  id: string;
  builtInKey: string;
  muscleGroup: TMuscleGroup;
  createdAt: string;
};

const SEEDED_AT = '2026-01-01T00:00:00.000Z';

export const BUILT_IN_EXERCISES: TBuiltInExerciseSeed[] = [
  ['00000000-0000-4000-8000-000000000001', 'barbellBenchPress', 'chest'],
  ['00000000-0000-4000-8000-000000000002', 'squat', 'legs'],
  ['00000000-0000-4000-8000-000000000003', 'deadlift', 'back'],
  ['00000000-0000-4000-8000-000000000004', 'overheadPress', 'shoulders'],
  ['00000000-0000-4000-8000-000000000005', 'barbellRow', 'back'],
  ['00000000-0000-4000-8000-000000000006', 'pullUp', 'back'],
  ['00000000-0000-4000-8000-000000000007', 'bicepsCurl', 'arms'],
  ['00000000-0000-4000-8000-000000000008', 'tricepsExtension', 'arms'],
  ['00000000-0000-4000-8000-000000000009', 'legPress', 'legs'],
  ['00000000-0000-4000-8000-000000000010', 'calfRaise', 'legs'],
].map(([id, builtInKey, muscleGroup]) => ({
  id,
  builtInKey,
  muscleGroup: muscleGroup as TMuscleGroup,
  createdAt: SEEDED_AT,
}));
