import * as Localization from 'expo-localization';
import Storage from 'expo-sqlite/kv-store';
import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { TWeightUnit } from '@/domain/units/weight';

export type TAppLanguage = 'ru' | 'en';

export type TThemeMode = 'system' | 'light' | 'dark';

export const MIN_REST_TIMER_SECONDS = 30;
export const MAX_REST_TIMER_SECONDS = 600;
export const DEFAULT_REST_TIMER_SECONDS = 180;

export type TDeviceLocale = {
  languageCode: string | null;
  measurementSystem: 'metric' | 'us' | 'uk' | null;
};

export type TPreferencesState = {
  language: TAppLanguage;
  weightUnit: TWeightUnit;
  themeMode: TThemeMode;
  restTimerEnabled: boolean;
  restTimerDurationSeconds: number;
  setLanguage: (language: TAppLanguage) => void;
  setWeightUnit: (weightUnit: TWeightUnit) => void;
  setThemeMode: (themeMode: TThemeMode) => void;
  setRestTimerEnabled: (restTimerEnabled: boolean) => void;
  setRestTimerDurationSeconds: (restTimerDurationSeconds: number) => void;
  reset: () => void;
};

function defaults(locale: TDeviceLocale) {
  return {
    language: locale.languageCode === 'en' ? ('en' as const) : ('ru' as const),
    weightUnit: locale.measurementSystem === 'us' ? ('lb' as const) : ('kg' as const),
    themeMode: 'system' as const,
    restTimerEnabled: false,
    restTimerDurationSeconds: DEFAULT_REST_TIMER_SECONDS,
  };
}

export function createPreferencesStore(
  storage: StateStorage,
  locale: TDeviceLocale,
): StoreApi<TPreferencesState> {
  const initial = defaults(locale);

  return createStore<TPreferencesState>()(
    persist(
      (set) => ({
        ...initial,
        setLanguage: (language) => set({ language }),
        setWeightUnit: (weightUnit) => set({ weightUnit }),
        setThemeMode: (themeMode) => set({ themeMode }),
        setRestTimerEnabled: (restTimerEnabled) => set({ restTimerEnabled }),
        setRestTimerDurationSeconds: (restTimerDurationSeconds) =>
          set({
            restTimerDurationSeconds: Math.min(
              MAX_REST_TIMER_SECONDS,
              Math.max(MIN_REST_TIMER_SECONDS, restTimerDurationSeconds),
            ),
          }),
        reset: () => set(initial),
      }),
      {
        name: 'fitnessmate-preferences',
        storage: createJSONStorage(() => storage),
        partialize: ({
          language,
          weightUnit,
          themeMode,
          restTimerEnabled,
          restTimerDurationSeconds,
        }) => ({
          language,
          weightUnit,
          themeMode,
          restTimerEnabled,
          restTimerDurationSeconds,
        }),
      },
    ),
  );
}

const deviceLocale = Localization.getLocales()[0] ?? {
  languageCode: 'ru',
  measurementSystem: 'metric' as const,
};

export const preferencesStore = createPreferencesStore(Storage, deviceLocale);

export function usePreferencesStore<T>(selector: (state: TPreferencesState) => T): T {
  return useStore(preferencesStore, selector);
}
