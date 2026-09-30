import type { StateStorage } from 'zustand/middleware';
import { createPreferencesStore } from './preferences-store';

const memoryStorage = (): StateStorage => {
  const values = new Map<string, string>();

  return {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => void values.set(name, value),
    removeItem: (name) => void values.delete(name),
  };
};

describe('preferences store', () => {
  it('derives supported defaults from the device locale', () => {
    const store = createPreferencesStore(memoryStorage(), {
      languageCode: 'en',
      measurementSystem: 'us',
    });
    expect(store.getState()).toMatchObject({
      language: 'en',
      weightUnit: 'lb',
      themeMode: 'system',
      restTimerEnabled: false,
      restTimerDurationSeconds: 180,
    });
  });

  it('falls back to Russian and kilograms', () => {
    const store = createPreferencesStore(memoryStorage(), {
      languageCode: 'fr',
      measurementSystem: null,
    });
    expect(store.getState()).toMatchObject({ language: 'ru', weightUnit: 'kg' });
  });

  it('updates preferences independently', () => {
    const store = createPreferencesStore(memoryStorage(), {
      languageCode: 'ru',
      measurementSystem: 'metric',
    });
    store.getState().setLanguage('en');
    store.getState().setWeightUnit('lb');
    store.getState().setThemeMode('dark');
    store.getState().setRestTimerEnabled(true);
    store.getState().setRestTimerDurationSeconds(10);
    expect(store.getState()).toMatchObject({
      language: 'en',
      weightUnit: 'lb',
      themeMode: 'dark',
      restTimerEnabled: true,
      restTimerDurationSeconds: 30,
    });

    store.getState().setRestTimerDurationSeconds(900);
    expect(store.getState().restTimerDurationSeconds).toBe(600);

    store.getState().reset();
    expect(store.getState()).toMatchObject({
      restTimerEnabled: false,
      restTimerDurationSeconds: 180,
    });
  });
});
