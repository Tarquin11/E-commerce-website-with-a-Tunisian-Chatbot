import axios from 'axios';

const API_URL = `${window.location.protocol}//${window.location.hostname}:5000/api/translate/batch`;
const translationCache: Record<string, Record<string, any>> = {};

export async function translateObject(
  obj: Record<string, any>,
  targetLang: string
): Promise<Record<string, any>> {
  if (targetLang === 'en') return obj;

  if (translationCache[targetLang]) {
    return translationCache[targetLang];
  }

  try {
    const flattened = flattenObject(obj);
    const keys = Object.keys(flattened);
    
    // Send all strings in one batch request to reduce round-trips
    const texts = keys.map(k => flattened[k]);
    const response = await axios.post(API_URL, {
      texts,
      target_lang: targetLang,
    });
    const translations: string[] = response.data.translations || [];
    const translated: Record<string, string> = {};
    for (let i = 0; i < keys.length; i++) {
      translated[keys[i]] = translations[i] ?? flattened[keys[i]];
    }

    const result = unflattenObject(translated);
    translationCache[targetLang] = result;
    return result;
  } catch (error) {
    console.error('Translation failed:', error);
    return obj;
  }
}

function flattenObject(obj: any, prefix = ''): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      flattened[newKey] = value;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    }
  }

  return flattened;
}

function unflattenObject(flattened: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(flattened)) {
    const keys = key.split('.');
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  return result;
}
