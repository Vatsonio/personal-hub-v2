"use client";

import { useState, useCallback, useEffect } from "react";
import { BookMarked, Trash2, Tag, X, Check, AlertTriangle, Loader2 } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import SavedFeed from "./components/SavedFeed";
import SavedComposer from "./components/SavedComposer";
import SavedFilters from "./components/SavedFilters";
import SavedSearchBar from "./components/SavedSearchBar";
import { useSavedItems } from "./hooks/useSavedItems";
import { useSavedSearch } from "./hooks/useSavedSearch";
import type { SavedItem } from "@/types/domain";

type Props = {
  initialItems: SavedItem[];
  userId: string;
  dbError?: string | null;
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

export default function SavedClient({
  initialItems,
  userId: initialUserId,
  dbError,
  storageUsed: initialStorageUsed = 0,
  storageLimit: initialStorageLimit = 0
}: Props) {
  const [userId] = useState(initialUserId);
  const { t } = useLocale();
  const [storageUsed, setStorageUsed] = useState(initialStorageUsed);
  const [storageLimit, setStorageLimit] = useState(initialStorageLimit);

  const refreshStorage = useCallback(async () => {
    try {
      const res = await fetch("/api/user/storage");
      if (res.ok) {
        const data = await res.json();
        setStorageUsed(data.used);
        setStorageLimit(data.limit);
      }
    } catch {
      // silent
    }
  }, []);

  // "Connecting…" shimmer — show briefly on cold cloud start so users see
  // something is happening rather than a blank screen.
  const [connecting, setConnecting] = useState(initialItems.length === 0 && !dbError);
  useEffect(() => {
    if (!connecting) return;
    const t = setTimeout(() => setConnecting(false), 1800);
    return () => clearTimeout(t);
  }, [connecting]);

  const { items, addItem, updateItem, deleteItem, bulkDelete, bulkTag } = useSavedItems(
    initialItems,
    userId
  );
  const { filtered, rawSearch, setRawSearch, filters, setFilters, ftsLoading } =
    useSavedSearch(items);
  const [replyTo, setReplyTo] = useState<SavedItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState("");
  const [tagging, setTagging] = useState(false);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setTagging(false);
    setTagInput("");
  }, []);

  const handleBulkDelete = useCallback(async () => {
    await bulkDelete(Array.from(selectedIds));
    clearSelection();
  }, [bulkDelete, selectedIds, clearSelection]);

  const handleBulkTag = useCallback(async () => {
    const tags = tagInput
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, "").toLowerCase())
      .filter(Boolean);
    if (tags.length === 0) return;
    await bulkTag(Array.from(selectedIds), tags);
    clearSelection();
  }, [bulkTag, selectedIds, tagInput, clearSelection]);

  const hasSelection = selectedIds.size > 0;

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        height:
          "calc(100svh - 4rem - env(safe-area-inset-top) - 3.5rem - env(safe-area-inset-bottom) - 0.5rem)"
      }}
    >
      <div className="flex-shrink-0 bg-gray-950/95 backdrop-blur-sm pb-2">
        {/* Header — hidden on mobile (bottom nav handles navigation) */}
        <div className="hidden sm:flex items-center gap-3 mb-3 flex-shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/20">
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-semibold text-lg leading-none">{t("saved.title")}</h1>
            <p className="text-gray-500 text-xs mt-0.5">{t("saved.count", items.length)}</p>
          </div>
          {storageLimit > 0 && (
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-xs text-gray-500">
                {fmtBytes(storageUsed)} / {fmtBytes(storageLimit)}
              </span>
              <div className="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.round((storageUsed / storageLimit) * 100))}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile storage bar */}
        {storageLimit > 0 && (
          <div className="sm:hidden flex items-center gap-2 mb-1.5 flex-shrink-0">
            <div className="flex-1 h-0.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500/60 rounded-full"
                style={{
                  width: `${Math.min(100, Math.round((storageUsed / storageLimit) * 100))}%`
                }}
              />
            </div>
            <span className="text-[10px] text-gray-600">{fmtBytes(storageUsed)}</span>
          </div>
        )}

        <SavedSearchBar value={rawSearch} onChange={setRawSearch} loading={ftsLoading} />
        <SavedFilters filters={filters} onChange={setFilters} items={items} />

        {/* Bulk action bar — slides in when items are selected */}
        {hasSelection && (
          <div className="flex-shrink-0 flex items-center gap-2 mt-2 px-3 py-2 bg-gray-900/80 border border-gray-700 rounded-xl backdrop-blur-sm animate-fade-in">
            <span className="text-xs text-gray-400 font-medium mr-1">
              {selectedIds.size} вибрано
            </span>

            {tagging ? (
              <>
                <input
                  autoFocus
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBulkTag()}
                  placeholder="#тег або кілька через пробіл"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60"
                />
                <button
                  onClick={handleBulkTag}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-xs hover:bg-violet-500/30 transition-all"
                >
                  <Check className="w-3 h-3" /> Застосувати
                </button>
                <button
                  onClick={() => setTagging(false)}
                  className="text-gray-600 hover:text-gray-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setTagging(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 text-xs hover:bg-blue-500/25 transition-all border border-blue-500/20"
                >
                  <Tag className="w-3 h-3" /> Теги
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 text-red-300 text-xs hover:bg-red-500/25 transition-all border border-red-500/20"
                >
                  <Trash2 className="w-3 h-3" /> Видалити
                </button>
              </>
            )}

            <button
              onClick={clearSelection}
              className="ml-auto text-gray-600 hover:text-gray-400 transition-colors"
              title="Скасувати"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* DB error banner — shows if migration wasn't applied or Supabase is unreachable */}
        {dbError && (
          <div className="flex-shrink-0 flex items-center gap-2 mt-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Помилка з&apos;єднання з базою даних. Дані можуть бути застарілими.</span>
          </div>
        )}

        {/* Connecting shimmer — shown on cold cloud start */}
        {connecting && (
          <div className="flex-shrink-0 flex items-center gap-2 mt-2 px-3 py-1.5 bg-gray-800/60 border border-gray-700/50 rounded-xl text-xs text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Підключення до хмари…</span>
          </div>
        )}
      </div>

      {/* Стрічка */}
      <div className="flex-1 overflow-y-auto min-h-0 mt-1">
        <SavedFeed
          items={filtered}
          allItems={items}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onPin={(id) => updateItem(id, { is_pinned: true })}
          onUnpin={(id) => updateItem(id, { is_pinned: false })}
          onFavorite={(id) => updateItem(id, { is_favorite: true })}
          onUnfavorite={(id) => updateItem(id, { is_favorite: false })}
          onDelete={async (id) => {
            await deleteItem(id);
            refreshStorage();
          }}
          onReply={setReplyTo}
          onUpdateMeta={(id, meta) =>
            updateItem(id, {
              metadata: { ...(items.find((i) => i.id === id)?.metadata ?? {}), ...meta }
            })
          }
          onSetReminder={(id, iso) => updateItem(id, { reminder_at: iso })}
        />
      </div>

      {/* Composer — hidden during bulk selection */}
      {!hasSelection && (
        <div className="flex-shrink-0 bg-gray-950/95 backdrop-blur-sm pt-1">
          <SavedComposer
            onAdd={addItem}
            onUploadDone={refreshStorage}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        </div>
      )}
    </div>
  );
}
