import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tr from './tr.json';

// shortcut: Turkish only in M1; English and device-locale detection come in M3.
void i18n.use(initReactI18next).init({
  lng: 'tr',
  fallbackLng: 'tr',
  resources: { tr: { translation: tr } },
  interpolation: { escapeValue: false },
});

export default i18n;
