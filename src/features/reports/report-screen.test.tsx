import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert, Share } from 'react-native';
import { router } from 'expo-router';
import { workoutRepository } from '@/database/repositories/workout-repository';
import type { TWorkout } from '@/domain/workouts/types';
import { setAppLanguage } from '@/shared/i18n';
import { reportDraftStore } from './report-draft-store';
import { ReportScreen } from './report-screen';
import { telegramCredentials } from './telegram-credentials';
import { sendTelegramMessage } from './telegram-service';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

jest.mock('@/database/repositories/workout-repository', () => ({
  workoutRepository: { getCompletedByIds: jest.fn() },
}));

jest.mock('@/features/settings/preferences-store', () => ({
  usePreferencesStore: (selector: (state: { weightUnit: 'kg'; themeMode: 'light' }) => unknown) =>
    selector({ weightUnit: 'kg', themeMode: 'light' }),
}));

jest.mock('./telegram-credentials', () => ({
  telegramCredentials: { load: jest.fn() },
}));

jest.mock('./telegram-service', () => ({
  sendTelegramMessage: jest.fn(),
}));

const earlyWorkout = createWorkout({
  id: 'early',
  name: 'Early workout',
  startedAt: '2026-07-20T10:00:00.000Z',
});
const lateWorkout = createWorkout({
  id: 'late',
  name: 'Late workout',
  startedAt: '2026-07-22T10:00:00.000Z',
});

describe('ReportScreen', () => {
  beforeAll(async () => setAppLanguage('en'));

  beforeEach(() => {
    reportDraftStore.getState().setWorkoutIds(['late', 'early']);
    jest.mocked(workoutRepository.getCompletedByIds).mockResolvedValue([lateWorkout, earlyWorkout]);
    jest.mocked(telegramCredentials.load).mockResolvedValue({ token: '', chatId: '' });
    jest.mocked(sendTelegramMessage).mockResolvedValue({ ok: true });
  });

  it('uses the live preview text for native sharing', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({
      action: Share.sharedAction,
    });
    const view = await render(<ReportScreen />);

    await view.findByTestId('report-preview');
    await fireEvent.changeText(view.getByLabelText('Title'), 'Weekly title');
    await fireEvent.changeText(view.getByLabelText('Description'), 'Training notes');
    await fireEvent.press(view.getByText('Share'));

    expect(share).toHaveBeenCalledWith({
      title: 'Weekly title',
      message: expect.stringContaining('Weekly title\n\nTraining notes'),
    });
  });

  it('switches from selection order to chronological order', async () => {
    const view = await render(<ReportScreen />);

    const selectionPreview = await view.findByTestId('report-preview');
    expect(String(selectionPreview.props.children).indexOf('Late workout')).toBeLessThan(
      String(selectionPreview.props.children).indexOf('Early workout'),
    );

    await fireEvent.press(view.getByText('By date'));

    await waitFor(() => {
      const text = String(view.getByTestId('report-preview').props.children);
      expect(text.indexOf('Early workout')).toBeLessThan(text.indexOf('Late workout'));
    });
  });

  it('warns and disables direct Telegram sending above 4096 characters', async () => {
    const view = await render(<ReportScreen />);

    await view.findByTestId('report-preview');
    await fireEvent.changeText(view.getByLabelText('Title'), 'a'.repeat(4097));

    expect(view.getByText('Telegram messages are limited to 4096 characters.')).toBeTruthy();
    expect(
      view.getByRole('button', { name: 'Send to Telegram' }).props.accessibilityState.disabled,
    ).toBe(true);
    expect(view.getByRole('button', { name: 'Share' }).props.accessibilityState.disabled).not.toBe(
      true,
    );
  });

  it('offers Settings when Telegram is not configured', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    const view = await render(<ReportScreen />);

    await view.findByTestId('report-preview');
    await fireEvent.press(view.getByText('Send to Telegram'));

    await waitFor(() => expect(alert).toHaveBeenCalled());
    const buttons = alert.mock.calls.at(-1)?.[2];
    const settingsButton = buttons?.find((button) => button.text === 'Open settings');
    settingsButton?.onPress?.();
    expect(router.push).toHaveBeenCalledWith('/settings');
  });

  it('sends the preview through the configured bot', async () => {
    jest.mocked(telegramCredentials.load).mockResolvedValue({
      token: 'secret',
      chatId: '-1001',
    });
    const alert = jest.spyOn(Alert, 'alert');
    const view = await render(<ReportScreen />);

    await view.findByTestId('report-preview');
    await fireEvent.press(view.getByText('Send to Telegram'));

    await waitFor(() =>
      expect(sendTelegramMessage).toHaveBeenCalledWith(
        { token: 'secret', chatId: '-1001' },
        expect.stringContaining('Late workout'),
      ),
    );
    expect(alert).toHaveBeenCalledWith('Report sent');
  });
});

function createWorkout(overrides: Partial<TWorkout>): TWorkout {
  return {
    id: 'workout',
    sourceProgramId: null,
    name: 'Workout',
    status: 'completed',
    startedAt: '2026-07-20T10:00:00.000Z',
    completedAt: '2026-07-20T11:00:00.000Z',
    updatedAt: '2026-07-20T11:00:00.000Z',
    exercises: [
      {
        id: 'exercise',
        sourceExerciseId: null,
        exerciseName: 'Bench press',
        muscleGroup: 'chest',
        sets: [{ id: 'set', weightKg: 80, repetitions: 10, isCompleted: true }],
      },
    ],
    ...overrides,
  };
}
