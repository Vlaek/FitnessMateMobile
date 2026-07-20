import type { TFunction } from 'i18next';

import type { Exercise } from './types';

export function exerciseDisplayName(exercise: Exercise, t: TFunction): string {
  return exercise.customName ?? t(`exercises.${exercise.builtInKey}`);
}
