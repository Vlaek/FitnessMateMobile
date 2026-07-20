export type ProgramSetInput = {
  weightKg: number;
  repetitions: number;
};

export type ProgramExerciseInput = {
  exerciseId: string;
  sets: ProgramSetInput[];
};

export type ProgramInput = {
  name: string;
  description: string;
  exercises: ProgramExerciseInput[];
};

export type Program = ProgramInput & {
  id: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProgramSummary = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  exerciseCount: number;
  setCount: number;
};
