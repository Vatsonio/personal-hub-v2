"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";

type Props = {
  open: boolean;
  title: string;
  body?: string;
  danger?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function SavedConfirmDialog({
  open,
  title,
  body,
  danger = false,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel
}: Props) {
  const { t } = useLocale();
  const finalConfirm = confirmLabel ?? "OK";
  const finalCancel = cancelLabel ?? t("saved.confirm.cancel");
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  return (
    <div
      className={`fixed inset-0 z-[80] transition-opacity duration-200 ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div onClick={onCancel} className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" />
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,360px)] rounded-2xl bg-gray-900/95 border border-white/10 shadow-2xl backdrop-blur-md transition-all duration-200 ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-[16px] text-white font-semibold leading-tight">{title}</h3>
          {body && <p className="text-[13px] text-gray-400 leading-snug mt-1.5">{body}</p>}
        </div>
        <div className="flex items-center gap-2 px-3 pb-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-[14px] text-gray-200 font-medium transition-colors"
          >
            {finalCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 h-10 rounded-xl text-[14px] font-medium transition-colors ${
              danger
                ? "bg-rose-500/90 hover:bg-rose-500 text-white"
                : "bg-violet-500/90 hover:bg-violet-500 text-white"
            }`}
          >
            {finalConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
