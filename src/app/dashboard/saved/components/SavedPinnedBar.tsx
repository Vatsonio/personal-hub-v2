"use client";

import { Pin } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import type { SavedItem } from "@/types/domain";

type Props = {
  item: SavedItem | null | undefined;
  count: number;
  onJump: (id: string) => void;
  onOpenList: () => void;
};

export default function SavedPinnedBar({ item, count, onJump, onOpenList }: Props) {
  const { t } = useLocale();
  if (!item) return null;

  const previewOf = (it: SavedItem): string => {
    if (it.content_type === "link") {
      const og = it.metadata as Record<string, string> | undefined;
      return og?.og_title || it.source_url || t("saved.pinned.link_fallback");
    }
    if (it.content_type === "image") return t("saved.pinned.image");
    if (it.content_type === "file") {
      const meta = it.metadata as Record<string, string> | undefined;
      return `📎 ${meta?.filename || it.title || t("saved.pinned.file_fallback")}`;
    }
    if (it.content_type === "voice") return t("saved.pinned.voice");
    return (it.content || "").replace(/\n/g, " ");
  };
  const preview = previewOf(item);

  return (
    <div className="px-3 pb-2">
      <div className="flex items-center gap-2 h-12 pl-3 pr-1 rounded-2xl bg-gray-900/85 backdrop-blur-md border border-white/5">
        <button
          type="button"
          onClick={() => onJump(item.id)}
          className="flex flex-1 items-center gap-2 min-w-0 text-left h-full"
        >
          <div className="w-[3px] self-stretch my-1 rounded-full bg-violet-400" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-violet-300 font-medium leading-tight">
              {t("saved.pinned.label")}
              {count > 1 && <span className="text-violet-300/70"> · {count}</span>}
            </div>
            <div className="text-[12.5px] text-gray-200 truncate leading-tight mt-0.5">
              {preview}
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={onOpenList}
          className="w-9 h-9 rounded-full hover:bg-white/5 flex items-center justify-center text-gray-400 transition-colors flex-shrink-0"
          title={t("saved.pinned.all")}
        >
          <Pin className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
