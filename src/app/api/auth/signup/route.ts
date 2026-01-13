import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase-types";

export const runtime = "nodejs";

type SignupRequest = {
  username: string;
  email: string;
  password: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateUsernameV2(value: string) {
  const u = value.trim();
  if (u.length < 1 || u.length > 20) return "用户名长度需要 1-20。";
  if (!/^[\p{L}\p{N}_-]+$/u.test(u)) return "用户名只能包含文字/数字/下划线/短横线。";
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

    const uErr = validateUsernameV2(username);
    if (uErr) return NextResponse.json({ error: uErr }, { status: 400 });
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "请输入有效邮箱。" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位。" }, { status: 400 });
    }

    // 使用Supabase Auth创建用户，让触发器自动创建profile
    const supabase = createSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim()
        }
      }
    });

    if (authError || !authData?.user) {
      const message = authError?.message ?? "Signup failed.";
      if (/already.*registered/i.test(message) || /already exists/i.test(message)) {
        return NextResponse.json(
          {
            error: "该邮箱已注册，请直接登录。",
            debug: process.env.NODE_ENV !== "production" ? message : undefined,
          },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // 如果需要邮箱验证，返回提示
    if (!authData.session) {
      return NextResponse.json({
        message: "注册成功！请检查邮箱并点击验证链接。",
        user: authData.user,
      });
    }

    // 如果直接登录成功（邮箱验证关闭）
    return NextResponse.json({
      session: authData.session,
      user: authData.user,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}