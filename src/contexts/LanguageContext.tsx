import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.sarees': 'Sarees',
    'nav.jewellery': 'Jewellery',
    'nav.combos': 'Combos',
    'search.placeholder': 'Search products...',
    'cart.title': 'Shopping Cart',
    'checkout.title': 'Checkout',
    'account.settings': 'Account Settings',
    'orders.my': 'My Orders',
    'wallet.title': 'Wallet',
    'common.loading': 'Loading...',
    'common.save': 'Save Changes',
    'common.cancel': 'Cancel',
  },
  hi: {
    'nav.sarees': 'साड़ियाँ',
    'nav.jewellery': 'आभूषण',
    'nav.combos': 'कॉम्बो',
    'search.placeholder': 'उत्पाद खोजें...',
    'cart.title': 'शॉपिंग कार्ट',
    'checkout.title': 'चेकआउट',
    'account.settings': 'खाता सेटिंग्स',
    'orders.my': 'मेरे आर्डर',
    'wallet.title': 'वॉलेट',
    'common.loading': 'लोड हो रहा है...',
    'common.save': 'परिवर्तन सहेजें',
    'common.cancel': 'रद्द करें',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('language');
    return (stored === 'hi' ? 'hi' : 'en') as Language;
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
