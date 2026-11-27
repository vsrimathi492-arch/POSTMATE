import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, mobileTranslations } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof mobileTranslations.en;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: mobileTranslations.en
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLang] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem('postmate_mobile_lang').then((saved) => {
      if (saved === 'en' || saved === 'ta') setLang(saved);
    });
  }, []);

  const setLanguage = (lang: Language) => {
    setLang(lang);
    AsyncStorage.setItem('postmate_mobile_lang', lang).catch(() => {});
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: mobileTranslations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useMobileLanguage = () => useContext(LanguageContext);
