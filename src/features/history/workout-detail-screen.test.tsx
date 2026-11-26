import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { workoutRepository } from '@/database/repositories/workout-repository';
import type { TWorkout } from '@/domain/workouts/types';
import { setAppLanguage } from '@/shared/i18n';
import { WorkoutDetailScreen } from './workout-detail-screen';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('@/database/repositories/workout-repository', () => ({
  workoutRepository: { getById: jest.fn(), save: jest.fn() },
}));
jest.mock('@/features/settings/preferences-store', () => ({
  usePreferencesStore: (selector: (state: { weightUnit: 'kg'; themeMode: 'light' }) => unknown) =>
    selector({ weightUnit: 'kg', themeMode: 'light' }),
}));

const workout: TWorkout = {
  id: 'completed',
  sourceProgramId: 'program',
  name: 'Training',
  status: 'completed',
  startedAt: '2026-11-26T10:00:00Z',
  completedAt: '2026-11-26T11:00:00Z',
  updatedAt: '2026-11-26T11:00:00Z',
  exercises: [
    {
      id: 'skipped',
      sourceExerciseId: null,
      exerciseName: 'Skipped program exercise',
      muscleGroup: 'chest',
      sets: [{ id: 's1', weightKg: 80, repetitions: 10, isCompleted: false }],
    },
    {
      id: 'mixed',
      sourceExerciseId: null,
      exerciseName: 'Added exercise',
      muscleGroup: 'legs',
      sets: [
        { id: 's2', weightKg: 90, repetitions: 5, isCompleted: false },
        { id: 's3', weightKg: 50, repetitions: 10, isCompleted: true },
        { id: 's4', weightKg: 70, repetitions: 5, isCompleted: false },
        { id: 's5', weightKg: 55, repetitions: 8, isCompleted: true },
      ],
    },
  ],
};

describe('WorkoutDetailScreen completed sets', () => {
  beforeAll(async () => setAppLanguage('en'));
  beforeEach(() => {
    jest.mocked(workoutRepository.getById).mockResolvedValue(workout);
    jest.mocked(workoutRepository.save).mockResolvedValue();
  });

  it('hides skipped exercises and sets from an existing completed workout', async () => {
    const view = await render(<WorkoutDetailScreen workoutId={workout.id} />);
    await view.findByText('Added exercise');
    expect(view.queryByText('Skipped program exercise')).toBeNull();
    expect(view.queryByText('90 kg × 5')).toBeNull();
    expect(view.queryByText('70 kg × 5')).toBeNull();
    expect(view.getByText('50 kg × 10')).toBeTruthy();
    expect(view.getByText('55 kg × 8')).toBeTruthy();
    expect(view.getByText('Set 1')).toBeTruthy();
    expect(view.getByText('Set 2')).toBeTruthy();
    expect(view.queryByText('Set 3')).toBeNull();
  });

  it('edits the correct completed set without changing hidden records', async () => {
    const view = await render(<WorkoutDetailScreen workoutId={workout.id} />);
    await view.findByText('Added exercise');
    await fireEvent.press(view.getByRole('button', { name: 'Edit' }));
    expect(view.queryByText('Skipped program exercise')).toBeNull();
    const weights = view.getAllByLabelText('Weight (kg)');
    expect(weights).toHaveLength(2);
    await fireEvent.changeText(weights[0]!, '52');
    await fireEvent.press(view.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(workoutRepository.save).toHaveBeenCalled());
    const saved = jest.mocked(workoutRepository.save).mock.calls[0]![0];
    expect(saved.exercises[0]).toEqual(workout.exercises[0]);
    expect(saved.exercises[1]?.sets).toEqual(
      workout.exercises[1]!.sets.map((set) => (set.id === 's3' ? { ...set, weightKg: 52 } : set)),
    );
    expect(workout.exercises[1]?.sets[1]?.weightKg).toBe(50);
  });
});
