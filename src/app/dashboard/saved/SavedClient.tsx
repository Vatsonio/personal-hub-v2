"use client";

import { useState, useCallback, useEffect } from "react";
import { Trash2, Tag, X, Check, AlertTriangle, Loader2 } from "lucide-react";
import SavedFeed from "./components/SavedFeed";
import SavedComposer from "./components/SavedComposer";
import SavedFilters from "./components/SavedFilters";
import SavedHeader from "./components/SavedHeader";
import SavedPinnedBar from "./components/SavedPinnedBar";
import SavedPinnedView from "./components/SavedPinnedView";
import { useSavedItems } from "./hooks/useSavedItems";
import { useSavedSearch } from "./hooks/useSavedSearch";
import type { SavedItem } from "@/types/domain";
import { readSettings, SETTINGS_EVENT_NAME } from "@/lib/settings";

type Props = {
  initialItems: SavedItem[];
  userId: string;
  dbError?: string | null;
  storageUsed?: number;
  storageLimit?: number;
};

function jumpToItemEl(id: string) {
  const target = document.querySelector<HTMLElement>(`[data-bubble-id="${id}"]`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.add("bubble-flash");
  setTimeout(() => target.classList.remove("bubble-flash"), 1400);
}

export default function SavedClient({
  initialItems,
  userId: initialUserId,
  dbError,
  storageUsed: initialStorageUsed = 0,
  storageLimit: initialStorageLimit = 0
}: Props) {
  const [userId] = useState(initialUserId);
  const [isGlass, setIsGlass] = useState(false);
  useEffect(() => {
    const check = () => setIsGlass(document.body.classList.contains("theme-glass"));
    check();
    window.addEventListener("personal-hub-settings-changed", check);
    return () => window.removeEventListener("personal-hub-settings-changed", check);
  }, []);
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

  // Track whether bottom nav is visible (affects bottom offset)
  const [bottomNavVisible, setBottomNavVisible] = useState(true);
  useEffect(() => {
    function check() {
      const s = readSettings();
      // On saved page, autoHide always hides the nav (we're not on /dashboard)
      setBottomNavVisible(!s.bottomNavHidden && !s.bottomNavAutoHide);
    }
    check();
    window.addEventListener(SETTINGS_EVENT_NAME, check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener(SETTINGS_EVENT_NAME, check);
      window.removeEventListener("storage", check);
    };
  }, []);

  // On mobile: lock html+body scroll so only the feed scrolls (iOS Safari fix)
  useEffect(() => {
    if (window.matchMedia("(max-width: 639px)").matches) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
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

  // Pinned management
  const pinned = items
    .filter((i) => i.is_pinned)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const [pinnedViewOpen, setPinnedViewOpen] = useState(false);
  const [pinnedCursor, setPinnedCursor] = useState(0);
  const currentPinned = pinned[pinnedCursor % Math.max(pinned.length, 1)] ?? pinned[0];

  const jumpToPinned = useCallback(
    (id: string) => {
      jumpToItemEl(id);
      setPinnedCursor((c) => (pinned.length > 0 ? (c + 1) % pinned.length : 0));
    },
    [pinned.length]
  );

  const jumpToItem = useCallback((id: string) => {
    jumpToItemEl(id);
  }, []);

  const handleUnpinAll = useCallback(async () => {
    for (const p of pinned) {
      await updateItem(p.id, { is_pinned: false });
    }
    setPinnedViewOpen(false);
  }, [pinned, updateItem]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
    <>
      <div
        className="flex flex-col overflow-hidden px-0 pt-0 pb-1
        sm:px-0 sm:pt-0 sm:pb-0 sm:h-[calc(100svh-4rem-env(safe-area-inset-top)-1rem-3.5rem-env(safe-area-inset-bottom))]
        fixed sm:static left-0 right-0
        sm:top-auto sm:bottom-auto sm:left-auto sm:right-auto"
        style={{
          top: "calc(4rem + env(safe-area-inset-top))",
          bottom: bottomNavVisible
            ? "calc(3.5rem + env(safe-area-inset-bottom))"
            : "env(safe-area-inset-bottom)"
        }}
      >
        <div className={`flex-shrink-0 ${isGlass ? "bg-transparent" : ""}`}>
          <SavedHeader
            pinnedCount={pinned.length}
            totalCount={items.length}
            onSearch={() => {
              /* TODO commit 7: open search overlay */
            }}
            storageUsed={storageUsed}
            storageLimit={storageLimit}
          />
          <SavedPinnedBar
            item={currentPinned}
            count={pinned.length}
            onJump={jumpToPinned}
            onOpenList={() => setPinnedViewOpen(true)}
          />

          <div className="px-3">
            <SavedFilters filters={filters} onChange={setFilters} items={items} />
          </div>

          {/* Bulk action bar — slides in when items are selected */}
          {hasSelection && (
            <div className="flex-shrink-0 flex items-center gap-2 mt-2 mx-3 px-3 py-2 bg-gray-900/80 border border-gray-700 rounded-xl backdrop-blur-sm">
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

          {/* DB error banner */}
          {dbError && (
            <div className="flex-shrink-0 flex items-center gap-2 mt-2 mx-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Помилка з&apos;єднання з базою даних. Дані можуть бути застарілими.</span>
            </div>
          )}

          {/* Connecting shimmer */}
          {connecting && (
            <div className="flex-shrink-0 flex items-center gap-2 mt-2 mx-3 px-3 py-1.5 bg-gray-800/60 border border-gray-700/50 rounded-xl text-xs text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Підключення до хмари…</span>
            </div>
          )}
        </div>

        {/* Стрічка */}
        <div className="flex-1 overflow-y-auto min-h-0 mt-1 overscroll-none">
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
          <div className={`flex-shrink-0 pt-1 px-3 ${isGlass ? "bg-transparent" : ""}`}>
            <SavedComposer
              onAdd={addItem}
              onUploadDone={refreshStorage}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
            />
          </div>
        )}
      </div>

      <SavedPinnedView
        open={pinnedViewOpen}
        items={pinned}
        onClose={() => setPinnedViewOpen(false)}
        onJump={jumpToItem}
        onUnpinAll={handleUnpinAll}
        onUpdateMeta={(id, meta) =>
          updateItem(id, {
            metadata: { ...(items.find((i) => i.id === id)?.metadata ?? {}), ...meta }
          })
        }
      />

      {/* search/loading indicator (kept for ftsLoading hint) */}
      {ftsLoading && (
        <div className="fixed bottom-20 right-4 z-40 text-xs text-gray-500 bg-gray-900/80 border border-white/5 rounded-full px-2 py-1 backdrop-blur-md">
          <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
          пошук…
        </div>
      )}

      {/* Hidden — keeps rawSearch wired for future overlay */}
      <input type="hidden" value={rawSearch} onChange={() => setRawSearch(rawSearch)} readOnly />
    </>
  );
}
