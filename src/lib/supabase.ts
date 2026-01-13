"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

function nonEmpty(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (cached) return cached;
  // NOTE: Next.js only inlines NEXT_PUBLIC_* vars reliably when accessed via
  // a static property, not dynamic indexing (process.env[name]).
  const url = nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL);
  // Supabase docs sometimes call this "publishable key" now; support both.
  const anonKey =
    nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!url || !anonKey) return null;
  cached = createClient(url, anonKey);
  return cached;
}

// 便捷的客户端获取函数
export function getSupabase() {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error('Supabase client not available. Check environment variables.');
  }
  return client;
}
