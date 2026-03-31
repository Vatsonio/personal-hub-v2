"use client";

import { useState } from "react";
import {
  Pin,
  PinOff,
  Heart,
  HeartOff,
  Trash2,
  Reply,
  Copy,
  Link2,
  FileUp,
  Image,
  Mic,
  Type,
  ChevronDown,
  ChevronUp,
  Check,
  Download,
  FileDown,
  Bell,
  BellOff
} from "lucide-react";
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
};

const TYPE_ICON: Record<string, React.ElementType> = {
  text: Type,
  link: Link2,
  file: FileUp,
  image: Image,
  voice: Mic
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}

export default function SavedBubble({
  item,
  replyParent,
  isSelected,
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
  const [showMd, setShowMd] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  const Icon = TYPE_ICON[item.content_type] ?? Type;

  function handleExportMd() {
    const lines: string[] = [];
    if (item.title) lines.push(`# ${item.title}`, "");
    if (item.content_type === "link" && item.source_url) lines.push(item.source_url);
    else if (item.content) lines.push(item.content);
    if (item.tags.length > 0) lines.push("", item.tags.map((t) => `#${t}`).join(" "));
    lines.push("", `_Збережено: ${new Date(item.created_at).toLocaleString("uk-UA")}_`);
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `saved-${item.id.slice(0, 8)}.md`;
    a.click();
  }

  function handleExportJson() {
    const blob = new Blob([JSON.stringify(item, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `saved-${item.id.slice(0, 8)}.json`;
    a.click();
  }

  async function handleCopy() {
    const text = item.content_type === "link" ? item.source_url : item.content;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className={`group relative flex flex-col max-w-2xl mx-auto w-full mb-1 rounded-2xl transition-colors ${
        isSelected
          ? "bg-violet-500/10 border border-violet-500/30"
          : item.is_pinned
            ? "bg-amber-500/5 border border-amber-500/10"
            : "border border-transparent"
      }`}
    >
      {/* Reply quote */}
      {replyParent && (
        <div className="ml-4 mb-1 pl-3 border-l-2 border-violet-500/40 text-xs text-gray-500 truncate">
          ↩ {replyParent.title ?? replyParent.content?.slice(0, 60) ?? "…"}
        </div>
      )}

      <div className="flex items-start gap-2 px-1 py-1.5">
        {/* Checkbox — visible on hover or when any item is selected */}
        <button
          onClick={onToggleSelect}
          className={`flex-shrink-0 mt-1 w-4 h-4 rounded border transition-all ${
            isSelected
              ? "bg-violet-500 border-violet-500 flex items-center justify-center"
              : "border-gray-700 bg-transparent opacity-0 group-hover:opacity-100"
          }`}
          title="Вибрати"
        >
          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
        </button>

        {/* Іконка типу */}
        <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-gray-800/80 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-gray-500" />
        </div>

        {/* Контент */}
        <div className="flex-1 min-w-0">
          {item.title && (
            <p className="text-white font-medium text-sm leading-snug mb-0.5">{item.title}</p>
          )}

          {item.content_type === "link" && item.source_url && (
            <div>
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm break-all underline underline-offset-2"
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

          {item.content_type === "text" && item.content && (
            <div>
              {showMd ? (
                <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                  <ReactMarkdown>{item.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap break-words leading-relaxed">
                  {item.content}
                </p>
              )}
              <button
                onClick={() => setShowMd((v) => !v)}
                className="mt-1 flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                {showMd ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showMd ? "Сховати MD" : "MD preview"}
              </button>
            </div>
          )}

          {item.content_type === "image" && item.source_url && (
            <div className="mt-1">
              <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.source_url}
                  alt={item.title ?? "image"}
                  className="max-h-72 max-w-full rounded-xl object-contain border border-gray-800/60 bg-gray-900/40 hover:opacity-90 transition-opacity cursor-zoom-in"
                  loading="lazy"
                />
              </a>
            </div>
          )}

          {item.content_type === "file" &&
            item.source_url &&
            /\.(mp4|webm|ogg|mov)$/i.test(item.source_url) && (
              <div className="mt-1">
                <video
                  src={item.source_url}
                  controls
                  className="max-h-64 max-w-full rounded-xl border border-gray-800/60 bg-black"
                  preload="metadata"
                />
              </div>
            )}

          {item.content_type === "file" && item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl bg-gray-800/60 border border-gray-700 hover:border-gray-600 transition-colors text-sm text-gray-300"
            >
              <FileUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="truncate">
                {(item.metadata as Record<string, string>)?.filename ?? item.title ?? "Файл"}
              </span>
              {(item.metadata as Record<string, string>)?.size && (
                <span className="text-gray-600 text-xs ml-auto flex-shrink-0">
                  {formatFileSize(Number((item.metadata as Record<string, string>).size))}
                </span>
              )}
            </a>
          )}

          {item.content_type === "voice" && (
            <p className="text-gray-400 text-sm">{item.title ?? item.content ?? "—"}</p>
          )}

          {/* Теги */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-xs bg-gray-800/70 text-gray-500 rounded-md border border-gray-700/50"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Час + indicators */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1 pt-0.5">
          <span className="text-gray-600 text-xs font-mono">{formatTime(item.created_at)}</span>
          <div className="flex gap-1">
            {item.is_pinned && <Pin className="w-3 h-3 text-amber-400" />}
            {item.is_favorite && <Heart className="w-3 h-3 text-red-400 fill-red-400" />}
          </div>
        </div>
      </div>

      {/* Actions — показуємо при hover */}
      <div className="absolute right-2 top-1 hidden group-hover:flex items-center gap-0.5 bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-xl px-1 py-0.5 shadow-xl z-10">
        <ActionBtn onClick={onReply} title="Відповісти">
          <Reply className="w-3.5 h-3.5" />
        </ActionBtn>
        <ActionBtn onClick={handleCopy} title="Копіювати">
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </ActionBtn>
        <ActionBtn onClick={handleExportMd} title="Експорт .md">
          <Download className="w-3.5 h-3.5" />
        </ActionBtn>
        <ActionBtn onClick={handleExportJson} title="Експорт .json">
          <FileDown className="w-3.5 h-3.5" />
        </ActionBtn>
        <ActionBtn
          onClick={item.is_pinned ? onUnpin : onPin}
          title={item.is_pinned ? "Відкріпити" : "Закріпити"}
        >
          {item.is_pinned ? (
            <PinOff className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Pin className="w-3.5 h-3.5" />
          )}
        </ActionBtn>
        <ActionBtn
          onClick={item.is_favorite ? onUnfavorite : onFavorite}
          title={item.is_favorite ? "Прибрати" : "Обране"}
        >
          {item.is_favorite ? (
            <HeartOff className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <Heart className="w-3.5 h-3.5" />
          )}
        </ActionBtn>
        <ActionBtn
          onClick={() => setShowReminderPicker((v) => !v)}
          title={item.reminder_at ? "Нагадування встановлено" : "Нагадати"}
        >
          {item.reminder_at ? (
            <BellOff className="w-3.5 h-3.5 text-yellow-400" />
          ) : (
            <Bell className="w-3.5 h-3.5" />
          )}
        </ActionBtn>
        <ActionBtn
          onClick={onDelete}
          title="Видалити"
          className="hover:text-red-400 hover:bg-red-400/10"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </ActionBtn>
      </div>

      {showReminderPicker && (
        <div className="absolute right-2 top-10 z-20 bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-xl flex flex-col gap-2 min-w-[200px]">
          <p className="text-xs text-gray-400 font-medium">Нагадати</p>
          <input
            type="datetime-local"
            defaultValue={item.reminder_at ? item.reminder_at.slice(0, 16) : ""}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-violet-500/60"
            onChange={(e) => {
              onSetReminder(e.target.value ? new Date(e.target.value).toISOString() : null);
              setShowReminderPicker(false);
            }}
          />
          {item.reminder_at && (
            <button
              onClick={() => {
                onSetReminder(null);
                setShowReminderPicker(false);
              }}
              className="text-xs text-red-400 hover:text-red-300 text-left"
            >
              Скасувати нагадування
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  onClick,
  title,
  children,
  className = ""
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg text-gray-400 hover:bg-gray-700/60 transition-all ${className}`}
    >
      {children}
    </button>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
