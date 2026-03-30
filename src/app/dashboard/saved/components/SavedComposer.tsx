"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Link2, FileUp, Type, Image, Mic, Loader2, AlertTriangle } from "lucide-react";
import type { SavedItem, SavedContentType, CreateSavedItemInput } from "@/types/domain";

type Props = {
  onAdd: (input: CreateSavedItemInput) => void;
  replyTo: SavedItem | null;
  onCancelReply: () => void;
};

const TYPES: { value: SavedContentType; Icon: React.ElementType; label: string }[] = [
  { value: "text", Icon: Type, label: "Текст" },
  { value: "link", Icon: Link2, label: "Посилання" },
  { value: "file", Icon: FileUp, label: "Файл" },
  { value: "image", Icon: Image, label: "Зображення" },
  { value: "voice", Icon: Mic, label: "Голос" }
];

const UPLOAD_TYPES: SavedContentType[] = ["file", "image"];

function parseTags(raw: string): string[] {
  return raw.match(/#[\w\u0400-\u04FF]+/g)?.map((t) => t.slice(1).toLowerCase()) ?? [];
}

function isUrl(str: string) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function fileExt(name: string) {
  return name.includes(".") ? name.split(".").pop()!.toLowerCase() : "bin";
}

export default function SavedComposer({ onAdd, replyTo, onCancelReply }: Props) {
  const [text, setText] = useState("");
  const [type, setType] = useState<SavedContentType>("text");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Auto-dismiss upload errors after 4 seconds
  useEffect(() => {
    if (!uploadError) return;
    const t = setTimeout(() => setUploadError(null), 4000);
    return () => clearTimeout(t);
  }, [uploadError]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Авто-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [text]);

  // Авто-detect тип
  useEffect(() => {
    if (isUrl(text.trim())) setType("link");
    else if (type === "link" && !isUrl(text.trim())) setType("text");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // When user switches to file/image type, trigger the file picker immediately
  function handleTypeSelect(t: SavedContentType) {
    setType(t);
    if (UPLOAD_TYPES.includes(t)) {
      // small timeout so state settles before input.accept is updated
      setTimeout(() => fileInputRef.current?.click(), 50);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setUploadError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      const input: CreateSavedItemInput = {
        content_type: type === "image" ? "image" : "file",
        content: data.url,
        source_url: data.url,
        title: file.name,
        tags: [],
        reply_to: replyTo?.id ?? null,
        metadata: { size: data.size, mime: file.type }
      };
      onAdd(input);
      setType("text");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setType("text");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const tags = parseTags(trimmed);
    const isLink = type === "link" || isUrl(trimmed);

    const input: CreateSavedItemInput = {
      content_type: isLink ? "link" : type,
      content: isLink ? null : trimmed,
      source_url: isLink ? trimmed : null,
      title: null,
      tags,
      reply_to: replyTo?.id ?? null
    };

    onAdd(input);
    setText("");
    onCancelReply();
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const isUploadMode = UPLOAD_TYPES.includes(type);

  return (
    <div className="flex-shrink-0 mt-2 border-t border-gray-800/60 pt-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={type === "image" ? "image/*" : "*/*"}
        onChange={handleFileChange}
      />

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-xs text-violet-300">
          <span className="flex-1 truncate">
            ↩ Відповідь на: {replyTo.title ?? replyTo.content?.slice(0, 50) ?? "…"}
          </span>
          <button onClick={onCancelReply} className="hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Upload error toast */}
      {uploadError && (
        <div className="flex items-start gap-2 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="hover:text-white flex-shrink-0">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Type selector */}
      <div className="flex gap-1 mb-2">
        {TYPES.map(({ value, Icon, label }) => (
          <button
            key={value}
            onClick={() => handleTypeSelect(value)}
            title={label}
            className={`p-1.5 rounded-lg transition-all ${
              type === value
                ? "bg-violet-500/20 text-violet-300"
                : "text-gray-600 hover:text-gray-400 hover:bg-gray-800"
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Upload hint or text input */}
      {isUploadMode ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-gray-700 text-gray-500 hover:border-violet-500/50 hover:text-violet-400 transition-all text-sm disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Завантаження…
            </>
          ) : (
            <>
              <FileUp className="w-4 h-4" /> Натисни, щоб вибрати{" "}
              {type === "image" ? "зображення" : "файл"}
            </>
          )}
        </button>
      ) : (
        <div className="flex items-end gap-2 bg-gray-900/60 border border-gray-800 rounded-2xl px-3 py-2 focus-within:border-violet-500/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              type === "link"
                ? "Вставте посилання…"
                : "Збережи текст, ідею або нотатку… (#теги підтримуються)"
            }
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 resize-none focus:outline-none leading-relaxed min-h-[2rem] max-h-40"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:bg-gray-800 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-md shadow-violet-500/20"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      <p className="text-gray-700 text-xs mt-1.5 pl-1">
        {isUploadMode
          ? "Файл буде збережено у Supabase Storage"
          : "Ctrl+Enter — зберегти · #тег — автоматично розпізнається"}
      </p>
    </div>
  );
}
