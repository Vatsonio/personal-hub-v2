"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, FileUp, Loader2, AlertTriangle, Paperclip, Mic } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import type { SavedItem, SavedContentType, CreateSavedItemInput } from "@/types/domain";
import SavedAttachSheet, { type AttachPickId } from "./SavedAttachSheet";
import SavedImagePreview from "./SavedImagePreview";

type Props = {
  onAdd: (input: CreateSavedItemInput) => void;
  onUploadDone?: () => void;
  replyTo: SavedItem | null;
  onCancelReply: () => void;
};

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

export default function SavedComposer({ onAdd, onUploadDone, replyTo, onCancelReply }: Props) {
  const { t } = useLocale();
  const [text, setText] = useState("");
  const [type, setType] = useState<SavedContentType>("text");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState<"environment" | null>(null);
  // Pending image previews (B2/B3): images selected but not uploaded yet
  const [pendingImages, setPendingImages] = useState<File[]>([]);

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
    setCaptureMode(null);
    if (UPLOAD_TYPES.includes(t)) {
      // small timeout so state settles before input.accept is updated
      setTimeout(() => fileInputRef.current?.click(), 50);
    }
  }

  // Attach-sheet pick — handles camera vs other types
  function handleAttachPick(picked: AttachPickId) {
    if (picked === "camera") {
      setType("image");
      setCaptureMode("environment");
      // Open camera directly
      setTimeout(() => fileInputRef.current?.click(), 50);
      return;
    }
    handleTypeSelect(picked);
  }

  // Upload a single file via the API. Returns metadata or throws.
  async function uploadOne(file: File): Promise<{ url: string; name: string; size: number }> {
    const form = new FormData();
    form.append("file", file);
    const data = await new Promise<{ url: string; name: string; size: number; error?: string }>(
      (resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error("Invalid response"));
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(form);
      }
    );
    if (data.error) throw new Error(data.error);
    return data;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    e.target.value = "";

    // For images, defer upload — show preview overlay so user can add caption.
    if (type === "image") {
      setPendingImages(files);
      return;
    }

    // For files, upload first only (single)
    const file = files[0];
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    try {
      const data = await uploadOne(file);
      const input: CreateSavedItemInput = {
        content_type: "file",
        content: data.url,
        source_url: data.url,
        title: file.name,
        tags: [],
        reply_to: replyTo?.id ?? null,
        metadata: { size: data.size, mime: file.type }
      };
      onAdd(input);
      onUploadDone?.();
      setType("text");
      setCaptureMode(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t("saved.composer.upload_failed"));
      setType("text");
      setCaptureMode(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleSendImages(caption: string, files: File[]) {
    setPendingImages([]);
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    try {
      const trimmedCaption = caption.trim();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = await uploadOne(file);
        const isFirst = i === 0;
        const input: CreateSavedItemInput = {
          content_type: "image",
          content: isFirst && trimmedCaption ? trimmedCaption : null,
          source_url: data.url,
          title: file.name,
          tags: isFirst && trimmedCaption ? parseTags(trimmedCaption) : [],
          reply_to: replyTo?.id ?? null,
          metadata: { size: data.size, mime: file.type }
        };
        onAdd(input);
      }
      onUploadDone?.();
      setType("text");
      setCaptureMode(null);
      onCancelReply();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t("saved.composer.upload_failed"));
      setType("text");
      setCaptureMode(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Ctrl/Cmd+Enter always submits; bare Enter submits on mobile (no physical keyboard)
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
      return;
    }
    // On touch devices (no modifier keys expected) bare Enter submits
    if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer: coarse)").matches) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const isUploadMode = UPLOAD_TYPES.includes(type);

  return (
    <div className="flex-shrink-0 mt-1 pt-2 sm:pt-3 pb-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={type === "image" ? "image/*" : "*/*"}
        multiple={type === "image" && !captureMode}
        {...(captureMode ? { capture: captureMode } : {})}
        onChange={handleFileChange}
      />

      {/* Image preview overlay (defer upload until user taps Send) */}
      <SavedImagePreview
        files={pendingImages}
        open={pendingImages.length > 0}
        onCancel={() => {
          setPendingImages([]);
          setType("text");
          setCaptureMode(null);
        }}
        onSend={handleSendImages}
        onRemoveFile={(idx) => setPendingImages((prev) => prev.filter((_, i) => i !== idx))}
      />

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-xs text-violet-300">
          <span className="flex-1 truncate">
            {t("saved.composer.reply_prefix")}{" "}
            {replyTo.title ?? replyTo.content?.slice(0, 50) ?? t("saved.composer.reply_fallback")}
          </span>
          <button onClick={onCancelReply} className="hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Upload progress bar */}
      {uploading && (
        <div className="mb-2 px-3 py-2 bg-gray-800/60 border border-gray-700/50 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> {t("saved.composer.uploading")}
            </span>
            <span className="text-xs text-gray-500">{uploadProgress}%</span>
          </div>
          <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
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

      <SavedAttachSheet
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        onPick={(picked) => handleAttachPick(picked)}
      />

      {/* Upload hint or text input */}
      {isUploadMode ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-3xl border border-dashed border-white/15 bg-gray-900/50 text-gray-500 hover:border-violet-400/40 hover:text-violet-300 transition-all text-sm disabled:opacity-50 backdrop-blur-md"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> {t("saved.composer.uploading")}
            </>
          ) : (
            <>
              <FileUp className="w-4 h-4" /> {t("saved.composer.pick_prefix")}{" "}
              {type === "image"
                ? t("saved.composer.placeholder.image")
                : t("saved.composer.placeholder.file")}
            </>
          )}
        </button>
      ) : (
        <div className="flex items-end gap-2">
          {/* Attach paperclip */}
          <button
            type="button"
            onClick={() => setAttachOpen(true)}
            className={`flex-shrink-0 w-11 h-11 rounded-full border border-white/5 backdrop-blur-md flex items-center justify-center transition-colors ${
              attachOpen
                ? "bg-violet-500/20 text-violet-200"
                : "bg-gray-900/70 text-gray-300 hover:text-white"
            }`}
            title={t("saved.composer.attach")}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-end gap-2 bg-gray-900/70 border border-white/5 rounded-3xl px-4 py-2 min-h-[44px] focus-within:border-violet-500/40 transition-colors backdrop-blur-md">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                type === "link"
                  ? t("saved.composer.placeholder.link")
                  : t("saved.composer.placeholder.text")
              }
              rows={1}
              className="flex-1 bg-transparent text-base sm:text-[14.5px] text-white placeholder-gray-500 resize-none focus:outline-none leading-relaxed min-h-[1.5rem] max-h-40 py-1"
            />
          </div>
          {/* Mic ↔ Send toggle */}
          <button
            onClick={() => {
              if (text.trim()) handleSubmit();
            }}
            className={`flex-shrink-0 relative w-11 h-11 rounded-full border flex items-center justify-center transition-colors ${
              text.trim()
                ? "bg-violet-500 hover:bg-violet-400 border-transparent shadow-lg shadow-violet-500/20"
                : "bg-gray-900/70 border-white/5 text-gray-300 backdrop-blur-md"
            }`}
            title={text.trim() ? t("saved.composer.send") : t("saved.composer.voice")}
          >
            <Mic
              className={`w-5 h-5 absolute transition-all duration-200 ${
                text.trim() ? "opacity-0 scale-75 rotate-45" : "opacity-100 scale-100 rotate-0"
              }`}
            />
            <Send
              className={`w-[18px] h-[18px] absolute text-white transition-all duration-200 translate-x-[1px] ${
                text.trim() ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 -rotate-45"
              }`}
            />
          </button>
        </div>
      )}

      <p className="text-gray-700 text-xs mt-1.5 pl-3 hidden sm:block">
        {isUploadMode ? t("saved.composer.hint_upload") : t("saved.composer.hint_text")}
      </p>
    </div>
  );
}
