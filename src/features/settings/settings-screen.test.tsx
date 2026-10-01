import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { telegramCredentials } from '@/features/reports/telegram-credentials';
import { restTimerService } from '@/features/rest-timer/rest-timer-service';
import { setAppLanguage } from '@/shared/i18n';
import { preferencesStore } from './preferences-store';
import { SettingsScreen } from './settings-screen';

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
}));

jest.mock('expo-sqlite/kv-store', () => ({
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@/features/reports/telegram-credentials', () => ({
  telegramCredentials: {
    load: jest.fn(),
    save: jest.fn(),
    clear: jest.fn(),
  },
}));

jest.mock('@/features/rest-timer/rest-timer-service', () => ({
  restTimerService: {
    requestPermission: jest.fn(),
    stop: jest.fn(),
  },
}));

jest.mock('@expo/ui', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Switch: NativeSwitch, View } =
    jest.requireActual<typeof import('react-native')>('react-native');

  return {
    Host: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    Switch: (props: object) => React.createElement(NativeSwitch, props),
  };
});

describe('SettingsScreen', () => {
  beforeAll(async () => setAppLanguage('en'));

  beforeEach(() => {
    jest.mocked(telegramCredentials.load).mockResolvedValue({
      token: 'saved-token',
      chatId: '-1001',
    });
    jest.mocked(telegramCredentials.save).mockResolvedValue();
    jest.mocked(telegramCredentials.clear).mockResolvedValue();
    jest.mocked(restTimerService.requestPermission).mockResolvedValue(true);
    jest.mocked(restTimerService.stop).mockResolvedValue();
    preferencesStore.setState({ restTimerEnabled: false, restTimerDurationSeconds: 180 });
  });

  it('uses a bottom back action and separates data actions', async () => {
    const view = await render(<SettingsScreen />);

    expect(view.queryByText('Close')).toBeNull();
    expect(view.getByText('Go back')).toBeTruthy();
    expect(view.getByTestId('settings-data-actions')).toHaveStyle({ gap: 12 });
  });

  it('loads, masks, reveals, and saves Telegram credentials', async () => {
    const view = await render(<SettingsScreen />);
    const tokenField = await view.findByDisplayValue('saved-token');

    expect(tokenField.props.secureTextEntry).toBe(true);
    await fireEvent.press(view.getByText('Show token'));
    expect(view.getByLabelText('Bot token').props.secureTextEntry).toBe(false);

    await fireEvent.changeText(view.getByLabelText('Bot token'), ' secret ');
    await fireEvent.changeText(view.getByLabelText('Chat ID'), ' -2002 ');
    await fireEvent.press(view.getByText('Save Telegram settings'));

    await waitFor(() =>
      expect(telegramCredentials.save).toHaveBeenCalledWith({
        token: 'secret',
        chatId: '-2002',
      }),
    );
    expect(view.getByText('Telegram is configured')).toBeTruthy();
  });

  it('removes saved Telegram credentials', async () => {
    const view = await render(<SettingsScreen />);

    await view.findByDisplayValue('saved-token');
    await fireEvent.press(view.getByText('Remove Telegram settings'));

    await waitFor(() => expect(telegramCredentials.clear).toHaveBeenCalledTimes(1));
    expect(view.getByLabelText('Bot token').props.value).toBe('');
    expect(view.getByLabelText('Chat ID').props.value).toBe('');
  });

  it('enables the rest timer only after notification permission is granted', async () => {
    jest.mocked(restTimerService.requestPermission).mockResolvedValueOnce(false);
    const view = await render(<SettingsScreen />);

    expect(view.getByText('Rest timer')).toBeTruthy();
    expect(view.getByText('3:00')).toBeTruthy();
    await fireEvent(view.getByTestId('rest-timer-switch'), 'valueChange', true);

    await waitFor(() => expect(restTimerService.requestPermission).toHaveBeenCalledTimes(1));
    expect(preferencesStore.getState().restTimerEnabled).toBe(false);

    jest.mocked(restTimerService.requestPermission).mockResolvedValueOnce(true);
    await fireEvent(view.getByTestId('rest-timer-switch'), 'valueChange', true);

    await waitFor(() => expect(preferencesStore.getState().restTimerEnabled).toBe(true));
  });

  it('changes rest duration in 30-second steps', async () => {
    const view = await render(<SettingsScreen />);

    await fireEvent.press(view.getByLabelText('Decrease by 30 seconds'));
    expect(await view.findByText('2:30')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Increase by 30 seconds'));
    expect(await view.findByText('3:00')).toBeTruthy();
  });
});
