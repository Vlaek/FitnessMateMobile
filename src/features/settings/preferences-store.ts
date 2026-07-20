import * as Localization from 'expo-localization';
import Storage from 'expo-sqlite/kv-store';
import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';

import type { WeightUnit } from '@/domain/units/weight';

export type AppLanguage = 'ru' | 'en';
export type ThemeMode = 'system' | 'light' | 'dark';

export type DeviceLocale = {
  languageCode: string | null;
  measurementSystem: 'metric' | 'us' | 'uk' | null;
};

export type PreferencesState = {
  language: AppLanguage;
  weightUnit: WeightUnit;
  themeMode: ThemeMode;
  setLanguage: (language: AppLanguage) => void;
  setWeightUnit: (weightUnit: WeightUnit) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  reset: () => void;
};

function defaults(locale: DeviceLocale) {
  return {
    language: locale.languageCode === 'en' ? ('en' as const) : ('ru' as const),
    weightUnit: locale.measurementSystem === 'us' ? ('lb' as const) : ('kg' as const),
    themeMode: 'system' as const,
  };
}

export function createPreferencesStore(
  storage: StateStorage,
  locale: DeviceLocale,
): StoreApi<PreferencesState> {
  const initial = defaults(locale);
  return createStore<PreferencesState>()(
    persist(
      (set) => ({
        ...initial,
        setLanguage: (language) => set({ language }),
        setWeightUnit: (weightUnit) => set({ weightUnit }),
        setThemeMode: (themeMode) => set({ themeMode }),
        reset: () => set(initial),
      }),
      {
        name: 'fitnessmate-preferences',
        storage: createJSONStorage(() => storage),
        partialize: ({ language, weightUnit, themeMode }) => ({
          language,
          weightUnit,
          themeMode,
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

export function usePreferencesStore<T>(selector: (state: PreferencesState) => T): T {
  return useStore(preferencesStore, selector);
}
