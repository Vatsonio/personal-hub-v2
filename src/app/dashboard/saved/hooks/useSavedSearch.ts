"use client";

import { useState, useEffect, useMemo } from "react";
import type { SavedItem, SavedContentType } from "@/types/domain";

type Filters = {
  type: SavedContentType | "all";
  pinned: boolean;
  favorite: boolean;
  tags: string[];
};

const FILTERS_KEY = "saved-filters";
const DEFAULT_FILTERS: Filters = {
  type: "all",
  pinned: false,
  favorite: false,
  tags: []
};

function loadPersistedFilters(): Filters {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  try {
    const raw = window.localStorage.getItem(FILTERS_KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw) as Partial<Filters>;
    return {
      type: typeof parsed.type === "string" ? (parsed.type as Filters["type"]) : "all",
      pinned: typeof parsed.pinned === "boolean" ? parsed.pinned : false,
      favorite: typeof parsed.favorite === "boolean" ? parsed.favorite : false,
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t) => typeof t === "string") : []
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}

export function useSavedSearch(items: SavedItem[]) {
  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // Hydrate filters from localStorage on mount (client-only)
  useEffect(() => {
    setFilters(loadPersistedFilters());
  }, []);

  // Persist filters whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
    } catch {
      // ignore quota / serialization errors
    }
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(rawSearch), 300);
    return () => clearTimeout(t);
  }, [rawSearch]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filters.pinned && !item.is_pinned) return false;
      if (filters.favorite && !item.is_favorite) return false;
      if (filters.type !== "all" && item.content_type !== filters.type) return false;
      if (filters.tags.length > 0 && !filters.tags.every((t) => item.tags.includes(t)))
        return false;

      if (search) {
        const q = search.toLowerCase();
        return (
          item.content?.toLowerCase().includes(q) ||
          item.title?.toLowerCase().includes(q) ||
          item.source_url?.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [items, search, filters]);

  return { filtered, rawSearch, setRawSearch, filters, setFilters, ftsLoading: false };
}
