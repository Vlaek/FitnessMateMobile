import { useColorScheme } from 'react-native';
import { usePreferencesStore } from '@/features/settings/preferences-store';
import { darkColors, lightColors } from './colors';

export function useAppTheme() {
  const system = useColorScheme();
  const mode = usePreferencesStore((state) => state.themeMode);
  const resolved = mode === 'system' ? (system ?? 'light') : mode;

  return { mode: resolved, colors: resolved === 'dark' ? darkColors : lightColors };
}
