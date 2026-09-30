import type { TWorkout } from '@/domain/workouts/types';
import {
  generateWorkoutReport,
  isTelegramMessageTooLong,
  TELEGRAM_MESSAGE_LIMIT,
  type IReportLabels,
} from './report-generator';

const labels: IReportLabels = {
  totalOutput: 'Total output',
  noCompletedSets: 'No completed sets',
  unit: 'kg',
  exerciseName: (key) => key,
};

function workout(overrides: Partial<TWorkout> = {}): TWorkout {
  return {
    id: 'workout-1',
    sourceProgramId: null,
    name: 'NewMeta - Back focus',
    status: 'completed',
    startedAt: '2026-07-20T10:00:00.000Z',
    completedAt: '2026-07-20T11:00:00.000Z',
    updatedAt: '2026-07-20T11:00:00.000Z',
    exercises: [
      {
        id: 'exercise-1',
        sourceExerciseId: null,
        exerciseName: 'Bench press',
        muscleGroup: 'chest',
        sets: [
          { id: 'set-1', weightKg: 80, repetitions: 10, isCompleted: true },
          { id: 'set-2', weightKg: 80, repetitions: 10, isCompleted: true },
          { id: 'set-3', weightKg: 80, repetitions: 8, isCompleted: true },
          { id: 'set-4', weightKg: 80, repetitions: 10, isCompleted: true },
          { id: 'set-5', weightKg: 90, repetitions: 5, isCompleted: false },
        ],
      },
      {
        id: 'exercise-2',
        sourceExerciseId: null,
        exerciseName: 'Hyperextension',
        muscleGroup: 'back',
        sets: [
          { id: 'set-6', weightKg: 0, repetitions: 10, isCompleted: true },
          { id: 'set-7', weightKg: 0, repetitions: 10, isCompleted: true },
          { id: 'set-8', weightKg: 0, repetitions: 10, isCompleted: true },
        ],
      },
    ],
    ...overrides,
  };
}

describe('generateWorkoutReport', () => {
  it('sorts by date when Array.prototype.toSorted is unavailable', () => {
    const originalToSorted = Array.prototype.toSorted;
    // React Native's JavaScript runtime may not provide this newer array method.
    Object.defineProperty(Array.prototype, 'toSorted', { configurable: true, value: undefined });

    try {
      const earlyWorkout = workout({ id: 'early', name: 'Early workout' });
      const lateWorkout = workout({
        id: 'late',
        name: 'Late workout',
        startedAt: '2026-07-22T10:00:00.000Z',
      });
      const report = generateWorkoutReport({
        workouts: [lateWorkout, earlyWorkout],
        selectionOrder: ['late', 'early'],
        sortMode: 'date',
        title: '',
        description: '',
        weightUnit: 'kg',
        locale: 'en',
        labels,
      });

      expect(report.indexOf('Early workout')).toBeLessThan(report.indexOf('Late workout'));
    } finally {
      Object.defineProperty(Array.prototype, 'toSorted', {
        configurable: true,
        value: originalToSorted,
      });
    }
  });

  it('groups matching completed sets in their first-seen order', () => {
    expect(
      generateWorkoutReport({
        workouts: [workout()],
        selectionOrder: ['workout-1'],
        sortMode: 'selection',
        title: 'Weekly title',
        description: '',
        weightUnit: 'kg',
        locale: 'en-US',
        labels,
      }),
    ).toBe(
      [
        'Weekly title',
        '',
        'NewMeta - Back focus',
        '',
        '1. Bench press - 3 × 10 × 80 kg',
        '2. Bench press - 1 × 8 × 80 kg',
        '3. Hyperextension - 3 × 10',
        '',
        'Total output: 3,040 kg',
      ].join('\n'),
    );
  });

  it('omits blank metadata without leading empty lines', () => {
    const result = generateWorkoutReport({
      workouts: [workout()],
      selectionOrder: ['workout-1'],
      sortMode: 'selection',
      title: '   ',
      description: '\n ',
      weightUnit: 'kg',
      locale: 'en-US',
      labels,
    });

    expect(result.startsWith('NewMeta - Back focus')).toBe(true);
  });

  it('keeps selection order or sorts stably by date', () => {
    const early = workout({ id: 'early', name: 'Early' });
    const late = workout({
      id: 'late',
      name: 'Late',
      startedAt: '2026-07-22T10:00:00.000Z',
      completedAt: '2026-07-22T11:00:00.000Z',
    });
    const sameDate = workout({ id: 'same', name: 'Same date' });
    const common = {
      workouts: [early, late, sameDate],
      selectionOrder: ['late', 'same', 'early'],
      title: '',
      description: '',
      weightUnit: 'kg' as const,
      locale: 'en-US',
      labels,
    };

    expect(
      generateWorkoutReport({ ...common, sortMode: 'selection' }).indexOf('Late'),
    ).toBeLessThan(generateWorkoutReport({ ...common, sortMode: 'selection' }).indexOf('Early'));
    const byDate = generateWorkoutReport({ ...common, sortMode: 'date' });
    expect(byDate.indexOf('Same date')).toBeLessThan(byDate.indexOf('Early'));
    expect(byDate.indexOf('Early')).toBeLessThan(byDate.indexOf('Late'));
  });

  it('formats pounds and reports workouts without completed sets', () => {
    const empty = workout({
      exercises: workout().exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) => ({ ...set, isCompleted: false })),
      })),
    });

    expect(
      generateWorkoutReport({
        workouts: [empty],
        selectionOrder: ['workout-1'],
        sortMode: 'selection',
        title: '',
        description: '',
        weightUnit: 'lb',
        locale: 'en-US',
        labels: { ...labels, unit: 'lb' },
      }),
    ).toContain('No completed sets\n\nTotal output: 0 lb');
  });
});

describe('isTelegramMessageTooLong', () => {
  it('allows exactly 4096 characters and rejects the next character', () => {
    expect(isTelegramMessageTooLong('a'.repeat(TELEGRAM_MESSAGE_LIMIT))).toBe(false);
    expect(isTelegramMessageTooLong('a'.repeat(TELEGRAM_MESSAGE_LIMIT + 1))).toBe(true);
  });
});
