import { fireEvent, render } from '@testing-library/react-native';
import type { TWorkout } from '@/domain/workouts/types';
import { restTimerService } from '@/features/rest-timer/rest-timer-service';
import { setAppLanguage } from '@/shared/i18n';
import { ActiveWorkoutScreen } from './active-workout-screen';
import { useActiveWorkout } from './use-active-workout';

const mockPreferences = {
  weightUnit: 'kg' as const,
  restTimerEnabled: true,
  restTimerDurationSeconds: 180,
};

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => 'new-id') }));
jest.mock('./use-active-workout', () => ({ useActiveWorkout: jest.fn() }));
jest.mock('@/features/settings/preferences-store', () => ({
  usePreferencesStore: (selector: (state: typeof mockPreferences) => unknown) =>
    selector(mockPreferences),
}));
jest.mock('@/features/rest-timer/rest-timer-service', () => ({
  restTimerService: { start: jest.fn() },
}));
jest.mock('../programs/editor/exercise-picker', () => ({
  ExercisePicker: () => null,
}));

const workout = (isCompleted: boolean): TWorkout => ({
  id: 'workout-1',
  sourceProgramId: null,
  name: 'Workout',
  status: 'draft',
  startedAt: '2026-10-01T10:00:00.000Z',
  completedAt: null,
  updatedAt: '2026-10-01T10:00:00.000Z',
  exercises: [
    {
      id: 'exercise-1',
      sourceExerciseId: null,
      exerciseName: 'Squat',
      muscleGroup: 'legs',
      sets: [
        {
          id: 'set-1',
          weightKg: 100,
          repetitions: 5,
          isCompleted,
        },
      ],
    },
  ],
});

describe('ActiveWorkoutScreen rest timer', () => {
  beforeAll(async () => setAppLanguage('en'));

  beforeEach(() => {
    mockPreferences.restTimerEnabled = true;
    mockPreferences.restTimerDurationSeconds = 180;
    jest.mocked(restTimerService.start).mockResolvedValue();
  });

  it('starts the configured timer when an incomplete set is completed', async () => {
    const setWorkout = jest.fn();
    jest.mocked(useActiveWorkout).mockReturnValue({
      workout: workout(false),
      setWorkout,
      exercises: [],
      loading: false,
      error: null,
      addExercise: jest.fn(),
    });
    const view = await render(<ActiveWorkoutScreen />);

    await fireEvent.press(view.getByRole('checkbox'));

    expect(setWorkout).toHaveBeenCalledTimes(1);
    expect(restTimerService.start).toHaveBeenCalledWith(180);
  });

  it('does not start the timer when a completed set is unchecked', async () => {
    jest.mocked(useActiveWorkout).mockReturnValue({
      workout: workout(true),
      setWorkout: jest.fn(),
      exercises: [],
      loading: false,
      error: null,
      addExercise: jest.fn(),
    });
    const view = await render(<ActiveWorkoutScreen />);

    await fireEvent.press(view.getByRole('checkbox'));

    expect(restTimerService.start).not.toHaveBeenCalled();
  });

  it('does not start the timer when the preference is disabled', async () => {
    mockPreferences.restTimerEnabled = false;
    jest.mocked(useActiveWorkout).mockReturnValue({
      workout: workout(false),
      setWorkout: jest.fn(),
      exercises: [],
      loading: false,
      error: null,
      addExercise: jest.fn(),
    });
    const view = await render(<ActiveWorkoutScreen />);

    await fireEvent.press(view.getByRole('checkbox'));

    expect(restTimerService.start).not.toHaveBeenCalled();
  });
});
