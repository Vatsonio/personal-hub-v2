"use client";

import { Pin, Heart, Type, Link2, FileUp, Image, Mic } from "lucide-react";
import type { SavedItem, SavedContentType } from "@/types/domain";

type Filters = {
  type: SavedContentType | "all";
  pinned: boolean;
  favorite: boolean;
  tags: string[];
};

type Props = {
  filters: Filters;
  onChange: (f: Filters) => void;
  items: SavedItem[];
};

const TYPE_OPTIONS: { value: SavedContentType | "all"; label: string; Icon: React.ElementType }[] =
  [
    { value: "all", label: "Всі", Icon: Type },
    { value: "text", label: "Текст", Icon: Type },
    { value: "link", label: "Посилання", Icon: Link2 },
    { value: "file", label: "Файл", Icon: FileUp },
    { value: "image", label: "Зображення", Icon: Image },
    { value: "voice", label: "Голос", Icon: Mic }
  ];

export default function SavedFilters({ filters, onChange, items }: Props) {
  const allTags = Array.from(new Set(items.flatMap((i) => i.tags))).sort();

  function toggle<K extends keyof Filters>(key: K, val: Filters[K]) {
    onChange({ ...filters, [key]: val });
  }

  function toggleTag(tag: string) {
    const next = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    onChange({ ...filters, tags: next });
  }

  return (
    <div className="flex flex-col gap-1.5 flex-shrink-0 mb-1">
      {/* Типи */}
      <div className="overflow-x-auto -mx-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-1.5 min-w-max">
          {TYPE_OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => toggle("type", value)}
              className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap ${
                filters.type === value
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
                  : "bg-gray-900/50 text-gray-500 border border-gray-800 hover:text-gray-300 hover:border-gray-700"
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}

          <button
            onClick={() => toggle("pinned", !filters.pinned)}
            className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap ${
              filters.pinned
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-gray-900/50 text-gray-500 border border-gray-800 hover:text-gray-300"
            }`}
          >
            <Pin className="w-3 h-3" /> Pinned
          </button>

          <button
            onClick={() => toggle("favorite", !filters.favorite)}
            className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap ${
              filters.favorite
                ? "bg-red-500/20 text-red-300 border border-red-500/40"
                : "bg-gray-900/50 text-gray-500 border border-gray-800 hover:text-gray-300"
            }`}
          >
            <Heart className="w-3 h-3" /> Favorite
          </button>
        </div>
      </div>

      {/* Теги */}
      {allTags.length > 0 && (
        <div className="overflow-x-auto -mx-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-1.5 min-w-max">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-0.5 rounded-md text-[11px] sm:text-xs transition-all whitespace-nowrap ${
                  filters.tags.includes(tag)
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    : "bg-gray-900/50 text-gray-600 border border-gray-800 hover:text-gray-400"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
