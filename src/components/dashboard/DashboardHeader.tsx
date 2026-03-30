"use client";

import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import Link from "next/link";
import WeatherWidget from "./WeatherWidget";
import UserNav from "./UserNav";
import type { Session } from "next-auth";
import { readSettings, SETTINGS_EVENT_NAME } from "@/lib/settings";

const VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

function VersionBadge() {
  if (!VERSION) return null;
  return (
    <span className="hidden sm:inline font-mono text-[10px] text-gray-500 leading-none mt-0.5">
      v{VERSION}
    </span>
  );
}

export default function DashboardHeader({
  session,
  savedCount
}: {
  session: Session;
  savedCount: number;
}) {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    let activeSettings = readSettings();

    function updateClock() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString(activeSettings.locale, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: activeSettings.timeFormat === "12h"
        })
      );
      setDate(
        now.toLocaleDateString(activeSettings.locale, {
          weekday: "short",
          day: "numeric",
          month: "short"
        })
      );
    }

    function onSettingsChanged() {
      activeSettings = readSettings();
      updateClock();
    }

    updateClock();
    const id = setInterval(updateClock, 1000);
    window.addEventListener(SETTINGS_EVENT_NAME, onSettingsChanged);
    window.addEventListener("storage", onSettingsChanged);

    return () => {
      clearInterval(id);
      window.removeEventListener(SETTINGS_EVENT_NAME, onSettingsChanged);
      window.removeEventListener("storage", onSettingsChanged);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/60">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center shadow-md shadow-violet-500/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white hidden sm:block leading-none">
              Personal Hub
            </span>
            <VersionBadge />
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <WeatherWidget />
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-white font-mono font-bold text-sm leading-none">{time}</span>
            <span className="text-gray-400 text-xs mt-0.5 capitalize">{date}</span>
          </div>
          <div className="sm:hidden text-white font-mono font-bold text-sm">{time}</div>
          <UserNav session={session} savedCount={savedCount} />
        </div>
      </div>
    </header>
  );
}
