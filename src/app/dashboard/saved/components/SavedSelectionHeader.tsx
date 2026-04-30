"use client";

import { X, Check } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

type Props = {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function SavedSelectionHeader({ count, onCancel, onConfirm }: Props) {
  const { t } = useLocale();
  return (
    <div className="px-3 pt-2 pb-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="w-10 h-10 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 flex items-center justify-center text-gray-300"
          title={t("saved.selection.cancel")}
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center justify-center h-10 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5">
          <div className="text-[14px] text-white font-medium">
            {t("saved.selection.title", count)}
          </div>
        </div>
        <button
          type="button"
          onClick={onConfirm}
          className="w-10 h-10 rounded-full bg-emerald-500/85 border border-white/5 flex items-center justify-center text-white"
          title={t("saved.selection.confirm")}
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
