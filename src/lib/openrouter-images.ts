import type { ImageSize } from "@/lib/presets";
import OpenAI from "openai";

export type OpenRouterImageGenerationInput = {
  prompt: string;
  n: number;
  size: ImageSize;
};

export type OpenRouterImageGenerationResult = {
  b64Images: string[];
  mime: string;
  model: string;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function aspectRatioForSize(size: ImageSize) {
  if (size === "1024x1536") return "2:3";
  if (size === "1536x1024") return "3:2";
  return "1:1";
}

function parseDataUrl(dataUrl: string): { mime: string; b64: string } {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("OpenRouter returned an unsupported image format (expected data URL).");
  return { mime: m[1]!, b64: m[2]! };
}

function getClient() {
  const apiKey = requireEnv("OPENROUTER_API_KEY");

  const defaultHeaders: Record<string, string> = {};
  const siteUrl = process.env.OPENROUTER_SITE_URL;
  const siteTitle = process.env.OPENROUTER_SITE_TITLE;
  if (siteUrl) defaultHeaders["HTTP-Referer"] = siteUrl;
  if (siteTitle) defaultHeaders["X-Title"] = siteTitle;

  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders,
  });
}

function extractImageUrlFromMessage(message: unknown): string | null {
  const msg = message as any;
  const images = msg?.images;
  if (Array.isArray(images)) {
    const url = images?.[0]?.image_url?.url;
    if (typeof url === "string" && url.length > 0) return url;
  }

  const content = msg?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      const url = (part as any)?.image_url?.url;
      const type = (part as any)?.type;
      if ((type === "image_url" || type === "output_image") && typeof url === "string" && url) {
        return url;
      }
    }
  }

  return null;
}

async function generateOne(
  model: string,
  prompt: string,
  size: ImageSize,
  signal: AbortSignal,
) {
  const client = getClient();
  const completion = await client.chat.completions.create(
    {
      model,
      modalities: ["image", "text"],
      messages: [{ role: "user", content: prompt }],
      image_config: { aspect_ratio: aspectRatioForSize(size) },
    } as any,
    { signal } as any,
  );

  const message = (completion as any)?.choices?.[0]?.message;
  const url = extractImageUrlFromMessage(message);
  if (!url) throw new Error("OpenRouter returned no image data.");

  return { dataUrl: url, model: (completion as any)?.model ?? model };
}

export async function generateOpenRouterImages(
  input: OpenRouterImageGenerationInput,
): Promise<OpenRouterImageGenerationResult> {
  const model = process.env.OPENROUTER_IMAGE_MODEL ?? "google/gemini-2.5-flash-image";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const count = Math.max(1, Math.min(4, input.n));
    const jobs = Array.from({ length: count }, async () =>
      generateOne(model, input.prompt, input.size, controller.signal),
    );
    const results = await Promise.all(jobs);

    const parsed = results.map((r) => parseDataUrl(r.dataUrl));
    const mime = parsed[0]!.mime;
    if (!parsed.every((p) => p.mime === mime)) {
      // Not fatal; pick first and keep going.
    }

    return {
      b64Images: parsed.map((p) => p.b64),
      mime,
      model: results[0]!.model,
    };
  } finally {
    clearTimeout(timeout);
  }
}
