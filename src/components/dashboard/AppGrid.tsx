"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Pencil, Check, EyeOff, Eye } from "lucide-react";
import { ALL_APPS } from "@/lib/apps";

const STORAGE_KEY = "dashboard:hidden-apps";

function loadHidden(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveHidden(hidden: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(hidden)));
}

export default function AppGrid() {
  const [editing, setEditing] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHidden(loadHidden());
    setMounted(true);
  }, []);

  function toggleHidden(id: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveHidden(next);
      return next;
    });
  }

  const visibleApps = editing ? ALL_APPS : ALL_APPS.filter((a) => !hidden.has(a.id));

  if (!mounted) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Додатки</h2>
        <div className="flex items-center gap-2">
          {!editing && hidden.size > 0 && (
            <span className="text-xs text-gray-600">({hidden.size} hidden)</span>
          )}
          <button
            onClick={() => setEditing((e) => !e)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {visibleApps.map((app) => {
          const Icon = app.icon;
          const isHidden = hidden.has(app.id);

          if (editing) {
            return (
              <div
                key={app.id}
                className={`relative group bg-gray-900/60 border rounded-2xl p-5 flex flex-col items-center text-center gap-3 transition-all duration-200 ${isHidden ? "border-gray-800 opacity-40" : "border-gray-700"}`}
              >
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${app.gradient} rounded-2xl flex items-center justify-center shadow-lg ${app.glow}`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{app.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5 leading-tight">{app.description}</p>
                </div>
                <button
                  onClick={() => toggleHidden(app.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition-colors"
                  aria-label={isHidden ? "Показати" : "Сховати"}
                >
                  {isHidden ? (
                    <Eye className="w-3.5 h-3.5 text-gray-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
              </div>
            );
          }

          return (
            <Link
              key={app.id}
              href={app.href}
              className="group bg-gray-900/60 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-600 rounded-2xl p-5 flex flex-col items-center text-center gap-3 transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 cursor-pointer"
            >
              <div
                className={`w-14 h-14 bg-gradient-to-br ${app.gradient} rounded-2xl flex items-center justify-center shadow-lg ${app.glow} group-hover:shadow-xl transition-shadow`}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{app.name}</p>
                <p className="text-gray-500 text-xs mt-0.5 leading-tight">{app.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {!editing && visibleApps.length === 0 && (
        <p className="text-gray-600 text-sm text-center py-8">
          Всі ярлики сховані.{" "}
          <button
            onClick={() => setEditing(true)}
            className="text-violet-400 hover:text-violet-300 underline"
          >
            Редагувати
          </button>
        </p>
      )}
    </div>
  );
}
