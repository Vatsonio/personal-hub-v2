"use client";

import { Search, X, Loader2 } from "lucide-react";

type Props = { value: string; onChange: (v: string) => void; loading?: boolean };

export default function SavedSearchBar({ value, onChange, loading }: Props) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0 mb-2 bg-gray-900/60 border border-gray-800 rounded-xl px-3 focus-within:border-violet-500/60 transition-colors">
      {loading ? (
        <Loader2 className="w-4 h-4 text-violet-400 animate-spin flex-shrink-0" />
      ) : (
        <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Пошук по тексту, URL, тегах…"
        className="flex-1 bg-transparent py-2.5 text-base sm:text-sm text-white placeholder-gray-500 focus:outline-none"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="text-gray-500 hover:text-gray-300 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
