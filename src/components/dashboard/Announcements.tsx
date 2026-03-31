"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export function Announcements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch("/api/announcements").then((r) => r.json()),
      fetch("/api/user/dismiss-announcement").then((r) => r.json())
    ]).then(([annData, dismissData]) => {
      setItems(annData.announcements ?? []);
      setDismissed(new Set((dismissData.ids ?? []) as string[]));
    });
  }, []);

  async function dismiss(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
    await fetch("/api/user/dismiss-announcement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
  }

  const visible = items.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {visible.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-3 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3"
        >
          <Megaphone className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium">{a.title}</p>
            <p className="text-gray-400 text-sm mt-0.5">{a.content}</p>
          </div>
          <button
            onClick={() => dismiss(a.id)}
            className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
            aria-label="Закрити"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
