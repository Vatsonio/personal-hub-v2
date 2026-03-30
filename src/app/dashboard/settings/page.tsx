"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, RotateCcw, Save } from "lucide-react";
import Link from "next/link";
import {
  DEFAULT_SETTINGS,
  type AppLocale,
  type AppTheme,
  type TimeFormat,
  type WeatherMode,
  readSettings,
  saveSettings
} from "@/lib/settings";

export default function SettingsPage() {
  const [theme, setTheme] = useState<AppTheme>(DEFAULT_SETTINGS.theme);
  const [locale, setLocale] = useState<AppLocale>(DEFAULT_SETTINGS.locale);
  const [weatherMode, setWeatherMode] = useState<WeatherMode>(DEFAULT_SETTINGS.weatherMode);
  const [weatherCity, setWeatherCity] = useState(DEFAULT_SETTINGS.weatherCity);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(DEFAULT_SETTINGS.timeFormat);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const settings = readSettings();
    setTheme(settings.theme);
    setLocale(settings.locale);
    setWeatherMode(settings.weatherMode);
    setWeatherCity(settings.weatherCity);
    setTimeFormat(settings.timeFormat);
  }, []);

  function handleSave() {
    saveSettings({ theme, locale, weatherMode, weatherCity: weatherCity.trim(), timeFormat });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleReset() {
    setTheme(DEFAULT_SETTINGS.theme);
    setLocale(DEFAULT_SETTINGS.locale);
    setWeatherMode(DEFAULT_SETTINGS.weatherMode);
    setWeatherCity(DEFAULT_SETTINGS.weatherCity);
    setTimeFormat(DEFAULT_SETTINGS.timeFormat);
    saveSettings(DEFAULT_SETTINGS);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
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

      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-6">
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

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" /> Зберегти
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Скинути
          </button>
          {saved && <span className="text-emerald-400 text-sm">Збережено ✓</span>}
        </div>
      </div>
    </div>
  );
}
