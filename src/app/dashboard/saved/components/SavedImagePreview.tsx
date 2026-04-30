"use client";

import { useEffect, useMemo, useState } from "react";
import { Send, X } from "lucide-react";

type Props = {
  files: File[];
  open: boolean;
  onCancel: () => void;
  onSend: (caption: string, files: File[]) => void;
  onRemoveFile?: (index: number) => void;
};

export default function SavedImagePreview({ files, open, onCancel, onSend, onRemoveFile }: Props) {
  const [caption, setCaption] = useState("");
  const [active, setActive] = useState(0);

  // Build object URLs for previews
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  useEffect(() => {
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [urls]);

  useEffect(() => {
    if (open) setCaption("");
    if (active >= files.length) setActive(0);
  }, [open, files.length, active]);

  // Esc to cancel
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || files.length === 0) return null;

  const currentUrl = urls[Math.min(active, urls.length - 1)];

  return (
    <div className="fixed inset-0 z-[75] flex flex-col">
      {/* Backdrop */}
      <div onClick={onCancel} className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* Top bar */}
      <div
        className="relative flex items-center gap-2 px-3 pt-3 pb-2"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="w-10 h-10 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 flex items-center justify-center text-gray-300"
          title="Скасувати"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center text-[13.5px] text-gray-200">
          {files.length === 1 ? "Зображення" : `Зображень: ${files.length}`}
        </div>
        <div className="w-10" />
      </div>

      {/* Big preview */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentUrl}
          alt="preview"
          className="max-h-full max-w-full object-contain rounded-2xl"
        />
      </div>

      {/* Thumbnails (multi) */}
      {files.length > 1 && (
        <div className="relative px-3 pt-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {files.map((_, idx) => (
              <div key={idx} className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setActive(idx)}
                  className={`w-[60px] h-[60px] rounded-xl overflow-hidden border-2 transition-all ${
                    idx === active ? "border-violet-400" : "border-white/10"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urls[idx]} alt="" className="w-full h-full object-cover" />
                </button>
                {onRemoveFile && (
                  <button
                    type="button"
                    onClick={() => onRemoveFile(idx)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500/90 text-white flex items-center justify-center"
                    title="Видалити"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Caption + send */}
      <div
        className="relative px-3 pt-2 pb-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-end gap-2 bg-gray-900/85 border border-white/5 rounded-3xl px-4 py-2 min-h-[44px] backdrop-blur-md">
            <input
              autoFocus
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSend(caption, files);
                }
              }}
              placeholder="Додати підпис..."
              className="flex-1 bg-transparent text-[14.5px] text-white placeholder-gray-500 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => onSend(caption, files)}
            className="flex-shrink-0 w-11 h-11 rounded-full bg-violet-500 hover:bg-violet-400 text-white flex items-center justify-center shadow-lg shadow-violet-500/20"
            title="Надіслати"
          >
            <Send className="w-[18px] h-[18px] translate-x-[1px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
