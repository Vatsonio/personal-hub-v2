"use client";

import { useState, useCallback, useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import SavedFeed from "./components/SavedFeed";
import SavedComposer from "./components/SavedComposer";
import SavedFilters from "./components/SavedFilters";
import SavedHeader from "./components/SavedHeader";
import SavedPinnedBar from "./components/SavedPinnedBar";
import SavedPinnedView from "./components/SavedPinnedView";
import SavedContextMenu, { type CtxState, type CtxActionId } from "./components/SavedContextMenu";
import SavedSelectionHeader from "./components/SavedSelectionHeader";
import SavedSelectionActionBar from "./components/SavedSelectionActionBar";
import SavedSearchOverlay from "./components/SavedSearchOverlay";
import SavedConfirmDialog from "./components/SavedConfirmDialog";
import SavedMoreMenu, { type MoreActionId } from "./components/SavedMoreMenu";
import { useSavedItems } from "./hooks/useSavedItems";
import { useSavedSearch } from "./hooks/useSavedSearch";
import { useSavedShortcuts } from "./hooks/useSavedShortcuts";
import type { SavedItem } from "@/types/domain";
import { readSettings, SETTINGS_EVENT_NAME } from "@/lib/settings";
import { useLocale } from "@/components/LocaleProvider";

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
  const { t } = useLocale();
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
  const { filtered, filters, setFilters, ftsLoading } = useSavedSearch(items);
  const [replyTo, setReplyTo] = useState<SavedItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Context menu state
  const [ctx, setCtx] = useState<CtxState>(null);
  const [expandedMdIds, setExpandedMdIds] = useState<Set<string>>(new Set());
  const [reminderPickerId, setReminderPickerId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Delete confirmation state — single id, "bulk", or null
  const [confirmDelete, setConfirmDelete] = useState<
    { kind: "single"; id: string } | { kind: "bulk"; count: number } | null
  >(null);

  // More menu state + sort dir
  const [moreAnchor, setMoreAnchor] = useState<{ x: number; y: number } | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Hydrate sort dir from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("saved-sort");
      if (raw === "asc" || raw === "desc") setSortDir(raw);
    } catch {
      // ignore
    }
  }, []);

  // Persist sort dir
  useEffect(() => {
    try {
      window.localStorage.setItem("saved-sort", sortDir);
    } catch {
      // ignore
    }
  }, [sortDir]);

  // Toast for "link copied" feedback
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(id);
  }, [toast]);

  const handleMoreAction = useCallback(
    (id: MoreActionId) => {
      switch (id) {
        case "sort_asc":
          setSortDir("asc");
          break;
        case "sort_desc":
          setSortDir("desc");
          break;
        case "export_all": {
          const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          const date = new Date().toISOString().slice(0, 10);
          a.download = `saved-bulk-${date}.json`;
          a.click();
          break;
        }
        case "clear_reminders": {
          const withReminders = items.filter((i) => i.reminder_at);
          for (const it of withReminders) {
            updateItem(it.id, { reminder_at: null });
          }
          break;
        }
      }
    },
    [items, updateItem]
  );

  const handleCopy = useCallback(async (item: SavedItem) => {
    const text = item.content_type === "link" ? item.source_url : item.content;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }, []);

  const handleExportMd = useCallback(
    (item: SavedItem) => {
      const lines: string[] = [];
      if (item.title) lines.push(`# ${item.title}`, "");
      if (item.content_type === "link" && item.source_url) lines.push(item.source_url);
      else if (item.content) lines.push(item.content);
      if (item.tags.length > 0) lines.push("", item.tags.map((t) => `#${t}`).join(" "));
      lines.push(
        "",
        `_${t("saved.bubble.export_saved_prefix")}: ${new Date(item.created_at).toLocaleString("uk-UA")}_`
      );
      const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `saved-${item.id.slice(0, 8)}.md`;
      a.click();
    },
    [t]
  );

  const handleExportJson = useCallback((item: SavedItem) => {
    const blob = new Blob([JSON.stringify(item, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `saved-${item.id.slice(0, 8)}.json`;
    a.click();
  }, []);

  const handleCtxAction = useCallback(
    (id: CtxActionId, item: SavedItem) => {
      switch (id) {
        case "reply":
          setReplyTo(item);
          break;
        case "copy":
          handleCopy(item);
          break;
        case "copy_link": {
          const url = `${window.location.origin}${window.location.pathname}?bubble=${item.id}`;
          (async () => {
            try {
              await navigator.clipboard.writeText(url);
              setToast(t("saved.ctx.link_copied"));
            } catch {
              setToast(t("saved.ctx.link_copy_failed"));
            }
          })();
          break;
        }
        case "edit":
          setExpandedMdIds((prev) => {
            const next = new Set(prev);
            if (next.has(item.id)) next.delete(item.id);
            else next.add(item.id);
            return next;
          });
          break;
        case "pin":
          updateItem(item.id, { is_pinned: !item.is_pinned });
          break;
        case "favorite":
          updateItem(item.id, { is_favorite: !item.is_favorite });
          break;
        case "remind":
          setReminderPickerId(item.id);
          break;
        case "export_md":
          handleExportMd(item);
          break;
        case "export_json":
          handleExportJson(item);
          break;
        case "delete":
          setConfirmDelete({ kind: "single", id: item.id });
          break;
        case "select":
          setSelectedIds(new Set([item.id]));
          break;
      }
    },
    [handleCopy, handleExportMd, handleExportJson, updateItem, deleteItem, refreshStorage]
  );

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

  // Permalink to bubble: ?bubble=<id> on mount → scroll to that item.
  // Decision: KEEP the param so a refresh re-jumps to the same bubble.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const bubbleId = params.get("bubble");
    if (!bubbleId) return;
    if (!items.some((i) => i.id === bubbleId)) return;
    const t = setTimeout(() => jumpToItem(bubbleId), 300);
    return () => clearTimeout(t);
    // Run once after items first arrive — depend on items.length, not items, to avoid re-jumping on every change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

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
  }, []);

  const requestBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    setConfirmDelete({ kind: "bulk", count: selectedIds.size });
  }, [selectedIds.size]);

  const performBulkDelete = useCallback(async () => {
    await bulkDelete(Array.from(selectedIds));
    clearSelection();
    refreshStorage();
  }, [bulkDelete, selectedIds, clearSelection, refreshStorage]);

  const performConfirmedDelete = useCallback(async () => {
    if (!confirmDelete) return;
    if (confirmDelete.kind === "single") {
      await deleteItem(confirmDelete.id);
      refreshStorage();
    } else {
      await performBulkDelete();
    }
    setConfirmDelete(null);
  }, [confirmDelete, deleteItem, refreshStorage, performBulkDelete]);

  const hasSelection = selectedIds.size > 0;

  // Wire global keyboard shortcuts
  useSavedShortcuts({
    imagePreviewOpen: false,
    confirmOpen: confirmDelete !== null,
    attachOpen: false,
    pinnedViewOpen,
    moreOpen: moreAnchor !== null,
    ctxOpen: ctx !== null,
    searchOpen,
    selectionMode: hasSelection,
    onCloseImagePreview: () => {
      /* owned by composer */
    },
    onCloseConfirm: () => setConfirmDelete(null),
    onCloseAttach: () => {
      /* owned by composer */
    },
    onClosePinnedView: () => setPinnedViewOpen(false),
    onCloseMore: () => setMoreAnchor(null),
    onCloseCtx: () => setCtx(null),
    onCloseSearch: () => setSearchOpen(false),
    onClearSelection: clearSelection,
    onOpenSearch: () => setSearchOpen(true),
    onSelectAllVisible: () => setSelectedIds(new Set(filtered.map((i) => i.id)))
  });

  return (
    <>
      <div
        className="flex flex-col overflow-hidden px-0 pt-0 pb-1
        sm:px-0 sm:pt-0 sm:pb-0 sm:h-[calc(100svh-env(safe-area-inset-top)-3.5rem-env(safe-area-inset-bottom))]
        fixed sm:static left-0 right-0
        sm:top-auto sm:bottom-auto sm:left-auto sm:right-auto"
        style={{
          top: "env(safe-area-inset-top)",
          bottom: bottomNavVisible
            ? "calc(3.5rem + env(safe-area-inset-bottom))"
            : "env(safe-area-inset-bottom)"
        }}
      >
        <div className={`flex-shrink-0 ${isGlass ? "bg-transparent" : ""}`}>
          {hasSelection ? (
            <SavedSelectionHeader
              count={selectedIds.size}
              onCancel={clearSelection}
              onConfirm={requestBulkDelete}
            />
          ) : (
            <>
              <SavedHeader
                pinnedCount={pinned.length}
                totalCount={items.length}
                onSearch={() => setSearchOpen(true)}
                onMore={(anchor) => setMoreAnchor(anchor)}
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
            </>
          )}

          {/* DB error banner */}
          {dbError && (
            <div className="flex-shrink-0 flex items-center gap-2 mt-2 mx-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t("saved.error.db")}</span>
            </div>
          )}

          {/* Connecting shimmer */}
          {connecting && (
            <div className="flex-shrink-0 flex items-center gap-2 mt-2 mx-3 px-3 py-1.5 bg-gray-800/60 border border-gray-700/50 rounded-xl text-xs text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{t("saved.connecting")}</span>
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
            onDelete={(id) => setConfirmDelete({ kind: "single", id })}
            onResetFilters={() =>
              setFilters({ type: "all", pinned: false, favorite: false, tags: [] })
            }
            onReply={setReplyTo}
            onUpdateMeta={(id, meta) =>
              updateItem(id, {
                metadata: { ...(items.find((i) => i.id === id)?.metadata ?? {}), ...meta }
              })
            }
            onSetReminder={(id, iso) => updateItem(id, { reminder_at: iso })}
            onOpenMenu={setCtx}
            selectionMode={hasSelection}
            expandedMdIds={expandedMdIds}
            reminderPickerId={reminderPickerId}
            onCloseReminderPicker={() => setReminderPickerId(null)}
            sortDir={sortDir}
          />
        </div>

        {/* Composer or selection action bar */}
        {hasSelection ? (
          <div className={`flex-shrink-0 ${isGlass ? "bg-transparent" : ""}`}>
            <SavedSelectionActionBar
              count={selectedIds.size}
              onDelete={requestBulkDelete}
              onApplyTags={async (tags) => {
                await bulkTag(Array.from(selectedIds), tags);
                clearSelection();
              }}
            />
          </div>
        ) : (
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

      <SavedContextMenu
        ctx={ctx}
        onClose={() => setCtx(null)}
        onAction={handleCtxAction}
        onReact={(emoji, item) => {
          const meta = (item.metadata as Record<string, unknown>) ?? {};
          const existing = Array.isArray(meta.marks) ? (meta.marks as string[]) : [];
          const next = existing.includes(emoji)
            ? existing.filter((m) => m !== emoji)
            : [...existing, emoji];
          updateItem(item.id, { metadata: { ...meta, marks: next } });
        }}
      />

      <SavedSearchOverlay
        open={searchOpen}
        items={items}
        onClose={() => setSearchOpen(false)}
        onJump={jumpToItem}
      />

      <SavedMoreMenu
        open={moreAnchor !== null}
        anchor={moreAnchor}
        sortDir={sortDir}
        onClose={() => setMoreAnchor(null)}
        onAction={handleMoreAction}
      />

      <SavedConfirmDialog
        open={confirmDelete !== null}
        title={
          confirmDelete?.kind === "bulk"
            ? t("saved.confirm.delete_many", confirmDelete.count)
            : t("saved.confirm.delete_one")
        }
        body={t("saved.confirm.body")}
        danger
        confirmLabel={t("saved.confirm.confirm")}
        cancelLabel={t("saved.confirm.cancel")}
        onConfirm={performConfirmedDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {ftsLoading && (
        <div className="fixed bottom-20 right-4 z-40 text-xs text-gray-500 bg-gray-900/80 border border-white/5 rounded-full px-2 py-1 backdrop-blur-md">
          <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
          {t("saved.search_loading")}
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[80] text-xs text-gray-100 bg-gray-900/95 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-md shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
