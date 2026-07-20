export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'other';

export type Exercise = {
  id: string;
  builtInKey: string | null;
  customName: string | null;
  muscleGroup: MuscleGroup;
  isCustom: boolean;
};
