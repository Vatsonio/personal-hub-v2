"use client";

import { useLayoutEffect, useState } from "react";
import {
  Reply,
  Copy,
  Edit3,
  Pin,
  PinOff,
  Heart,
  HeartOff,
  Bell,
  FileText,
  FileDown,
  Trash2,
  CheckCircle2
} from "lucide-react";
import type { SavedItem } from "@/types/domain";

export type CtxState = { x: number; y: number; item: SavedItem } | null;
export type CtxActionId =
  | "reply"
  | "copy"
  | "edit"
  | "pin"
  | "favorite"
  | "remind"
  | "export_md"
  | "export_json"
  | "delete"
  | "select";

type Props = {
  ctx: CtxState;
  onClose: () => void;
  onAction: (id: CtxActionId, item: SavedItem) => void;
};

type MenuRow =
  | { divider: true }
  | {
      id: CtxActionId;
      label: string;
      Icon: React.ElementType;
      danger?: boolean;
    };

export default function SavedContextMenu({ ctx, onClose, onAction }: Props) {
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!ctx) return;
    const PAD = 12;
    const W = 240;
    const H = 420;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = ctx.x;
    let top = ctx.y;
    if (left + W + PAD > vw) left = vw - W - PAD;
    if (left < PAD) left = PAD;
    if (top + H + PAD > vh) top = Math.max(PAD, vh - H - PAD);
    if (top < PAD) top = PAD;
    setPos({ left, top });
  }, [ctx]);

  if (!ctx) return null;

  const item = ctx.item;
  const hasCopyableText =
    (item.content_type === "text" && !!item.content) ||
    (item.content_type === "link" && !!item.source_url);

  const rows: (MenuRow | false)[] = [
    { id: "reply", label: "Відповісти", Icon: Reply },
    hasCopyableText && { id: "copy", label: "Копіювати", Icon: Copy },
    item.content_type === "text" && { id: "edit", label: "MD preview", Icon: Edit3 },
    {
      id: "pin",
      label: item.is_pinned ? "Відкріпити" : "Прикріпити",
      Icon: item.is_pinned ? PinOff : Pin
    },
    {
      id: "favorite",
      label: item.is_favorite ? "Прибрати з обраного" : "Обране",
      Icon: item.is_favorite ? HeartOff : Heart
    },
    { id: "remind", label: "Нагадати", Icon: Bell },
    { id: "export_md", label: "Експорт .md", Icon: FileText },
    { id: "export_json", label: "Експорт .json", Icon: FileDown },
    { divider: true },
    { id: "delete", label: "Видалити", Icon: Trash2, danger: true },
    { divider: true },
    { id: "select", label: "Вибрати", Icon: CheckCircle2 }
  ];

  const items: MenuRow[] = rows.filter(Boolean) as MenuRow[];

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
          {items.map((row, idx) =>
            "divider" in row ? (
              <div key={`d${idx}`} className="my-1 mx-3 h-px bg-white/10" />
            ) : (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  onAction(row.id, item);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 h-10 hover:bg-white/5 transition-colors text-left ${
                  row.danger ? "text-rose-400" : "text-gray-100"
                }`}
              >
                <row.Icon className="w-[18px] h-[18px] opacity-90" />
                <span className="text-[14px]">{row.label}</span>
              </button>
            )
          )}
        </div>
      </div>
    </>
  );
}
