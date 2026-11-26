import { render, waitFor } from '@testing-library/react-native';
import { workoutRepository } from '@/database/repositories/workout-repository';
import type { TWorkoutExercise } from '@/domain/workouts/types';
import { setAppLanguage } from '@/shared/i18n';
import { ExerciseWeightHistory } from './exercise-weight-history';

const mockPreferences = { weightUnit: 'kg' as 'kg' | 'lb' };
jest.mock('@/features/settings/preferences-store', () => ({
  usePreferencesStore: (selector: (state: typeof mockPreferences) => unknown) =>
    selector(mockPreferences),
}));

jest.mock('@/database/repositories/workout-repository', () => ({
  workoutRepository: { getExerciseWeightHistory: jest.fn() },
}));

const exercise: TWorkoutExercise = {
  id: 'card',
  sourceExerciseId: 'squat',
  exerciseName: 'Squat',
  muscleGroup: 'legs',
  sets: [],
};

describe('ExerciseWeightHistory', () => {
  beforeEach(async () => {
    await setAppLanguage('en');
    mockPreferences.weightUnit = 'kg';
  });

  it('converts weights to pounds', async () => {
    mockPreferences.weightUnit = 'lb';
    jest
      .mocked(workoutRepository.getExerciseWeightHistory)
      .mockResolvedValue([{ weightKg: 40, maxRepetitions: 2 }]);
    const view = await render(<ExerciseWeightHistory exercise={exercise} />);
    await waitFor(() => expect(view.getByText('88.18 lb')).toBeTruthy());
  });

  it('shows the best single-set repetitions for each weight in repository order', async () => {
    jest.mocked(workoutRepository.getExerciseWeightHistory).mockResolvedValue([
      { weightKg: 40, maxRepetitions: 1 },
      { weightKg: 50, maxRepetitions: 3 },
    ]);
    const view = await render(<ExerciseWeightHistory exercise={exercise} />);
    await waitFor(() => expect(view.getByText('40 kg')).toBeTruthy());
    expect(view.getByText('Max. 1 rep')).toBeTruthy();
    expect(view.getByText('Max. 3 reps')).toBeTruthy();
    expect(view.getAllByText(/\d+ kg/).map((item) => item.props.children[0])).toEqual([40, 50]);
    expect(workoutRepository.getExerciseWeightHistory).toHaveBeenCalledWith({
      sourceExerciseId: 'squat',
      exerciseName: 'Squat',
      muscleGroup: 'legs',
    });
  });

  it('hides the block for an exercise without history', async () => {
    jest.mocked(workoutRepository.getExerciseWeightHistory).mockResolvedValue([]);
    const view = await render(<ExerciseWeightHistory exercise={exercise} />);
    await waitFor(() => expect(workoutRepository.getExerciseWeightHistory).toHaveBeenCalled());
    expect(view.toJSON()).toBeNull();
  });

  it.each([
    [1, 'Макс. 1 повторение'],
    [2, 'Макс. 2 повторения'],
    [12, 'Макс. 12 повторений'],
  ])('labels the single-set record of %i repetitions in Russian', async (count, label) => {
    await setAppLanguage('ru');
    jest
      .mocked(workoutRepository.getExerciseWeightHistory)
      .mockResolvedValue([{ weightKg: 50, maxRepetitions: count }]);
    const view = await render(<ExerciseWeightHistory exercise={exercise} />);
    await waitFor(() => expect(view.getByText(label)).toBeTruthy());
  });
});
