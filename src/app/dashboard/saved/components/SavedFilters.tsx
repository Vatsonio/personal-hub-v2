"use client";

import { Pin, Heart, Type, Link2, FileUp, Image, Mic } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
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

type FilterLabelKey =
  | "saved.filters.all"
  | "saved.filters.text"
  | "saved.filters.link"
  | "saved.filters.file"
  | "saved.filters.image"
  | "saved.filters.voice";

const TYPE_OPTIONS: {
  value: SavedContentType | "all";
  labelKey: FilterLabelKey;
  Icon: React.ElementType;
}[] = [
  { value: "all", labelKey: "saved.filters.all", Icon: Type },
  { value: "text", labelKey: "saved.filters.text", Icon: Type },
  { value: "link", labelKey: "saved.filters.link", Icon: Link2 },
  { value: "file", labelKey: "saved.filters.file", Icon: FileUp },
  { value: "image", labelKey: "saved.filters.image", Icon: Image },
  { value: "voice", labelKey: "saved.filters.voice", Icon: Mic }
];

export default function SavedFilters({ filters, onChange, items }: Props) {
  const { t } = useLocale();
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

  const chipBase =
    "flex items-center gap-1 h-7 px-2.5 rounded-full text-[11.5px] sm:text-xs font-medium transition-all whitespace-nowrap border backdrop-blur-md";
  const chipIdle = "bg-gray-900/60 text-gray-400 border-white/5 hover:text-gray-200";

  return (
    <div className="flex flex-col gap-1.5 flex-shrink-0 mb-1">
      {/* Типи */}
      <div className="overflow-x-auto -mx-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-1.5 min-w-max">
          {TYPE_OPTIONS.map(({ value, labelKey, Icon }) => (
            <button
              key={value}
              onClick={() => toggle("type", value)}
              className={`${chipBase} ${
                filters.type === value
                  ? "bg-violet-500/20 text-violet-200 border-violet-400/30"
                  : chipIdle
              }`}
            >
              <Icon className="w-3 h-3" />
              {t(labelKey)}
            </button>
          ))}

          <button
            onClick={() => toggle("pinned", !filters.pinned)}
            className={`${chipBase} ${
              filters.pinned ? "bg-amber-500/20 text-amber-200 border-amber-400/30" : chipIdle
            }`}
          >
            <Pin className="w-3 h-3" /> Pinned
          </button>

          <button
            onClick={() => toggle("favorite", !filters.favorite)}
            className={`${chipBase} ${
              filters.favorite ? "bg-rose-500/20 text-rose-200 border-rose-400/30" : chipIdle
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
                className={`h-6 px-2 rounded-full text-[11px] transition-all whitespace-nowrap border ${
                  filters.tags.includes(tag)
                    ? "bg-blue-500/20 text-blue-200 border-blue-400/30"
                    : "bg-gray-900/50 text-gray-500 border-white/5 hover:text-gray-300"
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
