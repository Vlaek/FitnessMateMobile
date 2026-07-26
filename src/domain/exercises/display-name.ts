import type { TFunction } from 'i18next';
import type { TExercise } from './types';

export function exerciseDisplayName(exercise: TExercise, t: TFunction): string {
  return exercise.customName ?? t(`exercises.${exercise.builtInKey}`);
}
