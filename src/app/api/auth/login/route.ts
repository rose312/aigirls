import { NextResponse } from "next/server";
import {
  getSupabaseAnonServerClient,
  getSupabaseServiceRoleClient,
} from "@/lib/supabase-server";

export const runtime = "nodejs";

type LoginRequest = {
  identifier: string; // username or email
  password: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function looksLikeEmail(value: string) {
  return value.includes("@");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!identifier || !password) {
      return NextResponse.json({ error: "Missing identifier/password." }, { status: 400 });
    }

    let email = identifier;
    if (!looksLikeEmail(identifier)) {
      const username = normalizeUsername(identifier);
      let admin;
      try {
        admin = getSupabaseServiceRoleClient();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Supabase not configured";
        return NextResponse.json({ error: msg }, { status: 501 });
      }
      const { data, error } = await admin
        .from("profiles")
        .select("email")
        .eq("username_lower", username)
        .maybeSingle();
      if (error || !data?.email) {
        return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
      }
      email = String(data.email);
    }

    // Sign in using the user's access token workflow (password grant) via Supabase auth.
    // We can use anon key with email/password; the email is resolved server-side when user used username.
    const supabase = getSupabaseAnonServerClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData?.session) {
      const msg = authError?.message ?? "Invalid credentials.";
      if (/email not confirmed/i.test(msg)) {
        return NextResponse.json(
          {
            error:
              "邮箱未验证（Email not confirmed）。请去 Supabase 控制台确认邮箱，或在 Auth 设置里关闭邮箱确认后再登录。",
            debug: process.env.NODE_ENV !== "production" ? msg : undefined,
          },
          { status: 403 },
        );
      }

      return NextResponse.json(
        {
          error: "Invalid credentials.",
          debug: process.env.NODE_ENV !== "production" ? msg : undefined,
        },
        { status: 401 },
      );
    }

    return NextResponse.json({
      session: authData.session,
      user: authData.user,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
