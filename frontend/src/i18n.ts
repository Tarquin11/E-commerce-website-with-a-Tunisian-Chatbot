import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import { translateObject } from './utils/translator';

const loadedLanguages: Record<string, Record<string, any>> = { en: { translation: en } };
const loadingPromises: Record<string, Promise<void>> = {};

async function loadLanguage(lng: string) {
  if (lng === 'en' || loadedLanguages[lng]) {
    return;
  }

  if (loadingPromises[lng]) {
    return loadingPromises[lng];
  }

  loadingPromises[lng] = (async () => {
    try {
      const translated = await translateObject(en, lng);
      loadedLanguages[lng] = { translation: translated };
      i18n.addResourceBundle(lng, 'translation', translated, true, true);
    } catch (error) {
      console.error(`Failed to load language ${lng}:`, error);
    }
  })();

  return loadingPromises[lng];
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    defaultNS: 'translation',
    ns: ['translation'],
    debug: false,
    resources: loadedLanguages,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

i18n.on('languageChanged', (lng) => {
  loadLanguage(lng);
});

const detectedLang = i18n.language || 'en';
if (detectedLang !== 'en') {
  loadLanguage(detectedLang);
}

export default i18n;
