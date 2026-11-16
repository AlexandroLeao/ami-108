import { useSyncExternalStore } from 'react';
import type { Locale } from './copy';

const KEY = 'ami-108.locale';
const EVENT = 'ami-108:locale';
let fallback: Locale = 'pt-BR';

function snapshot(): Locale {
  try {
    const stored = window.localStorage.getItem(KEY);
    return stored === 'pt-BR' || stored === 'en' ? stored : fallback;
  } catch {
    return fallback;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(EVENT, callback);
  };
}

export function setLocale(locale: Locale) {
  fallback = locale;
  try {
    window.localStorage.setItem(KEY, locale);
  } catch {
    // Keep the current language in memory when storage is blocked.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, snapshot, () => 'pt-BR');
}
