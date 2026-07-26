import type { TMuscleGroup } from '@/domain/exercises/types';

export type TWorkoutSet = {
  id: string;
  weightKg: number;
  repetitions: number;
  isCompleted: boolean;
};

export type TWorkoutExercise = {
  id: string;
  sourceExerciseId: string | null;
  exerciseName: string;
  muscleGroup: TMuscleGroup;
  sets: TWorkoutSet[];
};

export type TWorkout = {
  id: string;
  sourceProgramId: string | null;
  name: string;
  status: 'draft' | 'completed';
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
  exercises: TWorkoutExercise[];
};

export type TWorkoutSummary = {
  id: string;
  name: string;
  startedAt: string;
  completedAt: string;
  exerciseCount: number;
  setCount: number;
  volumeKg: number;
};
