import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { telegramCredentials } from '@/features/reports/telegram-credentials';
import { setAppLanguage } from '@/shared/i18n';
import { SettingsScreen } from './settings-screen';

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
}));

jest.mock('@/features/reports/telegram-credentials', () => ({
  telegramCredentials: {
    load: jest.fn(),
    save: jest.fn(),
    clear: jest.fn(),
  },
}));

describe('SettingsScreen', () => {
  beforeAll(async () => setAppLanguage('en'));

  beforeEach(() => {
    jest.mocked(telegramCredentials.load).mockResolvedValue({
      token: 'saved-token',
      chatId: '-1001',
    });
    jest.mocked(telegramCredentials.save).mockResolvedValue();
    jest.mocked(telegramCredentials.clear).mockResolvedValue();
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
});
