import { NextResponse } from "next/server";
import {
  getSupabaseAnonServerClient,
  getSupabaseServiceRoleClient,
} from "@/lib/supabase-server";

export const runtime = "nodejs";

type SignupRequest = {
  username: string;
  email: string;
  password: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function validateUsername(value: string) {
  const u = value.trim();
  if (u.length < 3 || u.length > 20) return "用户名长度需要 3-20。";
  if (!/^[a-zA-Z0-9_]+$/.test(u)) return "用户名只能包含字母、数字、下划线。";
  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const username = typeof body.username === "string" ? body.username : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const uErr = validateUsername(username);
    if (uErr) return NextResponse.json({ error: uErr }, { status: 400 });
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "请输入有效邮箱。" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位。" }, { status: 400 });
    }

    const usernameLower = normalizeUsername(username);
    let admin;
    try {
      admin = getSupabaseServiceRoleClient();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Supabase not configured";
      return NextResponse.json({ error: msg }, { status: 501 });
    }

    const exists = await admin
      .from("profiles")
      .select("user_id")
      .eq("username_lower", usernameLower)
      .maybeSingle();
    if (exists.data?.user_id) {
      return NextResponse.json({ error: "用户名已被占用。" }, { status: 409 });
    }

    const supabase = getSupabaseAnonServerClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
        },
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message ?? "Signup failed." },
        { status: 400 },
      );
    }

    // If the project requires email confirmation, Supabase may return a null session.
    // Try signing in immediately so "register => logged-in" works when allowed by settings.
    let session = authData.session ?? null;
    if (!session) {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!loginError && loginData.session) session = loginData.session;
    }

    // Create profile (service role so it works even if email confirmation is required).
    const up = await admin.from("profiles").insert({
      user_id: authData.user.id,
      username: username.trim(),
      username_lower: usernameLower,
      email,
    });

    if (up.error) {
      return NextResponse.json(
        { error: `Profile creation failed: ${up.error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      session,
      user: authData.user,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
