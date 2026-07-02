"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  MESSAGES,
  type Locale,
  type Messages,
  isLocale,
} from "./locales";

const STORAGE_KEY = "lg-landing-locale";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Messages;
  /** Bump on locale change — forces visible re-render of static children */
  revision: number;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isLocale(saved)) setLocaleState(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale === "zh" ? "zh-CN" : locale;
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale, ready]);

  const [revision, setRevision] = useState(0);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    setRevision((r) => r + 1);
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, t: MESSAGES[locale], revision }),
    [locale, setLocale, revision],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
