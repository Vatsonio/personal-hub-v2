"use client";

import { useRef, useState } from "react";
import { Pin, Heart, Check, Bell, FileUp, ChevronUp, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import LinkPreview from "./LinkPreview";
import type { SavedItem } from "@/types/domain";

type Props = {
  item: SavedItem;
  replyParent: SavedItem | null;
  isSelected: boolean;
  onToggleSelect: () => void;
  onPin: () => void;
  onUnpin: () => void;
  onFavorite: () => void;
  onUnfavorite: () => void;
  onDelete: () => void;
  onReply: () => void;
  onUpdateMeta?: (meta: Record<string, string>) => void;
  onSetReminder: (iso: string | null) => void;
  onOpenImage?: () => void;
  onOpenMenu?: (ctx: { x: number; y: number; item: SavedItem }) => void;
  selectionMode?: boolean;
  showMd?: boolean;
  showReminderPicker?: boolean;
  onCloseReminderPicker?: () => void;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}

const URL_RE = /(https?:\/\/[^\s]+)/g;
function LinkifiedText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  text.replace(URL_RE, (match, _g, idx: number) => {
    if (idx > lastIdx) parts.push(text.slice(lastIdx, idx));
    parts.push(
      <a
        key={idx}
        href={match}
        target="_blank"
        rel="noopener noreferrer"
        className="text-violet-300 hover:text-violet-200 underline decoration-violet-400/40 underline-offset-2 break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {match}
      </a>
    );
    lastIdx = idx + match.length;
    return match;
  });
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return <>{parts}</>;
}

export default function SavedBubble({
  item,
  replyParent,
  isSelected,
  onToggleSelect,
  onReply,
  onUpdateMeta,
  onSetReminder,
  onOpenImage,
  onOpenMenu,
  selectionMode = false,
  showMd: showMdProp,
  showReminderPicker = false,
  onCloseReminderPicker
}: Props) {
  const [showMdLocal, setShowMdLocal] = useState(false);
  const showMd = showMdProp ?? showMdLocal;
  const [swipeX, setSwipeX] = useState(0);

  const longPress = useRef<{ timer: ReturnType<typeof setTimeout> | null; x: number; y: number }>({
    timer: null,
    x: 0,
    y: 0
  });
  const swipeRef = useRef<{
    startX: number;
    startY: number;
    active: boolean;
    horizontal: boolean | null;
  }>({ startX: 0, startY: 0, active: false, horizontal: null });

  const isMediaOnly =
    item.content_type === "image" &&
    !item.content &&
    !item.title &&
    item.tags.length === 0 &&
    !item.reminder_at;

  const SWIPE_THRESHOLD = 40;

  const onTouchStart = (e: React.TouchEvent) => {
    if (selectionMode) return;
    const t = e.touches[0];
    longPress.current.x = t.clientX;
    longPress.current.y = t.clientY;
    longPress.current.timer = setTimeout(() => {
      onOpenMenu?.({ x: t.clientX, y: t.clientY, item });
    }, 500);
    swipeRef.current = {
      startX: t.clientX,
      startY: t.clientY,
      active: true,
      horizontal: null
    };
  };
  const onTouchEnd = () => {
    if (longPress.current.timer) clearTimeout(longPress.current.timer);
    longPress.current.timer = null;

    // Swipe-to-reply: if locked horizontal and past threshold → trigger reply
    if (swipeRef.current.active && swipeRef.current.horizontal && swipeX > SWIPE_THRESHOLD) {
      onReply();
    }
    swipeRef.current.active = false;
    swipeRef.current.horizontal = null;
    setSwipeX(0);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    const dx = t.clientX - swipeRef.current.startX;
    const dy = t.clientY - swipeRef.current.startY;
    if (
      Math.abs(t.clientX - longPress.current.x) > 8 ||
      Math.abs(t.clientY - longPress.current.y) > 8
    ) {
      if (longPress.current.timer) clearTimeout(longPress.current.timer);
      longPress.current.timer = null;
    }
    if (!swipeRef.current.active) return;
    // Lock direction once movement clearly exceeds 8px in either axis
    if (swipeRef.current.horizontal === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        swipeRef.current.horizontal = Math.abs(dx) > Math.abs(dy);
        if (!swipeRef.current.horizontal) {
          // vertical scroll — abandon swipe
          swipeRef.current.active = false;
          setSwipeX(0);
          return;
        }
      } else {
        return;
      }
    }
    // Only follow rightward swipes
    if (swipeRef.current.horizontal) {
      const next = Math.max(0, Math.min(80, dx));
      setSwipeX(next);
    }
  };
  const onContextMenuHandler = (e: React.MouseEvent) => {
    if (selectionMode) return;
    e.preventDefault();
    onOpenMenu?.({ x: e.clientX, y: e.clientY, item });
  };
  const onClick = () => {
    if (selectionMode) onToggleSelect();
  };

  const bubbleBg = isMediaOnly
    ? "bg-transparent"
    : isSelected
      ? "bg-violet-500/15 border border-violet-500/40"
      : item.is_pinned
        ? "bg-amber-500/10 border border-amber-500/15"
        : "bg-gray-800/90 border border-white/5";

  const bubblePad = isMediaOnly ? "p-0" : "px-3 py-2";

  return (
    <div
      className={`relative flex justify-start mb-1.5 px-2 items-center gap-2 transition-colors ${
        selectionMode && isSelected ? "bg-violet-500/10" : ""
      }`}
      data-bubble-id={item.id}
    >
      {/* Selection checkbox — always visible in selection mode */}
      {selectionMode && (
        <button
          type="button"
          onClick={onToggleSelect}
          className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
            isSelected ? "bg-violet-500 border-violet-500" : "border-gray-600 bg-transparent"
          }`}
          title={isSelected ? "Зняти вибір" : "Вибрати"}
        >
          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
        </button>
      )}

      <div
        onClick={onClick}
        onContextMenu={onContextMenuHandler}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onTouchMove={onTouchMove}
        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl relative overflow-hidden select-none ${bubbleBg} ${bubblePad} ${
          selectionMode ? "cursor-pointer" : ""
        } ${swipeX === 0 ? "transition-transform duration-150" : ""}`}
        style={{
          WebkitTouchCallout: "none",
          transform: swipeX > 0 ? `translateX(${swipeX}px)` : undefined
        }}
      >
        {/* Reply quote */}
        {replyParent && (
          <div className="mb-1 pl-3 border-l-2 border-violet-400/50 text-xs text-gray-400 truncate">
            ↩ {replyParent.title ?? replyParent.content?.slice(0, 60) ?? "…"}
          </div>
        )}

        {/* Title */}
        {item.title && item.content_type !== "image" && (
          <p className="text-white font-semibold text-[15px] leading-snug mb-0.5">{item.title}</p>
        )}

        {/* Link */}
        {item.content_type === "link" && item.source_url && (
          <div>
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] text-white break-all leading-snug block hover:text-violet-200 underline decoration-white/20 underline-offset-2"
              onClick={(e) => e.stopPropagation()}
            >
              {item.source_url}
            </a>
            <LinkPreview
              url={item.source_url}
              cached={item.metadata as Record<string, string>}
              onFetched={(og) =>
                onUpdateMeta?.({
                  og_title: og.title ?? "",
                  og_description: og.description ?? "",
                  og_image: og.image ?? "",
                  og_site_name: og.siteName ?? ""
                })
              }
            />
          </div>
        )}

        {/* Text */}
        {item.content_type === "text" && item.content && (
          <div>
            {showMd ? (
              <div className="prose prose-invert prose-sm max-w-none text-gray-200">
                <ReactMarkdown>{item.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-[14.5px] text-gray-100 whitespace-pre-wrap break-words leading-relaxed pr-12">
                <LinkifiedText text={item.content} />
              </p>
            )}
            {showMdProp === undefined && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMdLocal((v) => !v);
                }}
                className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showMd ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showMd ? "Сховати MD" : "MD preview"}
              </button>
            )}
          </div>
        )}

        {/* Image */}
        {item.content_type === "image" && item.source_url && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!selectionMode) onOpenImage?.();
              else onToggleSelect();
            }}
            className="block text-left w-full focus:outline-none"
            title="Відкрити"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.source_url}
              alt={item.title ?? "image"}
              className="block w-full max-h-80 object-cover rounded-2xl hover:opacity-90 transition-opacity cursor-zoom-in"
              loading="lazy"
            />
          </button>
        )}

        {/* Video file */}
        {item.content_type === "file" &&
          item.source_url &&
          /\.(mp4|webm|ogg|mov)$/i.test(item.source_url) && (
            <div className="mt-1">
              <video
                src={item.source_url}
                controls
                className="max-h-72 max-w-full rounded-xl border border-white/5 bg-black"
                preload="metadata"
              />
            </div>
          )}

        {/* File */}
        {item.content_type === "file" &&
          item.source_url &&
          !/\.(mp4|webm|ogg|mov)$/i.test(item.source_url) && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl bg-black/30 border-l-[3px] border-violet-400/70 hover:bg-black/40 transition-colors text-[13px] text-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <FileUp className="w-4 h-4 text-violet-300 flex-shrink-0" />
              <span className="truncate">
                {(item.metadata as Record<string, string>)?.filename ?? item.title ?? "Файл"}
              </span>
              {(item.metadata as Record<string, string>)?.size && (
                <span className="text-gray-500 text-[11px] ml-auto flex-shrink-0">
                  {formatFileSize(Number((item.metadata as Record<string, string>).size))}
                </span>
              )}
            </a>
          )}

        {/* Voice */}
        {item.content_type === "voice" && (
          <p className="text-[14px] text-gray-300">{item.title ?? item.content ?? "—"}</p>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.tags.map((tag) => (
              <span key={tag} className="text-[11px] text-violet-300/80">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Reaction marks */}
        {(() => {
          const meta = (item.metadata as Record<string, unknown>) ?? {};
          const marks = Array.isArray(meta.marks) ? (meta.marks as string[]) : [];
          if (marks.length === 0) return null;
          return (
            <div className="absolute right-1.5 top-1 flex gap-0.5 pointer-events-none">
              {marks.map((m, i) => (
                <span
                  key={`${m}-${i}`}
                  className="text-[12px] leading-none px-1 py-0.5 rounded-full bg-black/40 backdrop-blur-sm"
                >
                  {m}
                </span>
              ))}
            </div>
          );
        })()}

        {/* Time + indicators */}
        <div
          className={`absolute right-2 bottom-1.5 flex items-center gap-1 text-[10.5px] ${
            isMediaOnly
              ? "text-white px-1.5 py-0.5 rounded-full bg-black/45 backdrop-blur-sm"
              : "text-gray-400/80"
          }`}
        >
          {item.is_pinned && <Pin className="w-3 h-3 text-amber-400" />}
          {item.is_favorite && <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />}
          {item.reminder_at && <Bell className="w-3 h-3 text-yellow-300" />}
          <span className="font-mono">{formatTime(item.created_at)}</span>
        </div>
      </div>

      {/* Reminder picker */}
      {showReminderPicker && (
        <div className="absolute right-3 top-10 z-20 bg-gray-900 border border-white/10 rounded-xl p-3 shadow-xl flex flex-col gap-2 min-w-[200px]">
          <p className="text-xs text-gray-400 font-medium">Нагадати</p>
          <input
            type="datetime-local"
            defaultValue={item.reminder_at ? item.reminder_at.slice(0, 16) : ""}
            className="bg-gray-800 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-violet-500/60"
            onChange={(e) => {
              onSetReminder(e.target.value ? new Date(e.target.value).toISOString() : null);
              onCloseReminderPicker?.();
            }}
          />
          {item.reminder_at && (
            <button
              onClick={() => {
                onSetReminder(null);
                onCloseReminderPicker?.();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 text-left"
            >
              Скасувати нагадування
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
