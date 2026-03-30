export type AppTheme = "dark" | "amoled";
export type AppLocale = "uk-UA" | "en-US";
export type TimeFormat = "24h" | "12h";

export type WeatherMode = "auto" | "manual";

export type AppSettings = {
  theme: AppTheme;
  locale: AppLocale;
  weatherCity: string;
  weatherMode: WeatherMode;
  timeFormat: TimeFormat;
};

export const SETTINGS_STORAGE_KEY = "personal-hub-settings-v1";
export const SETTINGS_EVENT_NAME = "personal-hub-settings-changed";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  locale: "uk-UA",
  weatherCity: "",
  weatherMode: "auto",
  timeFormat: "24h"
};

export function readSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      theme: parsed.theme === "amoled" ? "amoled" : DEFAULT_SETTINGS.theme,
      locale: parsed.locale === "en-US" ? "en-US" : DEFAULT_SETTINGS.locale,
      weatherCity: parsed.weatherCity?.trim() ?? "",
      weatherMode: parsed.weatherMode === "manual" ? "manual" : "auto",
      timeFormat: parsed.timeFormat === "12h" ? "12h" : DEFAULT_SETTINGS.timeFormat
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;

  const html = document.documentElement;
  const body = document.body;

  html.classList.add("dark");
  body.classList.remove("bg-black", "bg-gray-950", "text-white");

  if (theme === "amoled") {
    body.classList.add("bg-black", "text-white");
  } else {
    body.classList.add("bg-gray-950", "text-white");
  }
}

export function saveSettings(nextSettings: AppSettings) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
  applyTheme(nextSettings.theme);
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT_NAME, { detail: nextSettings }));
}
