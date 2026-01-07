"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ImageQuality, ImageSize, StyleId } from "@/lib/presets";

export type GalleryItem = {
  id: string;
  createdAt: number;
  prompt: string;
  styleId: StyleId;
  styleLabel: string;
  size: ImageSize;
  quality: ImageQuality;
  model: string | null;
  tagKeys: string[];
  imageUrl: string;
  imageKey?: string;
  urlExpiresAt?: number | null;
  favorite: boolean;
};

type GalleryContextValue = {
  items: GalleryItem[];
  addItems: (items: GalleryItem[]) => void;
  clear: () => void;
  toggleFavorite: (id: string) => void;
  remove: (id: string) => void;
};

const GalleryContext = createContext<GalleryContextValue | null>(null);

const STORAGE_KEY = "aigirls.gallery.v1";
const MAX_ITEMS = 60;
const MAX_ITEMS_FOR_STORAGE = 20;

function safeParseGallery(value: string | null): GalleryItem[] {
  if (!value) return [];
  try {
    const data = JSON.parse(value) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .filter((x) => typeof x === "object" && x !== null)
      .map((x) => x as Partial<GalleryItem> & { dataUrl?: unknown })
      .map((x) => ({
        id: typeof x.id === "string" ? x.id : "",
        createdAt: typeof x.createdAt === "number" ? x.createdAt : Date.now(),
        prompt: typeof x.prompt === "string" ? x.prompt : "",
        styleId: (typeof x.styleId === "string" ? x.styleId : "photo") as StyleId,
        styleLabel: typeof x.styleLabel === "string" ? x.styleLabel : "写真写实",
        size: (typeof x.size === "string" ? x.size : "1024x1536") as ImageSize,
        quality: (typeof x.quality === "string" ? x.quality : "auto") as ImageQuality,
        model: typeof x.model === "string" || x.model === null ? x.model : null,
        tagKeys: Array.isArray(x.tagKeys)
          ? x.tagKeys.filter((t): t is string => typeof t === "string").slice(0, 24)
          : [],
        imageUrl:
          typeof x.imageUrl === "string"
            ? x.imageUrl
            : typeof x.dataUrl === "string"
              ? x.dataUrl
              : "",
        imageKey: typeof x.imageKey === "string" ? x.imageKey : undefined,
        urlExpiresAt: typeof x.urlExpiresAt === "number" ? x.urlExpiresAt : null,
        favorite: typeof x.favorite === "boolean" ? x.favorite : false,
      }))
      .filter((x) => x.id && x.prompt && x.imageUrl)
      .slice(0, MAX_ITEMS_FOR_STORAGE);
  } catch {
    return [];
  }
}

function tryPersistGallery(items: GalleryItem[]) {
  try {
    const payload = JSON.stringify(items.slice(0, MAX_ITEMS_FOR_STORAGE));
    localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    // Ignore quota/security errors.
  }
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    const loaded = safeParseGallery(localStorage.getItem(STORAGE_KEY));
    if (loaded.length > 0) setItems(loaded);
  }, []);

  useEffect(() => {
    const now = Date.now();
    const needs = items
      .filter((it) => typeof it.imageKey === "string" && it.imageKey.length > 0)
      .filter((it) => !it.urlExpiresAt || it.urlExpiresAt < now + 60_000)
      .map((it) => it.imageKey as string);

    const unique = Array.from(new Set(needs)).slice(0, 50);
    if (unique.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/qiniu/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keys: unique }),
        });
        if (!res.ok) return;
        const payload = (await res.json()) as {
          items?: Array<{ key: string; url: string; expiresAt: number }>;
        };
        const signed = payload.items ?? [];
        if (signed.length === 0 || cancelled) return;

        const map = new Map(signed.map((x) => [x.key, x] as const));
        setItems((prev) =>
          prev.map((it) => {
            if (!it.imageKey) return it;
            const s = map.get(it.imageKey);
            if (!s) return it;
            return { ...it, imageUrl: s.url, urlExpiresAt: s.expiresAt };
          }),
        );
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items]);

  useEffect(() => {
    tryPersistGallery(items);
  }, [items]);

  const value = useMemo<GalleryContextValue>(
    () => ({
      items,
      addItems: (next) => {
        setItems((prev) => [...next, ...prev].slice(0, MAX_ITEMS));
      },
      clear: () => setItems([]),
      toggleFavorite: (id) =>
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, favorite: !it.favorite } : it)),
        ),
      remove: (id) => setItems((prev) => prev.filter((it) => it.id !== id)),
    }),
    [items],
  );

  return <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>;
}

export function useGallery() {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error("useGallery must be used within AppProviders");
  return ctx;
}
