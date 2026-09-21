import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../locales/en';
import fr from '../locales/fr';

const dictionaries = { en, fr };
const LanguageContext = createContext(null);
const STORAGE_KEY = 'flotteguard_lang';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) setLang(stored);
    });
  }, []);

  function toggleLanguage() {
    setLang((prev) => {
      const next = prev === 'en' ? 'fr' : 'en';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  const t = useMemo(() => {
    const dict = dictionaries[lang];
    return (key, vars) => {
      let str = dict[key] || key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          str = str.replace(`{${k}}`, v);
        });
      }
      return str;
    };
  }, [lang]);

  return <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
