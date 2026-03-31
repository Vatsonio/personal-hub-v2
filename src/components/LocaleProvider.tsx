"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type Locale, type translations, t as _t, formatDate as _formatDate } from "@/lib/i18n";
import { readSettings, SETTINGS_EVENT_NAME, type AppSettings } from "@/lib/settings";

type TranslationKey = keyof (typeof translations)["uk-UA"];

interface LocaleContextValue {
  locale: Locale;
  t: (key: TranslationKey, ...args: number[]) => string;
  formatDate: (iso: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "uk-UA",
  t: (key, ...args) => _t("uk-UA", key, ...args),
  formatDate: (iso) => _formatDate("uk-UA", iso)
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => readSettings().locale);

  useEffect(() => {
    function onSettingsChange(e: Event) {
      const detail = (e as CustomEvent<AppSettings>).detail;
      if (detail?.locale) setLocale(detail.locale);
    }
    window.addEventListener(SETTINGS_EVENT_NAME, onSettingsChange);
    return () => window.removeEventListener(SETTINGS_EVENT_NAME, onSettingsChange);
  }, []);

  return (
    <LocaleContext.Provider
      value={{
        locale,
        t: (key, ...args) => _t(locale, key, ...args),
        formatDate: (iso) => _formatDate(locale, iso)
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
