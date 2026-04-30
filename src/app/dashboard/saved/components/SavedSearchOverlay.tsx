"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Bookmark, Tag, Check } from "lucide-react";
import type { SavedItem } from "@/types/domain";

type Props = {
  open: boolean;
  items: SavedItem[];
  onClose: () => void;
  onJump: (id: string) => void;
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}

function typeLabel(it: SavedItem): string {
  if (it.content_type === "image") return "Фото";
  if (it.content_type === "link") {
    const meta = it.metadata as Record<string, string> | undefined;
    return meta?.og_site_name || "Посилання";
  }
  if (it.content_type === "file") return "Файл";
  if (it.content_type === "voice") return "Голос";
  return (it.content || "").slice(0, 60);
}

export default function SavedSearchOverlay({ open, items, onClose, onJump }: Props) {
  const [q, setQ] = useState("");
  const [listMode, setListMode] = useState(false);
  const [tagPanelOpen, setTagPanelOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    } else {
      setQ("");
      setListMode(false);
      setTagPanelOpen(false);
      setSelectedTags([]);
    }
  }, [open]);

  // All unique tags across items
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) for (const tg of it.tags) set.add(tg);
    return Array.from(set).sort();
  }, [items]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  const matches = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((it) => {
      // Tag filter — items with ANY selected tag
      if (selectedTags.length > 0 && !selectedTags.some((t) => it.tags.includes(t))) return false;
      if (!query) return selectedTags.length > 0;
      const meta = it.metadata as Record<string, string> | undefined;
      const hay = [
        it.content,
        it.source_url,
        it.title,
        meta?.og_title,
        meta?.og_description,
        meta?.og_site_name,
        ...(it.tags || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [q, items, selectedTags]);

  const showList = listMode || q.trim().length > 0 || selectedTags.length > 0;

  return (
    <div
      className={`fixed inset-0 z-[55] transition-opacity duration-200 ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div onClick={onClose} className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 px-3 pt-3 pb-2"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-11 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 flex items-center gap-2 px-4">
              <Search className="w-4 h-4 text-cyan-300" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Пошук у Збереженому"
                className="flex-1 bg-transparent outline-none text-[14.5px] text-white placeholder-gray-500"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 flex items-center justify-center text-gray-300"
              title="Закрити"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTagPanelOpen((v) => !v)}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-full backdrop-blur-md border text-[13px] transition-colors ${
                tagPanelOpen || selectedTags.length > 0
                  ? "bg-violet-500/20 border-violet-400/30 text-violet-200"
                  : "bg-gray-900/85 border-white/5 text-gray-200"
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span className="font-medium">Мітки</span>
              {selectedTags.length > 0 && (
                <span className="text-[11.5px] bg-white/15 rounded-full px-1.5 leading-5 min-w-[1.25rem] text-center">
                  {selectedTags.length}
                </span>
              )}
            </button>
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="flex items-center gap-1 h-9 px-3 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 text-[13px] text-gray-400 hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
                <span>Скинути</span>
              </button>
            )}
          </div>
          {tagPanelOpen && allTags.length > 0 && (
            <div className="mt-2 p-2 rounded-2xl bg-gray-900/85 backdrop-blur-md border border-white/5 max-h-40 overflow-y-auto">
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tg) => {
                  const active = selectedTags.includes(tg);
                  return (
                    <button
                      key={tg}
                      type="button"
                      onClick={() => toggleTag(tg)}
                      className={`flex items-center gap-1 h-7 px-2.5 rounded-full text-[12px] transition-colors ${
                        active
                          ? "bg-violet-500/30 text-violet-100 border border-violet-400/40"
                          : "bg-white/5 text-gray-300 border border-white/5 hover:bg-white/10"
                      }`}
                    >
                      {active && <Check className="w-3 h-3" />}
                      <span>#{tg}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {tagPanelOpen && allTags.length === 0 && (
            <div className="mt-2 p-3 rounded-2xl bg-gray-900/85 backdrop-blur-md border border-white/5 text-[12.5px] text-gray-500 text-center">
              Ще немає міток
            </div>
          )}
        </div>
      </div>

      {/* List of matches */}
      {showList && (
        <div
          className="absolute left-0 right-0 px-3 overflow-y-auto"
          style={{
            top: "calc(8rem + env(safe-area-inset-top))",
            bottom: "calc(5rem + env(safe-area-inset-bottom))"
          }}
        >
          <div className="max-w-3xl mx-auto">
            {q.trim().length === 0 && selectedTags.length === 0 ? (
              <div className="text-center text-gray-500 text-[13px] mt-8">
                Введіть запит для пошуку
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center text-gray-500 text-[13px] mt-8">Нічого не знайдено</div>
            ) : (
              matches.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => {
                    onJump(it.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 py-2.5 px-1 hover:bg-white/5 rounded-xl transition-colors text-left"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500/40 to-blue-500/30 border border-white/5 flex items-center justify-center flex-shrink-0">
                    <Bookmark className="w-5 h-5 text-cyan-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[14px] text-white font-medium truncate">Збережене</div>
                      <div className="text-[11.5px] text-cyan-300 flex-shrink-0">
                        {fmtTime(it.created_at)}
                      </div>
                    </div>
                    <div className="text-[12.5px] text-gray-400 truncate mt-0.5">
                      {typeLabel(it)}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div
        className="absolute left-0 right-0 bottom-0 px-3 pb-3 pt-2"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 h-10 px-3 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[13px] text-gray-300">{items.length} повідомлень</span>
          </div>
          <button
            type="button"
            onClick={() => setListMode((v) => !v)}
            className="h-10 px-4 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 text-[13px] text-gray-200"
          >
            {showList ? "Показати в чаті" : "Показати списком"}
          </button>
        </div>
      </div>
    </div>
  );
}
