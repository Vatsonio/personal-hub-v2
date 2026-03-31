"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

interface LightboxImage {
  src: string;
  title?: string | null;
}

interface Props {
  images: LightboxImage[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageLightbox({ images, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const current = images[index];
  const canPrev = index > 0;
  const canNext = index < images.length - 1;
  const { t } = useLocale();

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const prev = useCallback(() => {
    if (!canPrev) return;
    setIndex((i) => i - 1);
    resetZoom();
  }, [canPrev, resetZoom]);

  const next = useCallback(() => {
    if (!canNext) return;
    setIndex((i) => i + 1);
    resetZoom();
  }, [canNext, resetZoom]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((s) => Math.max(0.5, Math.min(5, s + delta)));
  }

  function onMouseDown(e: React.MouseEvent) {
    if (scale <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y)
    });
  }

  function onMouseUp() {
    setDragging(false);
  }

  async function handleDownload() {
    try {
      const res = await fetch(current.src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = current.title ?? "image";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(current.src, "_blank");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <span className="text-gray-400 text-sm truncate max-w-xs">
          {current.title ?? "Зображення"}
          {images.length > 1 && (
            <span className="ml-2 text-gray-600">
              {index + 1} / {images.length}
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.min(5, s + 0.5))}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title={t("lightbox.zoom_in")}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setScale((s) => Math.max(0.5, s - 0.5));
            }}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title={t("lightbox.zoom_out")}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          {scale !== 1 && (
            <button
              onClick={resetZoom}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {Math.round(scale * 100)}%
            </button>
          )}
          <button
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title={t("lightbox.download")}
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-1"
            title={t("lightbox.close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden select-none"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.src}
          alt={current.title ?? "image"}
          draggable={false}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragging ? "none" : "transform 0.15s ease",
            maxHeight:
              "calc(100dvh - 8rem - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
            maxWidth: "100%",
            objectFit: "contain"
          }}
        />
      </div>

      {/* Prev / Next arrows */}
      {canPrev && (
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-xl border border-white/10 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canNext && (
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-xl border border-white/10 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Thumbnail strip (if > 1 image) */}
      {images.length > 1 && (
        <div
          className="flex-shrink-0 flex gap-1.5 justify-center px-4 py-2 overflow-x-auto"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => {
                setIndex(i);
                resetZoom();
              }}
              className={`flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                i === index
                  ? "border-violet-400 opacity-100"
                  : "border-transparent opacity-40 hover:opacity-70"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
