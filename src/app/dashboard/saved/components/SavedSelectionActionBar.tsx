"use client";

import { useState } from "react";
import { Trash2, Tag, Check, X } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

type Props = {
  count: number;
  onDelete: () => void;
  onApplyTags: (tags: string[]) => void;
};

export default function SavedSelectionActionBar({ count, onDelete, onApplyTags }: Props) {
  const { t } = useLocale();
  const [tagging, setTagging] = useState(false);
  const [tagInput, setTagInput] = useState("");

  function handleApply() {
    const tags = tagInput
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, "").toLowerCase())
      .filter(Boolean);
    if (tags.length === 0) return;
    onApplyTags(tags);
    setTagInput("");
    setTagging(false);
  }

  return (
    <div className="px-3 pb-3 pt-1.5">
      {tagging ? (
        <div className="flex items-center gap-2 bg-gray-900/85 border border-white/5 rounded-full px-3 py-2 backdrop-blur-md">
          <Tag className="w-4 h-4 text-blue-300 flex-shrink-0" />
          <input
            autoFocus
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            placeholder={t("saved.selection.tags_placeholder")}
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500"
          />
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs hover:bg-violet-500/30 transition-all"
          >
            <Check className="w-3 h-3" /> {t("saved.selection.apply")}
          </button>
          <button
            type="button"
            onClick={() => {
              setTagging(false);
              setTagInput("");
            }}
            className="text-gray-500 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDelete}
            className="w-12 h-12 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 flex items-center justify-center text-rose-400 hover:bg-rose-500/15 transition-colors"
            title={t("saved.selection.delete")}
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <div className="text-[12px] text-gray-400">{t("saved.selection.count", count)}</div>
          <button
            type="button"
            onClick={() => setTagging(true)}
            className="w-12 h-12 rounded-full bg-gray-900/85 backdrop-blur-md border border-white/5 flex items-center justify-center text-violet-300 hover:bg-violet-500/15 transition-colors"
            title={t("saved.selection.tags")}
          >
            <Tag className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
