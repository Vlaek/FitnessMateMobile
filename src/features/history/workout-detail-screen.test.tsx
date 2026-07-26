import { fireEvent, render } from '@testing-library/react-native';

import { workoutRepository } from '@/database/repositories/workout-repository';
import type { Workout } from '@/domain/workouts/types';
import { preferencesStore } from '@/features/settings/preferences-store';
import { setAppLanguage } from '@/shared/i18n';

import { WorkoutDetailScreen } from './workout-detail-screen';

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
}));

jest.mock('@/database/repositories/workout-repository', () => ({
  workoutRepository: {
    getById: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  },
}));

const workout: Workout = {
  id: 'workout-1',
  sourceProgramId: null,
  name: 'Bench day',
  status: 'completed',
  startedAt: '2026-07-25T10:00:00.000Z',
  completedAt: '2026-07-25T11:00:00.000Z',
  updatedAt: '2026-07-25T11:00:00.000Z',
  exercises: [{
    id: 'exercise-1',
    sourceExerciseId: null,
    exerciseName: 'Bench press',
    muscleGroup: 'chest',
    sets: [{ id: 'set-1', weightKg: 60, repetitions: 8, isCompleted: true }],
  }],
};

describe('WorkoutDetailScreen', () => {
  beforeAll(async () => setAppLanguage('en'));

  beforeEach(() => {
    jest.mocked(workoutRepository.getById).mockResolvedValue(workout);
  });

  it('opens completed workouts in read-only mode', async () => {
    const view = await render(<WorkoutDetailScreen workoutId="workout-1" />);

    await view.findByText('Bench day');
    const unit = preferencesStore.getState().weightUnit;
    expect(view.queryByLabelText(`Weight (${unit})`)).toBeNull();
    expect(view.getByText('Edit')).toBeTruthy();
    expect(view.queryByText('Save')).toBeNull();
    expect(view.getByText('Go back')).toBeTruthy();
  });

  it('shows editable fields and Save only after Edit is pressed', async () => {
    const view = await render(<WorkoutDetailScreen workoutId="workout-1" />);

    await fireEvent.press(await view.findByText('Edit'));

    const unit = preferencesStore.getState().weightUnit;
    expect(view.getByLabelText(`Weight (${unit})`)).toBeTruthy();
    expect(view.getByText('Save')).toBeTruthy();
  });
});
