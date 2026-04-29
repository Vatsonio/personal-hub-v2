"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import SavedBubble from "./SavedBubble";
import ImageLightbox from "./ImageLightbox";
import { useLocale } from "@/components/LocaleProvider";
import type { SavedItem } from "@/types/domain";

type Props = {
  items: SavedItem[];
  allItems: SavedItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
  onFavorite: (id: string) => void;
  onUnfavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (item: SavedItem) => void;
  onUpdateMeta: (id: string, meta: Record<string, string>) => void;
  onSetReminder: (id: string, iso: string | null) => void;
  onOpenMenu?: (ctx: { x: number; y: number; item: SavedItem }) => void;
  selectionMode?: boolean;
  expandedMdIds?: Set<string>;
  reminderPickerId?: string | null;
  onCloseReminderPicker?: () => void;
};

export default function SavedFeed({
  items,
  allItems,
  selectedIds,
  onToggleSelect,
  onPin,
  onUnpin,
  onFavorite,
  onUnfavorite,
  onDelete,
  onReply,
  onUpdateMeta,
  onSetReminder,
  onOpenMenu,
  selectionMode = false,
  expandedMdIds,
  reminderPickerId,
  onCloseReminderPicker
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const dateRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevCountRef = useRef(items.length);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showJump, setShowJump] = useState(false);
  const { formatDate, t } = useLocale();

  // Watch the scroll container (parent of feed root) to toggle jump-to-bottom
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    const scroller = root?.parentElement;
    if (!scroller) return;
    const onScroll = () => {
      const distFromBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
      setShowJump(distFromBottom > 200);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToBottom() {
    const root = rootRef.current;
    const scroller = root?.parentElement;
    if (!scroller) return;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
  }

  const imageItems = items
    .filter((i) => i.content_type === "image" && i.source_url)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  function openLightbox(item: SavedItem) {
    const idx = imageItems.findIndex((i) => i.id === item.id);
    if (idx !== -1) setLightboxIndex(idx);
  }

  useEffect(() => {
    if (items.length > prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevCountRef.current = items.length;
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-600 select-none">
        <span className="text-4xl mb-3">📌</span>
        <p className="text-sm">{t("feed.empty")}</p>
        <p className="text-xs mt-1">{t("feed.empty_sub")}</p>
      </div>
    );
  }

  const sorted = [...items].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const rendered: React.ReactNode[] = [];
  let lastDateStr = "";

  for (const item of sorted) {
    const dateStr = new Date(item.created_at).toDateString();
    if (dateStr !== lastDateStr) {
      lastDateStr = dateStr;
      rendered.push(
        <div
          key={`sep-${dateStr}`}
          ref={(el) => {
            if (el) dateRefs.current.set(dateStr, el);
          }}
          className="flex justify-center my-3"
        >
          <span className="text-[11.5px] text-gray-200/90 font-medium px-3 py-1 rounded-full bg-gray-900/80 border border-white/5 backdrop-blur-md">
            {formatDate(item.created_at)}
          </span>
        </div>
      );
    }

    const replyParent = item.reply_to
      ? (allItems.find((i) => i.id === item.reply_to) ?? null)
      : null;

    rendered.push(
      <SavedBubble
        key={item.id}
        item={item}
        replyParent={replyParent}
        isSelected={selectedIds.has(item.id)}
        onToggleSelect={() => onToggleSelect(item.id)}
        onPin={() => onPin(item.id)}
        onUnpin={() => onUnpin(item.id)}
        onFavorite={() => onFavorite(item.id)}
        onUnfavorite={() => onUnfavorite(item.id)}
        onDelete={() => onDelete(item.id)}
        onReply={() => onReply(item)}
        onUpdateMeta={(meta) => onUpdateMeta(item.id, meta)}
        onSetReminder={(iso) => onSetReminder(item.id, iso)}
        onOpenImage={() => openLightbox(item)}
        onOpenMenu={onOpenMenu}
        selectionMode={selectionMode}
        showMd={expandedMdIds?.has(item.id)}
        showReminderPicker={reminderPickerId === item.id}
        onCloseReminderPicker={onCloseReminderPicker}
      />
    );
  }

  return (
    <>
      {lightboxIndex !== null && (
        <ImageLightbox
          images={imageItems.map((i) => ({ src: i.source_url!, title: i.title }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
      <div ref={rootRef} className="flex flex-col px-2 pt-1 pb-6">
        {rendered}
        <div ref={bottomRef} />
      </div>
      <button
        type="button"
        onClick={scrollToBottom}
        aria-hidden={!showJump}
        className={`jump-btn fixed right-4 z-40 w-10 h-10 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 flex items-center justify-center text-gray-300 shadow-lg ${
          showJump ? "jump-btn-shown" : "jump-btn-hidden"
        }`}
        style={{ bottom: "calc(8.5rem + env(safe-area-inset-bottom))" }}
        title="Вниз"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </>
  );
}
