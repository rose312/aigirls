import { NextResponse } from "next/server";
import { isQiniuConfigured, isQiniuPrivateBucket, presignQiniuGetUrl } from "@/lib/qiniu-s3";

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

    const body = (await req.json()) as unknown;
    if (!isRecord(body) || !Array.isArray((body as any).keys)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const keys = ((body as SignRequest).keys ?? [])
      .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
      .map((k) => k.trim())
      .slice(0, 50);

    const signed = await Promise.all(
      keys.map(async (key) => {
        const { url, expiresAt } = await presignQiniuGetUrl(key);
        return { key, url, expiresAt };
      }),
    );

    return NextResponse.json({ items: signed });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

