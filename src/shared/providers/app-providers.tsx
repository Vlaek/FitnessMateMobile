import { useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { bootstrapDatabase } from '@/database/bootstrap';
import { usePreferencesStore } from '@/features/settings/preferences-store';
import { setAppLanguage } from '@/shared/i18n';
import { ErrorScreen } from '@/shared/ui/error-screen';
import { LoadingScreen } from '@/shared/ui/loading-screen';

type TBootstrapState = 'loading' | 'ready' | 'error';

export function AppProviders({ children }: PropsWithChildren) {
  const language = usePreferencesStore((state) => state.language);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<TBootstrapState>('loading');

  useEffect(() => {
    void setAppLanguage(language);
  }, [language]);
  useEffect(() => {
    let active = true;
    void bootstrapDatabase()
      .then(() => {
        if (active) {
          setState('ready');
        }
      })
      .catch(() => {
        if (active) {
          setState('error');
        }
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState('loading');
    setAttempt((value) => value + 1);
  }, []);

  return (
    <SafeAreaProvider>
      {state === 'loading' ? (
        <LoadingScreen />
      ) : state === 'error' ? (
        <ErrorScreen onRetry={retry} />
      ) : (
        children
      )}
    </SafeAreaProvider>
  );
}
