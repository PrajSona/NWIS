import { createContext, useContext, useState, useCallback } from 'react';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [langCode, setLangCode] = useState(() => {
    try { return localStorage.getItem('nwis-lang') || DEFAULT_LANGUAGE; }
    catch { return DEFAULT_LANGUAGE; }
  });

  const setLanguage = useCallback((code) => {
    if (LANGUAGES[code]) {
      setLangCode(code);
      try { localStorage.setItem('nwis-lang', code); } catch {}
    }
  }, []);

  const t = LANGUAGES[langCode]?.translations || LANGUAGES[DEFAULT_LANGUAGE].translations;

  return (
    <LanguageContext.Provider value={{ langCode, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
