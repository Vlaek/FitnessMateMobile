import { fromCanonicalKg, type TWeightUnit } from '@/domain/units/weight';
import type { TWorkout, TWorkoutSet } from '@/domain/workouts/types';

export type TReportSortMode = 'selection' | 'date';

export interface IReportLabels {
  totalOutput: string;
  noCompletedSets: string;
  unit: string;
  exerciseName: (key: string) => string;
}

export interface IGenerateWorkoutReportOptions {
  workouts: TWorkout[];
  selectionOrder: string[];
  sortMode: TReportSortMode;
  title: string;
  description: string;
  weightUnit: TWeightUnit;
  locale: string;
  labels: IReportLabels;
}

type TSetGroup = {
  count: number;
  repetitions: number;
  weightKg: number;
};

export const TELEGRAM_MESSAGE_LIMIT = 4096;

export function isTelegramMessageTooLong(text: string): boolean {
  return text.length > TELEGRAM_MESSAGE_LIMIT;
}

export function generateWorkoutReport(options: IGenerateWorkoutReportOptions): string {
  const workouts = sortWorkouts(options.workouts, options.selectionOrder, options.sortMode);
  const sections = [options.title.trim(), options.description.trim()].filter(Boolean);

  sections.push(
    ...workouts.map((workout) =>
      formatWorkout(workout, options.weightUnit, options.locale, options.labels),
    ),
  );

  return sections.join('\n\n');
}

function sortWorkouts(
  workouts: TWorkout[],
  selectionOrder: string[],
  sortMode: TReportSortMode,
): TWorkout[] {
  const workoutsById = new Map(workouts.map((workout) => [workout.id, workout]));
  const selected = selectionOrder
    .map((id) => workoutsById.get(id))
    .filter((workout): workout is TWorkout => workout !== undefined);

  if (sortMode === 'selection') {
    return selected;
  }

  const selectionIndexes = new Map(selectionOrder.map((id, index) => [id, index]));

  return [...selected].sort((left, right) => {
    const dateDifference = new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime();

    return dateDifference || selectionIndexes.get(left.id)! - selectionIndexes.get(right.id)!;
  });
}

function formatWorkout(
  workout: TWorkout,
  weightUnit: TWeightUnit,
  locale: string,
  labels: IReportLabels,
): string {
  const setLines: string[] = [];
  let lineNumber = 1;
  let volumeKg = 0;

  for (const exercise of workout.exercises) {
    const completedSets = exercise.sets.filter((set) => set.isCompleted);

    for (const set of completedSets) {
      volumeKg += set.weightKg * set.repetitions;
    }

    for (const group of groupSets(completedSets)) {
      const weight = fromCanonicalKg(group.weightKg, weightUnit);
      const weightPart = weight === 0 ? '' : ` × ${formatNumber(weight, locale)} ${labels.unit}`;
      setLines.push(
        `${lineNumber}. ${labels.exerciseName(exercise.exerciseName)} - ${group.count} × ${group.repetitions}${weightPart}`,
      );
      lineNumber += 1;
    }
  }

  const body = setLines.length > 0 ? setLines.join('\n') : labels.noCompletedSets;
  const displayedVolume = fromCanonicalKg(volumeKg, weightUnit);

  return [
    workout.name,
    '',
    body,
    '',
    `${labels.totalOutput}: ${formatNumber(displayedVolume, locale)} ${labels.unit}`,
  ].join('\n');
}

function groupSets(sets: TWorkoutSet[]): TSetGroup[] {
  const groups = new Map<string, TSetGroup>();

  for (const set of sets) {
    const key = `${set.repetitions}:${set.weightKg}`;
    const existing = groups.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, {
        count: 1,
        repetitions: set.repetitions,
        weightKg: set.weightKg,
      });
    }
  }

  return [...groups.values()];
}

function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}
