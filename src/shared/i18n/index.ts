import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { AppLanguage } from '@/features/settings/preferences-store';

import { en } from './locales/en';
import { ru } from './locales/ru';

const i18n = createInstance();

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    fallbackLng: 'ru',
    lng: 'ru',
    resources: { en: { translation: en }, ru: { translation: ru } },
    interpolation: { escapeValue: false },
  });
}

export function setAppLanguage(language: AppLanguage): Promise<unknown> {
  return i18n.changeLanguage(language);
}

export { i18n };
