// This is a clean version just for testing
export const translations = {
  // Basic translations should work
  dashboard: { en: 'Dashboard', si: 'පුවරුව', ta: 'டாஷ்போர்ட்' },
  test: { en: 'Test', si: 'ටෙස්ට්', ta: 'டெஸ்ட்' },
} as const;

export type Language = 'en' | 'si' | 'ta';
export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Language = 'en'): string {
  const entry = translations[key];
  return (entry as any)?.[lang] ?? (entry as any)?.en ?? key;
}

// Note: This file is temporary - the original i18n.ts has duplicate keys that need removing