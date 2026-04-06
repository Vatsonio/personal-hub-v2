"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  LayoutDashboard,
  BookMarked,
  User,
  Settings
} from "lucide-react";
import Link from "next/link";
import {
  DEFAULT_SETTINGS,
  ALL_NAV_HREFS,
  type AppLocale,
  type AppTheme,
  type TimeFormat,
  type WeatherMode,
  type BottomNavItemConfig,
  readSettings,
  saveSettings,
  syncSettingsFromDb
} from "@/lib/settings";

const NAV_META: Record<string, { icon: React.ElementType; label: string }> = {
  "/dashboard": { icon: LayoutDashboard, label: "Головна" },
  "/dashboard/saved": { icon: BookMarked, label: "Saved" },
  "/dashboard/profile": { icon: User, label: "Профіль" },
  "/dashboard/settings": { icon: Settings, label: "Налаштування" }
};

export default function SettingsPage() {
  const [theme, setTheme] = useState<AppTheme>(DEFAULT_SETTINGS.theme);
  const [locale, setLocale] = useState<AppLocale>(DEFAULT_SETTINGS.locale);
  const [weatherMode, setWeatherMode] = useState<WeatherMode>(DEFAULT_SETTINGS.weatherMode);
  const [weatherCity, setWeatherCity] = useState(DEFAULT_SETTINGS.weatherCity);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(DEFAULT_SETTINGS.timeFormat);
  const [bottomNavHidden, setBottomNavHidden] = useState(DEFAULT_SETTINGS.bottomNavHidden);
  const [bottomNavAutoHide, setBottomNavAutoHide] = useState(DEFAULT_SETTINGS.bottomNavAutoHide);
  const [bottomNavItems, setBottomNavItems] = useState<BottomNavItemConfig[]>(
    DEFAULT_SETTINGS.bottomNavItems
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const local = readSettings();
    setTheme(local.theme);
    setLocale(local.locale);
    setWeatherMode(local.weatherMode);
    setWeatherCity(local.weatherCity);
    setTimeFormat(local.timeFormat);
    setBottomNavHidden(local.bottomNavHidden);
    setBottomNavAutoHide(local.bottomNavAutoHide);
    setBottomNavItems(local.bottomNavItems);

    syncSettingsFromDb().then((db) => {
      if (db) {
        setTheme(db.theme);
        setLocale(db.locale);
        setWeatherMode(db.weatherMode);
        setWeatherCity(db.weatherCity);
        setTimeFormat(db.timeFormat);
        setBottomNavHidden(db.bottomNavHidden);
        setBottomNavAutoHide(db.bottomNavAutoHide);
        setBottomNavItems(db.bottomNavItems);
      }
    });
  }, []);

  function handleSave() {
    saveSettings({
      theme,
      locale,
      weatherMode,
      weatherCity: weatherCity.trim(),
      timeFormat,
      bottomNavHidden,
      bottomNavAutoHide,
      bottomNavItems
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleReset() {
    setTheme(DEFAULT_SETTINGS.theme);
    setLocale(DEFAULT_SETTINGS.locale);
    setWeatherMode(DEFAULT_SETTINGS.weatherMode);
    setWeatherCity(DEFAULT_SETTINGS.weatherCity);
    setTimeFormat(DEFAULT_SETTINGS.timeFormat);
    setBottomNavHidden(DEFAULT_SETTINGS.bottomNavHidden);
    setBottomNavAutoHide(DEFAULT_SETTINGS.bottomNavAutoHide);
    setBottomNavItems(DEFAULT_SETTINGS.bottomNavItems);
    saveSettings(DEFAULT_SETTINGS);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function moveItem(index: number, dir: -1 | 1) {
    const next = [...bottomNavItems];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setBottomNavItems(next);
  }

  function toggleItemVisible(href: string) {
    setBottomNavItems((prev) =>
      prev.map((item) => (item.href === href ? { ...item, visible: !item.visible } : item))
    );
  }

  return (
    <div className="animate-fade-in">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Назад
      </Link>
      <h1 className="text-3xl font-bold text-white mb-2">Налаштування</h1>
      <p className="text-gray-400 mb-8">Тема, мова, погода та формат часу</p>

      {/* General settings */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-5">
          <label className="space-y-2">
            <span className="text-sm text-gray-300">Тема</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as AppTheme)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
            >
              <option value="dark">Dark</option>
              <option value="amoled">AMOLED</option>
              <option value="glass">Glass ✦</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm text-gray-300">Мова / Locale</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as AppLocale)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
            >
              <option value="uk-UA">Українська (uk-UA)</option>
              <option value="en-US">English (en-US)</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm text-gray-300">Погода</span>
            <select
              value={weatherMode}
              onChange={(e) => setWeatherMode(e.target.value as WeatherMode)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
            >
              <option value="auto">Авто (геолокація)</option>
              <option value="manual">Вручну (місто)</option>
            </select>
          </label>

          {weatherMode === "manual" && (
            <label className="space-y-2">
              <span className="text-sm text-gray-300">Місто</span>
              <input
                value={weatherCity}
                onChange={(e) => setWeatherCity(e.target.value)}
                placeholder="Наприклад: Lviv"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
              />
            </label>
          )}

          <label className="space-y-2">
            <span className="text-sm text-gray-300">Формат часу</span>
            <select
              value={timeFormat}
              onChange={(e) => setTimeFormat(e.target.value as TimeFormat)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
            >
              <option value="24h">24-годинний</option>
              <option value="12h">12-годинний</option>
            </select>
          </label>
        </div>
      </div>

      {/* Bottom nav settings */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-medium">Нижня навігація</h2>
            <p className="text-gray-500 text-xs mt-0.5">Тільки для мобільного</p>
          </div>
          <button
            onClick={() => setBottomNavHidden((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
              bottomNavHidden ? "bg-gray-700" : "bg-violet-600"
            }`}
            aria-label={bottomNavHidden ? "Показати навігацію" : "Сховати навігацію"}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                bottomNavHidden ? "translate-x-0" : "translate-x-5"
              }`}
            />
          </button>
        </div>

        {/* Auto-hide toggle */}
        <div className="flex items-center justify-between py-3 border-t border-gray-800/60">
          <div>
            <p className="text-sm text-gray-300">Ховати при відкритті додатку</p>
            <p className="text-xs text-gray-600 mt-0.5">Навбар зникає коли переходиш з головної</p>
          </div>
          <button
            onClick={() => setBottomNavAutoHide((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
              bottomNavAutoHide ? "bg-violet-600" : "bg-gray-700"
            }`}
            aria-label={bottomNavAutoHide ? "Вимкнути авто-сховок" : "Увімкнути авто-сховок"}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                bottomNavAutoHide ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {!bottomNavHidden && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-3">Порядок і видимість пунктів</p>
            {bottomNavItems.map((item, i) => {
              const meta = NAV_META[item.href];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <div
                  key={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                    item.visible
                      ? "bg-gray-800/60 border-gray-700/60"
                      : "bg-gray-900/40 border-gray-800/40 opacity-50"
                  }`}
                >
                  <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-200">{meta.label}</span>

                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveItem(i, -1)}
                      disabled={i === 0}
                      className="p-0.5 text-gray-500 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      aria-label="Вгору"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveItem(i, 1)}
                      disabled={i === bottomNavItems.length - 1}
                      className="p-0.5 text-gray-500 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      aria-label="Вниз"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Visibility toggle */}
                  <button
                    onClick={() => toggleItemVisible(item.href)}
                    className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                    aria-label={item.visible ? "Сховати" : "Показати"}
                  >
                    {item.visible ? (
                      <Eye className="w-4 h-4 text-violet-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save / Reset */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" /> Зберегти
        </button>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> Скинути
        </button>
        {saved && <span className="text-emerald-400 text-sm">Збережено ✓</span>}
      </div>
    </div>
  );
}
