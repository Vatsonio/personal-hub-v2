"use client";

import { useMemo } from "react";
import { X, MoreHorizontal, Search, ChevronsLeft } from "lucide-react";
import SavedBubble from "./SavedBubble";
import { useLocale } from "@/components/LocaleProvider";
import type { SavedItem } from "@/types/domain";

type Props = {
  open: boolean;
  items: SavedItem[];
  onClose: () => void;
  onJump: (id: string) => void;
  onUnpinAll?: () => void;
  onUpdateMeta?: (id: string, meta: Record<string, string>) => void;
};

function fullDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function groupByFullDate(items: SavedItem[]) {
  const map = new Map<string, SavedItem[]>();
  for (const it of items) {
    const k = fullDateLabel(it.created_at);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(it);
  }
  return Array.from(map.entries()).map(([label, arr]) => ({ label, items: arr }));
}

export default function SavedPinnedView({
  open,
  items,
  onClose,
  onJump,
  onUnpinAll,
  onUpdateMeta
}: Props) {
  const { t } = useLocale();
  const groups = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return groupByFullDate(sorted);
  }, [items]);

  return (
    <div
      className={`fixed inset-0 z-[60] bg-gray-950 transition-opacity duration-300 ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      {/* Header */}
      <div
        className="absolute top-0 left-0 right-0 z-10 px-3 pt-3 pb-2"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 flex items-center justify-center text-gray-300"
            title={t("saved.pinned.close")}
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex-1 flex items-center justify-center h-10 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5">
            <div className="text-[14px] text-white font-medium">
              {t("saved.pinned.count", items.length)}
            </div>
          </div>
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 flex items-center justify-center"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>

      {/* List */}
      <div
        className="absolute inset-0 overflow-y-auto pt-20 pb-24"
        style={{
          paddingTop: "calc(5rem + env(safe-area-inset-top))",
          paddingBottom: "calc(6rem + env(safe-area-inset-bottom))"
        }}
      >
        <div className="max-w-3xl mx-auto">
          {groups.length === 0 ? (
            <div className="text-center text-gray-500 text-[13px] mt-12">
              {t("saved.pinned.empty")}
            </div>
          ) : (
            groups.map((g) => (
              <section key={g.label}>
                <div className="flex justify-center my-3">
                  <span className="text-[12px] text-violet-300/90 font-medium">{g.label}</span>
                </div>
                {g.items.map((it) => (
                  <div key={it.id} className="flex items-end gap-2 px-1">
                    <button
                      type="button"
                      onClick={() => {
                        onJump(it.id);
                        onClose();
                      }}
                      className="mb-3 ml-1 w-7 h-7 rounded-full bg-violet-500/15 border border-violet-400/20 flex items-center justify-center text-violet-300 flex-shrink-0 hover:bg-violet-500/25 transition-colors"
                      title={t("saved.pinned.jump_to_original")}
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <SavedBubble
                        item={it}
                        replyParent={null}
                        isSelected={false}
                        onToggleSelect={() => {}}
                        onPin={() => {}}
                        onUnpin={() => {}}
                        onFavorite={() => {}}
                        onUnfavorite={() => {}}
                        onDelete={() => {}}
                        onReply={() => {}}
                        onUpdateMeta={(meta) => onUpdateMeta?.(it.id, meta)}
                        onSetReminder={() => {}}
                      />
                    </div>
                  </div>
                ))}
              </section>
            ))
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div
        className="absolute left-0 right-0 bottom-0 z-10 px-3 pb-3 pt-2"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onUnpinAll}
            disabled={items.length === 0}
            className="flex-1 h-11 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 text-[14px] text-gray-200 hover:bg-gray-800/85 transition-colors disabled:opacity-40"
          >
            {t("saved.pinned.unpin_all")}
          </button>
          <button
            type="button"
            className="w-11 h-11 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 flex items-center justify-center text-gray-300"
            title={t("saved.pinned.search")}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
