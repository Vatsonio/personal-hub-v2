export type AppTheme = "dark" | "amoled" | "glass";
export type AppLocale = "uk-UA" | "en-US";
export type TimeFormat = "24h" | "12h";
export type WeatherMode = "auto" | "manual";

export type BottomNavItemConfig = {
  href: string;
  visible: boolean;
};

export type AppSettings = {
  theme: AppTheme;
  locale: AppLocale;
  weatherCity: string;
  weatherMode: WeatherMode;
  timeFormat: TimeFormat;
  bottomNavHidden: boolean;
  bottomNavAutoHide: boolean;
  bottomNavItems: BottomNavItemConfig[];
};

export const SETTINGS_STORAGE_KEY = "personal-hub-settings-v1";
export const SETTINGS_EVENT_NAME = "personal-hub-settings-changed";

export const ALL_NAV_HREFS = [
  "/dashboard",
  "/dashboard/saved",
  "/dashboard/profile",
  "/dashboard/settings"
] as const;

export const DEFAULT_BOTTOM_NAV_ITEMS: BottomNavItemConfig[] = ALL_NAV_HREFS.map((href) => ({
  href,
  visible: true
}));

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  locale: "uk-UA",
  weatherCity: "",
  weatherMode: "auto",
  timeFormat: "24h",
  bottomNavHidden: false,
  bottomNavAutoHide: false,
  bottomNavItems: DEFAULT_BOTTOM_NAV_ITEMS
};

function parseTheme(t: unknown): AppTheme {
  if (t === "amoled") return "amoled";
  if (t === "glass") return "glass";
  return "dark";
}

function parseBottomNavItems(raw: unknown): BottomNavItemConfig[] {
  if (!Array.isArray(raw)) return DEFAULT_BOTTOM_NAV_ITEMS;
  const valid = ALL_NAV_HREFS as readonly string[];
  const parsed = raw
    .filter(
      (x): x is BottomNavItemConfig => x && typeof x.href === "string" && valid.includes(x.href)
    )
    .map((x) => ({ href: x.href, visible: x.visible !== false }));
  // Ensure all hrefs are present (append missing ones at end)
  for (const href of valid) {
    if (!parsed.find((x) => x.href === href)) {
      parsed.push({ href, visible: true });
    }
  }
  return parsed;
}

export function readSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      theme: parseTheme(parsed.theme),
      locale: parsed.locale === "en-US" ? "en-US" : DEFAULT_SETTINGS.locale,
      weatherCity: parsed.weatherCity?.trim() ?? "",
      weatherMode: parsed.weatherMode === "manual" ? "manual" : "auto",
      timeFormat: parsed.timeFormat === "12h" ? "12h" : DEFAULT_SETTINGS.timeFormat,
      bottomNavHidden: parsed.bottomNavHidden === true,
      bottomNavAutoHide: parsed.bottomNavAutoHide === true,
      bottomNavItems: parseBottomNavItems(parsed.bottomNavItems)
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
  body.classList.remove("bg-black", "bg-gray-950", "text-white", "theme-glass");

  if (theme === "amoled") {
    body.classList.add("bg-black", "text-white");
  } else if (theme === "glass") {
    body.classList.add("theme-glass", "text-white");
  } else {
    body.classList.add("bg-gray-950", "text-white");
  }
}

export function saveSettings(nextSettings: AppSettings) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
  applyTheme(nextSettings.theme);
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT_NAME, { detail: nextSettings }));

  // Sync to DB in background (non-blocking)
  fetch("/api/user/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextSettings)
  }).catch(() => {});
}

export async function syncSettingsFromDb(): Promise<AppSettings | null> {
  try {
    const res = await fetch("/api/user/settings");
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<AppSettings>;
    if (!data || Object.keys(data).length === 0) return null;
    const settings: AppSettings = {
      theme: parseTheme(data.theme),
      locale: data.locale === "en-US" ? "en-US" : DEFAULT_SETTINGS.locale,
      weatherCity: data.weatherCity?.trim() ?? "",
      weatherMode: data.weatherMode === "manual" ? "manual" : "auto",
      timeFormat: data.timeFormat === "12h" ? "12h" : DEFAULT_SETTINGS.timeFormat,
      bottomNavHidden: data.bottomNavHidden === true,
      bottomNavAutoHide: data.bottomNavAutoHide === true,
      bottomNavItems: parseBottomNavItems(data.bottomNavItems)
    };
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    applyTheme(settings.theme);
    return settings;
  } catch {
    return null;
  }
}
