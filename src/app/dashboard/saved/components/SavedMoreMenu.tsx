"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ, Download, BellOff } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

export type MoreActionId = "sort_asc" | "sort_desc" | "export_all" | "clear_reminders";

type Props = {
  open: boolean;
  anchor: { x: number; y: number } | null;
  sortDir: "asc" | "desc";
  onClose: () => void;
  onAction: (id: MoreActionId) => void;
};

export default function SavedMoreMenu({ open, anchor, sortDir, onClose, onAction }: Props) {
  const { t } = useLocale();
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!open || !anchor) return;
    const PAD = 12;
    const W = 240;
    const H = 200;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = anchor.x - W; // anchor is button right edge — open to the left
    let top = anchor.y;
    if (left + W + PAD > vw) left = vw - W - PAD;
    if (left < PAD) left = PAD;
    if (top + H + PAD > vh) top = Math.max(PAD, vh - H - PAD);
    if (top < PAD) top = PAD;
    setPos({ left, top });
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !anchor) return null;

  const rows: { id: MoreActionId; label: string; Icon: React.ElementType }[] = [
    sortDir === "desc"
      ? { id: "sort_asc", label: t("saved.menu.sort_asc"), Icon: ArrowDownAZ }
      : { id: "sort_desc", label: t("saved.menu.sort_desc"), Icon: ArrowUpAZ },
    { id: "export_all", label: t("saved.menu.export_all"), Icon: Download },
    { id: "clear_reminders", label: t("saved.menu.clear_reminders"), Icon: BellOff }
  ];

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[70]" />
      <div
        className="fixed z-[71] w-60 rounded-2xl bg-gray-900/95 border border-white/5 shadow-2xl overflow-hidden ctxmenu"
        style={{
          left: pos.left,
          top: pos.top,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)"
        }}
      >
        <div className="py-1.5">
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => {
                onAction(row.id);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3.5 h-10 hover:bg-white/5 transition-colors text-left text-gray-100"
            >
              <row.Icon className="w-[18px] h-[18px] opacity-90" />
              <span className="text-[13.5px]">{row.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
