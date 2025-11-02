// one to detect the page language based on the current URL, and one to get translations strings for different parts of the UI in src/i18n/utils.ts:

import { ui, defaultLang, showDefaultLang } from './ui';

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: string) {
    return ui[lang][key] || key;
  }
}

export function useTranslatedPath(lang: keyof typeof ui) {
  return function translatePath(path: string, l: string = lang) {
    const base = import.meta.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash
    const translatedPath = !showDefaultLang && l === defaultLang ? path : `/${l}${path}`;
    return `${base}${translatedPath}`;
  }
}

export function getLangFromUrl(url: URL) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const pathname = url.pathname.replace(base, ''); // Remove base from pathname
  const [, lang] = pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}