import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Screen } from './screen';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 44, right: 0, bottom: 34, left: 0 },
};

describe('Screen', () => {
  it('applies top and bottom safe area insets', async () => {
    const result = await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <Screen><Text>Content</Text></Screen>
      </SafeAreaProvider>,
    );
    expect(result.getByTestId('screen-root')).toHaveStyle({ paddingTop: 44, paddingBottom: 34 });
  });

  it('avoids double bottom inset under a tab bar', async () => {
    const result = await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <Screen bottomInset="tabBar"><Text>Content</Text></Screen>
      </SafeAreaProvider>,
    );
    expect(result.getByTestId('screen-root')).toHaveStyle({ paddingTop: 44, paddingBottom: 0 });
  });

  it('keeps keyboard-aware forms scrollable above the keyboard', async () => {
    const result = await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <Screen scroll keyboardAware><Text>Form</Text></Screen>
      </SafeAreaProvider>,
    );

    const scroll = result.getByTestId('screen-scroll');
    expect(scroll.props.automaticallyAdjustKeyboardInsets).toBe(true);
    expect(scroll.props.contentInsetAdjustmentBehavior).toBe('automatic');
    expect(scroll.props.keyboardDismissMode).toBeTruthy();
  });
});
