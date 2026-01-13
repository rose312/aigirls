import { NextResponse } from "next/server";
import {
  isQiniuConfigured,
  isQiniuPrivateBucket,
  signQiniuGetUrlForKey,
} from "@/lib/qiniu-s3";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

type SignRequest = { keys: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(req: Request) {
  try {
    if (!isQiniuConfigured() || !isQiniuPrivateBucket()) {
      return NextResponse.json(
        { error: "Qiniu private bucket signing is not configured." },
        { status: 501 },
      );
    }

    const authHeader =
      req.headers.get("authorization") ?? req.headers.get("Authorization");
    const match = authHeader?.match(/^Bearer\s+(.+)$/i);
    const accessToken = match?.[1];
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabase = getSupabaseServerClient(accessToken);
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const user = userData?.user ?? null;
    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await req.json()) as unknown;
    if (!isRecord(body) || !Array.isArray((body as any).keys)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const keys = ((body as SignRequest).keys ?? [])
      .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
      .map((k) => k.trim())
      .slice(0, 50);

    // Only sign keys that belong to the current user.
    // 支持两种字段名：qiniu_key 和 image_key
    const { data: owned, error: ownedErr } = await supabase
      .from("images")
      .select("qiniu_key, image_key")
      .or(`qiniu_key.in.(${keys.join(',')}),image_key.in.(${keys.join(',')})`)
      .limit(50);
    if (ownedErr) {
      return NextResponse.json({ error: ownedErr.message }, { status: 500 });
    }

    const ownedKeys = (owned ?? [])
      .flatMap((r: any) => [r.qiniu_key, r.image_key])
      .filter((k: any): k is string => typeof k === "string" && k.length > 0 && keys.includes(k));

    const signed = await Promise.all(
      ownedKeys.map(async (key) => {
        const { url, expiresAt } = await signQiniuGetUrlForKey(key);
        return { key, url, expiresAt };
      }),
    );

    return NextResponse.json({ items: signed });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
