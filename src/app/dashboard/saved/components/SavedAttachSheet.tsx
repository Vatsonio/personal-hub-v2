"use client";

import { Image as ImageIcon, Camera, FileUp, Link2, Mic, X } from "lucide-react";
import type { SavedContentType } from "@/types/domain";

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (id: SavedContentType) => void;
};

const OPTIONS: {
  id: SavedContentType;
  Icon: React.ElementType;
  label: string;
  tint: string;
  stroke: string;
}[] = [
  {
    id: "image",
    Icon: ImageIcon,
    label: "Фото",
    tint: "from-violet-500/30 to-violet-500/10",
    stroke: "text-violet-300"
  },
  {
    id: "image",
    Icon: Camera,
    label: "Камера",
    tint: "from-blue-500/30 to-blue-500/10",
    stroke: "text-blue-300"
  },
  {
    id: "file",
    Icon: FileUp,
    label: "Файл",
    tint: "from-emerald-500/30 to-emerald-500/10",
    stroke: "text-emerald-300"
  },
  {
    id: "link",
    Icon: Link2,
    label: "Посилання",
    tint: "from-cyan-500/30 to-cyan-500/10",
    stroke: "text-cyan-300"
  },
  {
    id: "voice",
    Icon: Mic,
    label: "Голос",
    tint: "from-rose-500/30 to-rose-500/10",
    stroke: "text-rose-300"
  }
];

export default function SavedAttachSheet({ open, onClose, onPick }: Props) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <div
        className={`fixed left-0 right-0 bottom-0 z-50 px-3 pb-3 transition-all duration-300 ease-out ${
          open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        }`}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-3xl mx-auto rounded-3xl bg-gray-900/95 backdrop-blur-md border border-white/5 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="text-[13px] text-gray-300 font-medium">Додати</div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300"
              title="Закрити"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-1 px-3 pb-3 pt-2">
            {OPTIONS.map((opt, idx) => {
              const Icon = opt.Icon;
              return (
                <button
                  key={`${opt.id}-${idx}`}
                  type="button"
                  onClick={() => {
                    onPick(opt.id);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1.5 py-2 rounded-2xl hover:bg-white/5 transition-colors"
                >
                  <span
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${opt.tint} border border-white/5 flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${opt.stroke}`} />
                  </span>
                  <span className="text-[11px] text-gray-300">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
