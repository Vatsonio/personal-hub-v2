"use client";

import { useEffect, useRef, useState } from "react";
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
  onSetReminder
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const dateRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevCountRef = useRef(items.length);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { formatDate, t } = useLocale();

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
          className="flex items-center gap-3 my-4"
        >
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-600 font-medium px-2 py-0.5 bg-gray-900 rounded-full border border-gray-800">
            {formatDate(item.created_at)}
          </span>
          <div className="flex-1 h-px bg-gray-800" />
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
      <div className="flex flex-col px-2 pb-4">
        <div className="flex items-center gap-2 mb-2 px-2">
          <input
            type="date"
            className="bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-xs text-gray-400 focus:outline-none focus:border-violet-500/60"
            onChange={(e) => {
              const val = e.target.value;
              const target = dateRefs.current.get(new Date(val + "T00:00:00").toDateString());
              target?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <span className="text-xs text-gray-600">{t("feed.jump_to_date")}</span>
        </div>
        {rendered}
        <div ref={bottomRef} />
      </div>
    </>
  );
}
