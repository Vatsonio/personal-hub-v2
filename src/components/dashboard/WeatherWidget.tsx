"use client";

import { useEffect, useState } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Loader2 } from "lucide-react";
import { readSettings, SETTINGS_EVENT_NAME } from "@/lib/settings";

type WeatherData = {
  temp: number;
  description: string;
  icon: string;
  city: string;
};

function WeatherIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = className || "w-4 h-4";
  if (icon.includes("01")) return <Sun className={`${cls} text-yellow-400`} />;
  if (icon.includes("09") || icon.includes("10"))
    return <CloudRain className={`${cls} text-blue-400`} />;
  if (icon.includes("13")) return <CloudSnow className={`${cls} text-sky-300`} />;
  if (icon.includes("50")) return <Wind className={`${cls} text-gray-400`} />;
  return <Cloud className={`${cls} text-gray-300`} />;
}

async function fetchByCity(city: string, apiKey: string, language: string): Promise<WeatherData> {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=${language}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return {
    temp: Math.round(data.main.temp),
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    city: data.name || city
  };
}

async function fetchByCoords(
  lat: number,
  lon: number,
  apiKey: string,
  language: string
): Promise<WeatherData> {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=${language}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return {
    temp: Math.round(data.main.temp),
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    city: data.name
  };
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [settings, setSettings] = useState(readSettings);

  useEffect(() => {
    async function fetchWeather() {
      setLoading(true);
      setError(false);

      const rawKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ?? "";
      const apiKey = rawKey.replace(/[\r\n]/g, "").trim();
      const language = settings.locale.startsWith("uk") ? "uk" : "en";

      if (!apiKey || apiKey === "your_openweathermap_api_key") {
        setLoading(false);
        return;
      }

      try {
        if (settings.weatherMode === "manual" && settings.weatherCity) {
          const data = await fetchByCity(settings.weatherCity, apiKey, language);
          setWeather(data);
        } else {
          // auto — geolocation
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          );
          const data = await fetchByCoords(
            pos.coords.latitude,
            pos.coords.longitude,
            apiKey,
            language
          );
          setWeather(data);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [settings]);

  useEffect(() => {
    function sync() {
      setSettings(readSettings());
    }
    window.addEventListener(SETTINGS_EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SETTINGS_EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (loading) return <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />;
  if (error || !weather) return null;

  return (
    <div className="flex items-center gap-1.5 bg-gray-800/50 rounded-xl px-2.5 py-1.5 border border-gray-700/50">
      <WeatherIcon icon={weather.icon} />
      <div className="flex flex-col leading-none">
        <span className="text-white text-sm font-medium">{weather.temp}°C</span>
        <span className="text-gray-400 text-[10px] capitalize mt-0.5">{weather.description}</span>
      </div>
      <span className="text-gray-500 text-[10px] hidden sm:block">{weather.city}</span>
    </div>
  );
}
