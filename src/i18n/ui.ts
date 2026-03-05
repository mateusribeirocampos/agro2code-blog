// dictionaries of terms to translate the labels for UI elements around your site. This allows your visitors to experience your site fully in their language.

export const languages = {
  en: 'English',
  pt: 'Português',
};

export const showDefaultLang = false;

export const defaultLang = 'en';

export const ui = {
  en: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.blog': 'Blog',
    'home.title': 'Agro2Code Blog',
  },
  pt: {
    'nav.home': 'Início',
    'nav.about': 'Sobre',
    'nav.blog': 'Blog',
    'home.title': 'Blog Agro2Code',
  },
} as const;
