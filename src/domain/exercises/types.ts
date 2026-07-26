export type TMuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'other';

export type TExercise = {
  id: string;
  builtInKey: string | null;
  customName: string | null;
  muscleGroup: TMuscleGroup;
  isCustom: boolean;
};
