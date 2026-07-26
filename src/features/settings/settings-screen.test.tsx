import { render } from '@testing-library/react-native';

import { setAppLanguage } from '@/shared/i18n';

import { SettingsScreen } from './settings-screen';

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
}));

describe('SettingsScreen', () => {
  beforeAll(async () => setAppLanguage('en'));

  it('uses a bottom back action and separates data actions', async () => {
    const view = await render(<SettingsScreen />);

    expect(view.queryByText('Close')).toBeNull();
    expect(view.getByText('Go back')).toBeTruthy();
    expect(view.getByTestId('settings-data-actions')).toHaveStyle({ gap: 12 });
  });
});
