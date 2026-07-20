import { z } from 'zod';

import type { ProgramInput } from './types';

const programSetSchema = z.object({
  weightKg: z.number().finite().min(0),
  repetitions: z.number().int().min(1).max(1000),
});

const programExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  sets: z.array(programSetSchema).min(1),
});

const programInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000),
  exercises: z.array(programExerciseSchema).min(1),
});

export function parseProgramInput(input: unknown): ProgramInput {
  return programInputSchema.parse(input);
}
