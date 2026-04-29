"use client";

import { ArrowLeft, Search, MoreHorizontal } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

type Props = {
  pinnedCount: number;
  totalCount: number;
  onSearch: () => void;
  onMore?: () => void;
  storageUsed?: number;
  storageLimit?: number;
};

function fmtBytes(n: number) {
  if (!n || n <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${(n / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function SavedHeader({
  pinnedCount,
  totalCount,
  onSearch,
  onMore,
  storageUsed = 0,
  storageLimit = 0
}: Props) {
  const { t } = useLocale();
  const showStorage = storageLimit > 0;
  const pct = showStorage ? Math.min(100, Math.round((storageUsed / storageLimit) * 100)) : 0;

  return (
    <div className="px-3 pt-2 pb-2">
      <div className="flex items-center gap-2">
        {/* Back + pinned count */}
        <button
          type="button"
          className="flex items-center gap-1.5 h-10 px-3 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5"
          title="Назад"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 text-gray-300" />
          {pinnedCount > 0 && (
            <span className="text-[12px] text-white bg-white/10 rounded-full px-1.5 leading-5 min-w-[1.25rem] text-center">
              {pinnedCount}
            </span>
          )}
        </button>

        {/* Title pill */}
        <div className="flex-1 flex flex-col items-center justify-center h-10 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 px-3 overflow-hidden">
          <div className="text-[14px] text-white font-medium leading-none truncate">
            {t("saved.title")}
          </div>
          <div className="text-[10.5px] text-gray-400 leading-none mt-0.5 truncate">
            {t("saved.count", totalCount)}
          </div>
        </div>

        {/* Search */}
        <button
          type="button"
          onClick={onSearch}
          className="w-10 h-10 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 flex items-center justify-center"
          title="Пошук"
        >
          <Search className="w-4 h-4 text-gray-300" />
        </button>

        {/* More */}
        <button
          type="button"
          onClick={onMore}
          className="w-10 h-10 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 flex items-center justify-center"
          title="Більше"
        >
          <MoreHorizontal className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      {/* Storage thin progress strip */}
      {showStorage && (
        <div className="mt-2 flex items-center gap-2 px-1">
          <div className="flex-1 h-0.5 bg-gray-800/70 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500/80 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 flex-shrink-0">
            {fmtBytes(storageUsed)} / {fmtBytes(storageLimit)}
          </span>
        </div>
      )}
    </div>
  );
}
