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

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
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

    // Create auth user via service role to avoid FK races with `profiles.user_id`
    // and to support "register => logged-in" without relying on email confirmation settings.
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username: username.trim() },
    });

    if (createError || !created.user) {
      return NextResponse.json(
        { error: createError?.message ?? "Signup failed." },
        { status: 400 },
      );
    }

    // Create profile (service role so it works even if email confirmation is required).
    const profileRow = {
      user_id: created.user.id,
      username: username.trim(),
      username_lower: usernameLower,
      email,
    };

    let lastError: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const up = await admin.from("profiles").insert(profileRow);
      if (!up.error) {
        lastError = null;
        break;
      }
      lastError = up.error.message;
      if (lastError.includes("foreign key constraint") && attempt < 2) {
        await sleep(250 * (attempt + 1));
        continue;
      }
      break;
    }

    if (lastError) {
      try {
        await admin.auth.admin.deleteUser(created.user.id);
      } catch {
        // ignore cleanup errors
      }
      return NextResponse.json(
        { error: `Profile creation failed: ${lastError}` },
        { status: 500 },
      );
    }

    const supabase = getSupabaseAnonServerClient();
    const { data: loginData } = await supabase.auth.signInWithPassword({ email, password });

    return NextResponse.json({
      session: loginData.session ?? null,
      user: created.user,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
