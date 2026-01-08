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

    const profileCommon = {
      username: username.trim(),
      username_lower: usernameLower,
      email,
    };

    // If the email is already registered, attempt to log in with the provided password and "repair"
    // a missing profile row (this can happen if a previous attempt failed after auth user creation).
    if (createError || !created.user) {
      const message = createError?.message ?? "Signup failed.";
      if (/already registered/i.test(message) || /already exists/i.test(message)) {
        const supabase = getSupabaseAnonServerClient();
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError || !loginData.user || !loginData.session) {
          return NextResponse.json(
            {
              error:
                "该邮箱已在 Supabase Auth 中注册（即使 public 表为空也会这样）。请到 Supabase 控制台 Authentication -> Users 搜索该邮箱并删除/重置密码；如果控制台也看不到，请确认你查看的是与 NEXT_PUBLIC_SUPABASE_URL 对应的同一个项目。",
              debug: process.env.NODE_ENV !== "production" ? message : undefined,
            },
            { status: 409 },
          );
        }

        const userId = loginData.user.id;
        const prof = await admin
          .from("profiles")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (!prof.data?.user_id) {
          let lastError: string | null = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            const up = await admin.from("profiles").insert({ user_id: userId, ...profileCommon });
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
            return NextResponse.json(
              { error: `Profile creation failed: ${lastError}` },
              { status: 500 },
            );
          }
        }

        return NextResponse.json({ session: loginData.session, user: loginData.user });
      }

      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Create profile (service role so it works even if email confirmation is required).
    const profileRow = { user_id: created.user.id, ...profileCommon };

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
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !loginData.session) {
      return NextResponse.json(
        { error: `Signup ok, but auto-login failed: ${loginError?.message ?? "no session"}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      session: loginData.session,
      user: created.user,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
