export type TProgramSetInput = {
  weightKg: number;
  repetitions: number;
};

export type TProgramExerciseInput = {
  exerciseId: string;
  sets: TProgramSetInput[];
};

export type TProgramInput = {
  name: string;
  description: string;
  exercises: TProgramExerciseInput[];
};

export type TProgram = TProgramInput & {
  id: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TProgramSummary = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  exerciseCount: number;
  setCount: number;
};
