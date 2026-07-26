import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import { workoutRepository } from '@/database/repositories/workout-repository';
import { reportDraftStore } from '@/features/reports/report-draft-store';
import { setAppLanguage } from '@/shared/i18n';
import HistoryScreen from '@/app/(tabs)/history';

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  return {
    router: { push: jest.fn() },
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(effect, [effect]);
    },
  };
});

jest.mock('@/database/repositories/workout-repository', () => ({
  workoutRepository: { listCompleted: jest.fn() },
}));

jest.mock('@/features/settings/preferences-store', () => ({
  usePreferencesStore: (selector: (state: { weightUnit: 'kg'; themeMode: 'light' }) => unknown) =>
    selector({ weightUnit: 'kg', themeMode: 'light' }),
}));

const summaries = [
  {
    id: 'a',
    name: 'Workout A',
    startedAt: '2026-07-20T10:00:00.000Z',
    completedAt: '2026-07-20T11:00:00.000Z',
    exerciseCount: 1,
    setCount: 2,
    volumeKg: 100,
  },
  {
    id: 'b',
    name: 'Workout B',
    startedAt: '2026-07-21T10:00:00.000Z',
    completedAt: '2026-07-21T11:00:00.000Z',
    exerciseCount: 1,
    setCount: 2,
    volumeKg: 200,
  },
];

describe('HistoryScreen report selection', () => {
  beforeAll(async () => setAppLanguage('en'));

  beforeEach(() => {
    reportDraftStore.getState().clear();
    jest.mocked(workoutRepository.listCompleted).mockResolvedValue(summaries);
  });

  it('numbers workouts in selection order and continues with that order', async () => {
    const view = await render(<HistoryScreen />);

    await view.findByText('Workout A');
    await fireEvent.press(view.getByText('Create report'));
    expect(view.getByRole('button', { name: 'Continue' }).props.accessibilityState.disabled).toBe(
      true,
    );

    await fireEvent.press(view.getByText('Workout A'));
    await fireEvent.press(view.getByText('Workout B'));
    expect(view.getByTestId('history-selection-a').props.children).toBe(1);
    expect(view.getByTestId('history-selection-b').props.children).toBe(2);

    await fireEvent.press(view.getByText('Workout A'));
    expect(view.getByTestId('history-selection-b').props.children).toBe(1);
    await fireEvent.press(view.getByText('Workout A'));
    await fireEvent.press(view.getByText('Continue'));

    expect(reportDraftStore.getState().workoutIds).toEqual(['b', 'a']);
    expect(router.push).toHaveBeenCalledWith('/reports/new');
  });

  it('cancels selection mode and restores normal card navigation', async () => {
    const view = await render(<HistoryScreen />);

    await view.findByText('Workout A');
    await fireEvent.press(view.getByText('Create report'));
    await fireEvent.press(view.getByText('Workout A'));
    await fireEvent.press(view.getByText('Cancel'));
    await fireEvent.press(view.getByText('Workout A'));

    expect(reportDraftStore.getState().workoutIds).toEqual([]);
    expect(router.push).toHaveBeenCalledWith('/history/a');
  });
});
