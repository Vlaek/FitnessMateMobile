import type { MuscleGroup } from '@/domain/exercises/types';

export type WorkoutSet = { id: string; weightKg: number; repetitions: number; isCompleted: boolean };
export type WorkoutExercise = { id: string; sourceExerciseId: string | null; exerciseName: string; muscleGroup: MuscleGroup; sets: WorkoutSet[] };
export type Workout = { id: string; sourceProgramId: string | null; name: string; status: 'draft' | 'completed'; startedAt: string; completedAt: string | null; updatedAt: string; exercises: WorkoutExercise[] };
export type WorkoutSummary = { id: string; name: string; startedAt: string; completedAt: string; exerciseCount: number; setCount: number; volumeKg: number };
