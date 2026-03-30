"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookMarked, UserCircle2, Settings, Pencil, Check, EyeOff, Eye } from "lucide-react";

const STORAGE_KEY = "dashboard:hidden-quick-actions";

const ALL_ACTIONS = [
  {
    id: "saved",
    href: "/dashboard/saved",
    label: "Saved",
    description: "Зберегти текст, посилання або ідею",
    icon: BookMarked
  },
  {
    id: "profile",
    href: "/dashboard/profile",
    label: "Профіль і безпека",
    description: "Керувати акаунтом, паролем і сесіями",
    icon: UserCircle2
  },
  {
    id: "settings",
    href: "/dashboard/settings",
    label: "Налаштування",
    description: "Мова, тема, формат часу",
    icon: Settings
  }
];

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

export default function QuickActions() {
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

  const visibleActions = editing ? ALL_ACTIONS : ALL_ACTIONS.filter((a) => !hidden.has(a.id));

  if (!mounted) return null;

  return (
    <section className="mb-8 bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Quick Actions
          </h2>
          {!editing && hidden.size > 0 && (
            <span className="text-xs text-gray-600">({hidden.size} hidden)</span>
          )}
        </div>
        <button
          onClick={() => setEditing((e) => !e)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
        </button>
      </div>

      {visibleActions.length === 0 && !editing ? (
        <p className="text-gray-600 text-sm text-center py-4">
          Всі дії приховані.{" "}
          <button
            onClick={() => setEditing(true)}
            className="text-violet-400 hover:text-violet-300 underline"
          >
            Редагувати
          </button>
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleActions.map((action) => {
            const Icon = action.icon;
            const isHidden = hidden.has(action.id);

            if (editing) {
              return (
                <div
                  key={action.id}
                  className={`relative flex items-center gap-3 rounded-xl border bg-gray-800/40 px-4 py-3 transition-all ${isHidden ? "border-gray-800 opacity-40" : "border-gray-700"}`}
                >
                  <div className="w-9 h-9 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium">{action.label}</p>
                    <p className="text-gray-500 text-xs">{action.description}</p>
                  </div>
                  <button
                    onClick={() => toggleHidden(action.id)}
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
                key={action.id}
                href={action.href}
                className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-800/40 hover:bg-gray-800/70 px-4 py-3 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{action.label}</p>
                  <p className="text-gray-500 text-xs">{action.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
