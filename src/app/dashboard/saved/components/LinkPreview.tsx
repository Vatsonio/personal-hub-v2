"use client";

import { useEffect, useRef, useState } from "react";

type OGData = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  siteName?: string | null;
};

type Props = {
  url: string;
  /** Already-fetched OG data stored in item.metadata — skips the fetch */
  cached: Record<string, string>;
  /** Called once after a fresh fetch so we can persist to metadata */
  onFetched?: (data: OGData) => void;
};

export default function LinkPreview({ url, cached, onFetched }: Props) {
  const hasCached = Boolean(cached?.og_title ?? cached?.og_image ?? cached?.og_description);
  const [data, setData] = useState<OGData | null>(
    hasCached
      ? {
          title: cached.og_title ?? null,
          description: cached.og_description ?? null,
          image: cached.og_image ?? null,
          siteName: cached.og_site_name ?? null
        }
      : null
  );
  const [loading, setLoading] = useState(!hasCached);
  const fetchedRef = useRef(hasCached);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;
    fetch(`/api/og-preview?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((json: OGData & { error?: string }) => {
        if (cancelled || json.error) return;
        setData(json);
        onFetched?.({
          title: json.title,
          description: json.description,
          image: json.image,
          siteName: json.siteName
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  if (loading) {
    return (
      <div className="mt-1.5 h-16 rounded-xl bg-black/30 border-l-[3px] border-violet-400/70 animate-pulse" />
    );
  }

  if (!data || (!data.title && !data.image && !data.description)) return null;

  return (
    <div className="mt-1.5 rounded-xl overflow-hidden bg-black/30 border-l-[3px] border-violet-400/70 hover:bg-black/40 transition-colors">
      <div className="px-3 pt-2 pb-2">
        {data.siteName && (
          <p className="text-[11px] text-violet-300 font-medium leading-tight truncate">
            {data.siteName}
          </p>
        )}
        {data.title && (
          <p className="text-[13px] text-white font-semibold leading-snug mt-0.5 line-clamp-2">
            {data.title}
          </p>
        )}
        {data.description && (
          <p className="text-[12px] text-gray-400 leading-snug mt-1 line-clamp-3">
            {data.description}
          </p>
        )}
      </div>
      {data.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.image}
          alt=""
          className="w-full h-40 object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}
    </div>
  );
}
