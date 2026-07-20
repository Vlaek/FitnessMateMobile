import { z } from 'zod';

const exercise = z.object({ id: z.string(), built_in_key: z.string().nullable(), custom_name: z.string().nullable(), muscle_group: z.string(), is_custom: z.number(), created_at: z.string() });
const program = z.object({ id: z.string(), name: z.string(), description: z.string(), sort_order: z.number(), created_at: z.string(), updated_at: z.string() });
const programExercise = z.object({ id: z.string(), program_id: z.string(), exercise_id: z.string(), sort_order: z.number() });
const programSet = z.object({ id: z.string(), program_exercise_id: z.string(), weight_kg: z.number(), repetitions: z.number(), sort_order: z.number() });
const workout = z.object({ id: z.string(), source_program_id: z.string().nullable(), name: z.string(), status: z.enum(['draft', 'completed']), started_at: z.string(), completed_at: z.string().nullable(), updated_at: z.string() });
const workoutExercise = z.object({ id: z.string(), workout_id: z.string(), source_exercise_id: z.string().nullable(), exercise_name: z.string(), muscle_group: z.string(), sort_order: z.number() });
const workoutSet = z.object({ id: z.string(), workout_exercise_id: z.string(), weight_kg: z.number(), repetitions: z.number(), is_completed: z.number(), sort_order: z.number() });

export const backupSchema = z.object({
  format: z.literal('fitnessmate-backup'), version: z.literal(1), exportedAt: z.string(),
  sections: z.object({ programs: z.boolean(), history: z.boolean() }), exercises: z.array(exercise),
  programs: z.array(program), programExercises: z.array(programExercise), programSets: z.array(programSet),
  workouts: z.array(workout), workoutExercises: z.array(workoutExercise), workoutSets: z.array(workoutSet),
});
export type FitnessMateBackup = z.infer<typeof backupSchema>;
export function parseBackup(value: unknown): FitnessMateBackup { return backupSchema.parse(value); }
