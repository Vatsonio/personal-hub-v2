"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, X, Send, Loader2, AlertTriangle, Trash2 } from "lucide-react";

type RecorderState = "idle" | "recording" | "recorded";

type RecordedBlob = {
  blob: Blob;
  url: string;
  mime: string;
  duration: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { blob: Blob; mime: string; duration: number }) => Promise<void> | void;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg"
  ];
  for (const m of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      // ignore
    }
  }
  return "";
}

export default function SavedVoiceRecorder({ open, onClose, onSubmit }: Props) {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [recorded, setRecorded] = useState<RecordedBlob | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  // Cleanup helpers
  function stopTicker() {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  function releaseStream() {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function fullReset() {
    stopTicker();
    releaseStream();
    if (recorded) {
      try {
        URL.revokeObjectURL(recorded.url);
      } catch {
        // ignore
      }
    }
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    setRecorded(null);
    setElapsed(0);
    setState("idle");
    setError(null);
    setSubmitting(false);
  }

  // When the panel closes, clean up everything
  useEffect(() => {
    if (!open) {
      fullReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTicker();
      releaseStream();
      if (recorded) {
        try {
          URL.revokeObjectURL(recorded.url);
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startRecording() {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Запис не підтримується у вашому браузері");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("MediaRecorder не доступний");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMimeType();
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const finalMime = mr.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: finalMime });
        const url = URL.createObjectURL(blob);
        const duration = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        setRecorded({ blob, url, mime: finalMime, duration });
        setState("recorded");
        stopTicker();
        releaseStream();
      };
      startedAtRef.current = Date.now();
      setElapsed(0);
      mr.start();
      setState("recording");
      tickRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 250);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message === "Permission denied"
            ? "Доступ до мікрофона заборонено"
            : err.message
          : "Не вдалося отримати доступ до мікрофона"
      );
      releaseStream();
      setState("idle");
    }
  }

  function stopRecording() {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      try {
        mr.stop();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зупинити запис");
      }
    } else {
      stopTicker();
      releaseStream();
    }
  }

  function discardRecording() {
    if (recorded) {
      try {
        URL.revokeObjectURL(recorded.url);
      } catch {
        // ignore
      }
    }
    setRecorded(null);
    setElapsed(0);
    setState("idle");
  }

  async function handleSubmit() {
    if (!recorded || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ blob: recorded.blob, mime: recorded.mime, duration: recorded.duration });
      // Caller handles closing the panel; do a defensive close anyway.
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося надіслати");
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md"
      onClick={() => {
        if (state === "recording" || submitting) return;
        onClose();
      }}
    >
      <div
        className="w-full max-w-md mx-3 mb-3 sm:mb-0 rounded-3xl bg-gray-900/95 border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="text-sm font-medium text-gray-200">Голосовий запис</div>
          <button
            type="button"
            onClick={onClose}
            disabled={state === "recording" || submitting}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 disabled:opacity-40"
            title="Закрити"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mb-3 flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        <div className="px-5 pb-5 pt-2 flex flex-col items-center">
          {state === "idle" && (
            <>
              <button
                type="button"
                onClick={startRecording}
                className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 shadow-2xl shadow-rose-500/30 flex items-center justify-center transition-transform active:scale-95"
                title="Натисни щоб записати"
              >
                <Mic className="w-12 h-12 text-white" />
              </button>
              <p className="mt-4 text-sm text-gray-300">Натисни щоб записати</p>
            </>
          )}

          {state === "recording" && (
            <>
              <button
                type="button"
                onClick={stopRecording}
                className="relative w-28 h-28 rounded-full bg-rose-500 shadow-2xl shadow-rose-500/40 flex items-center justify-center transition-transform active:scale-95"
                title="Зупинити"
              >
                <span className="absolute inset-0 rounded-full bg-rose-500/40 animate-ping" />
                <Mic className="relative w-12 h-12 text-white" />
              </button>

              <div className="mt-4 font-mono tabular-nums text-2xl text-white">
                {formatTime(elapsed)}
              </div>

              <div className="mt-3 flex items-center gap-1 h-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 rounded-full bg-rose-400/80 animate-pulse"
                    style={{
                      height: `${6 + ((i * 3) % 10)}px`,
                      animationDelay: `${i * 120}ms`,
                      animationDuration: "900ms"
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={stopRecording}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-sm text-white border border-white/10"
              >
                <Square className="w-4 h-4" />
                Зупинити
              </button>
            </>
          )}

          {state === "recorded" && recorded && (
            <>
              <div className="w-full">
                <audio
                  src={recorded.url}
                  controls
                  className="w-full rounded-xl bg-black/40"
                  preload="metadata"
                />
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Тривалість: {formatTime(recorded.duration)}
              </div>
              <div className="mt-5 flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={discardRecording}
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-sm text-gray-200 border border-white/10 disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                  Скасувати
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-violet-500 hover:bg-violet-400 text-sm text-white shadow-lg shadow-violet-500/20 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Надсилання…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Надіслати
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
