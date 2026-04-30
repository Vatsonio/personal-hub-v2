"use client";

import { Search, X, Loader2 } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

type Props = { value: string; onChange: (v: string) => void; loading?: boolean };

export default function SavedSearchBar({ value, onChange, loading }: Props) {
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-2 flex-shrink-0 mb-2 bg-gray-900/70 border border-white/5 rounded-full px-4 h-10 focus-within:border-violet-500/40 transition-colors backdrop-blur-md">
      {loading ? (
        <Loader2 className="w-4 h-4 text-violet-400 animate-spin flex-shrink-0" />
      ) : (
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("saved.searchbar.placeholder")}
        className="flex-1 bg-transparent text-base sm:text-[14px] text-white placeholder-gray-500 focus:outline-none"
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
