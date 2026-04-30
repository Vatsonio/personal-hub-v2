"use client";

import { ArrowLeft, Search, MoreHorizontal } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

type Props = {
  pinnedCount: number;
  totalCount: number;
  onSearch: () => void;
  onMore?: (anchor: { x: number; y: number }) => void;
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
  const subtitle = showStorage
    ? `${t("saved.count", totalCount)} · ${fmtBytes(storageUsed)} / ${fmtBytes(storageLimit)}`
    : t("saved.count", totalCount);

  return (
    <div className="px-3 pt-2 pb-2">
      <div className="flex items-center gap-2">
        {/* Back + pinned count */}
        <button
          type="button"
          className="flex items-center gap-1.5 h-10 px-3 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5"
          title={t("saved.header.back")}
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
          <div className="text-[10.5px] text-gray-400 leading-none mt-0.5 truncate">{subtitle}</div>
        </div>

        {/* Search */}
        <button
          type="button"
          onClick={onSearch}
          className="w-10 h-10 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 flex items-center justify-center"
          title={t("saved.header.search")}
        >
          <Search className="w-4 h-4 text-gray-300" />
        </button>

        {/* More */}
        <button
          type="button"
          onClick={(e) => {
            const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
            onMore?.({ x: r.right, y: r.bottom + 6 });
          }}
          className="w-10 h-10 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 flex items-center justify-center"
          title={t("saved.header.more")}
        >
          <MoreHorizontal className="w-4 h-4 text-gray-300" />
        </button>
      </div>
    </div>
  );
}
