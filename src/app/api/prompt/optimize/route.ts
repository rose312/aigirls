import { NextResponse } from "next/server";
import { checkPromptSafety } from "@/lib/prompt-safety";
import { optimizeImagePrompt } from "@/lib/openrouter-text";
import { optimizeImagePromptDeepSeek } from "@/lib/deepseek-text";
import { isPromptPresetId } from "@/lib/prompt-presets";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const keywords = typeof body.keywords === "string" ? body.keywords.trim() : "";
    const presetRaw = body.presetId;
    const presetId = isPromptPresetId(presetRaw) ? presetRaw : null;

    if (!keywords) {
      return NextResponse.json({ error: "请输入关键字（例如：长发、红唇、日落、晚礼服）。" }, { status: 400 });
    }
    if (keywords.length > 300) {
      return NextResponse.json({ error: "关键字太长了（建议≤ 300 字）。" }, { status: 400 });
    }

    const safety = checkPromptSafety(keywords, "standard");
    if (!safety.ok) {
      return NextResponse.json({ error: safety.message }, { status: 400 });
    }

    const provider = (process.env.PROMPT_OPTIMIZER_PROVIDER ?? "openrouter").toLowerCase();
    const prompt =
      provider === "deepseek"
        ? await optimizeImagePromptDeepSeek({ keywords, presetId })
        : await optimizeImagePrompt({ keywords, presetId });
    return NextResponse.json({ prompt });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
