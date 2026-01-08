import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function requireSupabaseAnonKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!value) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).",
    );
  }
  return value;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1] ?? "";
    const json = Buffer.from(payload, "base64url").toString("utf8");
    const data = JSON.parse(json) as unknown;
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    return data as Record<string, unknown>;
  } catch {
    return null;
  }
}

function validateSupabaseKey({
  url,
  key,
  name,
  expectedRole,
}: {
  url: string;
  key: string;
  name: string;
  expectedRole?: string;
}) {
  const payload = decodeJwtPayload(key);
  if (!payload) return;

  if (expectedRole) {
    const role = typeof payload.role === "string" ? payload.role : null;
    if (role && role !== expectedRole) {
      throw new Error(`${name} is not a "${expectedRole}" key (got role="${role}").`);
    }
  }

  // Supabase "anon" / "service_role" keys include a `ref` claim matching the project ref
  // (the subdomain of https://<ref>.supabase.co).
  const ref = typeof payload.ref === "string" ? payload.ref : null;
  if (ref) {
    let projectRef: string | null = null;
    try {
      const host = new URL(url).host;
      projectRef = host.split(".")[0] ?? null;
    } catch {
      // ignore
    }

    if (projectRef && projectRef !== ref) {
      throw new Error(
        `${name} does not match NEXT_PUBLIC_SUPABASE_URL (project ref mismatch: url=${projectRef}, key=${ref}).`,
      );
    }
  }
}

export function getSupabaseServerClient(accessToken: string) {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireSupabaseAnonKey();
  validateSupabaseKey({ url, key: anonKey, name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", expectedRole: "anon" });
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export function getSupabaseAnonServerClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireSupabaseAnonKey();
  validateSupabaseKey({ url, key: anonKey, name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", expectedRole: "anon" });
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseServiceRoleClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  validateSupabaseKey({ url, key: serviceRoleKey, name: "SUPABASE_SERVICE_ROLE_KEY", expectedRole: "service_role" });
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
