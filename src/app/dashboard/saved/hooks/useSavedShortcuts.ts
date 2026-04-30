"use client";

import { useEffect } from "react";

type ShortcutProps = {
  // overlay/state flags (priority order: top to bottom)
  imagePreviewOpen: boolean;
  confirmOpen: boolean;
  attachOpen: boolean;
  pinnedViewOpen: boolean;
  moreOpen: boolean;
  ctxOpen: boolean;
  searchOpen: boolean;
  selectionMode: boolean;

  // close callbacks
  onCloseImagePreview: () => void;
  onCloseConfirm: () => void;
  onCloseAttach: () => void;
  onClosePinnedView: () => void;
  onCloseMore: () => void;
  onCloseCtx: () => void;
  onCloseSearch: () => void;
  onClearSelection: () => void;

  // open / bulk callbacks
  onOpenSearch: () => void;
  onSelectAllVisible: () => void;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useSavedShortcuts(props: ShortcutProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Escape: close topmost overlay
      if (e.key === "Escape") {
        if (props.imagePreviewOpen) {
          props.onCloseImagePreview();
          return;
        }
        if (props.confirmOpen) {
          props.onCloseConfirm();
          return;
        }
        if (props.attachOpen) {
          props.onCloseAttach();
          return;
        }
        if (props.pinnedViewOpen) {
          props.onClosePinnedView();
          return;
        }
        if (props.moreOpen) {
          props.onCloseMore();
          return;
        }
        if (props.ctxOpen) {
          props.onCloseCtx();
          return;
        }
        if (props.searchOpen) {
          props.onCloseSearch();
          return;
        }
        if (props.selectionMode) {
          props.onClearSelection();
          return;
        }
        return;
      }

      // Cmd/Ctrl+K: open search overlay
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (!props.searchOpen) props.onOpenSearch();
        return;
      }

      // Cmd/Ctrl+A: select all visible (only in selection mode)
      if ((e.metaKey || e.ctrlKey) && (e.key === "a" || e.key === "A")) {
        if (props.selectionMode && !isEditableTarget(e.target)) {
          e.preventDefault();
          props.onSelectAllVisible();
        }
        return;
      }

      // "/" — open search if not focused in input
      if (e.key === "/" && !isEditableTarget(e.target)) {
        if (!props.searchOpen) {
          e.preventDefault();
          props.onOpenSearch();
        }
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props]);
}
