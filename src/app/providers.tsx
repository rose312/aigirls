"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { ImageQuality, ImageSize, StyleId } from "@/lib/presets";
import { getSupabaseBrowserClient } from "@/lib/supabase";

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

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  signInWithPassword: (identifier: string, password: string) => Promise<string | null>;
  signUpWithPassword: (username: string, email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  syncMyImages: () => Promise<void>;
};

const GalleryContext = createContext<GalleryContextValue | null>(null);
const AuthContext = createContext<AuthContextValue | null>(null);

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
        styleLabel: typeof x.styleLabel === "string" ? x.styleLabel : "",
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

async function setSupabaseSession(
  supabase: SupabaseClient,
  session: { access_token: string; refresh_token: string },
) {
  const { error } = await supabase.auth.setSession(session);
  return error ? error.message : null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loaded = safeParseGallery(localStorage.getItem(STORAGE_KEY));
    if (loaded.length > 0) setItems(loaded);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch {
        // ignore
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function syncMyImages() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { data } = await supabase.auth.getSession();
    const s = data.session;
    if (!s) return;

    const res = await supabase
      .from("images")
      .select(
        "id, created_at, prompt, style_id, style_label, size, quality, model, provider, tag_keys, image_key, favorite",
      )
      .order("created_at", { ascending: false })
      .limit(60);

    if (res.error) return;
    const rows = res.data ?? [];

    const mapped: GalleryItem[] = rows
      .map((r: any) => ({
        id: String(r.id),
        createdAt: new Date(r.created_at).getTime(),
        prompt: String(r.prompt ?? ""),
        styleId: String(r.style_id ?? "photo") as StyleId,
        styleLabel: String(r.style_label ?? ""),
        size: String(r.size ?? "1024x1536") as ImageSize,
        quality: String(r.quality ?? "auto") as ImageQuality,
        model: typeof r.model === "string" ? r.model : null,
        tagKeys: Array.isArray(r.tag_keys) ? r.tag_keys.map(String) : [],
        imageUrl: "",
        imageKey: typeof r.image_key === "string" ? r.image_key : undefined,
        urlExpiresAt: 0,
        favorite: Boolean(r.favorite),
      }))
      .filter((x) => x.id && x.prompt && x.imageKey);

    if (mapped.length > 0) setItems(mapped);
  }

  useEffect(() => {
    if (!user) return;
    void syncMyImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    // Refresh signed URLs for private buckets.
    const token = session?.access_token;
    if (!token) return;

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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
  }, [items, session?.access_token]);

  useEffect(() => {
    tryPersistGallery(items);
  }, [items]);

  const galleryValue = useMemo<GalleryContextValue>(
    () => ({
      items,
      addItems: (next) => setItems((prev) => [...next, ...prev].slice(0, MAX_ITEMS)),
      clear: () => setItems([]),
      toggleFavorite: (id) =>
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, favorite: !it.favorite } : it)),
        ),
      remove: (id) => setItems((prev) => prev.filter((it) => it.id !== id)),
    }),
    [items],
  );

  const authValue = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      signInWithPassword: async (identifier, password) => {
        try {
          const supabase = getSupabaseBrowserClient();
          if (!supabase) {
            return "Supabase 未配置。请设置 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY。";
          }
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier, password }),
          });
          const payload = (await res.json()) as {
            session?: any;
            error?: string;
            debug?: string;
          };
          if (!res.ok || !payload.session) {
            const msg = payload.error ?? "登录失败。";
            return payload.debug ? `${msg} (${payload.debug})` : msg;
          }
          return await setSupabaseSession(supabase, payload.session);
        } catch (e) {
          return e instanceof Error ? e.message : "Unknown error";
        }
      },
      signUpWithPassword: async (username, email, password) => {
        try {
          const supabase = getSupabaseBrowserClient();
          if (!supabase) {
            return "Supabase 未配置。请设置 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY。";
          }
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
          });
          const payload = (await res.json()) as {
            session?: any;
            error?: string;
            debug?: string;
          };
          if (!res.ok) {
            const msg = payload.error ?? "注册失败。";
            return payload.debug ? `${msg} (${payload.debug})` : msg;
          }
          if (payload.session?.access_token && payload.session?.refresh_token) {
            return await setSupabaseSession(supabase, payload.session);
          }
          return null;
        } catch (e) {
          return e instanceof Error ? e.message : "Unknown error";
        }
      },
      signOut: async () => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;
        await supabase.auth.signOut();
      },
      syncMyImages,
    }),
    [session, user],
  );

  return (
    <AuthContext.Provider value={authValue}>
      <GalleryContext.Provider value={galleryValue}>{children}</GalleryContext.Provider>
    </AuthContext.Provider>
  );
}

export function useGallery() {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error("useGallery must be used within AppProviders");
  return ctx;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AppProviders");
  return ctx;
}
