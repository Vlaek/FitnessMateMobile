import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import StartScreen from '@/app/(tabs)/start';
import { programRepository } from '@/database/repositories/program-repository';
import { workoutRepository } from '@/database/repositories/workout-repository';
import { setAppLanguage } from '@/shared/i18n';

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  return {
    router: { push: jest.fn() },
    useFocusEffect: (effect: () => void | (() => void)) => React.useEffect(effect, [effect]),
  };
});
jest.mock('@/database/repositories/program-repository', () => ({
  programRepository: { list: jest.fn() },
}));
jest.mock('@/database/repositories/workout-repository', () => ({
  workoutRepository: {
    getActive: jest.fn(),
    getProgramsWithHistory: jest.fn(),
    startFromProgram: jest.fn(),
    startFromLastWorkout: jest.fn(),
    startEmpty: jest.fn(),
  },
}));

describe('StartScreen launch choices', () => {
  beforeAll(async () => setAppLanguage('ru'));
  beforeEach(() => {
    jest.mocked(programRepository.list).mockResolvedValue([
      {
        id: 'program',
        name: 'Leg day',
        description: '',
        exerciseCount: 2,
        setCount: 6,
        sortOrder: 0,
      },
    ]);
    jest.mocked(workoutRepository.getActive).mockResolvedValue(null);
    jest.mocked(workoutRepository.getProgramsWithHistory).mockResolvedValue(['program']);
  });

  it.each([
    ['Обычная', 'startFromProgram'],
    ['Последняя', 'startFromLastWorkout'],
  ] as const)('starts via %s', async (label, method) => {
    const view = await render(<StartScreen />);
    await view.findByText('Leg day');
    await fireEvent.press(view.getByRole('button', { name: label }));
    await waitFor(() => expect(workoutRepository[method]).toHaveBeenCalledWith('program'));
    expect(router.push).toHaveBeenCalledWith('/workout');
  });

  it('disables the latest option when there is no previous workout', async () => {
    jest.mocked(workoutRepository.getProgramsWithHistory).mockResolvedValue([]);
    const view = await render(<StartScreen />);
    await view.findByText('Leg day');
    await fireEvent.press(view.getByRole('button', { name: 'Последняя' }));
    expect(workoutRepository.startFromLastWorkout).not.toHaveBeenCalled();
  });
});
